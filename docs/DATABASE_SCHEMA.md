# Database Schema

## Firestore Collections

### users Collection

**Collection Path**: `/users/{userId}`

**Document ID**: User's name (matches the part before @ in their email, e.g., "john" for john@secretsanta.app)

**Fields**:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | Yes | User's display name | "John Smith" |
| `wishlist` | string | Conditional* | User's gift wishlist (editable after pairing) | "Books, coffee, woolly socks" |
| `votedAmount` | number | Conditional* | Agreed spending amount in currency | 50 |
| `profilePicUrl` | string | Conditional* | URL to user's profile picture in Firebase Storage | "https://firebasestorage.googleapis.com/.../profile-pictures/john.jpg" |
| `gifteeId` | string\|null | Conditional* | Document ID of assigned giftee (null before pairing) | "mary" or null |
| `isAdmin` | boolean | Yes | Whether user has admin privileges | true or false |

**Note**: *Fields marked "Conditional" are required for regular users (`isAdmin: false`) but optional for admin users (`isAdmin: true`). Admin users only require `name` and `isAdmin` fields.

**Security Rules**:
- Authenticated users can read all user documents
- Users can only create/update their own document (matched by userId)
- After system lock (lockInTime set), users can only update `wishlist` field
- Delete operations are blocked

**Indexes**: None required (simple queries only)

### settings Collection

**Collection Path**: `/settings/{documentId}`

**Document ID**: `config` (single settings document)

**Fields**:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `lockInTime` | Timestamp\|null | Yes | Time when pairing was completed (null before pairing) | Timestamp(2025-12-01 10:30:00) or null |

**Security Rules**:
- Authenticated users can read
- Only admin@secretsanta.app can write
- Once set, lockInTime prevents user field updates (except wishlist)

**Indexes**: None required

## Sample Data

### Sample User Document (`/users/john`)
```json
{
  "name": "John Smith",
  "wishlist": "Books about Irish history, good coffee beans, warm woolly socks",
  "votedAmount": 50,
  "profilePicUrl": "https://firebasestorage.googleapis.com/v0/b/project-id.appspot.com/o/profile-pictures%2Fjohn.jpg?alt=media",
  "gifteeId": null,
  "isAdmin": false
}
```

### Sample Admin User Document (`/users/admin`)
```json
{
  "name": "Admin User",
  "isAdmin": true
}
```

**Note**: Admin users have a minimal schema and are excluded from Secret Santa pairing logic.

### Sample Settings Document (`/settings/config`)
```json
{
  "lockInTime": null
}
```

### After Pairing
```json
{
  "lockInTime": {
    "_seconds": 1733022600,
    "_nanoseconds": 0
  }
}
```

## Data Relationships

- Each user document has a `gifteeId` field that references another user's document ID
- After pairing, these form a circular chain: A → B → C → D → A
- The chain ensures everyone gives and receives exactly one gift
