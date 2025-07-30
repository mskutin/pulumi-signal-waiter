#!/bin/bash

# GitHub Actions Workflow Validation Script
# This script validates that all workflows use current action versions

set -e

echo "🔍 Validating GitHub Actions workflows..."

WORKFLOW_DIR=".github/workflows"
ISSUES_FOUND=0

# Check for deprecated action versions
check_deprecated_actions() {
    local file=$1
    echo "Checking $file..."
    
    # Check for deprecated actions/upload-artifact@v3
    if grep -q "actions/upload-artifact@v3" "$file"; then
        echo "❌ Found deprecated actions/upload-artifact@v3 in $file"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for deprecated actions/download-artifact@v3
    if grep -q "actions/download-artifact@v3" "$file"; then
        echo "❌ Found deprecated actions/download-artifact@v3 in $file"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for deprecated actions/create-release@v1
    if grep -q "actions/create-release@v1" "$file"; then
        echo "⚠️  Found actions/create-release@v1 in $file (consider using softprops/action-gh-release@v2)"
    fi
    
    # Check for deprecated actions/upload-release-asset@v1
    if grep -q "actions/upload-release-asset@v1" "$file"; then
        echo "⚠️  Found actions/upload-release-asset@v1 in $file (consider using softprops/action-gh-release@v2)"
    fi
    
    # Check for correct branch references
    if grep -q "branches.*main" "$file"; then
        echo "⚠️  Found 'main' branch reference in $file (should be 'master')"
    fi
    
    if grep -q "tree/main\|blob/main" "$file"; then
        echo "⚠️  Found 'main' branch URL reference in $file (should be 'master')"
    fi
}

# Check for recommended action versions
check_recommended_versions() {
    local file=$1
    
    # Check for current action versions
    if grep -q "actions/checkout@v4" "$file"; then
        echo "✅ Using current actions/checkout@v4"
    elif grep -q "actions/checkout@" "$file"; then
        echo "⚠️  Consider updating to actions/checkout@v4 in $file"
    fi
    
    if grep -q "actions/setup-node@v4" "$file"; then
        echo "✅ Using current actions/setup-node@v4"
    elif grep -q "actions/setup-node@" "$file"; then
        echo "⚠️  Consider updating to actions/setup-node@v4 in $file"
    fi
    
    if grep -q "actions/upload-artifact@v4" "$file"; then
        echo "✅ Using current actions/upload-artifact@v4"
    fi
}

# Validate workflow syntax
validate_yaml_syntax() {
    local file=$1
    
    # Check if yq is available for YAML validation
    if command -v yq >/dev/null 2>&1; then
        if ! yq eval '.' "$file" >/dev/null 2>&1; then
            echo "❌ Invalid YAML syntax in $file"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        else
            echo "✅ Valid YAML syntax in $file"
        fi
    else
        echo "⚠️  yq not available, skipping YAML syntax validation"
    fi
}

# Main validation loop
if [ -d "$WORKFLOW_DIR" ]; then
    for workflow in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
        if [ -f "$workflow" ]; then
            echo ""
            echo "📋 Validating $(basename "$workflow")..."
            validate_yaml_syntax "$workflow"
            check_deprecated_actions "$workflow"
            check_recommended_versions "$workflow"
        fi
    done
else
    echo "❌ Workflow directory $WORKFLOW_DIR not found"
    exit 1
fi

echo ""
echo "🏁 Validation complete!"

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "❌ Found $ISSUES_FOUND critical issues that need to be fixed"
    exit 1
else
    echo "✅ All workflows are using current action versions"
    exit 0
fi
