#!/usr/bin/env bash
set -euo pipefail

# setup-plan.sh
# Locates current feature context and sets up implementation plan file for /plan command.
#
# Usage: ./scripts/setup-plan.sh [--json]
#
# Exit codes:
#   0 - Success
#   1 - Not in git repository root
#   2 - Not on a feature branch (feat/*)
#   3 - Feature directory not found
#   4 - spec.md not found

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse arguments
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
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

# Validate repo root (check for .git directory)
if [[ ! -d "$REPO_ROOT/.git" ]]; then
    error_exit 1 "Not in a git repository root. Run from repository root."
fi

# Get current branch name
CURRENT_BRANCH=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)

# Validate on feature branch (feat/*)
if [[ ! "$CURRENT_BRANCH" =~ ^feat/ ]]; then
    error_exit 2 "Not on a feature branch. Current branch: $CURRENT_BRANCH. Expected: feat/*"
fi

# Extract feature slug from branch name
SLUG="${CURRENT_BRANCH#feat/}"
FEATURE_DIR="$REPO_ROOT/.claude/features/$SLUG"
SPEC_FILE="$FEATURE_DIR/spec.md"
PLAN_FILE="$FEATURE_DIR/plan.md"
TEMPLATE_FILE="$REPO_ROOT/templates/implementation-plan-template.md"

output "Feature slug: $SLUG"
output "Feature directory: $FEATURE_DIR"

# Verify feature directory exists
if [[ ! -d "$FEATURE_DIR" ]]; then
    error_exit 3 "Feature directory not found: $FEATURE_DIR"
fi

# Verify spec.md exists
if [[ ! -f "$SPEC_FILE" ]]; then
    error_exit 4 "Specification file not found: $SPEC_FILE"
fi

# Copy implementation plan template if plan.md doesn't exist
if [[ ! -f "$PLAN_FILE" ]]; then
    if [[ -f "$TEMPLATE_FILE" ]]; then
        cp "$TEMPLATE_FILE" "$PLAN_FILE"
        output "Copied implementation plan template to: $PLAN_FILE"
    else
        # Create a minimal placeholder if template doesn't exist
        echo "# Implementation Plan" > "$PLAN_FILE"
        echo "" >> "$PLAN_FILE"
        echo "<!-- Template not found at $TEMPLATE_FILE -->" >> "$PLAN_FILE"
        output "Warning: Template not found, created placeholder plan file"
    fi
else
    output "Plan file already exists: $PLAN_FILE"
fi

# Output JSON result
if [[ "$JSON_OUTPUT" == true ]]; then
    echo "{\"FEATURE_SPEC\": \"$SPEC_FILE\", \"IMPL_PLAN\": \"$PLAN_FILE\", \"SPECS_DIR\": \"$FEATURE_DIR\", \"BRANCH\": \"$CURRENT_BRANCH\", \"SLUG\": \"$SLUG\"}"
else
    echo ""
    echo "Feature context located successfully."
    echo "  Branch: $CURRENT_BRANCH"
    echo "  Spec file: $SPEC_FILE"
    echo "  Plan file: $PLAN_FILE"
    echo ""
    echo "Next steps:"
    echo "  1. Read the spec file and create the implementation plan"
    echo "  2. Run /tasks to break down the plan into tasks"
fi
