import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const getPositionsAction: Action = {
  name: 'delta:get-positions',
  description: 'Fetches all open positions for the authenticated account from Delta Exchange.',
  similes: ['get my positions', 'show my positions', 'list open positions'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'What are my current positions?' },
      },
      {
        name: 'assistant',
        content: {
          text: 'I will fetch your open positions.',
          actions: ['delta:get-positions'],
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime) => {
    return !!runtime.getService<DeltaRestClient>('delta-rest');
  },
  handler: async (runtime: IAgentRuntime, message: any, state?: any, options?: any, callback?: any): Promise<ActionResult> => {
    try {
      const client = runtime.getService<DeltaRestClient>('delta-rest');
      if (!client) {
        throw new Error('DeltaRestClient not initialized.');
      }
      await callback?.({
        text: 'Understood. Fetching your open positions...',
      });
      const positions = await client.getPositions();
      return {
        text: `You have ${positions.result.length} open positions.`,
        success: true,
        data: { positions: positions.result },
      };
    } catch (error: any) {
      logger.error('Error in getPositions action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to fetch your positions: ${error.message}`,
      });
      return {
        text: `Failed to retrieve positions: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
