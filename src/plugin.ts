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
  name: 'delta-exchange',
  description: 'A plugin for trading on Delta Exchange',
  config: {
    apiKey: process.env.DELTA_API_KEY || '',
    apiSecret: process.env.DELTA_API_SECRET || '',
    baseUrl: process.env.DELTA_BASE_URL || 'https://api.delta.exchange',
    wsUrl: process.env.DELTA_WS_URL || 'wss://socket.delta.exchange',
    sandbox: process.env.DELTA_SANDBOX === 'true',
    maxPositionSize: Number(process.env.DELTA_MAX_POSITION_SIZE) || 0,
    maxOrderSize: Number(process.env.DELTA_MAX_ORDER_SIZE) || 0,
    defaultLeverage: Number(process.env.DELTA_DEFAULT_LEVERAGE) || 0,
    enableRiskChecks: process.env.DELTA_ENABLE_RISK_CHECKS === 'true',
    maxDailyLoss: Number(process.env.DELTA_MAX_DAILY_LOSS) || 0,
    dailyLossLookbackDays: Number(process.env.DELTA_DAILY_LOSS_LOOKBACK_DAYS) || 0,
    wsReconnectInterval: Number(process.env.DELTA_WS_RECONNECT_INTERVAL) || 5000,
    wsMaxReconnectAttempts: Number(process.env.DELTA_WS_MAX_RECONNECT_ATTEMPTS) || 5,
    wsHeartbeatInterval: Number(process.env.DELTA_WS_HEARTBEAT_INTERVAL) || 30000,
    symbols: process.env.DELTA_SYMBOLS ? process.env.DELTA_SYMBOLS.split(',') : [],
  },
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
  async init(config: Record<string, string>, runtime: IAgentRuntime) {
    logger.info('Delta Exchange plugin initialized');
    try {
      const validatedConfig = deltaConfigSchema.parse(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) {
          process.env[key] = String(value);
        }
      }

      // Services are registered automatically via the 'services' array in the plugin definition.
      // No need to manually instantiate and register them here.

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
};

export default starterPlugin;
