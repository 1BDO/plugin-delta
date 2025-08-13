import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const getDeadmanStatusAction: Action = {
  name: 'delta:deadman-status',
  description: 'Gets the status of a deadman switch.',
  similes: ['get deadman status', 'check heartbeat status', 'deadman status'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'What is the status of my deadman switch my-heartbeat-id?' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Checking the status of deadman switch my-heartbeat-id.',
          actions: ['delta:deadman-status'],
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
      await callback?.({
        text: `Understood. Getting status for deadman switch ${heartbeatId}...`,
      });
      const result = await client.getHeartbeat(heartbeatId);
      return {
        text: `Status of deadman switch ${heartbeatId}: ${JSON.stringify(result.result)}`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in getDeadmanStatus action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to get the deadman switch status: ${error.message}`,
      });
      return {
        text: `Failed to get deadman switch status: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
