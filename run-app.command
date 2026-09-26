#!/bin/bash
# Double-click this file in Finder to launch the whole app: backend, React
# dev server, and Electron — all with one click, no manual terminals.
set -e

cd "$(dirname "$0")"

echo "Starting backend..."
(cd backend && source venv/bin/activate && python main.py) &
BACKEND_PID=$!

echo "Starting React dev server..."
BROWSER=none npm start &
REACT_PID=$!

# whenever this script exits — Electron closed, Ctrl+C, error — kill both
# background servers too, so nothing keeps running in the background.
# kill by PORT, not by $BACKEND_PID/$REACT_PID: npm and the "(...)" subshell
# each fork a child process to actually run the server, so killing the
# wrapper PID leaves the real server (still bound to the port) orphaned.
cleanup() {
  echo "Shutting down..."
  lsof -ti :5001 -sTCP:LISTEN | xargs kill 2>/dev/null
  lsof -ti :3000 -sTCP:LISTEN | xargs kill 2>/dev/null
}
trap cleanup EXIT

echo "Waiting for backend..."
until curl -s http://localhost:5001/history > /dev/null; do
  sleep 0.5
done

echo "Waiting for frontend..."
until curl -s http://localhost:3000 > /dev/null; do
  sleep 0.5
done

# runs in the foreground — the script (and this terminal window) stays open
# until you close the Electron window, then cleanup() above runs automatically
echo "Launching Electron..."
npm run electron-dev
