/**
 * Binance socket api wrapper class
 */
module.exports = class Binance {

  /**
   * Constructor
   */
  constructor() {
    this._baseurl   = 'wss://stream.binance.com:9443';
    this._socks     = {};
    this._callbacks = {};
    this._names     = {};
    this._symbols   = {};
    this._assets    = [];
    this._list      = [];
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
   * Come up with some fake history prices to fill in the initial line chart
   * @param {Number}  close  Current price
   */
  fakeHistory( close ) {
    let num = close * 0.0001; // faction of current price
    let min = -Math.abs( num );
    let max = Math.abs( num );
    let out = [];

    for ( let i = 0; i < 10; ++i ) {
      let rand = Math.random() * ( max - min ) + min;
      out.push( close + rand );
    }
    return out;
  }

  /**
   * Calculate volatility for recent price
   * @param {Array}  history  List of recent close prices
   */
  calcVolatility( history ) {
    let min     = history.reduce( ( min, val ) => val < min ? val : min, history[ 0 ] );
    let max     = history.reduce( ( max, val ) => val > max ? val : max, history[ 0 ] );
    let change  = max - min;
    let percent = max ? ( change / max * 100.0 ) : 0.0;
    return percent;
  }

  /**
   * Set object map of token -> name
   * @param {Object}  namesMap  Tokens names map
   */
  setNames( namesMap ) {
    this._names = Object.assign( this._names, namesMap );
  }

  /**
   * Get loaded symbols data
   */
  getSymbols() {
    return this._symbols;
  }

  /**
   * Get loaded base assets list
   */
  getAssets() {
    return this._assets;
  }

  /**
   * Connect to live ticker prices socket endpoint
   * @param {Function}  callback  Handler for price list
   */
  getPrices( callback ) {
    if ( typeof callback !== 'function' ) return;

    const ws = this.connect( 'ticker', this._baseurl +'/ws/!ticker@arr' );
    ws.addEventListener( 'error',   e => { this.trigger( 'error', ws, e ) } );
    ws.addEventListener( 'open',    e => { this.trigger( 'open', ws, e ) } );
    ws.addEventListener( 'close',   e => { this.trigger( 'close', ws, e ) } );
    ws.addEventListener( 'message', e => {

      // parse ticker list data
      let ticker = JSON.parse( e.data || '[]' ) || [];
      for ( let item of ticker ) {

        // parse ticker data for each symbol
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

        // look for existing token data, or build new object
        let data = this._symbols.hasOwnProperty( symbol ) ? this._symbols[ symbol ] : this._symbolData( symbol );

        // update and trim history data
        data.history = data.history || this.fakeHistory( close );
        data.history.splice( 0, data.history.length - 120 );
        data.history.push( close );
        data.volatility = this.calcVolatility( data.history );

        // resolve token icon image
        if ( !data.image ) {
          data.image = data.defaultIcon;
          let img = new Image();
          img.addEventListener( 'load', e => { data.image = img.src; } );
          img.src = data.tokenIcon;
        }

        // resolve token name
        if ( this._names.hasOwnProperty( data.token ) ) {
          data.name = this._names[ data.token ];
        }

        // save asset
        if ( this._assets.indexOf( data.asset ) < 0 ) {
          this._assets.push( data.asset );
        }

        // update token data
        this._symbols[ symbol ] = Object.assign( data, {
          open, high, low, close, change, percent, trades, tokenVolume, assetVolume, sign, arrow
        });
      }

      // build and emit final ticker list
      let prices = Object.keys( this._symbols ).map( s => this._symbols[ s ] );
      callback( prices );
    });
  }

  /**
   * Create a WebSocket connection
   * @param {String}  name      Ref name
   * @param {String}  endpoint  Socket endpoint url
   */
  connect( name, endpoint ) {
    try {
      let ws = new WebSocket( endpoint );
      this._socks[ name ] = ws;
      this.trigger( 'init', ws, 'Socket connection created.' );
      return ws;
    }
    catch ( err ) {
      this.trigger( 'error', null, err );
      return false;
    }
  }

  /**
   * Close all active socket connections
   */
  close() {
    Object.keys( this._socks ).map( name => {
      this._socks[ name ].close();
      delete this._socks[ name ];
    });
  }

  /**
   * Create static token data from a symbol
   * @param {String}  symbol  Token symbol from ticker list
   */
  _symbolData( symbol ) {
    let regx        = /^([A-Z]+)(BTC|ETH|BNB|USDT|TUSD|DAI)$/;
    let token       = symbol.replace( regx, '$1' );
    let asset       = symbol.replace( regx, '$2' );
    let name        = token;
    let pair        = token +'/'+ asset;
    let route       = '/symbol/'+ symbol;
    let defaultIcon = 'public/images/icons/default_.png';
    let tokenIcon   = 'public/images/icons/'+ String( token ).toLowerCase() +'_.png';
    let assetIcon   = 'public/images/icons/'+ String( asset ).toLowerCase() +'_.png';
    let infoUrl     = 'https://coinlib.io/coin/'+ token +'/';
    let image       = '';
    return { symbol, token, asset, name, pair, route, defaultIcon, tokenIcon, assetIcon, infoUrl, image };
  }

}
