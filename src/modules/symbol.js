/**
 * Returns data for a symbol (etc: FOOETH, BARBTC)
 */
const reg = /^([A-Z]+)(BTC|ETH|BNB|USDT|TUSD)$/;

module.exports = function( symbol, merge ) {

  symbol = String( symbol || '' ).replace( /[^\w]+/g, '' ).toUpperCase();

  let token = symbol.replace( reg, '$1' );
  let asset = symbol.replace( reg, '$2' );
  let name  = token;
  let pair  = token +'/'+ asset;
  let icon  = 'public/images/icons/'+ String( token ).toLowerCase() +'_.png';
  let route = '/symbol/'+ symbol;

  return Object.assign( { symbol, token, asset, name, pair, icon, route }, merge );
}
