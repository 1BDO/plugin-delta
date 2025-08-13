import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const getMarginsAction: Action = {
  name: 'delta:get-margins',
  description: 'Fetches the margin details for the authenticated account.',
  similes: ['get margins', 'show my margins', 'list margins'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'What are my current margins?' },
      },
      {
        name: 'assistant',
        content: {
          text: 'I will fetch your margin details.',
          actions: ['delta:get-margins'],
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
        text: 'Understood. Fetching your margin details...',
      });
      const margins = await client.getBalances();
      return {
        text: `You have ${margins.result.length} margin balances.`,
        success: true,
        data: { margins: margins.result },
      };
    } catch (error: any) {
      logger.error('Error in getMargins action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to fetch your margin details: ${error.message}`,
      });
      return {
        text: `Failed to retrieve margins: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
