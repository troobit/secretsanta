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
    db = firestore.client()

    # Fetch all non-admin users for pairing
    users_ref = db.collection('users')
    users_query = users_ref.where(filter=FieldFilter('isAdmin', '==', False))
    users_snapshot = users_query.stream()

    users_to_pair = []
    for user in users_snapshot:
        user_data = user.to_dict()
        conflicts = user_data.get('conflicts', [])
        if not isinstance(conflicts, list):
            conflicts = []
        users_to_pair.append({
            'id': user.id,
            'conflicts': conflicts
        })

    conflict_lookup = {}
    for user in users_to_pair:
        conflict_set = set()
        for conflict_id in user['conflicts']:
            conflict_set.add(conflict_id)
        conflict_lookup[user['id']] = conflict_set

    random.seed(datetime.utcnow().timestamp())
    shuffled_givers = users_to_pair.copy()
    random.shuffle(shuffled_givers)

    def can_pair(giver_id, giftee_id):
        if giver_id == giftee_id:
            return False
        if giftee_id in conflict_lookup.get(giver_id, set()):
            return False
        return True

    def backtrack(giver_index, assignments, used_giftees):
        if giver_index == len(shuffled_givers):
            return True

        giver = shuffled_givers[giver_index]
        giver_id = giver['id']

        potential_giftees = [
            u for u in users_to_pair if u['id'] not in used_giftees]
        random.shuffle(potential_giftees)

        for giftee in potential_giftees:
            giftee_id = giftee['id']

            if can_pair(giver_id, giftee_id):
                assignments[giver_id] = giftee_id
                used_giftees.add(giftee_id)

                if backtrack(giver_index + 1, assignments, used_giftees):
                    return True

                del assignments[giver_id]
                used_giftees.remove(giftee_id)

        return False

    pairings = {}
    used_giftees = set()

    backtrack(0, pairings, used_giftees)

    batch = db.batch()
    for giver_id, receiver_id in pairings.items():
        user_ref = db.collection('users').document(giver_id)
        batch.update(user_ref, {'gifteeId': receiver_id})
    batch.commit()

    return {
        'pairingsCount': len(pairings),
        'timestamp': datetime.utcnow().isoformat()
    }
