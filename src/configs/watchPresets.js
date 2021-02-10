/**
 * Watchform presets
 */
export default [
  {
    name: 'Top Coins',
    info: 'Coins with recent high trading volume.',
    options: {
      market: 'USDT',
      priceType: 'change',
      priceChange: '2',
      priceCheck: 'below',
      price: '',
      volumeType: 'gain',
      volumeChange: '2',
      volumeCheck: 'above',
      volume: '1000',
      volatilityCheck: 'above',
      volatility: '0',
      dangerCheck: 'below',
      danger: '0',
      timeCheck: 'less',
      timeLimit: '60',
    }
  },
  {
    name: 'Big Change',
    info: 'Big price change within a short time period.',
    options: {
      market: 'USDT',
      priceType: 'change',
      priceChange: '3',
      priceCheck: 'above',
      price: '0.00000100',
      volumeType: 'gain',
      volumeChange: '2',
      volumeCheck: 'above',
      volume: '',
      volatilityCheck: 'above',
      volatility: '5',
      dangerCheck: 'above',
      danger: '0',
      timeCheck: 'less',
      timeLimit: '30',
    }
  },
  {
    name: 'Slow Market',
    info: 'Small price change with low volume.',
    options: {
      market: 'USDT',
      priceType: 'change',
      priceChange: '1.5',
      priceCheck: 'above',
      price: '0.00000100',
      volumeType: 'gain',
      volumeChange: '0.5',
      volumeCheck: 'above',
      volume: '',
      volatilityCheck: 'above',
      volatility: '0',
      dangerCheck: 'below',
      danger: '0',
      timeCheck: 'less',
      timeLimit: '60',
    }
  },
]
