/**
 * Application options object
 */
export default {

  // cors proxy for outgoing http requests
  proxy: 'https://cors-anywhere.herokuapp.com/',
  proxylist: [
    'https://cors-anywhere.herokuapp.com/',
    'https://localhost:4343/',
    'http://localhost:8080/',
  ],

  // notification audio
  audio: {
    enabled: true,
    volume: 0.5,
    file: 'public/audio/audio_2.mp3',
  },

  // search options
  search: {
    strict: true,  // force case-sensitive search
  },

  // news related options
  news: {
    refetch: true,  // aut re-fetch news on a timer
    notify: false,  // show push notifications for news
    send: false,    // include news in outgoing notifications (email/telegram)
    interval: 5,    // how often to try fetching from each source (secs)
    delay: 300,     // how long to wait before fetching again from each source (secs)
    tweets: 1,      // how many tweets to fetch at once from each source
    total: 200,     // how many total tweets to store
    max: 50,        // max number of news entries to show
    days: 1,        // only show entries posted within this number of days
    sources: [      // twitter accounts for latest crypto news
      'coinbase',
      'binance',
      'HuobiGlobal',
      'YobitExchange',
      'BittrexExchange',
      'Coinsquare',
      'hitbtc',
      'Cryptopia_NZ',
      'Bitstamp',
      'bitfinex',
      'krakenfx',
      'coindesk',
      'cmcal_bot',
      'iCryptoMoon',
      'CryptoCurrent',
      'Cointelegraph',
      'CryptoCoinsNews',
      'cryptonewsday',
      'RedditBTC'
    ],
  },

  // mailgun api config
  mailgun: {
    enabled: false, // status
    domain: '',     // account domain
    apikey: '',     // api key
    email: '',      // recipient email
  },

  // telegram bot api config
  telegram: {
    enabled: false, // status
    botkey: '',     // telegram bot id
    userid: '',     // recipient chat id
  },
}
