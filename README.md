# Liam's S&C Program (PWA)

A fast, offline-first Progressive Web App for logging S&C sessions:
- Sessions with named workouts
- Exercises + sets
- Track **weight, reps, sets, RPE**, and optional **VBT velocity (m/s)** per set
- History + graphs per exercise (load, volume, e1RM)
- Works offline, installs to iPhone/Android home screen

## Quick start
1) Install Node.js (LTS)
2) In terminal:
```bash
npm install
npm run dev
```

## Deploy (easy)
- Push to GitHub
- Import to Vercel (recommended) and deploy
- Open the site on your phone → Share → Add to Home Screen

## Data
Stored locally in IndexedDB (Dexie). Export/Import JSON in Settings.
