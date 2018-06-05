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

  // get history data
  getData() {
    return this._data;
  },

  // load data from store
  loadData() {
    let data = store.getData( this._key );
    if ( !Array.isArray( data ) ) return;
    this._data = data;
  },

  // add data to history
  add( title, info, icon ) {
    if ( !title || !info ) return;
    let id     = utils.randString( 20 );
    let time   = Date.now();
    this._data = this._data.filter( e => ( ( time - e.time ) / 1000 ) < this._maxage );
    this._data.unshift( { id, time, title, info, icon } ); // new entries show first
    return store.setData( this._key, this._data );
  },

  // delete data from history
  delete( id ) {
    if ( !id ) return;
    this._data = this._data.filter( e => e.id !== id );
    return store.setData( this._key, this._data );
  },

  // flush all data from history
  flush() {
    this._data = [];
    return store.setData( this._key, this._data );
  },
}
