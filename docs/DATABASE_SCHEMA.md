# Database Schema

## users Collection

**Path**: `/users/{userId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name |
| `wishlist` | string | Users only | Gift wishlist |
| `profilePicUrl` | string | Users only | Storage URL |
| `gifteeId` | string\|null | Users only | Assigned giftee ID |
| `isAdmin` | boolean | Yes | Admin flag |
| `conflicts` | array of strings | No | User IDs this person cannot be paired with (defaults to empty array) |

**Note**: Regular users need all fields except `conflicts` (optional). Admin users need only `name` and `isAdmin: true`.

**Security**: Authenticated users read all, write own.

```
