import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';
import { findInstrumentInText } from '../utils/instrument-parser';

export const placeOrderAction: Action = {
  name: 'place-order',
  description: 'Places an order on Delta Exchange.',
  similes: ['buy', 'sell', 'create order', 'submit order'],
  examples: [
    [
      {// Example 1: A limit buy order
        name: 'user',
        content: { text: 'Buy 1 BTCUSD at 50000' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Placing a buy order for 1 BTCUSD at 50000.',
          actions: ['place-order'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'Sell 10 ETHUSD market' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Placing a market sell order for 10 ETHUSD.',
          actions: ['place-order'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'create a limit order to sell 5 SOLUSD at 150' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Submitting a limit sell order for 5 SOLUSD at 150.',
          actions: ['place-order'],
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

      // This is a placeholder for a more sophisticated NLP-based order parser
      const text = message.content.text.toLowerCase();
      const parts = text.split(' ');
      const side = parts.find((p: string) => p === 'buy' || p === 'sell');
      const size = parts.find((p: string) => !isNaN(Number(p)));
      const symbol = findInstrumentInText(text);
      const price = parts.find((p: string) => p.startsWith('@') || !isNaN(Number(p)))?.replace('@', '');

      if (!side || !size || !symbol) {
        throw new Error('Could not parse order from message. Please specify side, size, and symbol.');
      }

      const orderParams = {
        side,
        size: Number(size),
        product_symbol: symbol.toUpperCase(),
        order_type: price ? 'limit_order' : 'market_order',
        limit_price: price ? Number(price) : undefined,
      };

      await callback?.({
        text: `Understood. Submitting your order for ${orderParams.size} ${orderParams.product_symbol} to the exchange...`,
      });

      const order = await deltaRestClient.placeOrder(orderParams);
      return {
        text: `Order placed successfully: ${JSON.stringify(order.result)}`,
        success: true,
        data: { order: order.result },
      };
    } catch (error: any) {
      logger.error('Error in placeOrder action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to place your order: ${error.message}`,
      });
      return {
        text: `Failed to place order: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
