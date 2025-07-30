# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of pulumi-signal-waiter
- SignalWaiter component for blocking Pulumi deployments until SQS signals
- Support for configurable polling intervals (1-20 seconds)
- Support for multiple signals (N-of-M pattern)
- Comprehensive error handling and logging
- TypeScript support with full type definitions
- Unit tests with Jest
- GitHub Actions CI/CD pipeline
- ESLint and Prettier configuration
- Examples for basic and multi-instance scenarios

### Features

- **SignalWaiter Component**: Main component for waiting on SQS signals
- **Configurable Parameters**: Timeout, polling interval, signal count, message
  deletion
- **AWS SDK v3**: Modern AWS SDK with proper error handling
- **Multi-Signal Support**: Wait for N out of M instances to signal readiness
- **Production Ready**: Comprehensive logging, error handling, and validation

### Documentation

- Complete README with usage examples
- API documentation with JSDoc comments
- Multiple example scenarios
- GitHub issue and PR templates

## [0.1.0] - 2025-01-30

### Added

- Initial project structure
- Core SignalWaiter implementation
- Basic examples and documentation
- GitHub Actions workflows
- Testing framework setup

---

## Release Notes

### v0.1.0 - Initial Release

This is the first release of `@mskutin/pulumi-signal-waiter`, a TypeScript
library for coordinating asynchronous resource initialization in Pulumi
deployments.

**Key Features:**

- 🚀 Pulumi-native alternative to CloudFormation `cfn-signal`
- ⚙️ Configurable timeout and polling intervals
- 🔄 Support for multiple signal coordination (N-of-M pattern)
- 🛡️ Comprehensive error handling and validation
- 📝 Full TypeScript support with type definitions
- 🧪 Unit tests and CI/CD pipeline
- 📚 Complete documentation and examples

**Installation:**

```bash
npm install @mskutin/pulumi-signal-waiter
```

**Basic Usage:**

```typescript
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

const waiter = new SignalWaiter("bootstrap-waiter", {
  queueUrl: myQueue.url,
  timeoutMs: 300000,
});
```

See the [README](README.md) for complete documentation and examples.
