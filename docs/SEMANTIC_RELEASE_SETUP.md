# Semantic Release Branch Protection Bypass Setup

## Summary
The release workflow has been configured to use a fine-grained Personal Access Token (`SEMANTIC_RELEASE_TOKEN`) to bypass branch protection rules on `main`. You need to create this token and configure branch protection settings.

## Step 1: Create Fine-Grained Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure:
   - **Name**: `Guidr Semantic Release`
   - **Expiration**: 1 year
   - **Repository access**: Only select repositories → `stevendejongnl/guidr`
   - **Permissions**:
     - Contents: Read and write
     - Metadata: Read-only (automatically included)
     - Pull requests: Read and write
     - Issues: Read and write
4. Click "Generate token"
5. **Copy the token immediately** (it's only shown once)

## Step 2: Add Token as Repository Secret

1. Go to https://github.com/stevendejongnl/guidr/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SEMANTIC_RELEASE_TOKEN`
4. Value: Paste the PAT from Step 1
5. Click "Add secret"

## Step 3: Configure Branch Protection Bypass

1. Go to https://github.com/stevendejongnl/guidr/settings/branches
2. Click the branch protection rule for `main`
3. Scroll to "Rules applied to everyone including administrators"
4. Check: "Allow specified actors to bypass required pull requests"
5. Click "Add bypass" and select your GitHub user account
6. Save changes

**Note**: The PAT inherits your user permissions, so if you can bypass protection, so can the PAT.

## Verification

After completing all steps, test the workflow:

```bash
# Option 1: Wait for next push to main
# The release workflow will run automatically on the next commit

# Option 2: Test with a conventional commit
git checkout -b test/semantic-release
git commit --allow-empty -m "test: verify semantic release workflow"
git push -u origin test/semantic-release
gh pr create --title "test: verify semantic release workflow" --body "Testing branch protection bypass"
gh pr merge --squash

# Watch the release workflow
gh run watch
```

## Expected Behavior

When successful, the workflow should:
- Run all tests and checks (lint, typecheck, API tests)
- Determine the next version via semantic-release
- Push version bump commits to main (bypassing branch protection)
- Create a GitHub release
- Trigger downstream workflows (Docker)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Permission denied to push to main" | Verify token has been added to repo secrets and branch protection has bypass enabled |
| Workflow still uses `GITHUB_TOKEN` | Clear browser cache, confirm workflow file was saved with `SEMANTIC_RELEASE_TOKEN` |
| Release not detected | Check commits use conventional commit format (`feat:`, `fix:`, etc.) |
| Token expiration | GitHub sends emails 30 days before; rotate token and update secret |

## File Changes

- `.github/workflows/release.yml`: Updated to use `SEMANTIC_RELEASE_TOKEN` in checkout, dry-run, release, and trigger-downstream steps

## Security Notes

- The PAT has same permissions as your user account
- Set expiration to 1 year maximum
- Stored encrypted in GitHub Secrets
- Can be revoked anytime from GitHub settings
- Consider using a GitHub App for better audit trails (advanced)
