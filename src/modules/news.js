/**
 * Twitter news handler class
 */
import Bus from './bus';
import Twitter from './twitter';
import store from './store';

export default class News extends Bus {

  /**
   * Constructor
   */
  constructor() {
    super();
    this._ajax        = null;
    this._accountsKey = 'news_accounts_data';
    this._tweetsKey   = 'news_tweets_data';
    this._handlers    = [];
    this._tweets      = [];
    this._blacklist   = [];
    this._counter     = 0;
    this._interval    = null;
    this._options     = {
      enabled: true,  // aut re-fetch news on a timer
      interval: 5,    // how often to try fetching from each source (secs)
      delay: 300,     // how long to wait before fetching again from each source (secs)
      days: 1,        // only show entries posted within this number of days
      tweets: 1,      // how many tweets to fetch at once from each source
      total: 100,     // max number of news entries to store in list
    };
    this.tweetsHandler = this.tweetsHandler.bind( this );
    this.setupTimer();
  }

  /**
   * Set ajax module reference to use for requests
   * @param {object}  ajax  Ajax class instance
   */
  useAjax( ajax ) {
    this._ajax = ajax;
  }

  /**
   * Update options
   * @param {object}  options  Options object
   */
  setOptions( options ) {
    Object.assign( this._options, options );
    this.setupTimer();
    this.updateHandlers();
    this.filterTweets();
  }

  /**
   * Load saved accounts list from store
   */
  loadAccounts() {
    let accounts = store.getData( this._accountsKey );
    if ( !Array.isArray( accounts ) || !accounts.length ) return;
    this.importAccounts( accounts, true );
  }

  /**
   * Save accounts list to store
   */
  saveAccounts() {
    let accounts = this._handlers.map( tw => tw.handle );
    store.setData( this._accountsKey, accounts );
    this.emit( 'handlers', this._handlers );
  }

  /**
   * Load list of twitter handles
   * @param {array}    accounts  List of twitter handle string names
   * @param {boolean}  reset     Reset current list of loaded handlers
   * @param {boolean}  save      Save list of account after importing
   */
  importAccounts( accounts, reset, save ) {
    accounts = Array.isArray( accounts ) ? accounts : [];
    let count = 0;

    // reset current list, if a new list is available
    if ( reset && accounts.length ) this._handlers = [];
    // import new accounts list
    for ( let handle of accounts ) this.trackAccount( handle ) && count++;
    // save accounts back to store, or just emit loaded list
    if ( save ) { this.saveAccounts(); }
    else { this.emit( 'handlers', this._handlers ); }

    return count;
  }

  /**
   * Checks if a handle is already being tracked
   * @param {string}  handle  Twitter handle
   */
  tracking( handle ) {
    if ( !handle || typeof handle !== 'string' ) return false;
    return ( this._handlers.filter( tw => tw.handle === handle ).length ) ? true : false;
  }

  /**
   * Start tracking a new twitter account
   * @param {string}   handle  Twitter handle
   * @param {boolean}  fetch   Fetch tweets after adding
   * @param {boolean}  save    Save accounts after adding
   */
  trackAccount( handle, fetch, save ) {
    if ( !handle || typeof handle !== 'string' ) return false;
    if ( this.tracking( handle ) ) return false;
    // create new handler, add to list and update options
    const tw = new Twitter( handle );
    this.updateHandlers( tw );
    this._handlers.push( tw );
    // fetch tweets now if needed and emit event
    if ( fetch ) tw.fetchTweets( this._ajax, this.tweetsHandler );
    if ( save ) this.saveAccounts();
    return true;
  }

  /**
   * Stop tracking a twitter account
   * @param {string}  handle  Twitter handle
   */
  untrackAccount( handle ) {
    if ( !handle || typeof handle !== 'string' ) return false;
    // get handler that is being removed from the list, if it exists
    const tw = this._handlers.filter( tw => tw.handle === handle ).shift();
    if ( !tw ) return true;
    // remove handler from the list and emit events
    this._handlers = this._handlers.filter( tw => tw.handle !== handle );
    this._tweets = this._tweets.filter( t => t.handle !== handle );
    this.saveAccounts();
    this.saveTweets();
    return true;
  }

  /**
   * Update options for each Twitter handler
   */
  updateHandlers( tw ) {
    const fetchDelay = parseInt( this._options.delay ) || 300;
    const limitCount = parseInt( this._options.tweets ) || 1;
    if ( tw instanceof Twitter ) return tw.setOptions( { fetchDelay, limitCount } );
    this._handlers.forEach( tw => tw.setOptions( { fetchDelay, limitCount } ) );
  }

  /**
   * Load cached tweets from store
   */
  loadTweets() {
    let tweets = store.getData( this._tweetsKey );
    if ( !Array.isArray( tweets ) || !tweets.length ) return;
    this._tweets = tweets;
    this.resetTweets();
    this.filterTweets();
    this.saveTweets();
  }

  /**
   * Save current tweets to store
   */
  saveTweets() {
    store.setData( this._tweetsKey, this._tweets );
    this.emit( 'tweets', this._tweets );
  }

  /**
   * Reset new entries indicator
   */
  resetTweets() {
    this._tweets.forEach( t => { t.isNew = false; } );
    this.saveTweets();
  }

  /**
   * Flush tweets list
   */
  flushTweets() {
    this._tweets = [];
    this._blacklist = [];
    this.saveTweets();
  }

  /**
   * Remove tweet from list and add ID to blacklist
   * @param {string}  id  Tweet ID
   */
  blockTweet( id ) {
    if ( !id ) return false;
    this._tweets = this._tweets.filter( t => t.id !== id );
    this._blacklist = this._blacklist.filter( tid => tid !== id );
    this._blacklist.push( id );
    this.saveTweets();
    return true;
  }

  /**
   * Add new tweet object to the list
   * @param {object}  tweet  Tweet object
   */
  addTweet( tweet ) {
    if ( !tweet || !( 'id' in tweet ) ) return false;
    if ( this.tweetExists( tweet ) ) return false;
    if ( this.tweetBlocked( tweet ) ) return false;
    if ( this.tweetExpired( tweet ) ) return false;
    tweet.isNew = true; // for indicator
    this._tweets.push( tweet );
    return true;
  }

  /**
   * Checks if a tweet is in the list of news
   * @param {object}  tweet  Tweet object
   */
  tweetExists( tweet ) {
    if ( !tweet || !( 'id' in tweet ) ) return false;
    return this._tweets.filter( t => t.id === tweet.id ).length ? true : false;
  }

  /**
   * Checks if a tweet is in the blocklist
   * @param {object}  tweet  Tweet object
   */
  tweetBlocked( tweet ) {
    if ( !tweet || !( 'id' in tweet ) ) return false;
    return this._blacklist.filter( id => id === tweet.id ).length ? true : false;
  }

  /**
   * Checks if a tweet is too old, based on option
   * @param {object}  tweet  Tweet object
   */
  tweetExpired( tweet ) {
    if ( !tweet || !( 'id' in tweet ) ) return false;
    let days = parseInt( this._options.days ) | 0;
    let secs = ( Date.now() - tweet.time ) / 1000;
    let age  = Math.ceil( secs / 86400 );
    return ( age > days ) ? true : false;
  }

  /**
   * Handles new tweets that are fetched from the Twitter class
   * @param {string}  err    Error string (empty on success)
   * @param {array}  tweets  Tweets array (empty on error)
   */
  tweetsHandler( err, tweets ) {
    if ( err ) return this.emit( 'error', err );
    if ( !tweets.length ) return;

    for ( let tweet of tweets ) {
      // it's possible added tweets can get removed due to filtering...
      let added = this.addTweet( tweet );
      this.filterTweets();

      // double check if the tweet survived and emit it
      if ( added && this.tweetExists( tweet ) ) {
        this.emit( 'tweet', tweet );
      }
    }
    this.saveAccounts();
    this.saveTweets();
  }

  /**
   * Cleanup tweets list
   */
  filterTweets() {
    let total = parseInt( this._options.total );

    // filter out old tweets
    this._tweets = this._tweets.filter( tweet => {
      return !this.tweetExpired( tweet );
    });
    // sort tweets from new to old
    this._tweets = this._tweets.sort( ( a, b ) => {
      if ( a.time > b.time ) return -1;
      if ( a.time < b.time ) return 1;
      return 0;
    });
    // trim tweets list
    if ( total ) {
      this._tweets = this._tweets.slice( 0, total );
    }
  }

  /**
   * Fetch tweets for an account by handle
   * @param {string}  handle  Twitter handle
   */
  fetchByHandle( handle ) {
    if ( !handle || typeof handle !== 'string' ) return false;
    const tw = this._handlers.filter( tw => tw.handle === handle ).shift();
    if ( tw ) tw.fetchTweets( this._ajax, this.tweetsHandler );
    return true;
  }

  /**
   * Fetch tweets from next handler down the list
   */
  fetchNextHandler() {
    if ( !this._handlers.length ) return;
    const last = this._handlers.length - 1;
    const tw = this._handlers[ this._counter ];
    if ( tw ) tw.fetchTweets( this._ajax, this.tweetsHandler );
    this._counter = ( this._counter < last ) ? ( this._counter + 1 ) : 0;
  }

  /**
   * Start the tweets interval handler
   */
  setupTimer() {
    this.stopTimer();
    const secs = parseInt( this._options.interval );
    if ( !secs ) return;
    this._interval = setInterval( () => {
      if ( !this._options.enabled ) return;
      this.fetchNextHandler();
    }, 1000 * secs );
  }

  /**
   * Stop the tweets interval handler
   */
  stopTimer() {
    if ( this._interval ) {
      clearInterval( this._interval );
      this._interval = null;
    }
  }

}
