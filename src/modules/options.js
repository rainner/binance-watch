/**
 * App options
 */
const utils = require( './utils' );

// default options
const defaultOptions = {
  help     : false,    // [bool]    for showing help outpout.
  pair     : 'BTC',    // [string]  trading pair (BTC, ETH, BNB, USDT, blank = all).
  limit    : 0.00005,  // [float]   only check pairs under or equal this price (0 = all).
  percent  : 1,        // [float]   percent change in price to trigger alert.
  target   : 'price',  // [string]  target value to watch for change (price, percent).
  type     : '',       // [string]  filter alerts by type (gain, loss).
  check    : 10,       // [int]     how often to compare values (seconds).
  mute     : 30,       // [int]     duration to mute outgoing notifications (seconds).
  decimals : 8,        // [int]     number of digits after the decimal point in prices.
  once     : false,    // [bool]    only alert once for each pair.
  prices   : false,    // [bool]    show latest usdt pair prices on every --check update.
  notify   : false,    // [bool]    toggle system notifications.
  email    : '',       // [string]  e-mail address for notifications.
};

// extract options from script process arguments
const getProcessOptions = ( args ) => {
  let options = {};
  let isParam = ( p ) => p.indexOf( '--' ) !== -1;

  args.forEach( ( param, i ) => {
    let next = String( args[ i + 1 ] || '' ).trim();

    if ( param === '--help' ) {
      options.help = true;
    }
    if ( param === '--pair' && !isParam( next ) ) {
      options.pair = utils.toStr( next, options.pair ).toUpperCase();
    }
    if ( param === '--limit' && !isParam( next ) ) {
      options.limit = utils.toFloat( next, options.limit );
    }
    if ( param === '--percent' && !isParam( next ) ) {
      options.percent = utils.toFloat( next, options.percent );
    }
    if ( param === '--target' && !isParam( next ) ) {
      options.target = utils.toStr( next, options.target ).toUpperCase();
    }
    if ( param === '--type' && !isParam( next ) ) {
      options.type = utils.toStr( next, options.type ).replace( /[^a-z]+/, '' );
    }
    if ( param === '--check' && !isParam( next ) ) {
      options.check = utils.toInt( next, options.check );
    }
    if ( param === '--mute' && !isParam( next ) ) {
      options.mute = utils.toInt( next, options.mute );
    }
    if ( param === '--decimals' && !isParam( next ) ) {
      options.decimals = utils.toInt( next, options.decimals );
    }
    if ( param === '--once' ) {
      options.once = !isParam( next ) ? utils.toBool( next ) : true;
    }
    if ( param === '--prices' ) {
      options.prices = !isParam( next ) ? utils.toBool( next ) : true;
    }
    if ( param === '--notify' ) {
      options.notify = !isParam( next ) ? utils.toBool( next ) : true;
    }
    if ( param === '--email' && !isParam( next ) ) {
      options.email = utils.toStr( next, options.email ).trim().toLowerCase();
    }
  });
  return options;
};

// extract and merge custom options with default options
module.exports = {

  // default options
  _options: Object.assign( {}, defaultOptions ),

  // get options object
  getOptions() {
    return this._options;
  },

  // parse options from process
  fromProcess( process ) {
    if ( process && Array.isArray( process.argv ) ) {
      this._options = Object.assign( {}, defaultOptions, getProcessOptions( process.argv ) );
    }
    return this.getOptions();
  },

  // merge options with existing object
  fromObject( options ) {
    if ( typeof options === 'object' ) {
      this._options = Object.assign( {}, defaultOptions, options );
    }
    return this.getOptions();
  },

};

