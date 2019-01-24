/**
 * Ticker symbol class
 */
export default class Symbol {

  // constructor
  constructor( symbol ) {
    const regex      = /^([A-Z]+)(BTC|ETH|BNB|USDT|USDC|TUSD|PAX|DAI|XRP)$/;
    this.symbol      = String( symbol || '' ).toUpperCase();
    this.token       = this.symbol.replace( regex, '$1' );
    this.asset       = this.symbol.replace( regex, '$2' );
    this.name        = this.token;
    this.pair        = this.token +'/'+ this.asset;
    this.route       = '/symbol/'+ this.symbol;
    this.image       = 'public/images/icons/default_.png';
    this.open        = 0;
    this.high        = 0;
    this.low         = 0;
    this.close       = 0;
    this.change      = 0;
    this.percent     = 0;
    this.trades      = 0;
    this.tokenVolume = 0;
    this.assetVolume = 0;
    this.volatility  = 0;
    this.danger      = 0;
    this.time        = 0;
    this.history     = [];
    this.candles     = [];
    this.sign        = '';
    this.arrow       = '';
    this.style       = '';
    this.resolveImage();
  }

  /**
   * Resolve token icon image
   */
  resolveImage() {
    let img = new Image();
    img.addEventListener( 'load', e => { this.image = img.src; img = null; } );
    img.src = 'public/images/icons/'+ String( this.token ).toLowerCase() +'_.png';
  }

  /**
   * Set token name
   * @param {string} name Token name
   */
  setName( name ) {
    this.name = String( name || this.token );
  }

  /**
   * Set latest ticker values
   * @param {*} * Ticker values
   */
  setTickerData( ticker ) {
    this.open        = Number( ticker.o || ticker.openPrice || 0 );
    this.high        = Number( ticker.h || ticker.highPrice || 0 );
    this.low         = Number( ticker.l || ticker.lowPrice || 0 );
    this.close       = Number( ticker.c || ticker.lastPrice || 0 );
    this.change      = Number( ticker.p || ticker.priceChange || 0 );
    this.percent     = Number( ticker.P || ticker.priceChangePercent || 0 );
    this.trades      = Number( ticker.n || ticker.count || 0 );
    this.tokenVolume = Number( ticker.v || ticker.volume || 0 );
    this.assetVolume = Number( ticker.q || ticker.quoteVolume || 0 );
    this.sign        = ( this.percent > 0 ) ? '+' : '';
    this.arrow       = ( this.percent > 0 ) ? '▲' : '▼';
    this.calcVolatility();
    this.calcDanger();
    this.calcHistory();
    this.calcStyle();
  }

  /**
   * Get symbol data with merged data
   * @param {object}  merge  Optional object
   */
  getData( merge ) {
    let volume = this.assetVolume;
    let { symbol, token, asset, name, pair, route, image, close } = this;
    return Object.assign( { symbol, token, asset, name, pair, route, image, close, volume }, merge );
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
