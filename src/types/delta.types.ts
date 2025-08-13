/**
 * Delta Exchange API Type Definitions
 * Based on Delta Exchange REST v2 and WebSocket v2 APIs
 */

// Base types
export type DeltaSymbol = string;
export type DeltaProductId = number;
export type DeltaOrderId = string;
export type DeltaTimestamp = string; // ISO 8601 format

// Product types
export enum DeltaProductType {
  FUTURES = 'futures',
  PERPETUALS = 'perpetual_futures',
  OPTIONS = 'call_options',
  PUT_OPTIONS = 'put_options'
}

export enum DeltaSettlementType {
  CASH = 'cash',
  PHYSICAL = 'physical'
}

// Product interface
export interface DeltaProduct {
  id: DeltaProductId;
  symbol: DeltaSymbol;
  description: string;
  created_at: DeltaTimestamp;
  updated_at: DeltaTimestamp;
  settlement_time: DeltaTimestamp;
  notional_type: string;
  impact_size: number;
  initial_margin: number;
  maintenance_margin: number;
  contract_value: number;
  contract_unit_currency: string;
  tick_size: number;
  maker_commission: number;
  taker_commission: number;
  settlement_fee: number;
  base_asset: {
    id: number;
    symbol: string;
    precision: number;
  };
  quote_asset: {
    id: number;
    symbol: string;
    precision: number;
  };
  option_details?: {
    option_type: 'call' | 'put';
    strike_price: number;
    expiry: DeltaTimestamp;
    greeks: {
      delta: number;
      gamma: number;
      theta: number;
      vega: number;
      rho: number;
    };
    iv: number;
    underlying_symbol: string;
  };
}

// Ticker data
export interface DeltaTicker {
  close: number;
  contract_type: string;
  greeks: {
    delta: number;
    gamma: number;
    rho: number;
    theta: number;
    vega: number;
  };
  high: number;
  low: number;
  mark_price: number;
  mark_vol: number;
  oi: number;
  oi_change_usd_6h: number;
  oi_contracts: number;
  oi_value_symbol: string;
  oi_value_usd: number;
  open: number;
  price_band: {
    lower_limit: number;
    upper_limit: number;
  };
  product_id: DeltaProductId;
  product_symbol: DeltaSymbol;
  size: number;
  spot_price: number;
  strike_price: number;
  turnover: number;
  turnover_symbol: string;
  turnover_usd: number;
  volume: number;
}

// Orderbook levels
export interface DeltaOrderbookLevel {
  price: number;
  size: number;
}

export interface DeltaOrderbook {
  buy: DeltaOrderbookLevel[];
  sell: DeltaOrderbookLevel[];
  symbol: DeltaSymbol;
  timestamp: DeltaTimestamp;
}

// Order types
export enum DeltaOrderType {
  LIMIT = 'limit_order',
  MARKET = 'market_order',
  STOP_MARKET = 'stop_market_order',
  STOP_LIMIT = 'stop_limit_order',
  BRACKET_ORDER = 'bracket_order',
  OCO = 'oco_order'
}

export enum DeltaOrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

export enum DeltaTimeInForce {
  GTC = 'gtc',
  IOC = 'ioc',
  FOK = 'fok'
}

export enum DeltaOrderStatus {
  OPEN = 'open',
  CANCELLED = 'cancelled',
  FILLED = 'filled',
  PARTIAL_FILL = 'partial_fill'
}

// Order interface
export interface DeltaOrder {
  id: DeltaOrderId;
  product_id: DeltaProductId;
  product_symbol: DeltaSymbol;
  side: DeltaOrderSide;
  size: number;
  price?: number;
  stop_price?: number;
  limit_price?: number;
  order_type: DeltaOrderType;
  state: DeltaOrderStatus;
  created_at: DeltaTimestamp;
  updated_at: DeltaTimestamp;
  user_id: number;
  stop_trigger_method?: string;
  bracket_order?: {
    stop_loss_price?: number;
    stop_loss_trigger_method?: string;
    take_profit_price?: number;
    take_profit_trigger_method?: string;
  };
  oco_order?: {
    stop_loss_price?: number;
    stop_loss_trigger_method?: string;
    take_profit_price?: number;
    take_profit_trigger_method?: string;
  };
}

// Position interface
export interface DeltaPosition {
  entry_price: number;
  size: number;
  product_id: DeltaProductId;
  product_symbol: DeltaSymbol;
  realized_pnl: number;
  unrealized_pnl: number;
  unrealized_pnl_percentage: number;
  created_at: DeltaTimestamp;
  updated_at: DeltaTimestamp;
  margin: number;
  liquidation_price?: number;
  mark_price: number;
  user_id: number;
}

// Wallet balance
export interface DeltaWalletBalance {
  balance: number;
  order_margin: number;
  position_margin: number;
  available_balance: number;
  asset: {
    id: number;
    symbol: string;
    precision: number;
  };
  user_id: number;
}

// Portfolio margin
export interface DeltaPortfolioMargin {
  portfolio_margin: number;
  portfolio_margin_with_orders: number;
  maintenance_margin: number;
  initial_margin: number;
  available_margin: number;
  used_margin: number;
  margin_utilization: number;
  margin_utilization_percentage: number;
  total_collateral: number;
  total_notional: number;
  total_notional_btc: number;
  total_notional_usd: number;
  user_id: number;
}

// WebSocket message types
export interface DeltaWebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface DeltaWebSocketTicker extends DeltaWebSocketMessage {
  type: 'ticker';
  symbol: DeltaSymbol;
  price: number;
  mark_price: number;
  mark_vol: number;
  size: number;
  timestamp: DeltaTimestamp;
}

export interface DeltaWebSocketOrderbook extends DeltaWebSocketMessage {
  type: 'l2_orderbook';
  symbol: DeltaSymbol;
  buy: DeltaOrderbookLevel[];
  sell: DeltaOrderbookLevel[];
  timestamp: DeltaTimestamp;
}

export interface DeltaWebSocketPosition extends DeltaWebSocketMessage {
  type: 'position';
  product_id: DeltaProductId;
  product_symbol: DeltaSymbol;
  size: number;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  timestamp: DeltaTimestamp;
}

export interface DeltaWebSocketOrder extends DeltaWebSocketMessage {
  type: 'order';
  order: DeltaOrder;
  timestamp: DeltaTimestamp;
}

// API response wrappers
export interface DeltaApiResponse<T> {
  success: boolean;
  result: T;
}

export interface DeltaApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Configuration
export interface DeltaConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  wsUrl?: string;
  sandbox?: boolean;
}

// Trading strategies
export interface DeltaStrategyLeg {
  symbol: DeltaSymbol;
  side: DeltaOrderSide;
  size: number;
  price?: number;
}

export interface DeltaVerticalSpread {
  type: 'vertical_spread';
  legs: [DeltaStrategyLeg, DeltaStrategyLeg]; // Long and short legs
  max_profit: number;
  max_loss: number;
  breakeven: number;
}

export interface DeltaStraddle {
  type: 'straddle';
  legs: [DeltaStrategyLeg, DeltaStrategyLeg]; // Call and put at same strike
  max_profit: number;
  max_loss: number;
  breakeven: [number, number];
}

export interface DeltaStrangle {
  type: 'strangle';
  legs: [DeltaStrategyLeg, DeltaStrategyLeg]; // Call and put at different strikes
  max_profit: number;
  max_loss: number;
  breakeven: [number, number];
}

export interface DeltaIronCondor {
  type: 'iron_condor';
  legs: [DeltaStrategyLeg, DeltaStrategyLeg, DeltaStrategyLeg, DeltaStrategyLeg];
  max_profit: number;
  max_loss: number;
  breakeven: [number, number];
}

export type DeltaStrategy = DeltaVerticalSpread | DeltaStraddle | DeltaStrangle | DeltaIronCondor;