import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const resetMmpAction: Action = {
  name: 'delta:mmp-reset',
  description: 'Resets the MMP configuration.',
  similes: ['reset mmp', 'clear mmp', 'reset market maker protection'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Reset the MMP for BTC' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Resetting the MMP for BTC.',
          actions: ['delta:mmp-reset'],
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
      const asset = memory?.content?.text?.split(' ').pop();
      if (!asset) {
        throw new Error('Asset not provided in the message');
      }
      await callback?.({
        text: `Understood. Resetting MMP for ${asset}...`,
      });
      const result = await client.resetMmp({ asset });
      return {
        text: `MMP for ${asset} reset successfully.`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in resetMmp action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to reset the MMP: ${error.message}`,
      });
      return {
        text: `Failed to reset MMP: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
