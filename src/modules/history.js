/**
 * Handles saving data to a history list
 */
import store from './store';
import utils from './utils';

export default {

  // local data
  _key: 'history_data', // store key
  _maxage: 3600, // max age for entries (seconds)
  _data: [], // history data
  _callback: null, // data change handler

  // load data from store
  loadData() {
    let data = store.getData( this._key );
    if ( !Array.isArray( data ) ) return;
    this._data = data;
  },

  // get history data
  getData() {
    return this._data.slice();
  },

  // set handler for history data change
  onChange( callback ) {
    this._callback = callback;
  },

  // check and call custom history data handler
  callHandler() {
    if ( typeof this._callback === 'function' ) {
      let data = this.getData();
      this._callback( data );
    }
  },

  // add data to history
  add( title, info, icon ) {
    if ( !title || !info ) return;
    let id     = utils.randString( 20 );
    let time   = Date.now();
    this._data = this._data.filter( e => ( ( time - e.time ) / 1000 ) < this._maxage );
    this._data.unshift( { id, time, title, info, icon } ); // new entries show first
    this.callHandler();
    return store.setData( this._key, this._data );
  },

  // delete data from history
  delete( id ) {
    if ( !id ) return;
    this._data = this._data.filter( e => e.id !== id );
    this.callHandler();
    return store.setData( this._key, this._data );
  },

  // flush all data from history
  flush() {
    this._data = [];
    this.callHandler();
    return store.setData( this._key, this._data );
  },
}
