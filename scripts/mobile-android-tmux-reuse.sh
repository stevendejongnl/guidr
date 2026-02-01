#!/bin/bash
# Reuses or creates a tmux window/session for mobile development
# Usage: ./scripts/mobile-android-tmux-reuse.sh
# If already in tmux: creates new window in current session
# If not in tmux: creates/reuses persistent session

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start MongoDB if not already running
echo "Starting MongoDB container..."
cd "$PROJECT_ROOT/api-server"
docker compose up -d mongodb
cd "$PROJECT_ROOT"

if [ -n "$TMUX" ]; then
  # Already in a tmux session - create new windows with panes
  ANDROID_WINDOW="android"
  API_WINDOW="api"

  # Kill existing windows if they exist
  tmux kill-window -t "$ANDROID_WINDOW" 2>/dev/null || true
  tmux kill-window -t "$API_WINDOW" 2>/dev/null || true

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
  # Not in tmux - create/reuse session
  SESSION_NAME="guidr-android"

  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    # Session exists - kill old panes and start fresh
    tmux kill-session -t "$SESSION_NAME"
  fi

  # Create new session with android window
  tmux new-session -d -s "$SESSION_NAME" -x 200 -y 50 -n "android"
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
