import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const updateMmpAction: Action = {
  name: 'delta:mmp-update',
  description: 'Updates the MMP configuration.',
  similes: ['update mmp', 'set mmp', 'change market maker protection'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Update the MMP for BTC with a trade limit of 1000' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Updating the MMP for BTC with a trade limit of 1000.',
          actions: ['delta:mmp-update'],
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
      // This is a placeholder for a more sophisticated NLP-based parser
      const mmpConfig = JSON.parse(memory.content.text);
      await callback?.({
        text: `Understood. Updating MMP configuration...`,
      });
      const result = await client.updateMmp(mmpConfig);
      return {
        text: `MMP configuration updated successfully.`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in updateMmp action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to update the MMP configuration: ${error.message}`,
      });
      return {
        text: `Failed to update MMP: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
