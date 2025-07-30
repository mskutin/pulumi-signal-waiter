---
name: Bug report
about: Create a report to help us improve
title: "[BUG] "
labels: "bug"
assignees: ""
---

## 🐛 Bug Description

A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce

Steps to reproduce the behavior:

1. Create SignalWaiter with config: '...'
2. Deploy Pulumi stack with '...'
3. Wait for signal '...'
4. See error

## ✅ Expected Behavior

A clear and concise description of what you expected to happen.

## ❌ Actual Behavior

A clear and concise description of what actually happened.

## 📋 Environment

- **OS**: [e.g. macOS 13.0, Ubuntu 20.04, Windows 11]
- **Node.js version**: [e.g. 18.17.0]
- **Package version**: [e.g. 0.1.0]
- **Pulumi version**: [e.g. 3.85.0]
- **AWS CLI version**: [e.g. 2.13.0]

## 📝 Configuration

```typescript
// Your SignalWaiter configuration
const waiter = new SignalWaiter("example", {
  queueUrl: "...",
  // ... other config
});
```

## 📊 Logs

```
Paste relevant logs here
```

## 🔗 Additional Context

Add any other context about the problem here. Include:

- SQS queue configuration
- IAM permissions
- Network setup
- Any error messages

## 🤔 Possible Solution

If you have ideas on how to fix this, please share them here.
