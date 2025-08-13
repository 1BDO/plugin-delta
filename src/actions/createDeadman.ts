import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const createDeadmanAction: Action = {
  name: 'delta:deadman-create',
  description: 'Creates a deadman switch.',
  similes: ['create deadman', 'new deadman switch', 'set up heartbeat'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Create a deadman switch with ID my-heartbeat-id' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Creating a new deadman switch with ID my-heartbeat-id.',
          actions: ['delta:deadman-create'],
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
        text: `Understood. Creating deadman switch ${heartbeatId}...`,
      });
      const result = await client.createHeartbeat({ heartbeat_id: heartbeatId });
      return {
        text: `Deadman switch ${heartbeatId} created.`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in createDeadman action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to create the deadman switch: ${error.message}`,
      });
      return {
        text: `Failed to create deadman switch: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
