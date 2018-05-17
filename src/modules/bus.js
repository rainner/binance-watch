/**
 * Basic event bus
 */
export default {
  _data: {},

  // register
  on( event, callback ) {
    if ( !event || typeof event !== 'string' ) return;
    if ( typeof callback !== 'function' ) return;
    if ( !this._data.hasOwnProperty( event ) ) this._data[ event ] = [];
    this._data[ event ].push( callback );
  },

  // emit callbacks
  emit() {
    let args  = Array.from( arguments );
    let event = args.length ? args.shift() : '';
    if ( !this._data.hasOwnProperty( event ) ) return;
    this._data[ event ].forEach( cb => cb.apply( cb, args ) );
  }
}
