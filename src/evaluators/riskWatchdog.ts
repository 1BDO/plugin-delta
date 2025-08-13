import { Evaluator, IAgentRuntime } from '@elizaos/core';
import { DeltaWebSocketService } from '../services/DeltaWebSocketService';

/**
 * @name RISK_WATCHDOG
 * @description This evaluator acts as a continuous safety monitor for the agent's trading account.
 * It runs after every interaction to check for critical risk conditions provided by the
 * Delta Exchange `portfolio_margins` WebSocket stream.
 *
 * Its primary responsibilities are:
 * - To check for `liquidation_risk`: A flag from the exchange indicating the account is close to liquidation.
 * - To check for `margin_shortfall`: A value indicating how much additional margin is needed to be safe.
 *
 * If either of these conditions is met, it logs a critical error. In a production agent,
 * this evaluator could be extended to trigger emergency actions, such as:
 * - Emitting a custom event (e.g., 'CRITICAL_RISK_DETECTED') that another part of the agent can listen for.
 * - Directly calling a `delta:close-all-positions` or `delta:cancel-all-orders` action.
 * - Sending a notification to a human operator via another plugin (e.g., Telegram or email).
 *
 * This provides a crucial layer of automated safety, helping to prevent catastrophic losses.
 */
export const riskWatchdogEvaluator: Evaluator = {
  name: 'RISK_WATCHDOG',
  description: 'Detects margin deterioration and signals management actions.',
  validate: async () => true,
  handler: async (runtime: IAgentRuntime) => {
    const wsService = runtime.getService<DeltaWebSocketService>('delta-websocket');
    if (!wsService) {
      runtime.logger.warn('Delta WebSocket service not available for Risk Watchdog.');
      return;
    }

    const portfolioMargins = wsService.getLatestPortfolioMargins();
    
    for (const pm of portfolioMargins.values()) {
      if (pm.liquidation_risk === true || pm.margin_shortfall > 0) {
        runtime.logger.error(
          `CRITICAL RISK DETECTED: Liquidation Risk: ${pm.liquidation_risk}, Margin Shortfall: ${pm.margin_shortfall}`
        );
        // In a real agent, you might emit an event here:
        // runtime.emitEvent('CRITICAL_RISK_DETECTED', { marginInfo: pm });
      }
    }
  },
  examples: [],
};
