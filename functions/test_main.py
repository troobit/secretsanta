import unittest
from unittest.mock import Mock, patch, MagicMock
from main import triggerSecretSantaPairing
from firebase_functions import https_fn


class TestSecretSantaPairing(unittest.TestCase):
    """Test suite for Secret Santa pairing with conflict constraints"""

    def setUp(self):
        """Set up test fixtures"""
        self.mock_request = Mock(spec=https_fn.CallableRequest)
        self.mock_request.auth = Mock()
        self.mock_request.auth.token = {'email': 'admin@rtob.dev'}

    def create_mock_user_doc(self, data):
        """Helper to create a mock Firestore document"""
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = data
        return mock_doc

    @patch('main.firestore.client')
    def test_solvable_no_conflicts(self, mock_firestore):
        """Test successful pairing with no conflicts"""
        # Setup mock Firestore
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        # Mock admin user
        admin_doc = self.create_mock_user_doc({'isAdmin': True})
        mock_db.collection.return_value.document.return_value.get.return_value = admin_doc
        
        # Mock users with no conflicts
        mock_users = [
            Mock(id='user1', to_dict=lambda: {'name': 'User 1', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user2', to_dict=lambda: {'name': 'User 2', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user3', to_dict=lambda: {'name': 'User 3', 'isAdmin': False, 'conflicts': []}),
        ]
        
        mock_db.collection.return_value.where.return_value.stream.return_value = mock_users
        mock_db.batch.return_value = Mock()
        
        # Execute
        result = triggerSecretSantaPairing(self.mock_request)
        
        # Assert
        self.assertEqual(result['pairingsCount'], 3)
        self.assertIn('timestamp', result)
        self.assertNotIn('warnings', result)

    @patch('main.firestore.client')
    def test_solvable_with_bilateral_conflicts(self, mock_firestore):
        """Test successful pairing with bilateral conflicts"""
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        admin_doc = self.create_mock_user_doc({'isAdmin': True})
        mock_db.collection.return_value.document.return_value.get.return_value = admin_doc
        
        # Users with conflicts: user1 ↔ user2 conflict
        mock_users = [
            Mock(id='user1', to_dict=lambda: {'name': 'User 1', 'isAdmin': False, 'conflicts': ['user2']}),
            Mock(id='user2', to_dict=lambda: {'name': 'User 2', 'isAdmin': False, 'conflicts': ['user1']}),
            Mock(id='user3', to_dict=lambda: {'name': 'User 3', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user4', to_dict=lambda: {'name': 'User 4', 'isAdmin': False, 'conflicts': []}),
        ]
        
        mock_db.collection.return_value.where.return_value.stream.return_value = mock_users
        mock_db.batch.return_value = Mock()
        
        result = triggerSecretSantaPairing(self.mock_request)
        
        self.assertEqual(result['pairingsCount'], 4)
        self.assertIn('timestamp', result)

    @patch('main.firestore.client')
    def test_asymmetric_conflicts_warning(self, mock_firestore):
        """Test that asymmetric conflicts generate warnings"""
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        admin_doc = self.create_mock_user_doc({'isAdmin': True})
        mock_db.collection.return_value.document.return_value.get.return_value = admin_doc
        
        # Asymmetric conflict: user1 declares conflict with user2, but not vice versa
        mock_users = [
            Mock(id='user1', to_dict=lambda: {'name': 'User 1', 'isAdmin': False, 'conflicts': ['user2']}),
            Mock(id='user2', to_dict=lambda: {'name': 'User 2', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user3', to_dict=lambda: {'name': 'User 3', 'isAdmin': False, 'conflicts': []}),
        ]
        
        mock_db.collection.return_value.where.return_value.stream.return_value = mock_users
        mock_db.batch.return_value = Mock()
        
        result = triggerSecretSantaPairing(self.mock_request)
        
        self.assertEqual(result['pairingsCount'], 3)
        self.assertIn('warnings', result)
        self.assertTrue(any('asymmetric' in w.lower() for w in result['warnings']))

    @patch('main.firestore.client')
    def test_unsolvable_fully_conflicted_user(self, mock_firestore):
        """Test that fully conflicted users are detected before pairing"""
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        admin_doc = self.create_mock_user_doc({'isAdmin': True})
        mock_db.collection.return_value.document.return_value.get.return_value = admin_doc
        
        # User1 is conflicted with all others
        mock_users = [
            Mock(id='user1', to_dict=lambda: {'name': 'User 1', 'isAdmin': False, 'conflicts': ['user2', 'user3']}),
            Mock(id='user2', to_dict=lambda: {'name': 'User 2', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user3', to_dict=lambda: {'name': 'User 3', 'isAdmin': False, 'conflicts': []}),
        ]
        
        mock_db.collection.return_value.where.return_value.stream.return_value = mock_users
        
        with self.assertRaises(https_fn.HttpsError) as context:
            triggerSecretSantaPairing(self.mock_request)
        
        self.assertEqual(context.exception.code, https_fn.FunctionsErrorCode.FAILED_PRECONDITION)
        self.assertIn('conflicted with all other participants', str(context.exception.message))

    @patch('main.firestore.client')
    def test_unsolvable_impossible_configuration(self, mock_firestore):
        """Test that impossible conflict configurations are detected"""
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        admin_doc = self.create_mock_user_doc({'isAdmin': True})
        mock_db.collection.return_value.document.return_value.get.return_value = admin_doc
        
        # Create a configuration where pairing is impossible
        # All users conflict with each other in a way that makes circular pairing impossible
        mock_users = [
            Mock(id='user1', to_dict=lambda: {'name': 'User 1', 'isAdmin': False, 'conflicts': ['user2', 'user3']}),
            Mock(id='user2', to_dict=lambda: {'name': 'User 2', 'isAdmin': False, 'conflicts': ['user3', 'user4']}),
            Mock(id='user3', to_dict=lambda: {'name': 'User 3', 'isAdmin': False, 'conflicts': ['user4']}),
            Mock(id='user4', to_dict=lambda: {'name': 'User 4', 'isAdmin': False, 'conflicts': ['user1']}),
        ]
        
        mock_db.collection.return_value.where.return_value.stream.return_value = mock_users
        
        with self.assertRaises(https_fn.HttpsError) as context:
            triggerSecretSantaPairing(self.mock_request)
        
        error_msg = str(context.exception.message)
        self.assertIn('Unable to generate valid pairings', error_msg)
        self.assertIn('conflict', error_msg.lower())

    @patch('main.firestore.client')
    def test_insufficient_users(self, mock_firestore):
        """Test that insufficient user count is detected"""
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        admin_doc = self.create_mock_user_doc({'isAdmin': True})
        mock_db.collection.return_value.document.return_value.get.return_value = admin_doc
        
        # Only 2 users
        mock_users = [
            Mock(id='user1', to_dict=lambda: {'name': 'User 1', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user2', to_dict=lambda: {'name': 'User 2', 'isAdmin': False, 'conflicts': []}),
        ]
        
        mock_db.collection.return_value.where.return_value.stream.return_value = mock_users
        
        with self.assertRaises(https_fn.HttpsError) as context:
            triggerSecretSantaPairing(self.mock_request)
        
        self.assertEqual(context.exception.code, https_fn.FunctionsErrorCode.FAILED_PRECONDITION)
        self.assertIn('Insufficient users', str(context.exception.message))

    @patch('main.firestore.client')
    def test_self_assignment_prevention(self, mock_firestore):
        """Test that self-assignment is never allowed"""
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        admin_doc = self.create_mock_user_doc({'isAdmin': True})
        mock_db.collection.return_value.document.return_value.get.return_value = admin_doc
        
        mock_users = [
            Mock(id='user1', to_dict=lambda: {'name': 'User 1', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user2', to_dict=lambda: {'name': 'User 2', 'isAdmin': False, 'conflicts': []}),
            Mock(id='user3', to_dict=lambda: {'name': 'User 3', 'isAdmin': False, 'conflicts': []}),
        ]
        
        mock_db.collection.return_value.where.return_value.stream.return_value = mock_users
        
        # Mock batch to capture assignments
        captured_assignments = {}
        mock_batch = Mock()
        
        def capture_update(ref, data):
            user_id = ref.document.call_args[0][0] if ref.document.called else None
            if user_id:
                captured_assignments[user_id] = data['gifteeId']
        
        mock_batch.update = Mock(side_effect=capture_update)
        mock_db.batch.return_value = mock_batch
        
        result = triggerSecretSantaPairing(self.mock_request)
        
        # Verify no self-assignments
        for giver_id, giftee_id in captured_assignments.items():
            self.assertNotEqual(giver_id, giftee_id, f"Self-assignment detected: {giver_id}")

    @patch('main.firestore.client')
    def test_unauthenticated_user(self, mock_firestore):
        """Test that unauthenticated users are rejected"""
        self.mock_request.auth = None
        
        with self.assertRaises(https_fn.HttpsError) as context:
            triggerSecretSantaPairing(self.mock_request)
        
        self.assertEqual(context.exception.code, https_fn.FunctionsErrorCode.UNAUTHENTICATED)

    @patch('main.firestore.client')
    def test_non_admin_user(self, mock_firestore):
        """Test that non-admin users are rejected"""
        mock_db = Mock()
        mock_firestore.return_value = mock_db
        
        # Non-admin user
        user_doc = self.create_mock_user_doc({'isAdmin': False})
        mock_db.collection.return_value.document.return_value.get.return_value = user_doc
        
        with self.assertRaises(https_fn.HttpsError) as context:
            triggerSecretSantaPairing(self.mock_request)
        
        self.assertEqual(context.exception.code, https_fn.FunctionsErrorCode.PERMISSION_DENIED)


if __name__ == '__main__':
    unittest.main()
