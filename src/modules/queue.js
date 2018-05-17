/**
 * Handles adding things to a queue for debounced execution
 */
module.exports = {

  // for sending out mail and notifications off a queue on a timer
  _queue: [],
  _callback: null,
  _sto: null,

  // push message data to queue
  add( data ) {
    this._queue.push( data );
  },

  // remove and return next item in queue to be executed
  next() {
    return ( this._queue.length ) ? this._queue.shift() : null;
  },

  // flush queue data
  flush() {
    this._queue = [];
  },

  // stop interval tick
  stop() {
    if ( this._sto ) clearTimeout( this._sto );
  },

  // debounce handler for all queue data as a batch
  onBatch( delay, callback ) {
    this.stop();
    this._delay = parseInt( delay ) || 10;
    this._callback = callback;
    this._dispatchBatch();
  },

  // debounce handler for next item in the queue
  onNext( delay, callback ) {
    this.stop();
    this._delay = parseInt( delay ) || 10;
    this._callback = callback;
    this._dispatchNext();
  },

  // dispatcher for message queue
  _dispatchBatch() {
    this._sto = setTimeout( this._dispatchBatch.bind( this ), 1000 * this._delay );
    if ( !this._queue.length || typeof this._callback !== 'function' ) return;
    this._callback( this._queue );
    this._queue = [];
  },

  // dispatcher for message queue
  _dispatchNext() {
    this._sto = setTimeout( this._dispatchNext.bind( this ), 1000 * this._delay );
    if ( !this._queue.length || typeof this._callback !== 'function' ) return;
    this._callback( this._queue.shift() );
  },
}
