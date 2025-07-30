# 📦 pulumi-signal-waiter

[![npm version](https://img.shields.io/npm/v/@mskutin/pulumi-signal-waiter.svg?style=flat-square)](https://www.npmjs.com/package/@mskutin/pulumi-signal-waiter)
[![CI/CD Pipeline](https://github.com/mskutin/pulumi-signal-waiter/actions/workflows/ci.yml/badge.svg)](https://github.com/mskutin/pulumi-signal-waiter/actions/workflows/ci.yml)
[![Code Quality](https://github.com/mskutin/pulumi-signal-waiter/actions/workflows/code-quality.yml/badge.svg)](https://github.com/mskutin/pulumi-signal-waiter/actions/workflows/code-quality.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pulumi](https://img.shields.io/badge/pulumi-aws-blue.svg?style=flat-square)](https://www.pulumi.com)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

> A reusable Pulumi component that **blocks stack execution** until a bootstrap
> **signal message** is received from an AWS SQS queue. Ideal for coordinating
> asynchronous resource initialization (e.g., EC2 bootstrap completion)
> **without relying on CloudFormation `cfn-signal` or external Terraform
> providers**.

---

## 🚀 Features

- ✅ Pulumi-native alternative to `cfn-signal`
- ✅ Works in any Pulumi AWS project (TypeScript or JavaScript)
- ✅ Models "readiness dependencies" between resources
- ✅ Configurable timeout and region
- ✅ Zero external binaries or tools required

---

## 📦 Installation

```bash
npm install @mskutin/pulumi-signal-waiter
```

---

## 🛠️ Usage

### 1️⃣ Basic Usage - Single Instance Bootstrap

```typescript
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

// Create SQS queue for signal
const queue = new aws.sqs.Queue("bootstrapSignalQueue", {
  messageRetentionSeconds: 300,
  visibilityTimeoutSeconds: 60,
});

// IAM role for EC2 to send SQS messages
const role = new aws.iam.Role("sqsRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "ec2.amazonaws.com",
  }),
});

const policy = new aws.iam.RolePolicy("sqsPolicy", {
  role: role.id,
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["sqs:SendMessage"],
        Resource: queue.arn,
      },
    ],
  },
});

const instanceProfile = new aws.iam.InstanceProfile("sqsAccessProfile", {
  role: role.name,
});

// EC2 instance that sends signal after bootstrap
const instance = new aws.ec2.Instance("appInstance", {
  ami: "ami-0c55b159cbfafe1f0", // Amazon Linux 2
  instanceType: "t3.micro",
  iamInstanceProfile: instanceProfile.name,
  userData: aws.interpolate`#!/bin/bash
echo "Starting bootstrap process..."

# Your application setup here
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

# Wait for services to be ready
sleep 30

# Send ready signal to SQS
aws sqs send-message \\
    --queue-url ${queue.url} \\
    --message-body "ready" \\
    --region ${aws.config.region}

echo "Bootstrap complete, signal sent!"
`,
});

// Wait for the bootstrap signal before proceeding
const waiter = new SignalWaiter(
  "waitForBootstrap",
  {
    queueUrl: queue.url,
    region: aws.config.region,
    timeoutMs: 300000, // 5 minutes
  },
  { dependsOn: [instance] }
);

// Resources that depend on bootstrap completion
const bucket = new aws.s3.Bucket(
  "appBucket",
  {
    // This bucket will only be created after the signal is received
  },
  { dependsOn: [waiter] }
);

export const queueUrl = queue.url;
export const instanceId = instance.id;
export const bucketName = bucket.bucket;
```

### 2️⃣ Multi-Instance Coordination (N-of-M Pattern)

```typescript
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

// Shared SQS queue for all instances
const queue = new aws.sqs.Queue("multiInstanceQueue", {
  messageRetentionSeconds: 600,
});

// Create multiple instances
const instances: aws.ec2.Instance[] = [];
for (let i = 0; i < 3; i++) {
  const instance = new aws.ec2.Instance(`instance-${i}`, {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    iamInstanceProfile: instanceProfile.name,
    userData: aws.interpolate`#!/bin/bash
# Simulate variable bootstrap times
SLEEP_TIME=$((30 + RANDOM % 60))
echo "Instance ${i} sleeping for $SLEEP_TIME seconds"
sleep $SLEEP_TIME

# Send signal with instance identifier
aws sqs send-message \\
    --queue-url ${queue.url} \\
    --message-body "instance-${i}-ready" \\
    --region ${aws.config.region}
`,
  });
  instances.push(instance);
}

// Wait for 2 out of 3 instances to signal readiness
const multiWaiter = new SignalWaiter(
  "waitForMultipleInstances",
  {
    queueUrl: queue.url,
    region: aws.config.region,
    requiredSignalCount: 2, // Wait for 2 signals
    timeoutMs: 600000, // 10 minutes
    pollIntervalSeconds: 15, // Check every 15 seconds
  },
  { dependsOn: instances }
);

// Load balancer created after sufficient instances are ready
const loadBalancer = new aws.elb.LoadBalancer(
  "appLB",
  {
    availabilityZones: ["us-west-2a", "us-west-2b"],
    instances: instances.map(i => i.id),
    // ... other LB configuration
  },
  { dependsOn: [multiWaiter] }
);
```

### 3️⃣ Advanced Configuration with Custom Messages

```typescript
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

const queue = new aws.sqs.Queue("advancedQueue", {
  messageRetentionSeconds: 1200,
});

const instance = new aws.ec2.Instance("advancedInstance", {
  ami: "ami-0c55b159cbfafe1f0",
  instanceType: "t3.small",
  iamInstanceProfile: instanceProfile.name,
  userData: aws.interpolate`#!/bin/bash
set -e

# Complex bootstrap process
echo "Starting advanced bootstrap..."

# Database setup
./setup-database.sh
if [ $? -eq 0 ]; then
    echo "Database setup completed"
else
    echo "Database setup failed"
    exit 1
fi

# Application deployment
./deploy-application.sh
if [ $? -eq 0 ]; then
    echo "Application deployment completed"
else
    echo "Application deployment failed"
    exit 1
fi

# Health check
for i in {1..10}; do
    if curl -f http://localhost:8080/health; then
        echo "Health check passed"
        break
    fi
    echo "Health check attempt $i failed, retrying..."
    sleep 10
done

# Send detailed ready signal
aws sqs send-message \\
    --queue-url ${queue.url} \\
    --message-body "{\\"status\\": \\"ready\\", \\"timestamp\\": \\"$(date -Iseconds)\\", \\"instance\\": \\"$(curl -s http://169.254.169.254/latest/meta-data/instance-id)\\"}" \\
    --region ${aws.config.region}

echo "Advanced bootstrap complete!"
`,
});

// Advanced waiter configuration
const advancedWaiter = new SignalWaiter(
  "advancedWaiter",
  {
    queueUrl: queue.url,
    region: aws.config.region,
    timeoutMs: 900000, // 15 minutes for complex bootstrap
    pollIntervalSeconds: 20, // Less frequent polling
    deleteMessages: true, // Clean up messages after processing
  },
  { dependsOn: [instance] }
);
```

### 4️⃣ Container/ECS Integration

```typescript
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

const queue = new aws.sqs.Queue("containerQueue");

// ECS cluster and service
const cluster = new aws.ecs.Cluster("appCluster");

const taskDefinition = new aws.ecs.TaskDefinition("appTask", {
  family: "app",
  cpu: "256",
  memory: "512",
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  executionRoleArn: executionRole.arn,
  taskRoleArn: taskRole.arn,
  containerDefinitions: JSON.stringify([
    {
      name: "app",
      image: "your-app:latest",
      essential: true,
      portMappings: [{ containerPort: 8080 }],
      environment: [
        { name: "QUEUE_URL", value: queue.url },
        { name: "AWS_REGION", value: aws.config.region },
      ],
      // Container sends signal when ready
      command: [
        "/bin/sh",
        "-c",
        `
            # Start application in background
            ./start-app.sh &
            
            # Wait for application to be ready
            while ! curl -f http://localhost:8080/health; do
                sleep 5
            done
            
            # Send ready signal
            aws sqs send-message --queue-url $QUEUE_URL --message-body "container-ready" --region $AWS_REGION
            
            # Keep container running
            wait
            `,
      ],
    },
  ]),
});

const service = new aws.ecs.Service("appService", {
  cluster: cluster.id,
  taskDefinition: taskDefinition.arn,
  desiredCount: 2,
  launchType: "FARGATE",
  // ... network configuration
});

// Wait for containers to signal readiness
const containerWaiter = new SignalWaiter(
  "containerWaiter",
  {
    queueUrl: queue.url,
    region: aws.config.region,
    requiredSignalCount: 2, // Wait for both containers
    timeoutMs: 600000,
  },
  { dependsOn: [service] }
);
```

### 5️⃣ Database Migration Coordination

```typescript
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

const queue = new aws.sqs.Queue("migrationQueue");

// Lambda function for database migration
const migrationLambda = new aws.lambda.Function("dbMigration", {
  runtime: "python3.9",
  code: new pulumi.asset.AssetArchive({
    "index.py": new pulumi.asset.StringAsset(`
import boto3
import json
import os

def lambda_handler(event, context):
    # Run database migrations
    try:
        # Your migration logic here
        run_migrations()
        
        # Send success signal
        sqs = boto3.client('sqs')
        sqs.send_message(
            QueueUrl=os.environ['QUEUE_URL'],
            MessageBody='migration-complete'
        )
        
        return {'statusCode': 200, 'body': 'Migration completed'}
    except Exception as e:
        print(f"Migration failed: {e}")
        raise
        `),
  }),
  handler: "index.lambda_handler",
  role: migrationRole.arn,
  environment: {
    variables: {
      QUEUE_URL: queue.url,
    },
  },
});

// Trigger migration
const migrationInvocation = new aws.lambda.Invocation("triggerMigration", {
  functionName: migrationLambda.name,
  input: JSON.stringify({}),
});

// Wait for migration completion
const migrationWaiter = new SignalWaiter(
  "migrationWaiter",
  {
    queueUrl: queue.url,
    region: aws.config.region,
    timeoutMs: 1800000, // 30 minutes for large migrations
  },
  { dependsOn: [migrationInvocation] }
);

// Application instances that depend on migration
const appInstances = new aws.ec2.Instance(
  "appInstance",
  {
    // ... configuration
  },
  { dependsOn: [migrationWaiter] }
);
```

### 6️⃣ Error Handling and Monitoring

```typescript
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

const queue = new aws.sqs.Queue("monitoredQueue", {
  // Dead letter queue for failed signals
  redrivePolicy: JSON.stringify({
    deadLetterTargetArn: deadLetterQueue.arn,
    maxReceiveCount: 3,
  }),
});

const deadLetterQueue = new aws.sqs.Queue("failedSignals");

// CloudWatch alarm for monitoring
const queueAlarm = new aws.cloudwatch.MetricAlarm("queueAlarm", {
  comparisonOperator: "GreaterThanThreshold",
  evaluationPeriods: 2,
  metricName: "ApproximateNumberOfMessages",
  namespace: "AWS/SQS",
  period: 300,
  statistic: "Average",
  threshold: 5,
  alarmDescription: "Too many messages in queue",
  dimensions: {
    QueueName: queue.name,
  },
});

// Waiter with comprehensive error handling
const monitoredWaiter = new SignalWaiter(
  "monitoredWaiter",
  {
    queueUrl: queue.url,
    region: aws.config.region,
    timeoutMs: 600000,
    pollIntervalSeconds: 10,
    deleteMessages: true,
  },
  {
    dependsOn: [instance],
    // Add custom timeout handling
    customTimeouts: {
      create: "10m",
      update: "10m",
      delete: "5m",
    },
  }
);
```

### 🔧 Configuration Options

All available parameters for `SignalWaiter`:

```typescript
new SignalWaiter("waiterName", {
    // Required
    queueUrl: string | pulumi.Input<string>,

    // Optional with defaults
    region?: string | pulumi.Input<string>,           // Current AWS region
    timeoutMs?: number | pulumi.Input<number>,        // 300000 (5 minutes)
    pollIntervalSeconds?: number | pulumi.Input<number>, // 10 seconds
    requiredSignalCount?: number | pulumi.Input<number>, // 1
    deleteMessages?: boolean | pulumi.Input<boolean>,    // true
}, {
    // Standard Pulumi resource options
    dependsOn?: pulumi.Resource[],
    protect?: boolean,
    parent?: pulumi.Resource,
    // ... other options
});
```

---

## ⚙️ How It Works

1. Your EC2 (or other resource) sends a message to SQS when it’s fully
   configured.
2. `SignalWaiter` polls SQS every 10 seconds until it sees a message or times
   out.
3. Pulumi pauses deployment of dependent resources until the signal arrives.
4. The message is deleted from the queue to avoid re-processing.

---

## 📖 Parameters

| Parameter             | Type                    | Default            | Description                                           |
| --------------------- | ----------------------- | ------------------ | ----------------------------------------------------- |
| `queueUrl`            | `pulumi.Input<string>`  | required           | The AWS SQS Queue URL to listen on.                   |
| `region`              | `pulumi.Input<string>`  | current AWS region | Region where the queue exists.                        |
| `timeoutMs`           | `pulumi.Input<number>`  | `300000`           | Maximum wait time in milliseconds before failing.     |
| `pollIntervalSeconds` | `pulumi.Input<number>`  | `10`               | Polling interval in seconds (1-20 seconds).           |
| `requiredSignalCount` | `pulumi.Input<number>`  | `1`                | Number of signals required before completing (1-100). |
| `deleteMessages`      | `pulumi.Input<boolean>` | `true`             | Whether to delete messages after receiving them.      |

---

## 💡 Use Cases

- **EC2 AutoScaling lifecycle hooks**: wait for instance bootstrap before
  attaching to ELB.
- **Multi-instance coordination**: wait for N-of-M instances to signal
  readiness.
- **Database migrations**: pause until an external script signals readiness.
- **Complex orchestration**: enforce async order without hacks or `cfn-signal`.
- **Blue/green deployments**: coordinate between old and new infrastructure.
- **Container orchestration**: wait for multiple containers to be healthy.

---

## ✅ Advantages Over `cfn-signal` and custom wrappers

- Works without CloudFormation or AWS-specific signaling helpers.
- Cross-language, fully supported in Pulumi ecosystem.
- Uses standard AWS primitives (SQS), no custom binaries required.
- Lightweight and testable in isolation.

---

## 🏗️ Roadmap

- [ ] Add SNS / HTTP webhook signal support
- [x] Support for multiple messages (e.g., N-of-M signals)
- [ ] Python version of the component
- [ ] Packaged as official Pulumi ComponentResource

---

## 📜 License

MIT License – feel free to use and adapt.

---

## 🔗 Links

- Pulumi Documentation: https://www.pulumi.com/docs/
- AWS SQS Documentation:
  https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html
- cfn-signal reference (for comparison):
  https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-signal.html
