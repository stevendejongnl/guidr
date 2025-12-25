#!/bin/bash
# Trigger the iOS initialization workflow via GitHub API
# Requires: GITHUB_TOKEN environment variable or gh CLI installed

set -e

REPO_OWNER="stevendejongnl"
REPO_NAME="guidr"
WORKFLOW_FILE="initialize-ios.yml"
REF="main"

echo "Triggering iOS initialization workflow..."

# Try using gh CLI first (preferred)
if command -v gh &> /dev/null; then
    echo "Using gh CLI..."
    gh workflow run "$WORKFLOW_FILE" --ref "$REF"
    echo "✓ Workflow triggered successfully via gh CLI"
    exit 0
fi

# Fall back to curl with GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable not set and gh CLI not available"
    echo ""
    echo "Options:"
    echo "1. Install gh CLI: https://cli.github.com/"
    echo "2. Set GITHUB_TOKEN: export GITHUB_TOKEN=your_token_here"
    echo "3. Manually trigger at: https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
    exit 1
fi

echo "Using curl with GITHUB_TOKEN..."
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE/dispatches" \
  -d "{\"ref\":\"$REF\"}"

echo ""
echo "✓ Workflow triggered successfully via API"
echo "View at: https://github.com/$REPO_OWNER/$REPO_NAME/actions/workflows/$WORKFLOW_FILE"
