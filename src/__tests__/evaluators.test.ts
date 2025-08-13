import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { IAgentRuntime } from '@elizaos/core';
import { executionHealthEvaluator } from '../evaluators/executionHealth';
import { riskWatchdogEvaluator } from '../evaluators/riskWatchdog';
import { createMockRuntime } from './test-utils';

describe('Evaluators', () => {
  let mockRuntime: IAgentRuntime;

  beforeEach(() => {
    mockRuntime = createMockRuntime() as IAgentRuntime;
  });

  afterEach(() => {
    mock.restore();
  });

  it('should execute executionHealthEvaluator', async () => {
    const logger = {
      info: mock(),
    };
    (mockRuntime as any).logger = logger;
    await executionHealthEvaluator.handler(mockRuntime, {} as any);
    expect(logger.info).toHaveBeenCalledWith('Execution health check: All systems normal.');
  });

  it('should execute riskWatchdogEvaluator', async () => {
    const wsService = {
      getLatestPortfolioMargins: mock().mockReturnValue(new Map([['1', { liquidation_risk: true, margin_shortfall: 100 }]])),
    };
    const logger = {
      error: mock(),
    };
    (mockRuntime.getService as any) = mock(() => wsService);
    (mockRuntime as any).logger = logger;
    await riskWatchdogEvaluator.handler(mockRuntime, {} as any);
    expect(wsService.getLatestPortfolioMargins).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('CRITICAL RISK DETECTED: Liquidation Risk: true, Margin Shortfall: 100');
  });
});
