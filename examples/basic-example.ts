import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { SignalWaiter } from "../src/index";

// Get current AWS region
const currentRegion = aws.getRegion({});

// Create SQS Queue
const queue = new aws.sqs.Queue("bootstrapSignalQueue", {
  messageRetentionSeconds: 300,
  tags: {
    Purpose: "SignalWaiter-Bootstrap",
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

// Create IAM role for EC2 instance with minimal SQS permissions
const role = new aws.iam.Role("sqsRole", {
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

// Create minimal IAM policy for SQS access (only to our specific queue)
const policy = new aws.iam.RolePolicy("sqsPolicy", {
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

const instanceProfile = new aws.iam.InstanceProfile("sqsAccessProfile", {
  role: role.name,
});

// EC2 instance sends signal message to SQS in its bootstrap script
const instance = new aws.ec2.Instance(
  "appInstance",
  {
    ami: ami.then(ami => ami.id),
    instanceType: "t3.micro",
    iamInstanceProfile: instanceProfile.name,
    userData: pulumi.all([queue.url, currentRegion]).apply(
      ([queueUrl, region]: [string, aws.GetRegionResult]) => `#!/bin/bash
echo "Starting bootstrap process..."
yum update -y
yum install -y awscli

# Simulate some bootstrap work
echo "Performing application setup..."
sleep 60

# Send ready signal to SQS
echo "Sending ready signal..."
aws sqs send-message \\
    --queue-url "${queueUrl}" \\
    --message-body "ready" \\
    --region "${region.name}"

echo "Bootstrap complete!"
`
    ),
    tags: {
      Name: "SignalWaiter-Example-Instance",
      Purpose: "Bootstrap-Demo",
    },
  },
  { dependsOn: [policy] }
); // Ensure policy is attached before instance starts

// Wait until signal message is received before creating dependent resources
const waitForBootstrap = new SignalWaiter(
  "waitForBootstrap",
  {
    queueUrl: queue.url,
    region: currentRegion.then(r => r.name),
    timeoutMs: 600000, // 10 minutes timeout
  },
  { dependsOn: [instance] }
);

// Downstream resource depends on the signal
const bucket = new aws.s3.Bucket(
  "readyBucket",
  {
    tags: {
      CreatedAfter: "Bootstrap-Complete",
    },
  },
  { dependsOn: [waitForBootstrap] }
);

// Export useful values
export const queueUrl = queue.url;
export const instanceId = instance.id;
export const bucketName = bucket.bucket;
export const instancePublicIp = instance.publicIp;
