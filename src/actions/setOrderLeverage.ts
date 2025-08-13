import { Action, IAgentRuntime, ActionResult, logger } from '@elizaos/core';
import { DeltaRestClient } from '../services/DeltaRestClient';
import { findInstrumentInText } from '../utils/instrument-parser';

export const setOrderLeverageAction: Action = {
  name: 'set-order-leverage',
  description: 'Sets the leverage for a specific product on Delta Exchange.',
  similes: ['set leverage', 'change leverage', 'adjust leverage'],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'Set leverage for BTCUSD to 10' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Setting leverage for BTCUSD to 10.',
          actions: ['set-order-leverage'],
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'change leverage on ETHUSD to 25x' },
      },
      {
        name: 'assistant',
        content: {
          text: 'Adjusting leverage for ETHUSD to 25.',
          actions: ['set-order-leverage'],
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

      const text = message.content.text.toLowerCase();
      const symbol = findInstrumentInText(text);
      const leverage = text.split(' ').find((p: string) => !isNaN(Number(p.replace('x', ''))));

      if (!symbol || !leverage) {
        throw new Error('Could not parse symbol and leverage from message.');
      }

      const products = await deltaRestClient.getProducts();
      const product = products.result.find((p: any) => p.symbol.toLowerCase() === symbol.toLowerCase());

      if (!product) {
        throw new Error(`Product ${symbol} not found.`);
      }

      await callback?.({
        text: `Understood. Setting leverage for ${product.symbol} to ${leverage}...`,
      });

      const leverageValue = Number(leverage.replace('x', ''));
      const result = await deltaRestClient.setOrderLeverage(product.id, leverageValue);
      return {
        text: `Set leverage for product ${product.symbol} to ${leverageValue}`,
        success: true,
        data: { result },
      };
    } catch (error: any) {
      logger.error('Error in setOrderLeverage action:', error.message);
      await callback?.({
        text: `I'm sorry, there was an error trying to set the leverage: ${error.message}`,
      });
      return {
        text: `Failed to set leverage: ${error.message}`,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};
