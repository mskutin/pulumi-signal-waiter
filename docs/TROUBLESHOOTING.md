# Troubleshooting Guide

This guide helps resolve common issues when using `@mskutin/pulumi-signal-waiter`.

## 🔧 Installation Issues

### npm ci fails with "packages not in sync"

**Problem:** `npm ci` fails with error about package.json and package-lock.json being out of sync.

**Solution:**
```bash
# Remove lock file and reinstall
rm package-lock.json
npm install

# Or use our helper script
npm run ci:install
```

**Prevention:** Always commit both `package.json` and `package-lock.json` together.

### TypeScript compilation errors

**Problem:** TypeScript errors when importing the package.

**Solution:**
```bash
# Ensure you have compatible TypeScript version
npm install typescript@^5.0.0

# Check your tsconfig.json includes:
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 🚀 Runtime Issues

### SignalWaiter times out

**Problem:** SignalWaiter reaches timeout without receiving signals.

**Diagnosis:**
1. Check EC2 instance logs:
   ```bash
   # SSH into instance and check cloud-init logs
   sudo tail -f /var/log/cloud-init-output.log
   ```

2. Verify SQS queue has messages:
   ```bash
   aws sqs receive-message --queue-url YOUR_QUEUE_URL --region YOUR_REGION
   ```

**Common Causes:**
- **IAM Permissions**: Instance doesn't have SQS SendMessage permission
- **Network Issues**: Instance can't reach SQS endpoint
- **Script Errors**: User data script fails before sending signal
- **Wrong Queue URL**: Script uses incorrect queue URL

**Solutions:**
```typescript
// Increase timeout for slow bootstrap processes
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  timeoutMs: 900000, // 15 minutes instead of 5
});

// Reduce polling interval for faster detection
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  pollIntervalSeconds: 5, // Check every 5 seconds
});
```

### Permission denied errors

**Problem:** AWS SDK errors about access denied.

**Solution:**
1. **Check IAM Role Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "sqs:SendMessage",
           "sqs:ReceiveMessage",
           "sqs:DeleteMessage"
         ],
         "Resource": "arn:aws:sqs:REGION:ACCOUNT:QUEUE_NAME"
       }
     ]
   }
   ```

2. **Verify Instance Profile:**
   ```typescript
   const instanceProfile = new aws.iam.InstanceProfile("profile", {
     role: role.name, // Make sure role is attached
   });
   
   const instance = new aws.ec2.Instance("instance", {
     iamInstanceProfile: instanceProfile.name, // Not instanceProfile.id
     // ...
   });
   ```

### Signals not received

**Problem:** Script runs but SignalWaiter doesn't detect signals.

**Diagnosis:**
```bash
# Check if messages are in the queue
aws sqs get-queue-attributes \
  --queue-url YOUR_QUEUE_URL \
  --attribute-names ApproximateNumberOfMessages

# Check queue URL format
echo "Queue URL should be: https://sqs.REGION.amazonaws.com/ACCOUNT/QUEUE_NAME"
```

**Solutions:**
1. **Verify Queue URL:**
   ```typescript
   // Use queue.url, not queue.id
   const waiter = new SignalWaiter("waiter", {
     queueUrl: queue.url, // ✅ Correct
     // queueUrl: queue.id, // ❌ Wrong
   });
   ```

2. **Check User Data Script:**
   ```bash
   #!/bin/bash
   # Add error handling
   set -e
   
   # Log everything
   exec > >(tee /var/log/user-data.log)
   exec 2>&1
   
   echo "Starting bootstrap..."
   
   # Your bootstrap code here
   
   # Send signal with error handling
   aws sqs send-message \
     --queue-url "${queueUrl}" \
     --message-body "ready" \
     --region "${region}" || {
     echo "Failed to send SQS message"
     exit 1
   }
   
   echo "Bootstrap complete!"
   ```

## 🔄 Multi-Signal Issues

### Only some signals received

**Problem:** Waiting for N signals but only receiving fewer.

**Diagnosis:**
```typescript
// Enable verbose logging
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  requiredSignalCount: 3,
  timeoutMs: 600000, // Give more time for multiple instances
});
```

**Solutions:**
1. **Check all instances are running:**
   ```bash
   aws ec2 describe-instances --filters "Name=tag:Name,Values=YourInstanceTag"
   ```

2. **Stagger instance launches:**
   ```typescript
   // Add delays between instance creation
   const instances = [];
   for (let i = 0; i < 3; i++) {
     const instance = new aws.ec2.Instance(`instance-${i}`, {
       // ... config
     }, { 
       dependsOn: i > 0 ? [instances[i-1]] : undefined 
     });
     instances.push(instance);
   }
   ```

### Messages deleted too early

**Problem:** Using `deleteMessages: true` but need to preserve messages.

**Solution:**
```typescript
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  requiredSignalCount: 2,
  deleteMessages: false, // Preserve messages for other consumers
});
```

## 🐛 Development Issues

### Tests failing in CI

**Problem:** Tests pass locally but fail in GitHub Actions.

**Solutions:**
1. **Check Node.js version compatibility:**
   ```yaml
   # In .github/workflows/ci.yml
   strategy:
     matrix:
       node-version: [16.x, 18.x, 20.x] # Test multiple versions
   ```

2. **Mock AWS SDK properly:**
   ```typescript
   // In tests
   jest.mock("@aws-sdk/client-sqs", () => ({
     SQSClient: jest.fn(),
     ReceiveMessageCommand: jest.fn(),
   }));
   ```

### Build errors

**Problem:** TypeScript compilation fails.

**Solution:**
```bash
# Clean build
npm run clean
npm run build

# Check for type errors
npm run type-check

# Update dependencies
npm update
```

## 📊 Performance Issues

### High polling frequency

**Problem:** Too many SQS requests causing throttling.

**Solution:**
```typescript
const waiter = new SignalWaiter("waiter", {
  queueUrl: queue.url,
  pollIntervalSeconds: 15, // Reduce polling frequency
  timeoutMs: 900000, // Increase timeout to compensate
});
```

### Memory usage

**Problem:** High memory usage during long waits.

**Solution:**
- Use shorter timeouts with retry logic
- Implement circuit breaker pattern
- Monitor CloudWatch metrics

## 🔍 Debugging Tips

### Enable verbose logging

```bash
# Set Pulumi log level
export PULUMI_LOG_LEVEL=debug

# Run with verbose output
pulumi up --verbose
```

### Check AWS CloudTrail

```bash
# Look for SQS API calls
aws logs filter-log-events \
  --log-group-name CloudTrail/SQSApiCalls \
  --start-time $(date -d '1 hour ago' +%s)000
```

### Monitor SQS metrics

```bash
# Check queue metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesSent \
  --dimensions Name=QueueName,Value=YourQueueName \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Sum
```

## 🆘 Getting Help

If you're still having issues:

1. **Check existing issues:** [GitHub Issues](https://github.com/mskutin/pulumi-signal-waiter/issues)
2. **Create a bug report:** Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
3. **Include diagnostics:**
   - Package version
   - Node.js version
   - Pulumi version
   - Error messages
   - Minimal reproduction case

## 📚 Additional Resources

- [AWS SQS Troubleshooting](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-troubleshooting.html)
- [Pulumi Debugging Guide](https://www.pulumi.com/docs/support/troubleshooting/)
- [AWS IAM Troubleshooting](https://docs.aws.amazon.com/IAM/latest/UserGuide/troubleshoot.html)
