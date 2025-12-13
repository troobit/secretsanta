# Secret Santa

A Firebase-hosted gift exchange application that automates Secret Santa pairing with user authentication, wishlists, and admin controls. Features a secure random pairing algorithm, per-user custom theming, and a responsive web interface.

## Features

- **User Authentication**: Name-based login system with secure session management
- **Wishlist Management**: Create and edit wishlists that remain editable even after pairing
- **Automated Pairing**: Admin-triggered Secret Santa assignment with conflict constraint support (coming soon)
- **Secure Algorithm**: Python Cloud Function with constraint-aware random pairing
- **Custom Theming**: Per-user CSS customization for personalized experiences
- **Admin Dashboard**: Dedicated controls for managing pairings and viewing assignments
- **Mobile-First Design**: Responsive interface optimized for all device sizes

## Quick Start

### Prerequisites

Install Firebase CLI and authenticate:

```bash
npm install -g firebase-tools
firebase login
```

### Local Development

**Start the Firebase emulators** (Terminal 1):
```bash
firebase emulators:start
```

**Seed test data** (Terminal 2):
```bash
cd scripts
npm install
npm run seed
```

**Access the application**: [http://localhost:5000](http://localhost:5000)

**Test Accounts**:
- Regular users: `john`, `mary`, `paul` (password: `password123`)
- Administrator: `admin` (password: `admin123`)

## Architecture

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML, TailwindCSS, Alpine.js |
| Backend | Firebase (Auth, Firestore, Functions, Storage, Hosting) |
| Cloud Functions | Python 3.13 |
| Development | Firebase Local Emulator Suite |

### Project Structure

```
.
├── public/                      # Frontend application
│   ├── index.html               # Main app entry point
│   ├── js/
│   │   ├── auth-component.js        # Authentication logic
│   │   ├── user-dashboard-component.js
│   │   ├── admin-dashboard-component.js
│   │   └── firebase-init.js
│   └── css/                     # Stylesheets
│       ├── theme-default.css
│       └── *.css                # Per-user custom themes
├── functions/
│   └── main.py                  # Pairing algorithm & admin endpoints
├── scripts/
│   ├── seed-emulators.js        # Test data seeder
│   └── users.json               # User configuration
├── docs/
│   ├── SETUP.md                 # Detailed setup instructions
│   ├── DATABASE_SCHEMA.md       # Firestore data model
│   ├── CUSTOM_STYLING.md        # Theme customization guide
│   ├── PAIRING_CONSTRAINTS.md   # Constraint algorithm design
│   └── PYTHON_STANDARDS.md      # Code style guidelines
├── firestore.rules              # Database access control
└── storage.rules                # File storage access control
```

## Workflow

1. **Registration & Login**: Users authenticate with their username
2. **Wishlist Setup**: Users create and manage their gift wishlists
3. **Admin Pairing**: Administrator triggers Secret Santa assignment
4. **Assignment Viewing**: Users discover their assigned giftee
5. **Gift Planning**: Users review giftee's wishlist (pairing remains editable post-assignment)

## Deployment

Deploy to Firebase hosting:

```bash
firebase deploy
```

> Includes frontend, functions, and security rules. See [docs/SETUP.md](docs/SETUP.md) for detailed production setup instructions.

## Documentation

Detailed guides available in the `docs/` folder:

- [**Setup Guide**](docs/SETUP.md) — Installation, configuration, and deployment
- [**Database Schema**](docs/DATABASE_SCHEMA.md) — Firestore data model and collections
- [**Custom Styling**](docs/CUSTOM_STYLING.md) — Theme customization and CSS overrides
- [**Pairing Constraints**](docs/PAIRING_CONSTRAINTS.md) — Constraint algorithm design and requirements
- [**Python Standards**](docs/PYTHON_STANDARDS.md) — Code style and conventions

## Development

### Local Emulator UI

Access the Firebase Emulator dashboard during development:
[http://localhost:4000](http://localhost:4000)

### Emulator Ports

| Service | Port |
|---------|------|
| Hosting | 5000 |
| Functions | 5001 |
| Firestore | 8080 |
| Auth | 9099 |
| Storage | 9199 |
| Emulator UI | 4000 |

## Project Status

Currently implemented:
- Core authentication and user management
- Wishlist CRUD operations
- Admin pairing with basic algorithm
- Custom theming system

Planned features:
- Constraint-aware pairing algorithm
- Conflict constraint management UI
- Management dashboard
