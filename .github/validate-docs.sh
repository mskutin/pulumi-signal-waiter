#!/bin/bash

# Documentation Validation Script
# This script validates documentation structure and content

set -e

echo "📚 Validating Documentation Structure..."

ISSUES_FOUND=0

# Check README.md
echo ""
echo "📋 Checking README.md..."
if [ -f "README.md" ]; then
    # Check for required sections
    if grep -q "## .*Installation" README.md; then
        echo "✅ Installation section found"
    else
        echo "❌ Missing Installation section"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q "## .*Usage" README.md; then
        echo "✅ Usage section found"
    else
        echo "❌ Missing Usage section"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q "## .*License" README.md; then
        echo "✅ License section found"
    else
        echo "⚠️  License section missing (recommended)"
    fi
    
    # Check for badges
    if grep -q "!\[.*\](" README.md; then
        echo "✅ Badges found"
    else
        echo "⚠️  No badges found (consider adding status badges)"
    fi
    
    # Check for code examples
    if grep -q "\`\`\`" README.md; then
        echo "✅ Code examples found"
    else
        echo "⚠️  No code examples found"
    fi
else
    echo "❌ README.md not found"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check CONTRIBUTING.md
echo ""
echo "📋 Checking CONTRIBUTING.md..."
if [ -f "CONTRIBUTING.md" ]; then
    echo "✅ CONTRIBUTING.md found"
    
    if grep -q "Getting Started\|Development Setup" CONTRIBUTING.md; then
        echo "✅ Development setup instructions found"
    else
        echo "⚠️  Consider adding development setup instructions"
    fi
else
    echo "⚠️  CONTRIBUTING.md not found (recommended for open source projects)"
fi

# Check CHANGELOG.md
echo ""
echo "📋 Checking CHANGELOG.md..."
if [ -f "CHANGELOG.md" ]; then
    echo "✅ CHANGELOG.md found"
    
    if grep -q "Unreleased\|## \[" CHANGELOG.md; then
        echo "✅ Proper changelog format detected"
    else
        echo "⚠️  Consider using standard changelog format"
    fi
else
    echo "⚠️  CHANGELOG.md not found (recommended)"
fi

# Check LICENSE
echo ""
echo "📋 Checking LICENSE..."
if [ -f "LICENSE" ] || [ -f "LICENSE.md" ] || [ -f "LICENSE.txt" ]; then
    echo "✅ License file found"
else
    echo "⚠️  License file not found (recommended)"
fi

# Check examples directory
echo ""
echo "📋 Checking examples..."
if [ -d "examples" ]; then
    echo "✅ Examples directory found"
    
    EXAMPLE_COUNT=$(find examples -name "*.ts" -o -name "*.js" | wc -l)
    if [ "$EXAMPLE_COUNT" -gt 0 ]; then
        echo "✅ Found $EXAMPLE_COUNT example files"
    else
        echo "⚠️  No example files found in examples directory"
    fi
    
    if [ -f "examples/README.md" ]; then
        echo "✅ Examples documentation found"
    else
        echo "⚠️  Consider adding examples/README.md"
    fi
else
    echo "⚠️  Examples directory not found (recommended)"
fi

# Check docs directory
echo ""
echo "📋 Checking docs..."
if [ -d "docs" ]; then
    echo "✅ Docs directory found"
    
    if [ -f "docs/TROUBLESHOOTING.md" ]; then
        echo "✅ Troubleshooting guide found"
    else
        echo "⚠️  Consider adding troubleshooting documentation"
    fi
else
    echo "⚠️  Docs directory not found (consider adding for additional documentation)"
fi

# Check package.json documentation fields
echo ""
echo "📋 Checking package.json documentation fields..."
if [ -f "package.json" ]; then
    if grep -q '"description"' package.json; then
        echo "✅ Package description found"
    else
        echo "❌ Missing package description"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q '"repository"' package.json; then
        echo "✅ Repository URL found"
    else
        echo "❌ Missing repository URL"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    if grep -q '"homepage"' package.json; then
        echo "✅ Homepage URL found"
    else
        echo "⚠️  Consider adding homepage URL"
    fi
    
    if grep -q '"keywords"' package.json; then
        echo "✅ Keywords found"
    else
        echo "⚠️  Consider adding keywords for discoverability"
    fi
else
    echo "❌ package.json not found"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "🏁 Documentation validation complete!"

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "❌ Found $ISSUES_FOUND critical documentation issues"
    exit 1
else
    echo "✅ All critical documentation requirements met"
    exit 0
fi
