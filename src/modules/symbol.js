/**
 * Returns data for a symbol (etc: FOOETH, BARBTC)
 */
module.exports = function( symbol, merge ) {

  // sanitize symbol string
  symbol = String( symbol || '' ).replace( /[^\w]+/g, '' ).toUpperCase();

  // split symbol into token and asset parts
  let reg   = /^([A-Z]+)(BTC|ETH|BNB|USDT)$/;
  let token = symbol.replace( reg, '$1' );
  let asset = symbol.replace( reg, '$2' );
  let pair  = token +'/'+ asset;
  let icon  = 'public/images/icons/'+ String( token ).toLowerCase() +'_.png';
  let route = '/symbol/'+ symbol;

  // merge optional data and return
  return Object.assign( { symbol, token, asset, pair, icon, route }, merge );
}
