# אפליקציית כושר — Fitness Tracker

A Hebrew-language progressive web app for managing workout plans, tracking sessions, and syncing data across devices via Firebase.

## Features

- **Workout plans** — create, edit, duplicate, and organize plans with multiple workout days
- **Exercise bank** — a personal library of exercises with auto-generated instructions based on exercise name
- **Live sessions** — step through exercises with a rest timer, set tracking, and PR detection
- **Bodyweight support** — mark exercises as bodyweight; weight field becomes optional
- **History & heatmap** — full workout log with a GitHub-style activity heatmap
- **Progress charts** — visualize weight and volume trends per exercise
- **Cross-device sync** — all data lives in Firestore; sign in on any device and your data follows
- **JSON backup** — export and import a full data backup at any time
- **PWA** — installable on iOS and Android, works offline (Firestore cache)

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript |
| Routing | React Router 7 (hash-based) |
| State | React Context + `useReducer` |
| Drag & drop | dnd-kit |
| Backend | Firebase Auth (Google Sign-In) + Firestore |
| Build | Vite 7, vite-plugin-pwa |
| Tests | Vitest, React Testing Library |

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd fitness-app
npm install
```

### 2. Configure Firebase

Copy the example env file and fill in your Firebase project credentials:

```bash
cp .env.example .env.local
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

You can find these values in the Firebase console under **Project Settings → Your apps**.

### 3. Firestore rules

In the Firebase console, set Firestore security rules so each user can only access their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), sign in with Google, and start tracking.

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npm run preview      # Preview the production build locally
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run lint         # ESLint
npm run format       # Prettier
```

## Project Structure

```
src/
├── components/      # Reusable UI components (RestTimer, ExerciseForm, …)
├── context/         # React Context slices (Plans, History, Bank, Auth)
├── pages/           # Route-level pages (Home, Session, History, …)
├── utils/
│   ├── firebaseSync.ts          # Firestore load / save / real-time listener
│   ├── storage.ts               # validateImportData, exportAppState
│   └── exerciseInstructionsDb.ts # Auto-generated exercise instructions
├── firebase.ts      # Firebase app initialization
├── App.tsx          # Router and layout
└── types.ts         # Shared TypeScript types
```

## Data Architecture

All data is stored in Firestore under `users/{uid}/`:

| Path | Contents |
|---|---|
| `data/appState` | Plans + exercise bank |
| `history/{entryId}` | Individual workout log entries (subcollection) |

History is stored as a subcollection to avoid Firestore's 1 MB document limit.

## Authentication

The app requires Google Sign-In. There is no local/offline-only mode — signing in is required to access the app and all data is synced to Firestore.

## PWA Installation

On iOS: tap the Share button → **Add to Home Screen**.
On Android: tap the browser menu → **Install app**.

The app runs in standalone mode (no browser chrome) and works offline using Firestore's built-in local cache.
