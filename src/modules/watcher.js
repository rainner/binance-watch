/**
 * Class for watching price changes in ticker list
 */
export default class Watcher {

  /**
   * Constructor
   */
  constructor() {
    this._reg = null;
    this._snapshot = {};
    this._options = {
      // pair
      token: '', // token symbol
      market: 'BTC', // trading market symbol
      // price
      priceType: 'change', // change, gain, loss
      priceChange: '2', // change percent
      priceCheck: 'below', // above, below
      price: '', // custom price limit
      // volume
      volumeType: 'gain', // change, gain, loss
      volumeChange: '1', // change percent
      volumeCheck: 'above', // above, below
      volume: '', // custom volume limit
      // percent 24h
      changeCheck: 'above', // above, below
      change: '0', // custom 24h percent change
      // volatility
      volatilityCheck: 'below', // above, below
      volatility: '0', // custom volatility limit
      // danger
      dangerCheck: 'below', // above, below
      danger: '0', // custom danger limit
      // time
      timeCheck: 'less', // more, less
      timeLimit: '10', // limit change by time (mins)
      // filter
      filterType: 'deny', // deny, allow
      filterTokens: '', // csv tokens str
    }
  }

  /**
   * Set watch options
   * @param {object}  options  New options
   */
  setOptions( options ) {
    Object.assign( this._options, options );
    const search = String( this._options.filterTokens || '' ).trim().split( /[^a-zA-Z]+/g ).join( '|' ).toUpperCase();
    this._reg = search ? new RegExp( '^('+ search +')$' ) : null;
  }

  /**
   * Update snapshot price data
   * @param {array}  tickerlist  Array list of Symbol objects
   */
  updateSnapshot( tickerlist ) {
    let checked    = Date.now();
    let tokenCheck = String( this._options.token || '' );
    let assetCheck = String( this._options.market || '' );
    this._snapshot = {};

    for ( let i = 0; i < tickerlist.length; ++i ) {
      let { symbol, token, market, close, marketVolume } = tickerlist[ i ];
      if ( tokenCheck && token !== tokenCheck ) continue;
      if ( assetCheck && market !== assetCheck ) continue;
      this._snapshot[ symbol ] = { symbol, token, market, close, marketVolume, checked };
    }
  }

  /**
   * Update snapshot price/volume for a symbol
   * @param {array}   tickerlist  Array list of Symbol objects
   * @param {string}  symbol      Symbol string
   */
  updateSymbolSnapshot( tickerlist, symbol ) {
    if ( !this._snapshot.hasOwnProperty( symbol ) ) return;

    let pair = tickerlist.filter( p => ( p.symbol === symbol ) ).shift();
    if ( !pair ) return;

    this._snapshot[ symbol ].close = pair.close;
    this._snapshot[ symbol ].marketVolume = pair.marketVolume;
    this._snapshot[ symbol ].checked = Date.now();
  }

  /**
   * Check if a pair passes the filter options
   * @param {object}  p  Symbol object pair data
   */
  pairCheck( p ) {
    let token           = String( this._options.token || '' );
    let market          = String( this._options.market || '' );
    let priceCheck      = String( this._options.priceCheck || '' );
    let price           = Number( this._options.price || 0 );
    let volumeCheck     = String( this._options.volumeCheck || '' );
    let volume          = Number( this._options.volume || 0 );
    let changeCheck     = String( this._options.changeCheck || '' );
    let change          = Number( this._options.change || 0 );
    let volatilityCheck = String( this._options.volatilityCheck || '' );
    let volatility      = Number( this._options.volatility || 0 );
    let dangerCheck     = String( this._options.dangerCheck || '' );
    let danger          = Number( this._options.danger || 0 );
    let filterType      = String( this._options.filterType || '' );

    if ( token && p.token !== token ) return false;
    if ( market && p.market !== market ) return false;

    if ( this._reg && filterType === 'allow' && !this._reg.test( p.token ) ) return false;
    if ( this._reg && filterType === 'deny' && this._reg.test( p.token ) ) return false;

    if ( price && priceCheck === 'above' && p.close < price ) return false;
    if ( price && priceCheck === 'below' && p.close > price ) return false;

    if ( volume && volumeCheck === 'above' && p.marketVolume < volume ) return false;
    if ( volume && volumeCheck === 'below' && p.marketVolume > volume ) return false;

    if ( change && changeCheck === 'above' && p.percent < change ) return false;
    if ( change && changeCheck === 'below' && p.percent > change ) return false;

    if ( volatility && volatilityCheck === 'above' && p.volatility < volatility ) return false;
    if ( volatility && volatilityCheck === 'below' && p.volatility > volatility ) return false;

    if ( danger && dangerCheck === 'above' && p.danger < danger ) return false;
    if ( danger && dangerCheck === 'below' && p.danger > danger ) return false;

    return true;
  }

  /**
   * Check how many tokens are affected by the watch options
   * @param {array}  tickerlist  Array list of Symbol objects
   */
  watchCount( tickerlist ) {
    let count = 0;
    for ( let i = 0; i < tickerlist.length; ++i ) {
      if ( this.pairCheck( tickerlist[ i ] ) ) count++;
    }
    return count;
  }

  /**
   * Check list of prices against options
   * @param {array}     tickerlist  Array list of Symbol objects
   * @param {function}  callback    Callback handler
   */
  check( tickerlist, callback ) {
    let now          = Date.now();
    let priceType    = String( this._options.priceType || '' );
    let priceChange  = Number( this._options.priceChange || 0 );
    let volumeType   = String( this._options.volumeType || '' );
    let volumeChange = Number( this._options.volumeChange || 0 );
    let timeCheck    = String( this._options.timeCheck || 'less' );
    let timeLimit    = Number( this._options.timeLimit || 0 ) * 60; // secs
    let count        = tickerlist.length;

    // need something to check
    if ( !priceChange && !volumeChange ) return;

    // scan price list...
    while ( count-- ) {

      // price and snapshot data
      let p = tickerlist[ count ];
      let s = this._snapshot[ p.symbol ] || null;

      // initial filter checks
      if ( !s || !this.pairCheck( p ) ) continue;

      // calculate price and volume change
      let pc = this._calcPercent( p.close, s.close );
      let vc = this._calcPercent( p.marketVolume, s.marketVolume );
      let t  = ( now - s.checked ) / 1000;

      // check price change
      if ( priceChange ) {
        if ( priceType === 'gain' && pc.sign === '-' ) continue;
        if ( priceType === 'loss' && pc.sign === '+' ) continue;
        if ( pc.percent < priceChange ) continue;
      }
      // check volume change
      if ( volumeChange ) {
        if ( volumeType === 'gain' && vc.sign === '-' ) continue;
        if ( volumeType === 'loss' && vc.sign === '+' ) continue;
        if ( vc.percent < volumeChange ) continue;
      }
      // update snapshot data
      this._snapshot[ p.symbol ].close = p.close;
      this._snapshot[ p.symbol ].marketVolume = p.marketVolume;
      this._snapshot[ p.symbol ].checked = now;

      // check time options
      if ( timeCheck && timeLimit ) {
        if ( timeCheck === 'less' && t > timeLimit ) continue;
        if ( timeCheck === 'more' && t < timeLimit ) continue;
      }
      // we have a hit
      callback( p, pc, vc, t );
    }
  }

  /**
   * Calculate percent change
   * @param {number}  current  Current value
   * @param {number}  last     Last value
   */
  _calcPercent( current, last ) {
    let isnum   = ( last > 0 );
    let isup    = ( current >= last );
    let change  = isup  ? ( current - last ) : ( last - current );
    let percent = isnum ? ( change / last * 100.0 ) : 0.0;
    let sign    = isup  ? '+' : '-';
    let arrow   = isup  ? '▲' : '▼';
    return { change, percent, sign, arrow };
  }

}
