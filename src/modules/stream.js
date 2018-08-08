/**
 * Handles socket and other rest API connecitons to Binance from the web client.
 */
const symbolData = require( './symbol' );

module.exports = class Stream {

  /**
   * Constructor
   * @param {function}  wsWrap     Custom wrapper function that returns a WebSocket instance
   * @param {boolean}   reconnect  Try to reconnect if socket closes
   */
  constructor( wsWrap, reconnect ) {
    this._wsWrap    = wsWrap;
    this._reconnect = Boolean( reconnect );
    this._baseurl   = 'wss://stream.binance.com:9443';
    this._sockets   = {};
    this._callbacks = {};
  }

  /**
   * Register a custom event handler
   * @param {string}    name      Event name
   * @param {function}  callback  Custom handler function
   */
  on( name, callback ) {
    if ( name && typeof callback === 'function' ) {
      this._callbacks[ name ] = callback;
    }
  }

  /**
   * Trigger a custom event handler
   * @param {string}  name  Event name
   */
  trigger() {
    let args = Array.from( arguments );
    let name = args.length ? args.shift() : '';

    if ( this._callbacks.hasOwnProperty( name ) ) {
      let cb = this._callbacks[ name ];
      cb.apply( cb, args );
    }
  }

  /**
   * Close all open socket connections
   */
  closeSockets() {
    Object.keys( this._sockets ).forEach( name => {
      this._close( name );
    })
  }

  /**
   * Get last 24h ticker data for all pairs
   * @param {function}  callback   Handler function for symbol data
   */
  getTickerData( callback ) {
    if ( typeof callback !== 'function' ) throw 'Callback function required for getTickerData().';

    let wsname   = 'ticker';
    let endpoint = this._baseurl +'/ws/!ticker@arr';
    let cache    = {};

    this._close( wsname );
    this._start( wsname, endpoint, e => {
      let list   = JSON.parse( e.data );
      let output = [];

      // process data for each symbol and add to cache
      for ( let i = 0; i < list.length; ++i ) {
        let item        = list[ i ];
        let symbol      = String( item.s );
        let open        = parseFloat( item.o );
        let high        = parseFloat( item.h );
        let low         = parseFloat( item.l );
        let close       = parseFloat( item.c );
        let change      = parseFloat( item.p );
        let percent     = parseFloat( item.P );
        let trades      = parseInt( item.n );
        let tokenVolume = Math.round( item.v );
        let assetVolume = Math.round( item.q );
        let sign        = ( percent >= 0 ) ? '+' : '';
        let arrow       = ( percent >= 0 ) ? '▲' : '▼';
        let history     = cache.hasOwnProperty( symbol ) ? cache[ symbol ].history : [];

        // keep up to 100 close values in the history for each symbol
        if ( history.length > 100 ) history = history.slice( history.length - 100 );
        history.push( close );

        // buils final symbol data
        cache[ symbol ] = symbolData( symbol, {
          open, high, low, close, change, percent, trades, tokenVolume, assetVolume, sign, arrow, history
        });
      }

      // convert cache object to final prices list for each symbol
      Object.keys( cache ).forEach( symbol => { output.push( cache[ symbol ] ) } );
      callback( output );
    });
  }

  /**
   * Start watching for live price action on symbols
   * @param {array}     symbols    List of symbols to watch for: ['ETHBTC','LTCBTC',...].
   * @param {string}    interval   Candle length: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
   * @param {function}  callback   Handler function for candle data on price change
   */
  watchPrices( symbols, interval, callback ) {
    if ( !Array.isArray( symbols ) || !interval ) throw 'Symbols array list required for watchPrices().';
    if ( typeof callback !== 'function' ) throw 'Callback function required for watchPrices().';

    let wsname   = 'kline';
    let endpoint = this._baseurl +'/stream?streams='+ symbols.map( symbol => symbol.toLowerCase() +'@kline_'+ interval ).join( '/' );

    this._close( wsname );
    this._start( wsname, endpoint, e => {
      let { stream, data } = JSON.parse( e.data );
      let { s: symbol, k: candle } = data;
      let { o: open, h: high, l: low, c: close, v: tokenVolume, q: assetVolume, n: trades, i: duration, x: isFinal } = candle;
      let output = symbolData( symbol, { open, high, low, close, tokenVolume, assetVolume, trades, duration, isFinal } );
      callback( output );
    });
  }

  /**
   * Start new soclet connection and add it to the list
   * @param {string}    name       Local name identifier
   * @param {string}    endpoint   The full endpoint url to connect to
   * @param {function}  callback   Handler function for socket message event data
   */
  _start( name, endpoint, callback ) {
    this.trigger( 'start', name, endpoint );
    try {
      let ws = ( typeof this._wsWrap === 'function' ) ? this._wsWrap( endpoint ) : new WebSocket( endpoint );

      ws.addEventListener( 'error', e => {
        this.trigger( 'error', ws, e );
      });
      ws.addEventListener( 'open', e => {
        this.trigger( 'open', ws, e );
      });
      ws.addEventListener( 'close', e => {
        this.trigger( 'close', ws, e );
        if ( this._reconnect ) {
          setTimeout( () => { this._start( name, endpoint, callback ) }, 5000 );
        }
      });
      ws.addEventListener( 'message', callback );
      this._sockets[ name ] = ws;
      return true;
    }
    catch ( e ) {
      this.trigger( 'error', null, e );
      return false;
    }
  }

  /**
   * Close active socket connection
   */
  _close( name ) {
    if ( name && this._sockets.hasOwnProperty( name ) ) {
      this._sockets[ name ].close();
      delete this._sockets[ name ];
    }
  }

}
