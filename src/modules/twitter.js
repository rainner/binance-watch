/**
 * Twitter scraper and tweets manager class.
 */
export default class Twitter {

  // constructor
  constructor( handle, options ) {
    if ( !handle || typeof handle !== 'string' ) {
      throw 'Must provide a valid twitter handle string.';
    }
    this.uid     = '';
    this.handle  = '';
    this.name    = '';
    this.avatar  = '';
    this.url     = '';
    this.last    = 0;
    this.error   = '';
    this.options = {
      // ignore pinned tweets
      skipPinned: true,
      // ignore re-tweets
      skipRetweet: true,
      // strip html and whitespace from tweets
      cleanTweets: true,
      // prevent re-fetching for (secs)
      fetchDelay: 300,
      // limit number of tweets in local list
      limitCount: 20,
    };
    this.setOptions( options );
    this.setData( { handle: handle, name: handle } );
  }

  // merge new options
  setOptions( options ) {
    this.options = Object.assign( this.options, options );
  }

  // set new acocunt data
  setData( data ) {
    if ( typeof data !== 'object' ) return;
    if ( data.uid )    this.uid    = String( this.uid ).replace( /[^\w\-]+/g, '' );
    if ( data.handle ) this.handle = String( data.handle ).replace( /[^\w\-]+/g, '' );
    if ( data.name )   this.name   = String( data.name ).replace( /[\r\n\s\t]+/g, ' ' ).trim();
    if ( data.avatar ) this.avatar = String( data.avatar ).trim();
    this.url = 'https://twitter.com/'+ this.handle;
  }

  // get account info
  getData() {
    let { uid, handle, name, avatar, url, last, error } = this;
    return { uid, handle, name, avatar, url, last, error };
  }

  // fetch remote tweets using teh ajax module passed in
  fetchTweets( ajax, callback ) {
    const now = Date.now();
    const elapsed = ( now - this.last ) / 1000;
    const delay = this.options.fetchDelay | 0;

    if ( !callback || typeof callback !== 'function' ) return;
    if ( !ajax || typeof ajax !== 'object' ) return callback( 'Must provide an ajax module reference.', this.handle );
    if ( delay && elapsed < delay ) return callback( null, this.handle );

    this.last = now;
    this.error = '';

    ajax.get( this.url, {
      type: 'text',
      timeout: 30,
      done: ( xhr, status, response ) => {

        // check response status and content
        if ( !status || status !== 200 || !response ) {
          this.error = 'httpError ('+ status +'): Could not fetch content from '+ this.url;
          return callback( this.error, this.handle );
        }
        // try to parse repsonse as HTML
        const parser = new DOMParser();
        const html   = this._cleanHtml( response );
        const doc    = parser.parseFromString( html, 'text/html' );

        // check parsed document
        if ( !doc || !( 'querySelector' in doc ) ) {
          this.error = 'parserError: Could not parse response from '+ this.url;
          return callback( this.error, this.handle );
        }
        // parse tweets and pass to callback
        const tweets = this.parseTweets( doc );
        callback( null, this.handle, tweets );
      }
    });
  }

  // parse account and tweets data from a fetched HTML response
  parseTweets( doc ) {
    let limit  = this.options.limitCount | 0;
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

      // look for tweet containers
      let item    = items[ i ];
      let tweet   = item ? item.querySelector( '.js-stream-tweet' ) : null; // metadata tag
      let posted  = item ? item.querySelector( '.js-short-timestamp' ) : null; // date tag
      let content = item ? item.querySelector( '.js-tweet-text' ) : null; // tweet wrapper

      // check a few things, skip if needed
      if ( !item || !tweet || !posted || !content ) continue;
      if ( this.options.skipPinned && item.classList.contains( 'js-pinned' ) ) continue;
      if ( this.options.skipRetweet && tweet.hasAttribute( 'data-retweet-id' ) ) continue;

      // look for rest of tweet data
      let id     = tweet.getAttribute( 'data-tweet-id' ) || '';
      let uid    = tweet.getAttribute( 'data-user-id' ) || '';
      let name   = tweet.getAttribute( 'data-name' ) || '';
      let handle = tweet.getAttribute( 'data-screen-name' ) || '';
      let link   = 'https://twitter.com'+ tweet.getAttribute( 'data-permalink-path' ) || '';
      let time   = Number( posted.getAttribute( 'data-time-ms' ) ) || 0;
      let text   = this.options.cleanTweets ? this._cleanTweet( content.textContent ) : String( content.innerHTML || '' ).trim();

      // check tweet data and timestamp
      if ( !id || !uid || !handle || !text ) continue;
      if ( !time || time < 0 ) continue;

      // format time
      let d = new Date( time );
      let date = d.toDateString();

      // add tweet to list and update account info
      this.setData( { uid, handle, name, avatar } );
      output.push( { id, uid, time, date, name, handle, avatar, text, link } );
      count++;
    }
    return output;
  }

  // clean tweet text
  _cleanTweet( text ) {
    return String( text || '' )
    .replace( /([^\s]+)(https?\:|pic\.)/g, '$1 $2' ) // add space around links
    .replace( 'pic.twitter', 'https://pic.twitter' ) // fix some links without proto
    .replace( /([\`\'\’]+)/g, "'" ) // normalize apostrophes
    .replace( /([\“\”\“\”\"]+)/g, '"' ) // normalize quotes
    .replace( /[\…\#\$]+/g, ' ' ) // remove some junk chars
    .replace( /(https?\:\/\/[\w\-\.\?\=\&\%\/\#]+)/gi, '<a href="$1" target="_blank">$1</a>' ) // format links
    .replace( /[\t\r\n\s\uFEFF\xA0]+/g, ' ' ).trim(); // collapse whitespace
  }

  // clean html content
  _cleanHtml( html ) {
    return String( html || '' )
    .replace( /<(style|script)[^>]*>(?:(?!<\/(style|script)>)[^])*<\/(style|script)>/gim, '' )
    .replace( /[\r\n\s\t]+/g, ' ' )
    .trim();
  }

}
