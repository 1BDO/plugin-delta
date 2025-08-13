import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { IAgentRuntime } from '@elizaos/core';
import { getProductsAction } from '../actions/getProducts';
import { getTickerAction } from '../actions/getTicker';
import { placeOrderAction } from '../actions/placeOrder';
import { cancelOrderAction } from '../actions/cancelOrder';
import { getOptionChainAction } from '../actions/getOptionChain';
import { cancelAllOrdersAction } from '../actions/cancelAllOrders';
import { setOrderLeverageAction } from '../actions/setOrderLeverage';
import { getOrderbookAction } from '../actions/getOrderbook';
import { getMarginsAction } from '../actions/getMargins';
import { editOrderAction } from '../actions/editOrder';
import { closeAllAction } from '../actions/closeAll';
import { createDeadmanAction } from '../actions/createDeadman';
import { ackDeadmanAction } from '../actions/ackDeadman';
import { getDeadmanStatusAction } from '../actions/getDeadmanStatus';
import { updateMmpAction } from '../actions/updateMmp';
import { resetMmpAction } from '../actions/resetMmp';
import { createMockRuntime } from './test-utils';
const runtime = createMockRuntime() as IAgentRuntime; // <- cast here


describe('Actions', () => {
  let mockRuntime: IAgentRuntime;

  beforeEach(() => {
    mockRuntime = createMockRuntime() as IAgentRuntime;
  });

  afterEach(() => {
    mock.restore();
  });

  it('should execute getProductsAction', async () => {
    const client = {
      getProducts: mock().mockResolvedValue({ result: [] }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await getProductsAction.handler(mockRuntime, {} as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.getProducts).toHaveBeenCalled();
  });

  it('should execute getTickerAction', async () => {
    const client = {
      getTickerBySymbol: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await getTickerAction.handler(mockRuntime, { content: { text: 'get ticker BTCUSD' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.getTickerBySymbol).toHaveBeenCalledWith('BTCUSD');
  });

  it('should execute placeOrderAction', async () => {
    const placeOrderMock = mock(async (o: any) => ({ result: { id: '123', ...o } }));
    const client = { placeOrder: placeOrderMock };
    (runtime.getService as any) = mock(() => client);
  
    const callback = mock(async () => []);
    const result = await placeOrderAction.handler(
      runtime as IAgentRuntime,
      { content: { text: 'buy 1 BTCUSD at 50000' } } as any,
      {} as any,
      {} as any,
      callback
    );
  
    expect(result?.success).toBe(true);
    expect(placeOrderMock).toHaveBeenCalledWith({
      side: 'buy',
      size: 1,
      product_symbol: 'BTCUSD',
      order_type: 'limit_order',
      limit_price: 50000,
    });
  });

  it('should execute cancelOrderAction', async () => {
    const client = {
      cancelOrder: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await cancelOrderAction.handler(mockRuntime, { content: { text: 'cancel order 12345' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.cancelOrder).toHaveBeenCalledWith({ id: '12345' });
  });

  it('should execute getOptionChainAction', async () => {
    const client = {
      getOptionChain: mock().mockResolvedValue({ result: [] }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await getOptionChainAction.handler(mockRuntime, { content: { text: 'get option chain for BTC' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.getOptionChain).toHaveBeenCalledWith('BTC', undefined);
  });

  it('should execute cancelAllOrdersAction', async () => {
    const cancelAllOrdersMock = mock(async () => ({ result: {} }));
    const client = {
      getProducts: mock().mockResolvedValue({ result: [{ id: '1', symbol: 'BTCUSD' }] }),
      cancelAllOrders: cancelAllOrdersMock,
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await cancelAllOrdersAction.handler(mockRuntime, { content: { text: 'cancel all orders for BTCUSD' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(cancelAllOrdersMock).toHaveBeenCalledWith({ product_id: '1' });
  });

  it('should execute setOrderLeverageAction', async () => {
    const setOrderLeverageMock = mock(async () => ({ result: {} }));
    const client = {
      getProducts: mock().mockResolvedValue({ result: [{ id: '1', symbol: 'BTCUSD' }] }),
      setOrderLeverage: setOrderLeverageMock,
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await setOrderLeverageAction.handler(mockRuntime, { content: { text: 'set leverage for BTCUSD to 10' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(setOrderLeverageMock).toHaveBeenCalledWith('1', 10);
  });

  it('should execute getOrderbookAction', async () => {
    const client = {
      getOrderbook: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await getOrderbookAction.handler(mockRuntime, { content: { text: 'get orderbook for BTCUSD' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.getOrderbook).toHaveBeenCalledWith('BTCUSD');
  });

  it('should execute getMarginsAction', async () => {
    const client = {
      getBalances: mock().mockResolvedValue({ result: [] }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await getMarginsAction.handler(mockRuntime, {} as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.getBalances).toHaveBeenCalled();
  });

  it('should execute editOrderAction', async () => {
    const client = {
      editOrder: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await editOrderAction.handler(mockRuntime, { content: { text: 'edit order 12345 to size 10' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.editOrder).toHaveBeenCalledWith({ id: '12345', size: 10 });
  });

  it('should execute closeAllAction', async () => {
    const client = {
      closeAllPositions: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await closeAllAction.handler(mockRuntime, {} as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.closeAllPositions).toHaveBeenCalled();
  });

  it('should execute createDeadmanAction', async () => {
    const client = {
      createHeartbeat: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await createDeadmanAction.handler(mockRuntime, { content: { text: 'create deadman my-heartbeat-id' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.createHeartbeat).toHaveBeenCalledWith({ heartbeat_id: 'my-heartbeat-id' });
  });

  it('should execute ackDeadmanAction', async () => {
    const client = {
      ackHeartbeat: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await ackDeadmanAction.handler(mockRuntime, { content: { text: 'ack deadman my-heartbeat-id' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.ackHeartbeat).toHaveBeenCalledWith({ heartbeat_id: 'my-heartbeat-id' });
  });

  it('should execute getDeadmanStatusAction', async () => {
    const client = {
      getHeartbeat: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await getDeadmanStatusAction.handler(mockRuntime, { content: { text: 'get deadman status my-heartbeat-id' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.getHeartbeat).toHaveBeenCalledWith('my-heartbeat-id');
  });

  it('should execute updateMmpAction', async () => {
    const client = {
      updateMmp: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const mmpConfig = { asset: 'BTC', trade_limit: 1000 };
    const result = await updateMmpAction.handler(mockRuntime, { content: { text: JSON.stringify(mmpConfig) } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.updateMmp).toHaveBeenCalledWith(mmpConfig);
  });

  it('should execute resetMmpAction', async () => {
    const client = {
      resetMmp: mock().mockResolvedValue({ result: {} }),
    };
    (mockRuntime.getService as any) = mock(() => client);
    const callback = mock(async () => []);
    const result = await resetMmpAction.handler(mockRuntime, { content: { text: 'reset mmp for BTC' } } as any, {} as any, {} as any, callback);
    if (result) {
      expect(result.success).toBe(true);
    }
    expect(client.resetMmp).toHaveBeenCalledWith({ asset: 'BTC' });
  });
});
