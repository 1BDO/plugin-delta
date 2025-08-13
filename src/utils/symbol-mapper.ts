const symbolMap: { [key: string]: string } = {
  'bitcoin': 'BTCUSD',
  'btc': 'BTCUSD',
  'ethereum': 'ETHUSD',
  'eth': 'ETHUSD',
  'solana': 'SOLUSD',
  'sol': 'SOLUSD',
};

export function mapSymbol(input: string): string | undefined {
  return symbolMap[input.toLowerCase()];
}

export function findSymbolInText(text: string): string | undefined {
  const parts = text.toLowerCase().split(' ');
  for (const part of parts) {
    if (symbolMap[part]) {
      return symbolMap[part];
    }
    // Also check for the full symbol like BTCUSD
    if (part.endsWith('usd')) {
        const base = part.replace('usd', '');
        if (symbolMap[base]) {
            return symbolMap[base];
        }
    }
  }
  return undefined;
}
