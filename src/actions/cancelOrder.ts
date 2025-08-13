import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';

export const cancelOrderAction: Action = {
  name: 'cancel-order',
  description: 'Cancels an order on Delta Exchange.',
  similes: ['cancel my order', 'delete order', 'remove order'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Cancel my order 12345' },
      },
      {
        name: 'assistant',
        content: {
          text: 'I will cancel order 12345.',
          actions: ['cancel-order'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'delete order 67890' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Cancelling order 67890.',
          actions: ['cancel-order'],
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getService('delta-rest');
  },
  handler: async (runtime: IAgentRuntime, message: any, state?: any, options?: any, callback?: any): Promise<ActionResult> => {
    try {
      const deltaRestClient = runtime.getService('delta-rest') as DeltaRestClient;
      if (!deltaRestClient) {
        throw new Error('DeltaRestClient service not found');
      }

      const orderId = message?.content?.text?.split(' ').pop();
      if (!orderId) {
        throw new Error('Order ID not provided in the message');
      }

      await callback?.({
        text: `Understood. Cancelling order ${orderId}...`,
      });

      const result = await deltaRestClient.cancelOrder({ id: orderId });
      return {
        text: `Order ${orderId} cancelled successfully.`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in cancelOrder action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to cancel your order: ${error.message}`,
      });
      return {
        text: `Failed to cancel order: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
