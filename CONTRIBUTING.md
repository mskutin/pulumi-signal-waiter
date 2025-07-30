# Contributing to pulumi-signal-waiter

Thank you for your interest in contributing to pulumi-signal-waiter! This
document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Git

### Development Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/your-username/pulumi-signal-waiter.git
   cd pulumi-signal-waiter
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the project:**

   ```bash
   npm run build
   ```

4. **Run tests:**

   ```bash
   npm test
   ```

5. **Run validation (linting, formatting, type-checking):**
   ```bash
   npm run validate
   ```

## 📁 Project Structure

```
pulumi-signal-waiter/
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   └── signalWaiter.ts    # Core SignalWaiter implementation
├── examples/              # Usage examples
│   ├── basic-example.ts   # Simple usage example
│   ├── multi-signal-example.ts # Multi-instance example
│   └── test-example.ts    # Test/demo example
├── tests/                 # Unit tests
│   └── validation.test.ts # Validation tests
├── docs/                  # Documentation
├── .github/               # GitHub workflows and templates
└── dist/                  # Built output (generated)
```

## 🛠️ Development Workflow

### Making Changes

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Run validation:**

   ```bash
   npm run validate
   ```

4. **Add tests** for new functionality

5. **Update documentation** if needed

6. **Commit your changes:**
   ```bash
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:

```
feat: add support for custom polling intervals
fix: handle SQS permission errors gracefully
docs: update README with new examples
test: add validation tests for timeout parameters
```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all source code
- Provide proper type definitions
- Use JSDoc comments for public APIs
- Follow the existing code style

### Code Style

- **Formatting**: We use Prettier for code formatting

  ```bash
  npm run format        # Format code
  npm run format:check  # Check formatting
  ```

- **Linting**: We use ESLint for code quality

  ```bash
  npm run lint          # Check for issues
  npm run lint:fix      # Fix auto-fixable issues
  ```

- **Type Checking**: Ensure TypeScript compiles without errors
  ```bash
  npm run type-check
  ```

### Testing

- Write unit tests for new functionality
- Maintain or improve test coverage
- Use descriptive test names
- Mock external dependencies (AWS SDK, Pulumi)

```bash
npm test              # Run tests
npm run test:coverage # Run with coverage report
npm run test:watch    # Run in watch mode
```

## 🐛 Reporting Issues

When reporting issues, please include:

1. **Environment details:**
   - Node.js version
   - Package version
   - Operating system
   - Pulumi version

2. **Steps to reproduce** the issue

3. **Expected vs actual behavior**

4. **Code examples** demonstrating the issue

5. **Error messages** and logs

Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) for
consistency.

## 💡 Suggesting Features

For feature requests, please:

1. Check existing issues to avoid duplicates
2. Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
3. Describe the use case and motivation
4. Provide examples of how you'd like to use the feature

## 🔄 Pull Request Process

1. **Fork the repository** and create your branch from `main`

2. **Make your changes** following the guidelines above

3. **Update documentation** if you're changing functionality

4. **Add tests** for new features or bug fixes

5. **Ensure all checks pass:**

   ```bash
   npm run validate
   ```

6. **Create a pull request** using our
   [PR template](.github/pull_request_template.md)

7. **Respond to feedback** from maintainers

### PR Requirements

- [ ] All tests pass
- [ ] Code is properly formatted and linted
- [ ] TypeScript compiles without errors
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for significant changes)
- [ ] PR description explains the changes

## 📚 Documentation

- Keep README.md up to date
- Update JSDoc comments for API changes
- Add examples for new features
- Update CHANGELOG.md for releases

## 🏷️ Release Process

Releases are automated through GitHub Actions:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag: `git tag v1.0.0`
4. Push the tag: `git push origin v1.0.0`
5. GitHub Actions will automatically publish to NPM

## 🤝 Code of Conduct

This project follows the
[Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
Please be respectful and inclusive in all interactions.

## ❓ Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions about usage
- Check existing issues and documentation first

## 🙏 Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments (for major contributions)

Thank you for contributing to pulumi-signal-waiter! 🎉
