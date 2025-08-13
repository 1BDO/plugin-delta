import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { DeltaRestClient } from '../services/DeltaRestClient';
import { IAgentRuntime } from '@elizaos/core';
import { createMockRuntime } from './test-utils';
import axios from 'axios';

describe('DeltaRestClient', () => {
  let deltaRestClient: DeltaRestClient;
  let mockRuntime: IAgentRuntime;
  let mockHttpClient: {
    get: ReturnType<typeof mock>;
    post: ReturnType<typeof mock>;
    put: ReturnType<typeof mock>;
    delete: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    mockRuntime = createMockRuntime() as IAgentRuntime;
    mockHttpClient = {
      get: mock(),
      post: mock(),
      put: mock(),
      delete: mock(),
    };
    (axios as any).create = mock(() => mockHttpClient);
    deltaRestClient = new DeltaRestClient(
      mockRuntime,
      'test-api-key',
      'test-api-secret',
      'https://test-base-url',
    );
  });

  afterEach(() => {
    mock.restore();
  });

  it('should fetch products', async () => {
    const mockProducts = { result: [{ id: '1', symbol: 'BTCUSD' }, { id: '2', symbol: 'ETHUSD' }] };
    mockHttpClient.get.mockResolvedValue({ data: mockProducts });

    const products = await deltaRestClient.getProducts();
    expect(products).toEqual(mockProducts);
    expect(mockHttpClient.get).toHaveBeenCalledWith('/v2/products');
  });

  it('should fetch ticker by symbol', async () => {
    const mockTicker = { symbol: 'BTCUSD', last_price: 30000 };
    mockHttpClient.get.mockResolvedValue({ data: mockTicker });

    const ticker = await deltaRestClient.getTickerBySymbol('BTCUSD');
    expect(ticker).toEqual(mockTicker);
    expect(mockHttpClient.get).toHaveBeenCalledWith('/v2/tickers/BTCUSD');
  });

  it('should place an order', async () => {
    const mockOrder = { id: '123', symbol: 'BTCUSD', side: 'buy', quantity: 1 };
    mockHttpClient.post.mockResolvedValue({ data: mockOrder });

    const order = await deltaRestClient.placeOrder(mockOrder);
    expect(order).toEqual(mockOrder);
    expect(mockHttpClient.post).toHaveBeenCalledWith('/v2/orders', mockOrder, expect.any(Object));
  });

  it('should cancel an order', async () => {
    const mockOrder = { id: '123', symbol: 'BTCUSD', side: 'buy', quantity: 1 };
    mockHttpClient.delete.mockResolvedValue({ data: { message: 'Order cancelled' } });

    const result = await deltaRestClient.cancelOrder(mockOrder);
    expect(result).toEqual({ message: 'Order cancelled' });
    expect(mockHttpClient.delete).toHaveBeenCalledWith('/v2/orders', expect.any(Object));
  });

  it('should get option chain', async () => {
    const mockOptionChain = { result: [{ id: '1', symbol: 'BTC-29DEC23-30000-C' }, { id: '2', symbol: 'BTC-29DEC23-30000-P' }] };
    mockHttpClient.get.mockResolvedValue({ data: mockOptionChain });

    const optionChain = await deltaRestClient.getOptionChain('BTC');
    expect(optionChain).toEqual(mockOptionChain);
    expect(mockHttpClient.get).toHaveBeenCalledWith('/v2/tickers?product_type=option&underlying_asset=BTC', expect.any(Object));
  });

  it('should handle API errors', async () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Invalid API Key' },
      },
    };
    mockHttpClient.get.mockRejectedValue(error);

    await expect(deltaRestClient.getProducts()).rejects.toThrow('Delta API Error: Invalid API Key. Please check your DELTA_API_KEY.');
  });

  it('should generate a valid signature', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = (deltaRestClient as any).signRequest('GET', '/v2/products', '', '', timestamp);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
  });
});
