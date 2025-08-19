import { Service, IAgentRuntime, logger } from '@elizaos/core';

/**
 * @class DeltaWebSocketService
 * @description Delta Exchange WebSocket service for real-time market data, positions, orders, and portfolio margins.
 *
 * @example
 * // Subscribe to ticker data for BTCUSD
 * deltaWebSocketService.subscribeTicker(['BTCUSD']);
 *
 * @example
 * // Handle ticker data
 * deltaWebSocketService.onTicker((data) => {
 *   console.log('Ticker data:', data);
 * });
 */
import { DeltaConfig, deltaConfigSchema } from '../config/schema';
import {
  DeltaWebSocketMessage,
  DeltaWebSocketTicker,
  DeltaWebSocketOrderbook,
  DeltaWebSocketPosition,
  DeltaWebSocketOrder,
} from '../types/delta.types';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// Use Node.js built-in WebSocket or handle browser compatibility
let WebSocket: any;
if (typeof window === 'undefined') {
  // Node.js environment
  WebSocket = require('ws');
} else {
  // Browser environment
  WebSocket = window.WebSocket;
}

export interface WebSocketSubscription {
  channel: string;
  symbols?: string[];
}

export class DeltaWebSocketService extends Service {
  private ws: any = null;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private idleTimeout: NodeJS.Timeout | null = null;
  private idleTimeoutInterval = 60000; // Default to 60 seconds
  private subscriptions = new Set<string>();
  private messageEmitter = new EventEmitter();
  private isConnected = false;

  private apiKey: string;
  private apiSecret: string;
  private wsUrl: string;

  // Local caches
  private tickersCache: Map<string, any> = new Map();
  private orderbookCache: Map<string, any> = new Map();
  private positionsCache: Map<string, any> = new Map();
  private ordersCache: Map<string, any> = new Map();
  private marginsCache: Map<string, any> = new Map();
  private portfolioMarginsCache: Map<string, any> = new Map();

  constructor(runtime?: IAgentRuntime, wsUrl?: string, apiKey?: string, apiSecret?: string) {
    super(runtime);
    this.wsUrl = wsUrl || 'wss://socket.india.delta.exchange';
    this.apiKey = apiKey || '';
    this.apiSecret = apiSecret || '';
  }

  static readonly serviceType: string = 'delta-websocket';
  static readonly capabilityDescription: string = 'Delta Exchange WebSocket service for real-time market data, positions, orders, and portfolio margins';

  getType(): string {
    return DeltaWebSocketService.serviceType;
  }

  get capabilityDescription(): string {
    return DeltaWebSocketService.capabilityDescription;
  }

  async start(): Promise<void> {
    this.connect();
  }

  async stop(): Promise<void> {
    this.disconnect();
  }

  static async stop(_runtime: IAgentRuntime): Promise<void> {
    // console.log('Delta WebSocket Service static stop called.'); // Removed for production
  }

  static async start(runtime: IAgentRuntime): Promise<DeltaWebSocketService> {
    const wsUrl = runtime.getSetting('wsUrl') as string;  // Change from 'WSURL'
    const apiKey = runtime.getSetting('apiKey') as string;
    const apiSecret = runtime.getSetting('apiSecret') as string;  // Change from 'APISECRET'

    const instance = new DeltaWebSocketService(runtime, wsUrl, apiKey, apiSecret);
    console.log("Delta WebSocket Client started.");
    return instance;
  }

  connect(): void {
    // const wsUrl = process.env.DELTA_WS_URL || 'wss://socket.delta.exchange'; // Replaced by runtime settings

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('Delta WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.authenticateAndSubscribe(); // New method for auth and initial subscriptions
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: any) => {
      const message: DeltaWebSocketMessage = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error: any) => {
      console.error('Delta WebSocket error:', error);
      this.isConnected = false;
      this.reconnect();
    };

    this.ws.onclose = () => {
      console.log('Delta WebSocket disconnected');
      this.isConnected = false;
      this.stopHeartbeat();
      this.reconnect();
    };
  }

  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.stopHeartbeat();
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    }
  }

  private reconnect(): void {
    // const wsReconnectInterval = Number(process.env.DELTA_WS_RECONNECT_INTERVAL) || 5000; // Replaced by runtime settings
    // const wsMaxReconnectAttempts = Number(process.env.DELTA_WS_MAX_RECONNECT_ATTEMPTS) || 5; // Replaced by runtime settings
    const wsReconnectInterval = 5000; // Default to 5 seconds
    const wsMaxReconnectAttempts = 5; // Default to 5 attempts

    if (this.reconnectAttempts >= wsMaxReconnectAttempts) {
      console.warn('Max reconnect attempts reached. Stopping reconnection.');
      return;
    }

    if (this.reconnectTimeout) return; // Prevent multiple reconnects

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect in ${wsReconnectInterval}ms (attempt ${this.reconnectAttempts}/${wsMaxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, wsReconnectInterval);
  }

  private startHeartbeat(): void {
    // const wsHeartbeatInterval = Number(process.env.DELTA_WS_HEARTBEAT_INTERVAL) || 30000; // Replaced by runtime settings
    const wsHeartbeatInterval = 30000; // Default to 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, wsHeartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(message: DeltaWebSocketMessage): void {
    this.messageEmitter.emit(message.type, message);
    switch (message.type) {
      case 'ticker':
        this.tickersCache.set(message.symbol, message);
        break;
      case 'l2_orderbook':
        this.orderbookCache.set(message.symbol, message);
        break;
      case 'l2_updates':
        this.updateOrderbookCache(message);
        break;
      case 'candlesticks':
        break;
      case 'mark_price':
        this.tickersCache.set(message.symbol, { ...this.tickersCache.get(message.symbol), mark_price: message.mark_price });
        break;
      case 'spot_price':
      case 'v2/spot_price':
        this.tickersCache.set(message.symbol, { ...this.tickersCache.get(message.symbol), spot_price: message.spot_price });
        break;
      case 'spot_30mtwap_price':
        break;
      case 'funding_rate':
        break;
      case 'product_updates':
        break;
      case 'announcements':
        break;
      case 'positions':
        this.positionsCache.set(message.position_id, message);
        break;
      case 'orders':
        this.ordersCache.set(message.client_order_id || message.order_id, message);
        break;
      case 'margins':
        this.marginsCache.set(message.account_id, message);
        break;
      case 'v2/user_trades':
        break;
      case 'portfolio_margins':
        this.portfolioMarginsCache.set(message.account_id, message);
        break;
      case 'mmp_trigger':
        break;
      case 'auth_ack':
        // Handle authentication acknowledgment
        if (message.success) {
          console.log('WebSocket authentication successful.', message);
          this.subscribeToPrivateChannels();
        } else {
          console.error('WebSocket authentication failed:', message);
          logger.error('WebSocket authentication failed:', message);
          this.disconnect();
        }
        break;
      case 'error':
        console.error('WebSocket error message:', message);
        this.messageEmitter.emit('error', new Error(message.payload?.message || 'Unknown WebSocket error'));
        break;
      default:
        console.log('Unhandled message type:', message.type, message);
    }
  }

  private async authenticateAndSubscribe(): Promise<void> {
    if (this.apiKey && this.apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signaturePayload = `GET/realtime${timestamp}`;
      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(signaturePayload)
        .digest('hex');

      const authMessage = {
        type: 'auth',
        payload: {
          'api-key': this.apiKey,
          signature: signature,
          timestamp: timestamp,
        },
      };
      this.ws.send(JSON.stringify(authMessage));
    } else {
      console.warn(
        'API Key or Secret not provided. Cannot authenticate WebSocket for private channels.'
      );
    }
    this.subscribeToInitialChannels(); // Always subscribe to initial channels after (attempted) auth
  }

  private sendSubscription(channel: string, symbols: string[] = ['all']): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'subscribe',
        payload: {
          channels: [
            {
              name: channel,
              symbols: symbols,
            },
          ],
        },
      };
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn(`Cannot subscribe to ${channel}. WebSocket is not open.`);
    }
  }

  private sendUnsubscription(channel: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'unsubscribe',
        payload: {
          channels: [
            {
              name: channel,
            },
          ],
        },
      };
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn(`Cannot unsubscribe from ${channel}. WebSocket is not open.`);
    }
  }

  private subscribeToInitialChannels(): void {
    // Subscribe to public channels on initial connection
    this.subscribeTicker(['all']);
    this.subscribeOrderbook(['all']);
  }

  private subscribeToPrivateChannels(): void {
    // Subscribe to private channels after successful authentication
    this.subscribePositions();
    this.subscribeOrders();
    this.subscribePortfolioMargins();
  }

  subscribeTicker(symbols: string[] = ['all']): void {
    const subscription = 'v2/ticker';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeTicker(): void {
    const subscription = 'v2/ticker';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeOrderbook(symbols: string[] = ['all']): void {
    const subscription = 'l2_orderbook';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeOrderbook(): void {
    const subscription = 'l2_orderbook';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribePositions(): void {
    const subscription = 'positions';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribePositions(): void {
    const subscription = 'positions';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeOrders(): void {
    const subscription = 'orders';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribeOrders(): void {
    const subscription = 'orders';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribePortfolioMargins(): void {
    const subscription = 'portfolio_margins';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribePortfolioMargins(): void {
    const subscription = 'portfolio_margins';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  // Event listeners
  onTicker(callback: (data: DeltaWebSocketTicker) => void): () => void {
    this.messageEmitter.on('ticker', callback);
    return () => this.messageEmitter.off('ticker', callback);
  }

  onOrderbook(callback: (data: DeltaWebSocketOrderbook) => void): () => void {
    this.messageEmitter.on('orderbook', callback);
    return () => this.messageEmitter.off('orderbook', callback);
  }

  onPosition(callback: (data: DeltaWebSocketPosition) => void): () => void {
    this.messageEmitter.on('position', callback);
    return () => this.messageEmitter.off('position', callback);
  }

  onOrder(callback: (data: DeltaWebSocketOrder) => void): () => void {
    this.messageEmitter.on('order', callback);
    return () => this.messageEmitter.off('order', callback);
  }

  onPortfolioMargin(callback: (data: any) => void): () => void {
    this.messageEmitter.on('portfolio_margin', callback);
    return () => this.messageEmitter.off('portfolio_margin', callback);
  }

  // Utility methods
  isReady(): boolean {
    return this.isConnected;
  }

  getConnectionStatus(): string {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  // New public methods for subscribing to various channels
  subscribeL2Updates(symbols: string[] = ['all']): void {
    const subscription = 'l2_updates';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeL2Updates(): void {
    const subscription = 'l2_updates';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeCandlesticks(symbols: string[] = ['all'], interval: string = '1m'): void {
    const subscription = `candlesticks_${interval}`;
    this.subscriptions.add(subscription);
    this.sendSubscription('candlesticks', symbols.map(s => `${s}_${interval}`));
  }

  unsubscribeCandlesticks(interval: string = '1m'): void {
    const subscription = `candlesticks_${interval}`;
    this.subscriptions.delete(subscription);
    this.sendUnsubscription('candlesticks');
  }

  subscribeMarkPrice(symbols: string[] = ['all']): void {
    const subscription = 'mark_price';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeMarkPrice(): void {
    const subscription = 'mark_price';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeSpotPrice(symbols: string[] = ['all']): void {
    const subscription = 'spot_price';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeSpotPrice(): void {
    const subscription = 'spot_price';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeV2SpotPrice(symbols: string[] = ['all']): void {
    const subscription = 'v2/spot_price';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeV2SpotPrice(): void {
    const subscription = 'v2/spot_price';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeSpot30mTWAPPrice(symbols: string[] = ['all']): void {
    const subscription = 'spot_30mtwap_price';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeSpot30mTWAPPrice(): void {
    const subscription = 'spot_30mtwap_price';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeFundingRate(symbols: string[] = ['all']): void {
    const subscription = 'funding_rate';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription, symbols);
  }

  unsubscribeFundingRate(): void {
    const subscription = 'funding_rate';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeProductUpdates(): void {
    const subscription = 'product_updates';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribeProductUpdates(): void {
    const subscription = 'product_updates';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeAnnouncements(): void {
    const subscription = 'announcements';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribeAnnouncements(): void {
    const subscription = 'announcements';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeMargins(): void {
    const subscription = 'margins';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribeMargins(): void {
    const subscription = 'margins';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeUserTrades(): void {
    const subscription = 'v2/user_trades';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribeUserTrades(): void {
    const subscription = 'v2/user_trades';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  subscribeMMPTrigger(): void {
    const subscription = 'mmp_trigger';
    this.subscriptions.add(subscription);
    this.sendSubscription(subscription);
  }

  unsubscribeMMPTrigger(): void {
    const subscription = 'mmp_trigger';
    this.subscriptions.delete(subscription);
    this.sendUnsubscription(subscription);
  }

  // New methods for retrieving cached data
  getLatestTickers(): Map<string, any> {
    return this.tickersCache;
  }

  getLatestOrderbook(symbol: string): any {
    return this.orderbookCache.get(symbol);
  }

  getLatestPositions(): Map<string, any> {
    return this.positionsCache;
  }

  getLatestOrders(): Map<string, any> {
    return this.ordersCache;
  }

  getLatestMargins(): Map<string, any> {
    return this.marginsCache;
  }

  getLatestPortfolioMargins(): Map<string, any> {
    return this.portfolioMarginsCache;
  }

  onCandlesticks(callback: (data: any) => void): () => void {
    this.messageEmitter.on('candlesticks', callback);
    return () => this.messageEmitter.off('candlesticks', callback);
  }

  onMarkPrice(callback: (data: any) => void): () => void {
    this.messageEmitter.on('mark_price', callback);
    return () => this.messageEmitter.off('mark_price', callback);
  }

  onSpotPrice(callback: (data: any) => void): () => void {
    this.messageEmitter.on('spot_price', callback);
    return () => this.messageEmitter.off('spot_price', callback);
  }

  onV2SpotPrice(callback: (data: any) => void): () => void {
    this.messageEmitter.on('v2/spot_price', callback);
    return () => this.messageEmitter.off('v2/spot_price', callback);
  }

  onSpot30mTWAPPrice(callback: (data: any) => void): () => void {
    this.messageEmitter.on('spot_30mtwap_price', callback);
    return () => this.messageEmitter.off('spot_30mtwap_price', callback);
  }

  onFundingRate(callback: (data: any) => void): () => void {
    this.messageEmitter.on('funding_rate', callback);
    return () => this.messageEmitter.off('funding_rate', callback);
  }

  onProductUpdates(callback: (data: any) => void): () => void {
    this.messageEmitter.on('product_updates', callback);
    return () => this.messageEmitter.off('product_updates', callback);
  }

  onAnnouncements(callback: (data: any) => void): () => void {
    this.messageEmitter.on('announcements', callback);
    return () => this.messageEmitter.off('announcements', callback);
  }

  onMargin(callback: (data: any) => void): () => void {
    this.messageEmitter.on('margin', callback);
    return () => this.messageEmitter.off('margin', callback);
  }

  onUserTrade(callback: (data: any) => void): () => void {
    this.messageEmitter.on('user_trade', callback);
    return () => this.messageEmitter.off('user_trade', callback);
  }

  onMMPTrigger(callback: (data: any) => void): () => void {
    this.messageEmitter.on('mmp_trigger', callback);
    return () => this.messageEmitter.off('mmp_trigger', callback);
  }

  onL2Updates(callback: (data: any) => void): () => void {
    this.messageEmitter.on('l2_updates', callback);
    return () => this.messageEmitter.off('l2_updates', callback);
  }

  onError(callback: (error: Error) => void): () => void {
    this.messageEmitter.on('error', callback);
    return () => this.messageEmitter.off('error', callback);
  }

  private updateOrderbookCache(message: any): void {
    const { symbol, asks, bids, action, cs } = message;
    if (action === 'snapshot') {
      this.orderbookCache.set(symbol, { asks, bids });
    } else if (action === 'update') {
      const orderbook = this.orderbookCache.get(symbol);
      if (orderbook) {
        this.applyOrderbookUpdate(orderbook.asks, asks);
        this.applyOrderbookUpdate(orderbook.bids, bids);
        if (cs && !this.verifyChecksum(orderbook, cs)) {
          console.error(`Checksum failed for ${symbol}. Resubscribing...`);
          this.sendUnsubscription(`l2_updates`);
          this.sendSubscription(`l2_updates`, [symbol]);
        }
      }
    }
  }

  private applyOrderbookUpdate(currentLevels: any[], newLevels: any[]): void {
    newLevels.forEach(([price, size]) => {
      const index = currentLevels.findIndex((level) => level[0] === price);
      if (size === '0') {
        if (index !== -1) {
          currentLevels.splice(index, 1);
        }
      } else {
        if (index !== -1) {
          currentLevels[index][1] = size;
        } else {
          currentLevels.push([price, size]);
        }
      }
    });
    currentLevels.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
  }

  private verifyChecksum(orderbook: any, checksum: number): boolean {
    const { asks, bids } = orderbook;
    const asksStr = asks.slice(0, 10).map((l: any) => l.join(':')).join(':');
    const bidsStr = bids.slice(0, 10).map((l: any) => l.join(':')).join(':');
    const checksumStr = `${asksStr}:${bidsStr}`;
    const calculatedChecksum = this.crc32(checksumStr);
    return calculatedChecksum === checksum;
  }

  private crc32(str: string): number {
    const crcTable = this.makeCRCTable();
    let crc = 0 ^ -1;
    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  private makeCRCTable(): number[] {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
    return crcTable;
  }
}
