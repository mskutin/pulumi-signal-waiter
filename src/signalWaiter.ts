import * as pulumi from "@pulumi/pulumi";
import { SQSClient, ReceiveMessageCommand, DeleteMessageBatchCommand } from "@aws-sdk/client-sqs";

/**
 * @packageDocumentation
 * # Pulumi Signal Waiter
 *
 * `pulumi-signal-waiter` is a lightweight Pulumi component that allows you to
 * **pause stack execution** until a "ready" signal is received on an SQS queue.
 *
 * This is useful when:
 * - EC2 instances or AutoScaling Groups perform long bootstrap operations.
 * - You want to model asynchronous "readiness" in your infrastructure code.
 * - You want a Pulumi-native alternative to `cfn-signal` or external Terraform providers.
 *
 * ## How It Works
 *
 * 1. Your instance or workload publishes a message to an SQS queue once it finishes setup.
 * 2. The `SignalWaiter` component polls the queue until a message is received.
 * 3. Pulumi does not create dependent resources until the signal arrives.
 *
 * ---
 *
 * Example:
 *
 * ```ts
 * import { SignalWaiter } from "@yourorg/pulumi-signal-waiter";
 *
 * const waiter = new SignalWaiter("waitForBootstrap", {
 *   queueUrl: myQueue.id,
 *   region: aws.config.region,
 *   timeoutMs: 300000
 * }, { dependsOn: [myEc2Instance] });
 * ```
 *
 * ---
 */

/**
 * Input interface for the dynamic provider
 */
interface WaitForSignalInputs {
  queueUrl: string;
  region: string;
  timeout: number;
  pollInterval: number;
  requiredSignalCount: number;
  deleteMessages: boolean;
}

/**
 * Dynamic provider that waits for a message in an SQS queue.
 */
class WaitForSignalProvider implements pulumi.dynamic.ResourceProvider {
  async create(inputs: WaitForSignalInputs) {
    const sqs = new SQSClient({ region: inputs.region });
    const start = Date.now();
    const timeout = inputs.timeout || 300000; // Default 5 min
    const pollInterval = inputs.pollInterval || 10; // Default 10 seconds
    const requiredSignalCount = inputs.requiredSignalCount || 1;
    const deleteMessages = inputs.deleteMessages !== false; // Default true
    let pollCount = 0;
    const receivedSignals: string[] = [];

    pulumi.log.info(
      `SignalWaiter: Starting to wait for ${requiredSignalCount} signal(s) in queue: ${inputs.queueUrl}`
    );
    pulumi.log.info(`SignalWaiter: Timeout set to ${timeout}ms (${Math.round(timeout / 1000)}s)`);
    pulumi.log.info(`SignalWaiter: Poll interval set to ${pollInterval}s`);
    pulumi.log.info(`SignalWaiter: Delete messages: ${deleteMessages}`);

    while (Date.now() - start < timeout && receivedSignals.length < requiredSignalCount) {
      pollCount++;
      const elapsed = Date.now() - start;
      const remaining = timeout - elapsed;

      pulumi.log.info(
        `SignalWaiter: Poll #${pollCount}, ${receivedSignals.length}/${requiredSignalCount} signals received, ${Math.round(elapsed / 1000)}s elapsed, ${Math.round(remaining / 1000)}s remaining`
      );

      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: inputs.queueUrl,
          MaxNumberOfMessages: Math.min(10, requiredSignalCount - receivedSignals.length), // Receive up to remaining needed
          WaitTimeSeconds: Math.min(pollInterval, Math.floor(remaining / 1000)), // Don't wait longer than remaining time
        });

        const response = await sqs.send(command);

        if (response.Messages && response.Messages.length > 0) {
          const messagesToDelete: { Id: string; ReceiptHandle: string }[] = [];

          for (const msg of response.Messages) {
            receivedSignals.push(msg.Body || "ready");
            pulumi.log.info(
              `SignalWaiter: Signal ${receivedSignals.length}/${requiredSignalCount} received: ${msg.Body}`
            );

            if (deleteMessages && msg.ReceiptHandle) {
              messagesToDelete.push({
                Id: msg.MessageId || `msg-${Date.now()}`,
                ReceiptHandle: msg.ReceiptHandle,
              });
            }
          }

          // Delete messages in batch if requested
          if (deleteMessages && messagesToDelete.length > 0) {
            try {
              const deleteCommand = new DeleteMessageBatchCommand({
                QueueUrl: inputs.queueUrl,
                Entries: messagesToDelete,
              });
              await sqs.send(deleteCommand);
              pulumi.log.info(
                `SignalWaiter: ${messagesToDelete.length} message(s) deleted from queue`
              );
            } catch (deleteError) {
              pulumi.log.warn(
                `SignalWaiter: Failed to delete messages (signals still received): ${deleteError}`
              );
            }
          }

          // Check if we have enough signals
          if (receivedSignals.length >= requiredSignalCount) {
            const finalElapsed = Date.now() - start;
            pulumi.log.info(
              `SignalWaiter: ✅ All ${requiredSignalCount} signal(s) received after ${Math.round(finalElapsed / 1000)}s`
            );

            return {
              id: `signals-${Date.now()}`,
              signals: receivedSignals,
              signalCount: receivedSignals.length,
              receivedAt: new Date().toISOString(),
              pollCount: pollCount,
              elapsedMs: finalElapsed,
            };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        pulumi.log.warn(`SignalWaiter: Error during poll #${pollCount}: ${errorMessage}`);

        // For certain errors, we should fail fast rather than continue polling
        if (
          errorMessage.includes("does not exist") ||
          errorMessage.includes("AccessDenied") ||
          errorMessage.includes("InvalidParameterValue")
        ) {
          throw new Error(`SignalWaiter: Fatal error - ${errorMessage}`);
        }

        // For transient errors, wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const finalElapsed = Date.now() - start;
    if (receivedSignals.length < requiredSignalCount) {
      throw new Error(
        `SignalWaiter: Timeout after ${Math.round(finalElapsed / 1000)}s waiting for ${requiredSignalCount} signal(s). Only received ${receivedSignals.length} (${pollCount} polls attempted)`
      );
    }

    // This shouldn't happen, but just in case
    return {
      id: `signals-${Date.now()}`,
      signals: receivedSignals,
      signalCount: receivedSignals.length,
      receivedAt: new Date().toISOString(),
      pollCount: pollCount,
      elapsedMs: finalElapsed,
    };
  }
}

/**
 * Configuration options for SignalWaiter component
 */
export interface SignalWaiterArgs {
  /**
   * The AWS SQS Queue URL to listen on for signal messages.
   * This should be the full queue URL, not just the queue name.
   */
  queueUrl: pulumi.Input<string>;

  /**
   * AWS region where the queue exists.
   * If not specified, uses the current Pulumi AWS provider region.
   */
  region?: pulumi.Input<string>;

  /**
   * Maximum wait time in milliseconds before timing out.
   * Default: 300000 (5 minutes)
   * Minimum: 10000 (10 seconds)
   * Maximum: 3600000 (1 hour)
   */
  timeoutMs?: pulumi.Input<number>;

  /**
   * Polling interval in seconds for checking SQS messages.
   * Default: 10 seconds
   * Minimum: 1 second
   * Maximum: 20 seconds (SQS long polling limit)
   */
  pollIntervalSeconds?: pulumi.Input<number>;

  /**
   * Number of signal messages required before considering the wait complete.
   * Default: 1 (wait for single signal)
   * Useful for scenarios where multiple instances need to signal readiness.
   */
  requiredSignalCount?: pulumi.Input<number>;

  /**
   * Whether to delete messages from the queue after receiving them.
   * Default: true
   * Set to false if you want to preserve messages for other consumers.
   */
  deleteMessages?: pulumi.Input<boolean>;
}

/**
 * A Pulumi dynamic resource that waits for a bootstrap signal message on an AWS SQS queue.
 *
 * This component is useful to model dependencies on **out-of-band processes**
 * such as EC2 user-data scripts or container tasks that must finish setup before
 * continuing the Pulumi deployment.
 *
 * ### Parameters
 * - **queueUrl** – The SQS queue to listen on.
 * - **region** *(optional)* – AWS region of the queue (defaults to current Pulumi/AWS config region).
 * - **timeoutMs** *(optional)* – Maximum wait time in milliseconds (default: 300000 / 5 min).
 *
 * ### Behavior
 * - Polls SQS every 10 seconds until a message is received.
 * - Deletes the message after reading it (acknowledges success).
 * - Throws an error if the timeout expires before a message arrives.
 *
 * ### Example
 * ```ts
 * const waiter = new SignalWaiter("waiter", {
 *   queueUrl: myQueue.id,
 *   timeoutMs: 600000
 * }, { dependsOn: [myEC2Instance] });
 *
 * new aws.s3.Bucket("postBootstrapBucket", {}, { dependsOn: waiter });
 * ```
 *
 * @see https://github.com/mskutin/pulumi-signal-waiter
 */

export class SignalWaiter extends pulumi.dynamic.Resource {
  constructor(name: string, args: SignalWaiterArgs, opts?: pulumi.CustomResourceOptions) {
    // Input validation
    if (!args.queueUrl) {
      throw new Error("SignalWaiter: queueUrl is required");
    }

    // Validate timeout if provided
    const timeoutMs = args.timeoutMs || 300000;
    if (typeof timeoutMs === "number") {
      if (timeoutMs < 10000) {
        throw new Error("SignalWaiter: timeoutMs must be at least 10000 (10 seconds)");
      }
      if (timeoutMs > 3600000) {
        throw new Error("SignalWaiter: timeoutMs must not exceed 3600000 (1 hour)");
      }
    }

    // Validate polling interval if provided
    const pollIntervalSeconds = args.pollIntervalSeconds || 10;
    if (typeof pollIntervalSeconds === "number") {
      if (pollIntervalSeconds < 1) {
        throw new Error("SignalWaiter: pollIntervalSeconds must be at least 1");
      }
      if (pollIntervalSeconds > 20) {
        throw new Error(
          "SignalWaiter: pollIntervalSeconds must not exceed 20 (SQS long polling limit)"
        );
      }
    }

    // Validate required signal count if provided
    const requiredSignalCount = args.requiredSignalCount || 1;
    if (typeof requiredSignalCount === "number") {
      if (requiredSignalCount < 1) {
        throw new Error("SignalWaiter: requiredSignalCount must be at least 1");
      }
      if (requiredSignalCount > 100) {
        throw new Error("SignalWaiter: requiredSignalCount must not exceed 100 (practical limit)");
      }
    }

    // Use the region from args, or fall back to AWS provider region, or default
    const config = new pulumi.Config("aws");
    const region = args.region || config.get("region") || "us-east-1";

    super(
      new WaitForSignalProvider(),
      name,
      {
        queueUrl: args.queueUrl,
        region: region,
        timeout: timeoutMs,
        pollInterval: pollIntervalSeconds,
        requiredSignalCount: requiredSignalCount,
        deleteMessages: args.deleteMessages !== false, // Default true
      },
      opts
    );
  }
}
