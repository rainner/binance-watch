/**
 * Console log wrapper
 */
export default function() {
  const w = global || window || null;
  if ( !w || !w.DEBUG || !w.console ) return;

  for ( let i = 0; i < arguments.length; ++i ) {
    if ( typeof arguments[ i ] === 'object' ) {
      arguments[ i ] = JSON.stringify( arguments[ i ], null, 2 );
    }
  }
  console.log( '-'.repeat( 100 ) );
  console.log.apply( console, arguments );
}
