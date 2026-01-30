#!/usr/bin/env bash
set -euo pipefail

# check-task-prerequisites.sh
# Checks available design documents for /tasks command.
#
# Usage: ./scripts/check-task-prerequisites.sh [--json]
#
# Exit codes:
#   0 - Success
#   1 - Not in git repository root
#   2 - Not on a feature branch (feat/*)
#   3 - Feature directory not found
#   4 - plan.md not found (required prerequisite)

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

output "Feature slug: $SLUG"
output "Feature directory: $FEATURE_DIR"

# Verify feature directory exists
if [[ ! -d "$FEATURE_DIR" ]]; then
    error_exit 3 "Feature directory not found: $FEATURE_DIR"
fi

# Verify plan.md exists (required prerequisite)
PLAN_FILE="$FEATURE_DIR/plan.md"
if [[ ! -f "$PLAN_FILE" ]]; then
    error_exit 4 "Implementation plan not found: $PLAN_FILE. Run /plan first."
fi

# Scan for available docs
AVAILABLE_DOCS=()

# Check for standard documents
[[ -f "$FEATURE_DIR/spec.md" ]] && AVAILABLE_DOCS+=("$FEATURE_DIR/spec.md")
[[ -f "$FEATURE_DIR/plan.md" ]] && AVAILABLE_DOCS+=("$FEATURE_DIR/plan.md")
[[ -f "$FEATURE_DIR/research.md" ]] && AVAILABLE_DOCS+=("$FEATURE_DIR/research.md")
[[ -f "$FEATURE_DIR/data-model.md" ]] && AVAILABLE_DOCS+=("$FEATURE_DIR/data-model.md")
[[ -f "$FEATURE_DIR/quickstart.md" ]] && AVAILABLE_DOCS+=("$FEATURE_DIR/quickstart.md")

# Check for contracts directory and files
if [[ -d "$FEATURE_DIR/contracts" ]]; then
    while IFS= read -r -d '' contract_file; do
        AVAILABLE_DOCS+=("$contract_file")
    done < <(find "$FEATURE_DIR/contracts" -type f -name "*.md" -print0 2>/dev/null || true)
fi

# Output JSON result
if [[ "$JSON_OUTPUT" == true ]]; then
    # Build JSON array of available docs
    JSON_DOCS="["
    first=true
    for doc in "${AVAILABLE_DOCS[@]}"; do
        if [[ "$first" == true ]]; then
            first=false
        else
            JSON_DOCS+=", "
        fi
        JSON_DOCS+="\"$doc\""
    done
    JSON_DOCS+="]"

    echo "{\"FEATURE_DIR\": \"$FEATURE_DIR\", \"AVAILABLE_DOCS\": $JSON_DOCS, \"BRANCH\": \"$CURRENT_BRANCH\", \"SLUG\": \"$SLUG\"}"
else
    echo ""
    echo "Task prerequisites check passed."
    echo "  Branch: $CURRENT_BRANCH"
    echo "  Feature directory: $FEATURE_DIR"
    echo ""
    echo "Available documents:"
    for doc in "${AVAILABLE_DOCS[@]}"; do
        echo "  - $(basename "$doc")"
    done
    echo ""
    echo "Ready to generate tasks from these documents."
fi
