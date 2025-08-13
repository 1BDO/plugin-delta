const symbolMap: { [key: string]: string } = {
  'bitcoin': 'BTCUSD',
  'btc': 'BTCUSD',
  'ethereum': 'ETHUSD',
  'eth': 'ETHUSD',
  'solana': 'SOLUSD',
  'sol': 'SOLUSD',
};

const optionRegex = /(C|P)-BTC-\d+-\d{6}/i;
const perpetualRegex = /(BTC|ETH|SOL)USD/i;

export function findInstrumentInText(text: string): string | undefined {
  const upperText = text.toUpperCase();
  
  // First, check for a complex option symbol
  const optionMatch = upperText.match(optionRegex);
  if (optionMatch) {
    return optionMatch[0];
  }

  // Next, check for a perpetual symbol
  const perpetualMatch = upperText.match(perpetualRegex);
  if (perpetualMatch) {
    return perpetualMatch[0];
  }

  // Fallback to simple alias mapping
  const parts = text.toLowerCase().split(/[\s\-_]+/); // Split on spaces, hyphens, or underscores
  for (const part of parts) {
    if (symbolMap[part]) {
      return symbolMap[part];
    }
  }
  
  return undefined;
}
