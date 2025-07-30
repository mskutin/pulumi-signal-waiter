/**
 * Simple test example for SignalWaiter
 * This demonstrates basic usage without requiring a full Pulumi deployment
 */

import * as aws from "@pulumi/aws";
import { SignalWaiter } from "../src/index";

// This is a minimal example showing how to use SignalWaiter
// In a real scenario, you would run this as part of a Pulumi program

async function testSignalWaiter() {
  console.log("Testing SignalWaiter component...");

  // Create a test queue
  const testQueue = new aws.sqs.Queue("test-signal-queue", {
    messageRetentionSeconds: 300,
  });

  // Create SignalWaiter with short timeout for testing
  const waiter = new SignalWaiter("test-waiter", {
    queueUrl: testQueue.url,
    timeoutMs: 30000, // 30 seconds for testing
  });

  console.log("SignalWaiter created successfully!");
  console.log("In a real deployment, this would wait for a message in the queue.");

  return {
    queueUrl: testQueue.url,
    waiterId: waiter.urn,
  };
}

// Export for use in Pulumi programs
export { testSignalWaiter };
