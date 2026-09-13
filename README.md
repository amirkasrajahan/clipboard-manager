# Clipboard Manager

A desktop clipboard history manager. Runs in the background, watches the system
clipboard, and keeps a searchable history — with notes, favorites, and a
scratchpad for combining multiple copied snippets into one block of text.

Built with Electron + React on the frontend and a small Flask + SQLite backend
for persistence.

## Features

- **Auto-tracking** — polls the system clipboard every second and saves new
  copies automatically (skips exact duplicates in a row)
- **Search** — press `/` to jump to the search box, matches are highlighted
- **Per-item notes** — attach a note to any entry
- **Favorites** — star items to keep them easy to find
- **Selection mode** — multi-select entries (in click order) and use
  **Add to Bench** to concatenate them into one block of text you can copy out
- **Click to copy** — click any entry to put it back on the clipboard

## Tech stack

- **Frontend**: React (Create React App) + Electron
- **Backend**: Flask, Flask-SQLAlchemy, Flask-CORS
- **Storage**: SQLite (`backend/clipboard.db`, created automatically on first run)

## Running it locally

**1. Install frontend dependencies**

```bash
npm install
```

**2. Install backend dependencies**

```bash
pip install flask flask-sqlalchemy flask-cors
```

**3. Start the backend** (from the repo root, runs on `localhost:5000`)

```bash
python backend/main.py
```

**4. Start the app**

```bash
npm run electron-dev
```

This launches the Electron window (500x700) pointed at the React dev server.
The backend must be running first — if it isn't, the app still opens but
clipboard history won't persist.

## Project structure

```
backend/main.py       Flask API — /history (GET/POST), /history/:id (PATCH/DELETE)
public/electron.js    Electron main process — clipboard polling, window setup
public/preload.js     IPC bridge exposed to React as window.electronAPI
src/App.jsx           Main UI — history, search, selection mode, bench
src/components/       Clipboard item card
```
