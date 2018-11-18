/**
 * Price alarms helper class
 */
import Bus from './bus';
import store from './store';
import utils from './utils';

export default class Alarms extends Bus {

  /**
   * Constructor
   */
  constructor( options ) {
    super();
    this._alarms  = [];
    this._options = Object.assign( {
      // key used for storage
      key: 'alarms_data',
      // ...
    }, options );
  }

  /**
   * Save current alarms data to store and emit list
   */
  saveData() {
    this.emit( 'update', this._alarms );
    store.setData( this._options.key, this._alarms );
  }

  /**
   * Load saved history data from store
   */
  loadData() {
    let data = store.getData( this._options.key );
    if ( !data || !Array.isArray( data ) ) return;
    this._alarms = data;
    this.emit( 'update', this._alarms );
  }

  /**
   * Get count of active alarms for a symbol
   * @param {string}  symbol  Pair symbol string
   */
  getCount( symbol ) {
    return this._alarms.filter( a => ( a.symbol === symbol && a.active ) ).length;
  }

  /**
   * Adds an alarm for a pair
   * @param {object}  pairData  Pair data object from binance socket class
   * @param {number}  price     Alarm price
   */
  add( pairData, price ) {
    if ( !pairData || !pairData.symbol || !pairData.close ) return false;
    let { symbol, token, asset, pair, image, close } = pairData;

    close = parseFloat( close ) || 0; // current price
    price = parseFloat( price ) || 0; // alarm price

    if ( !close || !price || close === price ) return false;
    if ( this.find( symbol, price ).length ) return false;

    let id     = utils.randString( 20 );
    let time   = Date.now();
    let active = true;
    let arrow  = ( price > close ) ? '▲' : '▼';
    let sign   = ( price > close ) ? '≥' : '≤';
    let check  = ( price > close ) ? 'gain' : 'loss';
    let alarm  = { id, time, active, arrow, sign, check, symbol, token, asset, pair, image, close, price };

    this._alarms.push( alarm );
    this.saveData();
    return true;
  }

  /**
   * Find existing alarms for a symbol and price
   * @param {string}  symbol  Pair symbol string
   * @param {number}  price   Alarm price
   */
  find( symbol, price ) {
    price = parseFloat( price ) || 0;
    return this._alarms.filter( a => ( a.symbol === symbol && a.price === price ) );
  }

  /**
   * Remove an alarm from the list by ID
   * @param {string}  id  Unique alarm ID
   */
  remove( id ) {
    if ( !id || typeof id !== 'string' ) return;
    this._alarms = this._alarms.filter( a => a.id !== id );
    this.saveData();
  }

  /**
   * Toggle status for an alarm by ID
   * @param {string}   id      Unique alarm ID
   * @param {boolean}  active  Alarm active status
   */
  toggle( id, active ) {
    if ( !id || typeof id !== 'string' ) return;
    if ( typeof active !== 'boolean' ) return;

    this._alarms.forEach( a => {
      if ( a.id !== id ) return;
      a.active = active;
    });
    this.saveData();
  }

  /**
   * Flush all alarms
   */
  flush() {
    this._alarms = [];
    this.saveData();
  }

  /**
   * Check price of a symbol against all saved alarms
   * @param {string}   symbol    Pair symbol string
   * @param {number}   close     Current pair close price
   * @param {function} callback  Callback handler
   */
  check( symbol, close, callback ) {
    let count = 0;

    for ( let i = 0; i < this._alarms.length; ++i ) {
      let a = this._alarms[ i ];
      let price = Number( a.price || 0 );

      if ( a.symbol !== symbol || !a.active ) continue;
      if ( a.check === 'loss' && close > price ) continue;
      if ( a.check === 'gain' && close < price ) continue;

      let diff = 'equal to';
      if ( close > price ) diff = 'more than';
      if ( close < price ) diff = 'less than';

      let closeFixed = Number( close ).toFixed( 8 );
      let priceFixed = Number( price ).toFixed( 8 );

      let title = `${a.symbol} price ${a.arrow} ${closeFixed} ${a.asset}`;
      let info  = `${a.symbol} is now ${diff} your alarm price of ${priceFixed} ${a.asset}.`;

      callback( title, info, a );
      a.active = false;
      count++;
    }
    // save alarms data if alarms were triggered
    if ( count ) this.saveData();
  }

}
