# 📦 pulumi-signal-waiter

[![npm version](https://img.shields.io/npm/v/@yourorg/pulumi-signal-waiter.svg?style=flat-square)](https://www.npmjs.com/package/@yourorg/pulumi-signal-waiter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Pulumi](https://img.shields.io/badge/pulumi-aws-blue.svg?style=flat-square)](https://www.pulumi.com)

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

### 1️⃣ Add `SignalWaiter` to Your Pulumi Stack

```typescript
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "@mskutin/pulumi-signal-waiter";

// Create SQS queue for signal
const queue = new aws.sqs.Queue("bootstrapSignalQueue", {
    messageRetentionSeconds: 300,
});

// EC2 instance sends message to SQS after bootstrap
const instance = new aws.ec2.Instance("appInstance", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    userData: #! / bin / bash echo "Bootstrapping..." sleep 60 aws sqs send - message--queue - url ${ queue.id } --message - body "ready" --region ${ aws.config.region },
    iamInstanceProfile: new aws.iam.InstanceProfile("sqsAccessProfile", {
        role: new aws.iam.Role("sqsRole", {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "ec2.amazonaws.com" }),
            managedPolicyArns: ["arn:aws:iam::aws:policy/AmazonSQSFullAccess"],
        }),
    }),
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
- [ ] Support for multiple messages (e.g., N-of-M signals)
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
