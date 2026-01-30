#!/usr/bin/env bash
set -euo pipefail

# create-new-feature.sh
# Creates a new feature branch and specification directory for SDD workflow.
#
# Usage: ./scripts/create-new-feature.sh [--json] "Feature Description"
#
# Exit codes:
#   0 - Success
#   1 - Missing arguments
#   2 - Not in git repository root
#   3 - Git working directory not clean
#   4 - Branch already exists
#   5 - Feature directory already exists

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse arguments
JSON_OUTPUT=false
FEATURE_DESC=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            FEATURE_DESC="$1"
            shift
            ;;
    esac
done

# Helper function to output messages
output() {
    if [[ "$JSON_OUTPUT" == true ]]; then
        return
    fi
    echo "$1" >&2
}

# Helper function to output error and exit
error_exit() {
    local code=$1
    local message=$2
    if [[ "$JSON_OUTPUT" == true ]]; then
        echo "{\"error\": \"$message\", \"code\": $code}"
    else
        echo "Error: $message" >&2
    fi
    exit "$code"
}

# Validate arguments
if [[ -z "$FEATURE_DESC" ]]; then
    error_exit 1 "Missing feature description. Usage: $0 [--json] \"Feature Description\""
fi

# Validate repo root (check for .git directory)
if [[ ! -d "$REPO_ROOT/.git" ]]; then
    error_exit 2 "Not in a git repository root. Run from repository root."
fi

# Check git working directory is clean
if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
    error_exit 3 "Git working directory is not clean. Commit or stash changes first."
fi

# Generate kebab-case slug from feature description
generate_slug() {
    local desc="$1"
    echo "$desc" | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9 ]//g' | \
        sed 's/  */ /g' | \
        sed 's/^ *//;s/ *$//' | \
        tr ' ' '-'
}

SLUG=$(generate_slug "$FEATURE_DESC")
BRANCH_NAME="feat/$SLUG"
FEATURE_DIR="$REPO_ROOT/.claude/features/$SLUG"
SPEC_FILE="$FEATURE_DIR/spec.md"
TEMPLATE_FILE="$REPO_ROOT/templates/spec-template.md"

output "Feature slug: $SLUG"
output "Branch name: $BRANCH_NAME"

# Verify branch doesn't exist (local or remote)
if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$BRANCH_NAME" 2>/dev/null; then
    error_exit 4 "Local branch '$BRANCH_NAME' already exists."
fi

if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/remotes/origin/$BRANCH_NAME" 2>/dev/null; then
    error_exit 4 "Remote branch 'origin/$BRANCH_NAME' already exists."
fi

# Verify feature directory doesn't exist
if [[ -d "$FEATURE_DIR" ]]; then
    error_exit 5 "Feature directory '$FEATURE_DIR' already exists."
fi

# Create feature directory
output "Creating feature directory: $FEATURE_DIR"
mkdir -p "$FEATURE_DIR"

# Copy spec template if it exists, otherwise create a placeholder
if [[ -f "$TEMPLATE_FILE" ]]; then
    cp "$TEMPLATE_FILE" "$SPEC_FILE"
    output "Copied spec template to: $SPEC_FILE"
else
    # Create a minimal placeholder if template doesn't exist
    echo "# Feature Specification: $FEATURE_DESC" > "$SPEC_FILE"
    echo "" >> "$SPEC_FILE"
    echo "<!-- Template not found at $TEMPLATE_FILE -->" >> "$SPEC_FILE"
    output "Warning: Template not found, created placeholder spec file"
fi

# Create and checkout feature branch
output "Creating and checking out branch: $BRANCH_NAME"
git -C "$REPO_ROOT" checkout -b "$BRANCH_NAME"

# Output JSON result
if [[ "$JSON_OUTPUT" == true ]]; then
    echo "{\"BRANCH_NAME\": \"$BRANCH_NAME\", \"SPEC_FILE\": \"$SPEC_FILE\", \"FEATURE_DIR\": \"$FEATURE_DIR\", \"SLUG\": \"$SLUG\"}"
else
    echo ""
    echo "Success! Created feature branch and specification."
    echo "  Branch: $BRANCH_NAME"
    echo "  Spec file: $SPEC_FILE"
    echo ""
    echo "Next steps:"
    echo "  1. Edit the specification file"
    echo "  2. Run /plan to create an implementation plan"
fi
