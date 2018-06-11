/**
 * Application options object
 */
export default {

  // notification sounds
  sound: true,

  // cors proxy for outgoing http requests
  proxy: 'https://cors-anywhere.herokuapp.com/',

  // news related options
  news: {
    refetch: true,  // aut re-fetch news on a timer
    notify: true,   // show push notifications for news
    send: false,    // include news in outgoing notifications (email/telegram)
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
  }
}
