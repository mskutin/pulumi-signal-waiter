# Examples

This directory contains practical examples of how to use `@mskutin/pulumi-signal-waiter` in different scenarios.

## 📁 Available Examples

### 1. **basic-example.ts** - Simple Single Instance Bootstrap

A straightforward example showing how to wait for a single EC2 instance to complete its bootstrap process.

**Features:**
- Single EC2 instance with user data script
- SQS queue for signaling
- Minimal IAM permissions
- S3 bucket created after bootstrap completion

**Use Case:** Basic application deployment where you need to wait for instance initialization.

### 2. **multi-signal-example.ts** - Multi-Instance Coordination

Advanced example demonstrating the N-of-M signal pattern with multiple EC2 instances.

**Features:**
- Multiple EC2 instances (3 instances)
- Wait for subset of instances (2 out of 3)
- Variable bootstrap times
- Load balancer created after sufficient instances are ready
- Batch message processing

**Use Case:** Auto-scaling groups, blue-green deployments, or any scenario where you need partial readiness.

### 3. **test-example.ts** - Testing and Development

Simple example for testing the SignalWaiter component without full infrastructure.

**Features:**
- Minimal setup for testing
- Short timeout for quick validation
- Demonstrates basic API usage

**Use Case:** Development, testing, and learning the API.

## 🚀 Running Examples

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Configure AWS credentials:**
   ```bash
   aws configure
   # or set environment variables
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   export AWS_REGION=us-east-1
   ```

### Running with Pulumi

1. **Initialize a new Pulumi project:**
   ```bash
   mkdir my-signal-waiter-test
   cd my-signal-waiter-test
   pulumi new typescript
   ```

2. **Install the package:**
   ```bash
   npm install @mskutin/pulumi-signal-waiter
   ```

3. **Copy an example to your index.ts:**
   ```bash
   cp ../examples/basic-example.ts ./index.ts
   ```

4. **Deploy:**
   ```bash
   pulumi up
   ```

### Building Examples Locally

To type-check the examples without deploying:

```bash
npm run examples:build
```

## 📖 Example Walkthrough

### Basic Example Flow

1. **SQS Queue Creation**: Creates a queue for receiving bootstrap signals
2. **IAM Setup**: Creates minimal permissions for EC2 to send SQS messages
3. **EC2 Instance**: Launches with user data that sends signal after bootstrap
4. **SignalWaiter**: Waits for the signal before proceeding
5. **Dependent Resources**: Creates S3 bucket only after signal received

### Multi-Signal Example Flow

1. **Queue Setup**: Single queue for all instances
2. **Multiple Instances**: Launches 3 EC2 instances with variable bootstrap times
3. **SignalWaiter Configuration**: Waits for 2 out of 3 signals
4. **Batch Processing**: Efficiently handles multiple signals
5. **Load Balancer**: Created after sufficient instances are ready

## 🔧 Customization

### Common Modifications

**Adjust Timeout:**
```typescript
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  timeoutMs: 600000, // 10 minutes
});
```

**Change Polling Interval:**
```typescript
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  pollIntervalSeconds: 5, // Check every 5 seconds
});
```

**Multi-Signal Configuration:**
```typescript
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  requiredSignalCount: 3, // Wait for 3 signals
  deleteMessages: false,  // Preserve messages
});
```

### Custom Bootstrap Scripts

**Database Migration Example:**
```bash
#!/bin/bash
# Run database migrations
./migrate-database.sh

# Send ready signal
aws sqs send-message \\
  --queue-url "${queueUrl}" \\
  --message-body "migration-complete" \\
  --region "${region}"
```

**Container Deployment Example:**
```bash
#!/bin/bash
# Pull and start containers
docker-compose up -d

# Wait for health check
while ! curl -f http://localhost:8080/health; do
  sleep 5
done

# Send ready signal
aws sqs send-message \\
  --queue-url "${queueUrl}" \\
  --message-body "containers-ready" \\
  --region "${region}"
```

## 🐛 Troubleshooting

### Common Issues

1. **Timeout Errors:**
   - Check EC2 instance logs: `sudo tail -f /var/log/cloud-init-output.log`
   - Verify IAM permissions for SQS
   - Ensure AWS CLI is installed in user data

2. **Permission Denied:**
   - Check IAM role has SQS SendMessage permission
   - Verify queue URL is correct
   - Ensure instance profile is attached

3. **Signal Not Received:**
   - Check SQS queue for messages in AWS Console
   - Verify user data script execution
   - Check network connectivity from EC2 to SQS

### Debug Mode

Enable verbose logging by setting environment variables:

```bash
export PULUMI_LOG_LEVEL=debug
pulumi up
```

## 📚 Additional Resources

- [Main README](../README.md) - Complete documentation
- [API Documentation](../docs/api/) - Generated TypeScript docs
- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines
- [Pulumi Documentation](https://www.pulumi.com/docs/) - Pulumi guides
- [AWS SQS Documentation](https://docs.aws.amazon.com/sqs/) - SQS reference

## 💡 Need Help?

- Open an [issue](https://github.com/mskutin/pulumi-signal-waiter/issues) for bugs
- Start a [discussion](https://github.com/mskutin/pulumi-signal-waiter/discussions) for questions
- Check existing examples and documentation first
