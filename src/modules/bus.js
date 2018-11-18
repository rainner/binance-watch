/**
 * Basic event bus class
 */
export default class Bus {

  /**
   * Constructor
   */
  constructor() {
    this._events = {};
  }

  /**
   * Register an event handler
   * @param {string}    name      Event name
   * @param {function}  callback  Event callback function
   */
  on( name, callback ) {
    if ( !name || typeof name !== 'string' ) return;
    if ( typeof callback !== 'function' ) return;
    if ( !this._events.hasOwnProperty( name ) ) this._events[ name ] = [];
    this._events[ name ].push( callback );
  }

  /**
   * Emit an event by name (first arg) with rest of args passed to it
   */
  emit() {
    let args = Array.from( arguments );
    let name = args.length ? args.shift() : '';

    if ( this._events.hasOwnProperty( name ) ) {
      for ( let i = 0; i < this._events[ name ].length; ++i ) {
        let cb = this._events[ name ][ i ];
        cb.apply( cb, args );
      }
    }
    args = undefined; // gc
  }
}
