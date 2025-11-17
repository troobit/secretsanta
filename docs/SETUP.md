# Setup

## Prerequisites
- Firebase CLI: `npm install -g firebase-tools`
- `firebase login`

## Local Development

**Start emulators:**
```bash
firebase emulators:start
```

**Seed test data:**
```bash
cd scripts && npm install && npm run seed
```

**Access:**
- App: http://localhost:5000
- Emulator UI: http://localhost:4000

**Test logins:**
- Users: john, mary, paul / password123
- Admin: admin / admin123

## Production

```bash
firebase deploy
```
