/**
 * Prints console help information
 */
const logger = require( './logger' );
const utils  = require( './utils' );

module.exports = {

  // print header info based on current options
  printHeader( options, pairs ) {
    const o = options;

    let pairInfo  = 'all pairs';
    let muteTime  = utils.elapsed( o.mute );
    let limitInfo = o.limit ? 'under '+ o.limit : 'at any price';
    let checkInfo = utils.elapsed( o.check );

    if ( o.type ) logger.info( 'Only showing pairs with', o.type, 'in value' );
    if ( o.once ) logger.info( 'Alerts for each pair will only show once every', checkInfo );
    if ( o.notify || o.email ) logger.info( 'System and e-mail notifications will be sent every', muteTime );
    if ( o.email ) logger.info( 'E-mail notifications will be sent to:', o.email );

    if ( o.pair ) {
      pairInfo = o.pair +' pairs';
      if ( Array.isArray( pairs ) ) {
        pairInfo = utils.noun( pairs.length, o.pair +' pair', o.pair +' pairs' );
      }
    }
    logger.info( 'Checking for', o.percent +'%', o.target, 'change on', pairInfo, limitInfo );
  },

  // print options to console
  printOptions( options ) {
    const o = options;
    const c = 12;
    const l = logger;
    const u = utils;

    l.log( ' ' );
    l.log( 'white',  'Usage' );
    l.log( 'yellow', '$ node ./script [options]' );
    l.log( ' ' );
    l.log( 'white',  u.fill( 'Option', c ),     u.fill( 'Current', c ),  u.fill( 'Info', c ), );
    l.log( 'yellow', u.fill( '--help', c ),     u.fill( '', c ),         'Show this help message.' );
    l.log( 'yellow', u.fill( '--pair', c ),     u.fill( o.pair, c ),     'Trading pair (BTC ETH BNB USDT).' );
    l.log( 'yellow', u.fill( '--limit', c ),    u.fill( o.limit, c ),    'Only check pairs under or equal this price.' );
    l.log( 'yellow', u.fill( '--percent', c ),  u.fill( o.percent, c ),  'The percent change in price to trigger alerts.' );
    l.log( 'yellow', u.fill( '--target', c ),   u.fill( o.target, c ),   'Target value to watch for change (price, percent).' );
    l.log( 'yellow', u.fill( '--type', c ),     u.fill( o.type, c ),     'Filter alerts by type (gain, loss).' );
    l.log( 'yellow', u.fill( '--check', c ),    u.fill( o.check, c ),    'How often to check compare values (seconds).' );
    l.log( 'yellow', u.fill( '--mute', c ),     u.fill( o.mute, c ),     'Duration to mute outgoing notifications (seconds).' );
    l.log( 'yellow', u.fill( '--decimals', c ), u.fill( o.decimals, c ), 'Number of digits after the decimal point in prices.' );
    l.log( 'yellow', u.fill( '--once', c ),     u.fill( o.once, c ),     'Only alert once for each pair within --check period.' );
    l.log( 'yellow', u.fill( '--notify', c ),   u.fill( o.notify, c ),   'Enable system notifications.' );
    l.log( 'yellow', u.fill( '--email', c ),    u.fill( o.email, c ),    'Enable e-mail notifications.' );
    l.log( ' ' );
  },
}


