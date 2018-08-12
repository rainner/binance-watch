/**
 * Application watchform presets
 */
export default [
  // big spikes in price and volume within a short time period
  {
    name: 'Big Pumps',
    options: {
      asset: 'BTC',
      priceType: 'gain',
      priceChange: '5',
      priceCheck: 'below',
      price: '',
      volumeType: 'gain',
      volumeChange: '10',
      volumeCheck: 'above',
      volume: '',
      timeCheck: 'less',
      timeLimit: '10',
    }
  },
  // big dips in price with volume within a short time period
  {
    name: 'Big Dumps',
    options: {
      asset: 'BTC',
      priceType: 'loss',
      priceChange: '5',
      priceCheck: 'below',
      price: '',
      volumeType: 'gain',
      volumeChange: '10',
      volumeCheck: 'above',
      volume: '',
      timeCheck: 'less',
      timeLimit: '10',
    }
  },
  // small changes in price and volume during slow markets
  {
    name: 'Slow Market',
    options: {
      asset: 'BTC',
      priceType: 'change',
      priceChange: '1',
      priceCheck: 'below',
      price: '',
      volumeType: 'gain',
      volumeChange: '1',
      volumeCheck: 'above',
      volume: '',
      timeCheck: 'less',
      timeLimit: '30',
    }
  },
  // small change withing 15 minutes on coins with some volume
  {
    name: 'Quick Swings',
    options: {
      asset: 'BTC',
      priceType: 'change',
      priceChange: '2',
      priceCheck: 'above',
      price: '0.00000100',
      volumeType: 'gain',
      volumeChange: '1',
      volumeCheck: 'above',
      volume: '',
      timeCheck: 'less',
      timeLimit: '10',
    }
  },
  // small change for cheap coins
  {
    name: 'Cheap Coins',
    options: {
      asset: 'BTC',
      priceType: 'change',
      priceChange: '2',
      priceCheck: 'below',
      price: '0.00001',
      volumeType: 'gain',
      volumeChange: '5',
      volumeCheck: 'above',
      volume: '',
      timeCheck: 'less',
      timeLimit: '60',
    }
  },
  // coins with recent high volume
  {
    name: 'Top Coins',
    options: {
      asset: 'BTC',
      priceType: 'change',
      priceChange: '2',
      priceCheck: 'below',
      price: '',
      volumeType: 'gain',
      volumeChange: '5',
      volumeCheck: 'above',
      volume: '1000',
      timeCheck: 'less',
      timeLimit: '30',
    }
  },
]
