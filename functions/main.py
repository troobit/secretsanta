from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import random
from datetime import datetime

# Initialize Firebase Admin SDK
initialize_app()

# Set global options for cost control
options.set_global_options(max_instances=10)


@https_fn.on_call()
def triggerSecretSantaPairing(req: https_fn.CallableRequest) -> dict:
    # Check authentication
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated to trigger pairing"
        )

    db = firestore.client()

    try:
        # Verify user is admin by checking Firestore document
        # Extract user ID from email (format: username@rtob.dev -> username)
        user_email = req.auth.token.get('email', '')
        if not user_email or '@' not in user_email:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="Invalid user email format"
            )

        user_id = user_email.split('@')[0]
        user_doc = db.collection('users').document(user_id).get()

        if not user_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="User document not found"
            )

        user_data = user_doc.to_dict()
        if not user_data.get('isAdmin', False):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Only admin users can trigger pairing"
            )

        # Fetch all non-admin users for pairing
        users_ref = db.collection('users')
        users_query = users_ref.where(
            filter=FieldFilter('isAdmin', '==', False))
        users_snapshot = users_query.stream()

        users_to_pair = []
        for user in users_snapshot:
            user_data = user.to_dict()
            raw_conflicts = user_data.get('conflicts') if user_data else []
            if not isinstance(raw_conflicts, list):
                raw_conflicts = []
            normalized_conflicts = [c for c in raw_conflicts if isinstance(c, str)]
            users_to_pair.append({
                'id': user.id,
                'name': user_data.get('name', 'Unknown') if user_data else 'Unknown',
                'conflicts': normalized_conflicts
            })

        conflict_lookup = {}
        for user in users_to_pair:
            conflict_lookup[user['id']] = set()

        for user in users_to_pair:
            giver_id = user['id']
            for conflict_id in user['conflicts']:
                conflict_lookup[giver_id].add(conflict_id)
                if conflict_id not in conflict_lookup:
                    conflict_lookup[conflict_id] = set()
                conflict_lookup[conflict_id].add(giver_id)

        # Validate minimum user count (need at least 3 for meaningful pairing)
        if len(users_to_pair) < 3:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                message=f"Insufficient users for pairing. Need at least 3 non-admin users, found {len(users_to_pair)}"
            )

        # Validate constraint graph
        warnings = []
        errors = []

        # Check for users with too many conflicts
        for user in users_to_pair:
            user_id = user['id']
            user_conflicts = conflict_lookup.get(user_id, set())
            
            # A user must be able to give to at least one person (not themselves, not conflicted)
            available_giftees = len(users_to_pair) - 1 - len(user_conflicts)
            if available_giftees <= 0:
                errors.append(
                    f"User '{user['name']}' ({user_id}) is conflicted with all other participants and cannot be paired"
                )

        # Check for asymmetric conflict declarations and reconcile
        asymmetric_pairs = []
        checked_pairs = set()
        
        for user in users_to_pair:
            user_id = user['id']
            declared_conflicts = user.get('conflicts', [])
            
            for conflict_id in declared_conflicts:
                # Only check each pair once
                pair_key = tuple(sorted([user_id, conflict_id]))
                if pair_key in checked_pairs:
                    continue
                checked_pairs.add(pair_key)
                
                # Find the other user
                other_user = next((u for u in users_to_pair if u['id'] == conflict_id), None)
                if other_user:
                    other_conflicts = other_user.get('conflicts', [])
                    if user_id not in other_conflicts:
                        asymmetric_pairs.append(f"{user_id} ↔ {conflict_id}")

        if asymmetric_pairs:
            warnings.append(
                f"Asymmetric conflicts detected and auto-reconciled: {', '.join(asymmetric_pairs)}"
            )

        # If any errors found, return them without attempting pairing
        if errors:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                message=f"Pairing prerequisites not satisfied: {'; '.join(errors)}"
            )

        # Backtracking pairing algorithm with constraint awareness
        # Shuffle users for fairness (deterministic seeded randomness could be added)
        random.seed(datetime.utcnow().timestamp())
        shuffled_givers = users_to_pair.copy()
        random.shuffle(shuffled_givers)
        
        def can_pair(giver_id, giftee_id):
            """Check if a giver can be paired with a giftee"""
            if giver_id == giftee_id:
                return False
            if giftee_id in conflict_lookup.get(giver_id, set()):
                return False
            return True
        
        def backtrack(giver_index, assignments, used_giftees):
            """Recursively try to assign giftees to all givers"""
            # Base case: all givers have been assigned
            if giver_index == len(shuffled_givers):
                return True
            
            giver = shuffled_givers[giver_index]
            giver_id = giver['id']
            
            # Try each potential giftee
            potential_giftees = [u for u in users_to_pair if u['id'] not in used_giftees]
            random.shuffle(potential_giftees)
            
            for giftee in potential_giftees:
                giftee_id = giftee['id']
                
                if can_pair(giver_id, giftee_id):
                    # Make assignment
                    assignments[giver_id] = giftee_id
                    used_giftees.add(giftee_id)
                    
                    # Recurse to next giver
                    if backtrack(giver_index + 1, assignments, used_giftees):
                        return True
                    
                    # Backtrack: undo assignment
                    del assignments[giver_id]
                    used_giftees.remove(giftee_id)
            
            # No valid assignment found
            return False
        
        pairings = {}
        used_giftees = set()
        
        if not backtrack(0, pairings, used_giftees):
            # Build diagnostic information about why pairing failed
            conflict_summary = []
            for user in users_to_pair:
                user_id = user['id']
                user_conflicts = conflict_lookup.get(user_id, set())
                if len(user_conflicts) > 0:
                    conflict_summary.append(f"{user['name']} ({len(user_conflicts)} conflicts)")
            
            error_details = f"Unable to generate valid pairings with current conflict constraints. "
            error_details += f"Participants: {len(users_to_pair)}. "
            if conflict_summary:
                error_details += f"Users with conflicts: {', '.join(conflict_summary[:5])}. "
            error_details += "Try reducing conflicts or adding more participants."
            
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                message=error_details
            )

        batch = db.batch()

        for giver_id, receiver_id in pairings.items():
            user_ref = db.collection('users').document(giver_id)
            batch.update(user_ref, {'gifteeId': receiver_id})

        batch.commit()

        # Return pairing summary payload for the admin dashboard
        result = {
            'pairingsCount': len(pairings),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if warnings:
            result['warnings'] = warnings
            
        return result
    except https_fn.HttpsError:
        # Re-raise HttpsError as-is (don't wrap it)
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Pairing failed: {str(e)}"
        )
