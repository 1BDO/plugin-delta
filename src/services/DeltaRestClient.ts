// src/services/DeltaRestClient.ts

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { Service, IAgentRuntime } from '@elizaos/core';

export class DeltaRestClient extends Service {
  private httpClient: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  static readonly serviceType: string = 'delta-rest';
  static readonly capabilityDescription: string = 'Delta Exchange REST client for placing orders, fetching products, and ticker information.';

  constructor(runtime?: IAgentRuntime, apiKey?: string, apiSecret?: string, baseUrl?: string) {
    super(runtime);
    this.apiKey = apiKey || '';
    this.apiSecret = apiSecret || '';
    this.baseUrl = baseUrl || 'https://api.delta.exchange';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'elizaos-delta-plugin',
      },
    });
  }

  async start(): Promise<void> {
    // console.log('Delta REST Client started.'); // Removed for production
  }

  async stop(): Promise<void> {
    // console.log('Delta REST Client stopped.'); // Removed for production
  }

  static async stop(_runtime: IAgentRuntime): Promise<void> {
    // console.log('Delta REST Client static stop called.'); // Removed for production
  }

  get capabilityDescription(): string {
    return DeltaRestClient.capabilityDescription;
  }

  static async start(runtime: IAgentRuntime): Promise<DeltaRestClient> {
    const apiKey = await runtime.getSetting('DELTA_API_KEY');
    const apiSecret = await runtime.getSetting('DELTA_API_SECRET');
    const baseUrl = await runtime.getSetting('DELTA_REST_BASE') || 'https://api.delta.exchange';
    const instance = new DeltaRestClient(runtime, apiKey, apiSecret, baseUrl);
    console.log("Delta REST Client started.");
    return instance;
  }

  async getProducts(): Promise<any> {
    try {
      const response = await this.httpClient.get('/v2/products');
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const delay = (retryAfter ? parseInt(retryAfter) : 5) * 1000; // Default to 5 seconds
        console.warn(`Rate limit exceeded. Retrying after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getProducts(); // Retry the request
      }
      throw this.handleError(error);
    }
  }

  async getTickerBySymbol(symbol: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/v2/tickers/${symbol}`);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const delay = (retryAfter ? parseInt(retryAfter) : 5) * 1000; // Default to 5 seconds
        console.warn(`Rate limit exceeded. Retrying after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getTickerBySymbol(symbol); // Retry the request
      }
      throw this.handleError(error);
    }
  }

  async placeOrder(order: any) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('POST', '/v2/orders', '', JSON.stringify(order), timestamp);
      const response = await this.httpClient.post('/v2/orders', order, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        data: order, // Send order details in the request body for DELETE
      });
      return response.data;
    } catch (error: any) {
      // console.error('Error placing order:', error.message);
      throw this.handleError(error);
    }
  }

  async cancelOrder(order: any) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('DELETE', '/v2/orders', '', JSON.stringify(order), timestamp);
      const response = await this.httpClient.delete('/v2/orders', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        data: order, // Send order details in the request body for DELETE
      });
      return response.data;
    } catch (error: any) {
      // console.error('Error cancelling order:', error.message);
      throw this.handleError(error);
    }
  }

  async editOrder(order: any) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('PUT', '/v2/orders', '', JSON.stringify(order), timestamp);
      const response = await this.httpClient.put('/v2/orders', order, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        data: order,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createBatchOrders(orders: any[]) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('POST', '/v2/orders/batch', '', JSON.stringify(orders), timestamp);
      const response = await this.httpClient.post('/v2/orders/batch', orders, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async editBatchOrders(orders: any[]) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('PUT', '/v2/orders/batch', '', JSON.stringify(orders), timestamp);
      const response = await this.httpClient.put('/v2/orders/batch', orders, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deleteBatchOrders(orders: any[]) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('DELETE', '/v2/orders/batch', '', JSON.stringify(orders), timestamp);
      const response = await this.httpClient.delete('/v2/orders/batch', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        data: orders,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async placeBracketOrder(order: any) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('POST', '/v2/orders/bracket', '', JSON.stringify(order), timestamp);
      const response = await this.httpClient.post('/v2/orders/bracket', order, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async editBracketOrder(order: any) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('PUT', '/v2/orders/bracket', '', JSON.stringify(order), timestamp);
      const response = await this.httpClient.put('/v2/orders/bracket', order, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async cancelAllOrders(filters?: { product_id?: string; contract_types?: string[] }) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = filters ? JSON.stringify(filters) : '';
      const signature = this.signRequest('DELETE', '/v2/orders/cancel_all', '', payload, timestamp);
      const response = await this.httpClient.delete('/v2/orders/cancel_all', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        data: filters, // Send filters in the request body for DELETE
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPositions(): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('GET', '/v2/positions', '', '', timestamp);
      const response = await this.httpClient.get('/v2/positions', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async setOrderLeverage(productId: string, leverage: number): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({ product_id: productId, leverage });
      const signature = this.signRequest('POST', '/v2/positions/change_leverage', '', payload, timestamp);
      const response = await this.httpClient.post('/v2/positions/change_leverage', { product_id: productId, leverage }, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getOptionChain(underlyingAsset: string, expiry?: string): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const path = '/v2/tickers';
      let query = `product_type=option&underlying_asset=${underlyingAsset}`;
      if (expiry) {
        query += `&expiry=${expiry}`;
      }
      const signature = this.signRequest('GET', path, query, '', timestamp);
      const response = await this.httpClient.get(`${path}?${query}`, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getBalances(): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('GET', '/v2/wallet/balances', '', '', timestamp);
      const response = await this.httpClient.get('/v2/wallet/balances', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getOrderbook(symbol: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/v2/l2orderbook/${symbol}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getOrderHistory(params: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('GET', '/v2/orders/history', '', '', timestamp);
      const response = await this.httpClient.get('/v2/orders/history', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        params,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserFills(params: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('GET', '/v2/fills', '', '', timestamp);
      const response = await this.httpClient.get('/v2/fills', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        params,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getWalletTransactions(params: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('GET', '/v2/wallet/transactions', '', '', timestamp);
      const response = await this.httpClient.get('/v2/wallet/transactions', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        params,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async closeAllPositions(): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('POST', '/v2/positions/close_all', '', '', timestamp);
      const response = await this.httpClient.post('/v2/positions/close_all', null, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createHeartbeat(heartbeat: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('POST', '/v2/heartbeat/create', '', JSON.stringify(heartbeat), timestamp);
      const response = await this.httpClient.post('/v2/heartbeat/create', heartbeat, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async ackHeartbeat(heartbeat: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('POST', '/v2/heartbeat', '', JSON.stringify(heartbeat), timestamp);
      const response = await this.httpClient.post('/v2/heartbeat', heartbeat, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getHeartbeat(heartbeatId?: string): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('GET', '/v2/heartbeat', '', '', timestamp);
      const response = await this.httpClient.get('/v2/heartbeat', {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
        params: { heartbeat_id: heartbeatId },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateMmp(mmpConfig: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('PUT', '/v2/users/update_mmp', '', JSON.stringify(mmpConfig), timestamp);
      const response = await this.httpClient.put('/v2/users/update_mmp', mmpConfig, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async resetMmp(mmpConfig: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest('PUT', '/v2/users/reset_mmp', '', JSON.stringify(mmpConfig), timestamp);
      const response = await this.httpClient.put('/v2/users/reset_mmp', mmpConfig, {
        headers: {
          'api-key': this.apiKey,
          'signature': signature,
          'timestamp': timestamp,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private signRequest(method: string, path: string, query: string, payload: string, timestamp: number): string {
    const signatureData = method + timestamp + path + query + payload;
    const hmac = crypto.createHmac('sha256', this.apiSecret);
    hmac.update(signatureData);
    return hmac.digest('hex');
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const { response } = error;
      if (response) {
        const { status, data } = response;
        let errorMessage = data?.message || JSON.stringify(data);

        switch (status) {
          case 401:
          case 403:
            // Authentication or authorization errors
            if (errorMessage.includes('signature expired')) return new Error(`Delta API Error: Signature Expired. Please check your system time.`);
            if (errorMessage.includes('Invalid API Key')) return new Error(`Delta API Error: Invalid API Key. Please check your DELTA_API_KEY.`);
            if (errorMessage.includes('IP not whitelisted')) return new Error(`Delta API Error: IP Not Whitelisted. Please configure your IP in Delta Exchange settings.`);
            return new Error(`Delta API Authentication Error: Status ${status}, Message: ${errorMessage}`);
          case 429:
            // Rate limit errors
            const retryAfter = response.headers['retry-after'];
            return new Error(`Delta API Rate Limit Exceeded: Status ${status}, Message: ${errorMessage}. Please retry after ${retryAfter || 'some time'} seconds.`);
          case 400:
          case 404:
          case 405:
          case 406:
          case 409:
          case 412:
          case 422:
            // General request errors, often containing specific API error codes in message
            if (errorMessage.includes('insufficient_margin')) return new Error(`Delta API Order Error: Insufficient Margin. Message: ${errorMessage}`);
            if (errorMessage.includes('order_size_exceed_available')) return new Error(`Delta API Order Error: Order Size Exceeds Available. Message: ${errorMessage}`);
            if (errorMessage.includes('risk_limits_breached')) return new Error(`Delta API Order Error: Risk Limits Breached. Message: ${errorMessage}`);
            if (errorMessage.includes('invalid_contract')) return new Error(`Delta API Order Error: Invalid Contract. Message: ${errorMessage}`);
            if (errorMessage.includes('immediate_liquidation')) return new Error(`Delta API Order Error: Immediate Liquidation. Message: ${errorMessage}`);
            if (errorMessage.includes('out_of_bankruptcy')) return new Error(`Delta API Order Error: Out of Bankruptcy. Message: ${errorMessage}`);
            if (errorMessage.includes('immediate_execution_post_only') || errorMessage.includes('self_matching_disrupted_post_only')) return new Error(`Delta API Order Error: Post Only Violation. Message: ${errorMessage}`);
            return new Error(`Delta API Request Error: Status ${status}, Message: ${errorMessage}`);
          case 500:
            return new Error(`Delta API Server Error: Status ${status}, Message: ${errorMessage}`);
          default:
            return new Error(`Delta API Error: Status ${status}, Message: ${errorMessage}`);
        }
      }  else if (error.request) {
        return new Error(`Delta API No Response: ${error.message}`);
      } else {
        return new Error(`Delta API Request Error: ${error.message}`);
      }
    } else {
      return new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
}
