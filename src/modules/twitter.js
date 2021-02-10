/**
 * Twitter scraper and tweets manager class.
 */
export default class Twitter {

  /**
   * Constructor
   * @param {string}  handle   Twitter handle
   * @param {object}  options  Fetching options
   */
  constructor( handle, options ) {
    if ( !handle || typeof handle !== 'string' ) {
      throw 'Must provide a valid twitter handle string.';
    }
    this.uid       = '';
    this.handle    = '';
    this.name      = '';
    this.avatar    = '';
    this.url       = '';
    this.error     = '';
    this.last      = 0;
    this.fetching  = false;
    this._options  = {
      skipPinned  : true,  // ignore pinned tweets
      skipRetweet : true,  // ignore re-tweets
      cleanTweets : true,  // strip html and whitespace from tweets
      fetchDelay  : 300,   // prevent re-fetching for (secs)
      limitCount  : 1,     // limit number of tweets parsed
    };
    this.setOptions( options );
    this.setData( { handle: handle, name: handle } );
  }

 /**
   * Update options
   * @param {object}  options  Options object
   */
  setOptions( options ) {
    Object.assign( this._options, options );
  }

  /**
   * Set new acocunt data
   * @param {object} data  Twitter account data
   */
  setData( data ) {
    if ( typeof data !== 'object' ) return;
    if ( data.uid )    this.uid    = String( this.uid ).replace( /[^\w\-]+/g, '' );
    if ( data.handle ) this.handle = String( data.handle ).replace( /[^\w\-]+/g, '' );
    if ( data.name )   this.name   = String( data.name ).replace( /[\r\n\s\t]+/g, ' ' ).trim();
    if ( data.avatar ) this.avatar = String( data.avatar ).trim();
    this.url = 'https://twitter.com/'+ this.handle;
  }

  /**
   * Get account info
   */
  getData() {
    let { uid, handle, name, avatar, url, last, fetching, error } = this;
    return { uid, handle, name, avatar, url, last, fetching, error };
  }

  /**
   * Fetch remote tweets using ajax module
   * @param {object}    ajax      Ajax module instance to use for request
   * @param {function}  callback  Callback function
   */
  fetchTweets( ajax, callback ) {
    if ( !callback || typeof callback !== 'function' ) return;
    if ( !ajax || typeof ajax !== 'object' ) return callback( 'Must provide an ajax module reference.', [] );
    if ( !this._canFetch() ) return callback( '', [] ); // too soon, ignore

    this.fetching = true;
    this.error = '';

    ajax.get( this.url, {
      type: 'text',
      timeout: 30,
      notAjax: true,

      done: ( xhr, status, response ) => {
        this.fetching = false;
      },
      error: ( xhr, status, error ) => {
        this.error = error +' | @'+ this.handle +'.';
        return callback( this.error, [] );
      },
      success: ( xhr, status, response ) => {
        let parser = new DOMParser();
        let html   = this._cleanHtml( response );
        let doc    = parser.parseFromString( html, 'text/html' );

        if ( doc && doc instanceof HTMLDocument ) {
          this.last = Date.now();
          callback( '', this.parseTweets( doc ) );
        } else {
          this.error = 'DOMParserError: Could not parse response from '+ this.url;
          callback( this.error, [] );
        }
        parser = null;
        html = null;
        doc = null;
      }
    });
  }

  /**
   * Darse account and tweets data from a fetched HTML response
   * @param {HTMLDocument}  doc  Twitter account page document
   */
  parseTweets( doc ) {
    let limit  = this._options.limitCount | 0;
    let count  = 0;
    let output = [];

    // look for profile avatar
    let avatar = doc.querySelector( 'img.ProfileAvatar-image' );
    avatar = avatar ? avatar.src : '';

    // look for items
    let items = doc.querySelectorAll( '.stream-item' ) || [];

    // loop tweet list items
    for ( let i = 0; i < items.length; ++i ) {
      if ( limit && count >= limit ) break;

      // look for tweet data
      let item    = items[ i ];
      let tweet   = item   ? item.querySelector( '.js-stream-tweet' ) : null; // metadata tag
      let posted  = item   ? item.querySelector( '.js-short-timestamp' ) : null; // date tag
      let content = item   ? item.querySelector( '.js-tweet-text' ) : null; // tweet wrapper
      let text    = '';

      // look for account info
      let id      = tweet  ? tweet.getAttribute( 'data-tweet-id' ) || '' : '';
      let uid     = tweet  ? tweet.getAttribute( 'data-user-id' ) || '' : '';
      let name    = tweet  ? tweet.getAttribute( 'data-name' ) || '' : '';
      let handle  = tweet  ? tweet.getAttribute( 'data-screen-name' ) || '' : '';
      let link    = tweet  ? 'https://twitter.com'+ tweet.getAttribute( 'data-permalink-path' ) || '' : '';
      let time    = posted ? Number( posted.getAttribute( 'data-time-ms' ) ) || 0 : 0;

      // update profile details
      this.setData( { uid, handle, name, avatar } );

      // resolve tweet text
      if ( content ) {
        text = this._options.cleanTweets
          ? this._cleanTweet( content.textContent )
          : String( content.innerHTML || '' ).trim();
      }
      // check a few things, skip if needed
      if ( !id || !uid || !name || !handle || !text || !time || time < 0 ) continue;
      if ( this._options.skipPinned && item.classList.contains( 'js-pinned' ) ) continue;
      if ( this._options.skipRetweet && tweet.hasAttribute( 'data-retweet-id' ) ) continue;

      // format time
      let d = new Date( time );
      let date = d.toDateString();

      // add tweet to list and update account info
      output.push( { id, uid, time, date, name, handle, avatar, text, link } );
      count++;
    }
    items = null;
    return output;
  }

  /**
   * Check last fetch time to see if it's ok to fetch again
   */
  _canFetch() {
    let now      = Date.now();
    let elapsed  = Math.floor( ( now - this.last ) / 1000 );
    let delay    = this._options.fetchDelay | 0;

    if ( this.fetching || this.last >= now ) return false; // busy, wait
    if ( delay && elapsed < delay ) return false; // too soon, wait
    return true; // looks good
  }

  /**
   * Clean tweet text
   * @param {string}  text  Strign to clean
   */
  _cleanTweet( text ) {
    return String( text || '' )
    .replace( /([^\s]+)(https?\:|pic\.)/g, '$1 $2' ) // add space around links
    .replace( 'pic.twitter', 'https://pic.twitter' ) // fix some links without proto
    .replace( /([\`\'\’]+)/g, "'" ) // normalize apostrophes
    .replace( /([\“\”\“\”\"]+)/g, '"' ) // normalize quotes
    .replace( /[\…\#\$]+/g, ' ' ) // remove some junk chars
    .replace( /[\t\r\n\s\uFEFF\xA0]+/g, ' ' ).trim(); // collapse whitespace
  }

  /**
   * Clean html content
   * @param {string}  html  HTML text to clean
   */
  _cleanHtml( html ) {
    return String( html || '' )
    .replace( /<(style|script)[^>]*>(?:(?!<\/(style|script)>)[^])*<\/(style|script)>/gim, '' )
    .replace( /[\r\n\s\t]+/g, ' ' )
    .trim();
  }

}
