/**
 * Ticker symbol class
 */
export default class Symbol {

  // constructor
  constructor( symbol = '' ) {
    this.symbol       = String( symbol || '' ).toUpperCase();
    this.id           = ''; // custom unique token id
    this.token        = ''; // base asset token
    this.market       = ''; // quote asset token (market)
    this.name         = ''; // name of token
    this.pair         = ''; // token/market
    this.route        = '/symbol/'+ this.symbol;
    this.image        = 'public/images/icons/default_.png';
    this.imageLoaded  = false;
    this.open         = 0;
    this.high         = 0;
    this.low          = 0;
    this.close        = 0;
    this.change       = 0;
    this.percent      = 0;
    this.trades       = 0;
    this.tokenVolume  = 0;
    this.marketVolume = 0;
    this.volatility   = 0;
    this.danger       = 0;
    this.time         = 0;
    this.rank         = 0;
    this.supply       = 0;
    this.capusd       = 0;
    this.history      = [];
    this.candles      = [];
    this.sign         = '';
    this.arrow        = '';
    this.style        = '';
  }

  /**
   * Split full symbol (BTCUSD) into token and asset symbols (BTC, USD)
   */
  splitSymbol( markets = [] ) {
    if ( this.token || this.market || !markets.length ) return;
    const quotes = markets.join( '|' );
    const regexp = new RegExp( `^([A-Z]+)(${quotes})$` );
    this.token   = this.symbol.replace( regexp, '$1' ) || this.token;
    this.market  = this.symbol.replace( regexp, '$2' ) || this.market;
    this.name    = this.token;
    this.pair    = this.token +'/'+ this.market;
  }

  /**
   * Set coin data fetched from coincap API
   * https://docs.coincap.io/
   */
  setCoinData( data ) {
    if ( typeof data !== 'object' ) return;
    this.id     = String( data.id || this.id ).trim();
    this.name   = String( data.name || this.token ).trim();
    this.rank   = Number( data.rank || 0 );
    this.supply = Number( data.supply || 0 );
    this.capusd = Number( data.marketCapUsd || 0 );
  }

  /**
   * Set latest ticker values from binance socket API
   * https://binance-docs.github.io/apidocs/spot/en/#individual-symbol-mini-ticker-stream
   */
  setTickerData( data ) {
    this.open         = Number( data.o || data.openPrice || 0 );
    this.high         = Number( data.h || data.highPrice || 0 );
    this.low          = Number( data.l || data.lowPrice || 0 );
    this.close        = Number( data.c || data.lastPrice || 0 );
    this.change       = Number( data.p || data.priceChange || 0 );
    this.percent      = Number( data.P || data.priceChangePercent || 0 );
    this.trades       = Number( data.n || data.count || 0 );
    this.tokenVolume  = Number( data.v || data.volume || 0 );
    this.marketVolume = Number( data.q || data.quoteVolume || 0 );
    this.sign         = ( this.percent > 0 ) ? '+' : '';
    this.arrow        = ( this.percent > 0 ) ? '▲' : '▼';
    this.calcVolatility();
    this.calcDanger();
    this.calcHistory();
    this.calcStyle();
  }

  /**
   * Resolve token icon image
   */
  resolveImage() {
    if ( !this.token || this.imageLoaded ) return;
    let img = new Image();
    img.addEventListener( 'load',  e => { this.imageLoaded = true; this.image = img.src; } );
    img.addEventListener( 'error', e => { this.imageLoaded = true; } );
    img.src = 'public/images/icons/'+ String( this.token ).toLowerCase() +'_.png';
  }

  /**
   * Get symbol data with merged data
   * @param {object}  merge  Optional object
   */
  getData( merge ) {
    let volume = this.marketVolume;
    let { id, symbol, token, market, name, pair, route, image, close, capusd, supply } = this;
    return Object.assign( { id, symbol, token, market, name, pair, route, image, close, capusd, supply, volume }, merge );
  }

  /**
   * Cleanup stored price data
   */
  flushData() {
    this.history = [];
    this.candles = [];
  }

  /**
   * Calculate style class based on percent
   */
  calcStyle() {
    this.style = '';
    if ( this.percent > 0 ) this.style = 'gain';
    if ( this.percent < 0 ) this.style = 'loss';
  }

  /**
   * Calculate 24h high/low volatility score
   */
  calcVolatility() {
    let change = ( this.high - this.low );
    this.volatility = this.high ? ( change / this.high * 100.0 ) : 0.0;
  }

  /**
   * Calculate possible pump/dump danger score based on cached price action from recent few hours
   */
  calcDanger() {
    let now   = Date.now();
    let wait  = 300; // secs to wait
    let hrs   = 3;   // hours to store prices
    let secs  = ( now - this.time ) / 1000;
    let total = ( 60 * 60 * hrs ) / wait;

    if ( secs < wait ) return;
    this.candles.push( this.close );
    this.candles.splice( 0, this.candles.length - total );

    let idx = this.candles.length;
    let min = this.candles[ 0 ];
    let max = this.candles[ 0 ];

    while ( idx-- ) {
      let price = this.candles[ idx ];
      min = ( price < min ) ? price : min;
      max = ( price > max ) ? price : max;
    }
    let change = ( max - min );
    this.danger = max ? ( change / max * 100.0 ) : 0.0;
    this.time = now;
  }

  /**
   * Manages a history list with the latest close price
   */
  calcHistory() {
    if ( !this.history.length ) this.fakeHistory();
    this.history.push( this.close );
    this.history.splice( 0, this.history.length - 30 );
  }

  /**
   * Come up with some fake history prices to fill in the initial line chart
   */
  fakeHistory() {
    let num = this.close * 0.0002;
    let min = -Math.abs( num );
    let max = Math.abs( num );
    this.history = [];

    for ( let i = 0; i < 30; ++i ) {
      let rand = Math.random() * ( max - min ) + min;
      this.history.push( this.close + rand );
    }
  }

}
