import type { Plugin, IAgentRuntime } from '@elizaos/core';
import {
  type Action,
  type ActionResult,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  logger,
  type MessagePayload,
  type WorldPayload,
  EventType,
} from '@elizaos/core';
import { z } from 'zod';
import { DeltaWebSocketService } from './services/DeltaWebSocketService';
import { DeltaRestClient } from './services/DeltaRestClient';
import { getProductsAction, getTickerAction, placeOrderAction, cancelOrderAction, getOptionChainAction, getPositionsAction, cancelAllOrdersAction, setOrderLeverageAction, getOrderbookAction, getMarginsAction, editOrderAction, closeAllAction, createDeadmanAction, ackDeadmanAction, getDeadmanStatusAction, updateMmpAction, resetMmpAction } from './actions/index';
import { positionsProvider, balancesProvider, marketStateProvider, accountStateProvider, marketDataProvider, riskStateProvider, marketStatusProvider } from './providers/index';
import { executionHealthEvaluator, riskWatchdogEvaluator } from './evaluators/index';
import { DeltaConfig, deltaConfigSchema } from './config/schema';

export const starterPlugin: Plugin = {
  name: 'plugin-delta',
  description: 'A plugin for trading on Delta Exchange',
  config: {},
  dependencies: [],
  services: [DeltaWebSocketService, DeltaRestClient],
  actions: [
    getProductsAction,
    getTickerAction,
    placeOrderAction,
    cancelOrderAction,
    getOptionChainAction,
    getPositionsAction,
    cancelAllOrdersAction,
    setOrderLeverageAction,
    getOrderbookAction,
    getMarginsAction,
    editOrderAction,
    closeAllAction,
    createDeadmanAction,
    ackDeadmanAction,
    getDeadmanStatusAction,
    updateMmpAction,
    resetMmpAction
  ],
  providers: [
    marketStateProvider,
    positionsProvider,
    balancesProvider,
    accountStateProvider,
    marketDataProvider,
    riskStateProvider,
    marketStatusProvider
  ],
  evaluators: [
    executionHealthEvaluator,
    riskWatchdogEvaluator
  ],
  events: {
    [EventType.MESSAGE_RECEIVED]: [
      async (payload: MessagePayload) => {
        // Example event handler for incoming messages
        logger.info(`Received message: ${payload.message.content.text}`);
      },
    ],
  },
  routes: [],
  tests: [],
  async init(config: Record<string, any>, runtime: IAgentRuntime) {
    logger.info('Initializing Delta Exchange plugin...');
    
    // Combine environment variables with the config from the character file
    const combinedConfig = {
      apiKey: process.env.DELTA_API_KEY,
      apiSecret: process.env.DELTA_API_SECRET,
      baseUrl: process.env.DELTA_BASE_URL,
      wsUrl: process.env.DELTA_WS_URL,
      ...config,
    };

    try {
      const validatedConfig = deltaConfigSchema.parse(combinedConfig);
      
      // Apply the validated config to the runtime settings
      for (const [key, value] of Object.entries(validatedConfig)) {
        runtime.setSetting(key, value, false);  // Remove .toUpperCase()
      }
      
      logger.info('Delta Exchange plugin initialized successfully.');

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Invalid Delta Exchange plugin configuration: ${errorMessages}`);
      }
      throw error;
    }
  },
};

export default starterPlugin;
