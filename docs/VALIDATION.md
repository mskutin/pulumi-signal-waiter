# Validation Tools

This document describes the validation tools available in this project to ensure code quality, documentation standards, and workflow integrity.

## 🛠️ Available Validation Scripts

### 1. **Main Validation Pipeline**
```bash
npm run validate
```
Runs the complete validation pipeline including:
- TypeScript type checking
- ESLint code linting
- Prettier formatting check
- Jest unit tests
- Documentation validation

### 2. **Documentation Validation**
```bash
npm run validate:docs
# or directly:
.github/validate-docs.sh
```
Validates documentation structure and content:
- ✅ README.md sections (Installation, Usage, License)
- ✅ CONTRIBUTING.md presence and content
- ✅ CHANGELOG.md format
- ✅ LICENSE file presence
- ✅ Examples directory and documentation
- ✅ package.json metadata fields

### 3. **Workflow Validation**
```bash
npm run validate:workflows
# or directly:
.github/validate-workflows.sh
```
Validates GitHub Actions workflows:
- ✅ Current action versions (no deprecated actions)
- ✅ Proper branch references (master vs main)
- ✅ YAML syntax validation (if yq is available)
- ✅ README structure requirements

### 4. **Individual Validation Commands**

#### Code Quality
```bash
npm run type-check    # TypeScript compilation check
npm run lint          # ESLint code analysis
npm run lint:fix      # Auto-fix ESLint issues
npm run format        # Format code with Prettier
npm run format:check  # Check Prettier formatting
```

#### Testing
```bash
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

#### Build & Examples
```bash
npm run build         # Build TypeScript to JavaScript
npm run examples:build # Validate examples TypeScript
```

## 🔄 GitHub Actions Integration

### Automated Validation Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Runs on push to `master` and `develop`
   - Tests across Node.js 18.x, 20.x, 22.x
   - Includes security audit and package validation

2. **Code Quality** (`.github/workflows/code-quality.yml`)
   - Lint and format checking
   - TypeScript type validation
   - Documentation structure validation
   - Cross-platform build testing

3. **Dependencies** (`.github/workflows/dependencies.yml`)
   - Weekly dependency updates
   - Security vulnerability scanning
   - Automated PR creation for updates

## 📊 Validation Criteria

### Code Quality Standards
- ✅ **TypeScript**: Strict mode, no compilation errors
- ✅ **ESLint**: No linting errors, consistent code style
- ✅ **Prettier**: Consistent code formatting
- ✅ **Tests**: All unit tests pass, good coverage

### Documentation Standards
- ✅ **README.md**: Must have Installation, Usage, and License sections
- ✅ **Code Examples**: Working TypeScript examples
- ✅ **API Documentation**: JSDoc comments for public APIs
- ✅ **Contributing Guide**: Development setup instructions
- ✅ **Changelog**: Proper versioning and release notes

### Workflow Standards
- ✅ **GitHub Actions**: Current action versions (v4+)
- ✅ **Branch References**: Consistent use of `master` branch
- ✅ **Security**: No deprecated or vulnerable actions
- ✅ **Cross-Platform**: Tests on Ubuntu, Windows, macOS

## 🚨 Validation Failures

### Common Issues and Solutions

#### TypeScript Errors
```bash
# Check specific errors
npm run type-check

# Common fixes
npm install @types/node  # Missing type definitions
```

#### Linting Errors
```bash
# Auto-fix most issues
npm run lint:fix

# Manual review required for complex issues
npm run lint
```

#### Documentation Issues
```bash
# Check what's missing
npm run validate:docs

# Common fixes:
# - Add missing README sections
# - Update package.json metadata
# - Add examples documentation
```

#### Workflow Issues
```bash
# Check workflow problems
npm run validate:workflows

# Common fixes:
# - Update deprecated GitHub Actions
# - Fix branch references (main → master)
# - Update Node.js versions
```

## 🎯 Best Practices

### Before Committing
```bash
# Run full validation
npm run validate

# Fix any issues found
npm run lint:fix
npm run format

# Ensure tests pass
npm test
```

### Before Releasing
```bash
# Complete validation pipeline
npm run validate
npm run validate:workflows

# Build and test package
npm run build
npm pack

# Test package installation
mkdir test-install && cd test-install
npm init -y
npm install ../mskutin-pulumi-signal-waiter-*.tgz
```

### Continuous Integration
- All validation runs automatically on PR creation
- Merge blocked if validation fails
- Weekly dependency updates with validation
- Automated security scanning

## 📈 Validation Metrics

The validation tools track:
- **Code Coverage**: Target >80% test coverage
- **Documentation Coverage**: All public APIs documented
- **Workflow Health**: All actions up-to-date
- **Dependency Security**: No known vulnerabilities
- **Cross-Platform Compatibility**: Tests on 3 OS, 3 Node.js versions

## 🔧 Customization

### Adding New Validations

1. **Add to validation scripts** (`.github/validate-*.sh`)
2. **Update package.json scripts**
3. **Add to GitHub Actions workflows**
4. **Document in this file**

### Modifying Standards

1. **Update ESLint config** (`.eslintrc.json`)
2. **Update Prettier config** (`.prettierrc.json`)
3. **Update TypeScript config** (`tsconfig.json`)
4. **Update validation scripts accordingly**

## 📚 Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](../README.md) - Main project documentation
