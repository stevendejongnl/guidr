#!/bin/bash
# Creates a new tmux window or session for mobile development with Metro and android:watch in separate panes
# Usage: ./scripts/mobile-android-tmux-new.sh
# If already in tmux: creates new window in current session
# If not in tmux: creates new session

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start MongoDB if not already running
echo "Starting MongoDB container..."
cd "$PROJECT_ROOT/api-server"
docker compose up -d mongodb
cd "$PROJECT_ROOT"

if [ -n "$TMUX" ]; then
  # Already in a tmux session - create new windows with panes
  ANDROID_WINDOW="android-dev"
  API_WINDOW="api"

  # Create android window
  tmux new-window -n "$ANDROID_WINDOW"
  tmux send-keys -t "$ANDROID_WINDOW" "cd '$PROJECT_ROOT' && npm --workspace=mobile start" Enter

  # Create second pane for android:watch
  tmux split-window -h -t "$ANDROID_WINDOW"
  tmux send-keys -t "$ANDROID_WINDOW" "cd '$PROJECT_ROOT' && sleep 30 && npm --workspace=mobile run android:watch" Enter

  # Set equal pane sizes
  tmux select-layout -t "$ANDROID_WINDOW" even-horizontal

  # Create API window
  tmux new-window -n "$API_WINDOW"
  tmux send-keys -t "$API_WINDOW" "cd '$PROJECT_ROOT/api-server' && uv sync && MONGODB_URL=mongodb://guidr:guidr123@localhost:27017/guidr_test?authSource=admin uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" Enter
else
  # Not in tmux - create new session
  SESSION_NAME="guidr-android-dev"

  # Kill existing session if it exists
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux kill-session -t "$SESSION_NAME"
  fi

  # Create new session with android window
  tmux new-session -d -s "$SESSION_NAME" -x 200 -y 50 -n "android-dev"
  tmux send-keys -t "$SESSION_NAME" "cd '$PROJECT_ROOT' && npm --workspace=mobile start" Enter

  # Create second pane for android:watch
  tmux split-window -h -t "$SESSION_NAME"
  tmux send-keys -t "$SESSION_NAME" "cd '$PROJECT_ROOT' && sleep 30 && npm --workspace=mobile run android:watch" Enter

  # Set equal pane sizes
  tmux select-layout -t "$SESSION_NAME" even-horizontal

  # Create API window
  tmux new-window -t "$SESSION_NAME" -n "api"
  tmux send-keys -t "$SESSION_NAME:api" "cd '$PROJECT_ROOT/api-server' && uv sync && MONGODB_URL=mongodb://guidr:guidr123@localhost:27017/guidr_test?authSource=admin uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" Enter

  # Attach to the session
  tmux attach-session -t "$SESSION_NAME"
fi
