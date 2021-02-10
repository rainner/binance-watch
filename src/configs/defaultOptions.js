/**
 * Application options object
 */
export default {

  // cors proxy for outgoing http requests
  proxy: 'https://binance-watch-wrapper.herokuapp.com/',

  // custom proxy list
  proxylist: [
    'https://binance-watch-wrapper.herokuapp.com/',
    'https://cors-anywhere.herokuapp.com/',
  ],

  // notification options
  notify: {
    enabled: true,
    duration: 10,
  },

  // notification audio
  audio: {
    enabled: true,
    volume: 0.5,
    file: 'public/audio/audio_2.mp3',
  },

  // search options
  search: {
    fullword: false,  // must type full search words
    fullcase: true,   // must type correct word upper/lower case letters
  },

  // live price options
  prices: {
    header: true,         // show top coins in header
    chart: true,          // show live price chart in list
    market: 'USDT',       // default selected market token
    sort: 'marketVolume', // price data to sort by
    order: 'desc',        // price sort direction
    limit: 20,            // how many entries to show
  },

  // news related options
  news: {
    enabled: true, // enable fetching on a timer
    notify: false,  // show push notifications for news
    send: false,    // include news in outgoing notifications (email/telegram)
    interval: 5,    // how often to try fetching from each source (secs)
    delay: 500,     // how long to wait before fetching again from each source (secs)
    tweets: 1,      // how many tweets to fetch at once from each source
    total: 100,     // how many total tweets to store
    max: 30,        // max number of news entries to show
    days: 1,        // only show entries posted within this number of days
  },

  // binance api config
  binance: {
    enabled: false, // status
    apikey: '',     // api key
    apisecret: '',  // api secret
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
