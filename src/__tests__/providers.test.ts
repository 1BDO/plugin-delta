import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { IAgentRuntime } from '@elizaos/core';
import { marketStateProvider } from '../providers/marketState';
import { accountStateProvider } from '../providers/accountState';
import { riskStateProvider } from '../providers/riskState';
import { marketStatusProvider } from '../providers/marketStatus';
import { createMockRuntime } from './test-utils';

describe('Providers', () => {
  let mockRuntime: IAgentRuntime;

  beforeEach(() => {
    mockRuntime = createMockRuntime() as IAgentRuntime;
  });

  afterEach(() => {
    mock.restore();
  });

  it('should execute marketStateProvider', async () => {
    const wsService = {
      getLatestTickers: mock().mockReturnValue(new Map()),
    };
    (mockRuntime.getService as any) = mock(() => wsService);
    const result = await marketStateProvider.get(mockRuntime, {} as any, {} as any);
    expect(result.text).toBeDefined();
    expect(wsService.getLatestTickers).toHaveBeenCalled();
  });

  it('should execute accountStateProvider', async () => {
    const wsService = {
      getLatestPositions: mock().mockReturnValue(new Map()),
      getLatestOrders: mock().mockReturnValue(new Map()),
      getLatestMargins: mock().mockReturnValue(new Map()),
    };
    (mockRuntime.getService as any) = mock(() => wsService);
    const result = await accountStateProvider.get(mockRuntime, {} as any, {} as any);
    expect(result.text).toBeDefined();
    expect(wsService.getLatestPositions).toHaveBeenCalled();
    expect(wsService.getLatestOrders).toHaveBeenCalled();
    expect(wsService.getLatestMargins).toHaveBeenCalled();
  });

  it('should execute riskStateProvider', async () => {
    const wsService = {
      getLatestPortfolioMargins: mock().mockReturnValue(new Map()),
    };
    (mockRuntime.getService as any) = mock(() => wsService);
    const result = await riskStateProvider.get(mockRuntime, {} as any, {} as any);
    expect(result.text).toBeDefined();
    expect(wsService.getLatestPortfolioMargins).toHaveBeenCalled();
  });

  it('should execute marketStatusProvider', async () => {
    const wsService = {};
    (mockRuntime.getService as any) = mock(() => wsService);
    const result = await marketStatusProvider.get(mockRuntime, {} as any, {} as any);
    expect(result.text).toBeDefined();
  });
});
