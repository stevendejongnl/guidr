#!/bin/bash
# Send Telegram notification for CI/CD events
# Usage: ./send-telegram-notification.sh --type <type> --branch <branch> --run-url <url> --commit <sha> [options]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TELEGRAM_API="https://api.telegram.org/bot"

# Parse command-line arguments
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --type)
        NOTIFICATION_TYPE="$2"
        shift 2
        ;;
      --version)
        VERSION="$2"
        shift 2
        ;;
      --branch)
        BRANCH="$2"
        shift 2
        ;;
      --run-url)
        RUN_URL="$2"
        shift 2
        ;;
      --commit)
        COMMIT="$2"
        shift 2
        ;;
      --error)
        ERROR_MSG="$2"
        shift 2
        ;;
      --metadata)
        METADATA="$2"
        shift 2
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      *)
        echo "Unknown option: $1"
        exit 1
        ;;
    esac
  done
}

# Escape HTML entities for Telegram
escape_html() {
  local text="$1"
  text="${text//&/&amp;}"
  text="${text//</&lt;}"
  text="${text//>/&gt;}"
  text="${text//\"/&quot;}"
  text="${text//\'/&#x27;}"
  echo "$text"
}

# Truncate commit SHA to 7 characters
truncate_sha() {
  echo "${1:0:7}"
}

# Truncate long strings with ellipsis
truncate_string() {
  local text="$1"
  local max_length="${2:-1000}"
  if [ ${#text} -gt $max_length ]; then
    echo "${text:0:$max_length}..."
  else
    echo "$text"
  fi
}

# Format message based on notification type
format_message() {
  local type="$1"
  local commit_short=$(truncate_sha "$COMMIT")
  local escaped_branch=$(escape_html "$BRANCH")
  local escaped_error=$(escape_html "${ERROR_MSG:-}")

  case "$type" in
    release_success)
      cat <<EOF
<b>🚀 Release v${VERSION} Created</b>

<b>Status:</b> ✅ Success
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<a href="https://github.com/stevendejongnl/guidr/releases/tag/v${VERSION}">View Release</a>
<a href="${RUN_URL}">View Workflow</a>
EOF
      ;;
    release_skip)
      cat <<EOF
<b>ℹ️ Release Check Completed</b>

<b>Status:</b> ℹ️ No release needed
<b>Branch:</b> ${escaped_branch}
<b>Reason:</b> No relevant commits since last release

<a href="${RUN_URL}">View Workflow</a>
EOF
      ;;
    android_success)
      cat <<EOF
<b>📦 Android APK v${VERSION} Uploaded</b>

<b>Status:</b> ✅ Success
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<a href="https://github.com/stevendejongnl/guidr/releases/tag/v${VERSION}">Download APK</a>
<a href="${RUN_URL}">View Build</a>
EOF
      ;;
    android_failure)
      cat <<EOF
<b>📦 Android Build Failed</b>

<b>Status:</b> ❌ Failure
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<a href="${RUN_URL}">View Build Logs</a>
EOF
      ;;
    testflight_success)
      cat <<EOF
<b>✈️ TestFlight v${VERSION} Deployed</b>

<b>Status:</b> ✅ Success
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<a href="${RUN_URL}">View Build</a>
EOF
      ;;
    testflight_failure)
      cat <<EOF
<b>✈️ TestFlight Deployment Failed</b>

<b>Status:</b> ❌ Failure
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<a href="${RUN_URL}">View Build Logs</a>
EOF
      ;;
    docker_success)
      cat <<EOF
<b>🐳 Docker v${VERSION} Deployed</b>

<b>Status:</b> ✅ Success
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<b>Image:</b> <code>ghcr.io/stevendejongnl/guidr-api-server:${VERSION}</code>

<a href="${RUN_URL}">View Deployment</a>
EOF
      ;;
    docker_failure)
      cat <<EOF
<b>🐳 Docker Deployment Failed</b>

<b>Status:</b> ❌ Failure
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<a href="${RUN_URL}">View Build Logs</a>
EOF
      ;;
    pr_check_failure)
      cat <<EOF
<b>⚠️ PR Check Failed</b>

<b>Status:</b> ❌ Failure
<b>Branch:</b> ${escaped_branch}
<b>Commit:</b> <code>${commit_short}</code>

<a href="${RUN_URL}">View Failed Checks</a>
EOF
      ;;
    *)
      echo "Error: Unknown notification type: $type"
      exit 1
      ;;
  esac
}

# Validate required parameters
validate_parameters() {
  local required_params=("NOTIFICATION_TYPE" "BRANCH" "RUN_URL" "COMMIT")

  for param in "${required_params[@]}"; do
    if [ -z "${!param}" ]; then
      echo "Error: Required parameter --${param,,} not provided"
      exit 1
    fi
  done

  # Type-specific validations
  case "$NOTIFICATION_TYPE" in
    release_success|android_success|testflight_success|docker_success)
      if [ -z "$VERSION" ]; then
        echo "Error: --version is required for $NOTIFICATION_TYPE"
        exit 1
      fi
      ;;
  esac
}

# Send notification to Telegram
send_telegram() {
  local message="$1"

  # Check for required secrets
  if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "⚠️ Telegram secrets not configured, skipping notification"
    return 0
  fi

  # Truncate message if too long (Telegram limit: 4096)
  if [ ${#message} -gt 4000 ]; then
    message="${message:0:4000}...truncated"
  fi

  # Send via Telegram API
  set +e
  local response=$(curl -s -X POST \
    "${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${message}" \
    -d "parse_mode=HTML" \
    -d "disable_web_page_preview=false" \
    -d "disable_notification=false")
  local curl_exit_code=$?
  set -e

  if [ $curl_exit_code -ne 0 ]; then
    echo "⚠️ Failed to send Telegram notification (curl exit code: $curl_exit_code)"
    echo "Response: $response"
    return 0  # Don't fail CI
  fi

  # Check if API returned success
  if echo "$response" | grep -q '"ok":true'; then
    echo "✓ Telegram notification sent successfully"
    return 0
  else
    echo "⚠️ Telegram API error: $response"
    return 0  # Don't fail CI even if notification fails
  fi
}

# Main execution
main() {
  parse_arguments "$@"
  validate_parameters

  # Format the notification message
  MESSAGE=$(format_message "$NOTIFICATION_TYPE")

  if [ "$DRY_RUN" = true ]; then
    echo "==== DRY RUN: Telegram Notification ===="
    echo ""
    echo "$MESSAGE"
    echo ""
    echo "==== Would send to chat ID: $TELEGRAM_CHAT_ID ===="
    return 0
  fi

  # Send the notification
  send_telegram "$MESSAGE"
}

# Execute main function with all arguments
main "$@"
