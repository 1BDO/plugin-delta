import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const ackDeadmanAction: Action = {
  name: 'delta:deadman-ack',
  description: 'Acknowledges a deadman switch.',
  similes: ['ack deadman', 'acknowledge heartbeat', 'send heartbeat ack'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Acknowledge the deadman switch my-heartbeat-id' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Acknowledging the deadman switch my-heartbeat-id.',
          actions: ['delta:deadman-ack'],
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime) => {
    return !!runtime.getService<DeltaRestClient>('delta-rest');
  },
  handler: async (runtime: IAgentRuntime, memory: any, state?: any, options?: any, callback?: any): Promise<ActionResult> => {
    try {
      const client = runtime.getService<DeltaRestClient>('delta-rest');
      if (!client) {
        throw new Error('DeltaRestClient not initialized.');
      }
      const heartbeatId = memory?.content?.text?.split(' ').pop();
      if (!heartbeatId) {
        throw new Error('Heartbeat ID not provided in the message');
      }
      await callback?.({
        text: `Understood. Acknowledging deadman switch ${heartbeatId}...`,
      });
      const result = await client.ackHeartbeat({ heartbeat_id: heartbeatId });
      return {
        text: `Deadman switch ${heartbeatId} acknowledged.`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in ackDeadman action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to acknowledge the deadman switch: ${error.message}`,
      });
      return {
        text: `Failed to acknowledge deadman switch: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
