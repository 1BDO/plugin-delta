import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const editOrderAction: Action = {
  name: 'delta:edit-order',
  description: 'Edits an existing order.',
  similes: ['edit order', 'modify order', 'change order'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Edit order 12345 to size 10' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Editing order 12345 to size 10.',
          actions: ['delta:edit-order'],
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
      // This is a placeholder for a more sophisticated NLP-based order parser
      const text = memory.content.text.toLowerCase();
      const parts = text.split(' ');
      const orderId = parts.find((p: string) => !isNaN(Number(p)));
      const sizeIndex = parts.findIndex((p: string) => p === 'size');
      const size = sizeIndex !== -1 ? parts[sizeIndex + 1] : undefined;

      if (!orderId) {
        throw new Error('Order ID not provided in the message');
      }

      const order = { id: orderId, size: size ? Number(size) : undefined };

      await callback?.({
        text: `Understood. Editing order ${orderId}...`,
      });

      const result = await client.editOrder(order);
      return {
        text: `Order ${orderId} edited successfully.`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in editOrder action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to edit your order: ${error.message}`,
      });
      return {
        text: `Failed to edit order: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
