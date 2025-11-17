# Secret Santa

Firebase-hosted Secret Santa gift exchange app with user authentication, admin controls, and automated random pairing.

## Features

- User login with name-based authentication
- Editable wishlists
- Admin dashboard for triggering Secret Santa pairing
- Secure random pairing algorithm (Python Cloud Function)
- Per-user custom CSS themes
- Mobile-first responsive design

## Tech Stack

- **Frontend**: HTML, TailwindCSS, Alpine.js
- **Backend**: Firebase (Auth, Firestore, Functions, Storage, Hosting)
- **Functions**: Python 3.13
- **Development**: Firebase Local Emulator Suite

## Quick Start

### Prerequisites

```bash
npm install -g firebase-tools
firebase login
```

### Local Development

**Terminal 1** - Start emulators:
```bash
firebase emulators:start
```

**Terminal 2** - Seed test data:
```bash
cd scripts
npm install
npm run seed
```

**Access the app**: <http://localhost:5000>

**Test accounts**:
- Users: `john`, `mary`, `paul` / password: `password123`
- Admin: `admin` / password: `admin123`

## Project Structure

```
.
├── public/              # Frontend assets
│   ├── index.html       # Main app
│   ├── js/              # Alpine.js components
│   └── css/             # Custom styling
├── functions/           # Python Cloud Functions
│   └── main.py          # Pairing algorithm
├── scripts/             # Utilities
│   └── seed-emulators.js # Test data seeder
├── docs/                # Documentation
│   ├── SETUP.md
│   ├── DATABASE_SCHEMA.md
│   └── CUSTOM_STYLING.md
├── firestore.rules      # Database security
└── storage.rules        # Storage security
```

## Workflow

1. Users log in and update wishlists
2. Admin triggers pairing (one-time only)
3. Users see their assigned giftee
4. Wishlist remains editable post-pairing

## Production Deployment

```bash
firebase deploy
```

See `docs/SETUP.md` for full deployment instructions.

## Documentation

- **Setup Guide**: `docs/SETUP.md`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **Custom Styling**: `docs/CUSTOM_STYLING.md`

## License

Private project
