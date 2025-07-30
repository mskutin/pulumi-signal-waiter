/**
 * Advanced example: Wait for multiple EC2 instances to signal readiness
 * This demonstrates the N-of-M signal pattern
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "../src/index";

// Configuration
const instanceCount = 3;
const requiredSignals = 2; // Wait for at least 2 out of 3 instances

// Get current AWS region
const currentRegion = aws.getRegion({});

// Create SQS Queue for bootstrap signals
const queue = new aws.sqs.Queue("multiBootstrapSignalQueue", {
  messageRetentionSeconds: 600, // 10 minutes
  visibilityTimeoutSeconds: 30,
  tags: {
    Purpose: "Multi-Instance-Bootstrap",
  },
});

// Get the latest Amazon Linux 2 AMI
const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ["amazon"],
  filters: [
    {
      name: "name",
      values: ["amzn2-ami-hvm-*-x86_64-gp2"],
    },
    {
      name: "state",
      values: ["available"],
    },
  ],
});

// Create IAM role for EC2 instances
const role = new aws.iam.Role("multiInstanceRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "ec2.amazonaws.com",
        },
      },
    ],
  }),
});

// Create minimal IAM policy for SQS access
const policy = new aws.iam.RolePolicy("multiInstanceSqsPolicy", {
  role: role.id,
  policy: queue.arn.apply((queueArn: string) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["sqs:SendMessage"],
          Resource: queueArn,
        },
      ],
    })
  ),
});

const instanceProfile = new aws.iam.InstanceProfile("multiInstanceProfile", {
  role: role.name,
});

// Create multiple EC2 instances
const instances: aws.ec2.Instance[] = [];
for (let i = 0; i < instanceCount; i++) {
  const instance = new aws.ec2.Instance(
    `appInstance-${i}`,
    {
      ami: ami.then(ami => ami.id),
      instanceType: "t3.micro",
      iamInstanceProfile: instanceProfile.name,
      userData: pulumi.all([queue.url, currentRegion]).apply(
        ([queueUrl, region]: [string, aws.GetRegionResult]) => `#!/bin/bash
echo "Starting bootstrap process for instance ${i}..."
yum update -y
yum install -y awscli

# Simulate variable bootstrap time (some instances may take longer)
SLEEP_TIME=$((30 + RANDOM % 120))  # 30-150 seconds
echo "Performing application setup for $SLEEP_TIME seconds..."
sleep $SLEEP_TIME

# Send ready signal to SQS with instance identifier
echo "Sending ready signal from instance ${i}..."
aws sqs send-message \\
    --queue-url "${queueUrl}" \\
    --message-body "instance-${i}-ready" \\
    --region "${region.name}"

echo "Bootstrap complete for instance ${i}!"
`
      ),
      tags: {
        Name: `SignalWaiter-Multi-Instance-${i}`,
        Purpose: "Multi-Bootstrap-Demo",
        InstanceIndex: i.toString(),
      },
    },
    { dependsOn: [policy] }
  );

  instances.push(instance);
}

// Wait for at least N instances to signal readiness
const waitForBootstrap = new SignalWaiter(
  "waitForMultiBootstrap",
  {
    queueUrl: queue.url,
    region: currentRegion.then(r => r.name),
    timeoutMs: 600000, // 10 minutes timeout
    pollIntervalSeconds: 5, // Check every 5 seconds
    requiredSignalCount: requiredSignals, // Wait for 2 out of 3 instances
    deleteMessages: true, // Clean up messages after receiving
  },
  { dependsOn: instances }
); // Depend on all instances

// Create resources that depend on the bootstrap completion
const bucket = new aws.s3.Bucket(
  "multiReadyBucket",
  {
    tags: {
      CreatedAfter: `${requiredSignals}-of-${instanceCount}-Bootstrap-Complete`,
    },
  },
  { dependsOn: [waitForBootstrap] }
);

// Create an ALB that will only be created after enough instances are ready
const alb = new aws.lb.LoadBalancer(
  "appLoadBalancer",
  {
    loadBalancerType: "application",
    subnets: aws.ec2
      .getSubnets({
        filters: [{ name: "default-for-az", values: ["true"] }],
      })
      .then(subnets => subnets.ids),
    tags: {
      CreatedAfter: "Multi-Instance-Bootstrap",
    },
  },
  { dependsOn: [waitForBootstrap] }
);

// Export useful values
export const queueUrl = queue.url;
export const instanceIds = instances.map(instance => instance.id);
export const bucketName = bucket.bucket;
export const loadBalancerDns = alb.dnsName;
export const bootstrapConfig = {
  totalInstances: instanceCount,
  requiredSignals: requiredSignals,
  timeoutMinutes: 10,
};
