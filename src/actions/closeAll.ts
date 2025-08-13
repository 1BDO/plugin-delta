import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const closeAllAction: Action = {
  name: 'delta:close-all',
  description: 'Closes all open positions.',
  similes: ['close all positions', 'flatten all positions', 'exit all trades'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Close all my positions now.' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Closing all open positions.',
          actions: ['delta:close-all'],
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
        text: 'Understood. Closing all positions...',
      });
      const result = await client.closeAllPositions();
      return {
        text: 'All positions have been closed.',
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in closeAll action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to close all positions: ${error.message}`,
      });
      return {
        text: `Failed to close all positions: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
