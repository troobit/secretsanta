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

        # Check if pairing already completed (lockInTime exists)
        settings_doc = db.collection('settings').document('config').get()
        if settings_doc.exists:
            settings_data = settings_doc.to_dict()
            if settings_data.get('lockInTime') is not None:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                    message="Pairing already completed. Cannot trigger again."
                )

        # Fetch all non-admin users for pairing
        users_ref = db.collection('users')
        users_query = users_ref.where(
            filter=FieldFilter('isAdmin', '==', False))
        users_snapshot = users_query.stream()

        users_to_pair = []
        for user in users_snapshot:
            users_to_pair.append({
                'id': user.id,
                'name': user.to_dict().get('name', 'Unknown')
            })

        # Validate minimum user count (need at least 3 for meaningful pairing)
        if len(users_to_pair) < 3:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                message=f"Insufficient users for pairing. Need at least 2 non-admin users, found {len(users_to_pair)}"
            )

        shuffled_users = users_to_pair.copy()
        n = len(shuffled_users)
        for i in range(n - 1, 0, -1):
            j = random.randint(0, i)
            shuffled_users[i], shuffled_users[j] = shuffled_users[j], shuffled_users[i]

        pairings = {}
        for i in range(len(shuffled_users)):
            giver_id = shuffled_users[i]['id']
            receiver_id = shuffled_users[(i + 1) % len(shuffled_users)]['id']
            pairings[giver_id] = receiver_id

            if giver_id == receiver_id:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.INTERNAL,
                    message="Algorithm error: self-assignment detected"
                )

        batch = db.batch()

        for giver_id, receiver_id in pairings.items():
            user_ref = db.collection('users').document(giver_id)
            batch.update(user_ref, {'gifteeId': receiver_id})

        settings_ref = db.collection('settings').document('config')
        batch.set(settings_ref, {
            'lockInTime': firestore.SERVER_TIMESTAMP
        }, merge=True)

        batch.commit()

        return {
            'success': True,
            'message': 'Pairing completed successfully',
            'pairingCount': len(pairings),
            'timestamp': datetime.now().isoformat()
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Pairing failed: {str(e)}"
        )
