/**
 * Handles saving data to a history list
 */
import Bus from './bus';
import store from './store';
import utils from './utils';

export default class History extends Bus {

  /**
   * Constructor
   */
  constructor( options ) {
    super();
    this._alarms = [];
    this._sto = null;
    this._options = Object.assign( {
      // key used for storage
      key: 'history_data',
      // auto remove entries past this value (secs)
      expire: 1800,
      // total number of entries to keep in list
      total: 20,
      // ...
    }, options );
  }

  /**
   * Save current history data to store and emit list
   */
  saveData() {
    this._autoClean();
    this.emit( 'update', this._alarms );
    store.setData( this._options.key, this._alarms );
    if ( this._sto ) clearTimeout( this._sto );
    this._sto = setTimeout( this.saveData.bind( this ), 30000 );
  }

  /**
   * Load saved history data from store
   */
  loadData() {
    let data = store.getData( this._options.key );
    if ( !data || !Array.isArray( data ) ) return;
    this._alarms = data;
    this.saveData();
  }

  /**
   * Add data to history
   * @param {string}  title  Title string
   * @param {string}  info   Info string
   * @param {string}  icon   Icon image URL
   */
  add( title, info, icon ) {
    if ( !title || !info ) return;
    let id    = utils.randString( 20 );
    let time  = Date.now();
    let isNew = true;
    this._alarms.unshift( { id, time, isNew, title, info, icon } );
    this.saveData();
  }

  /**
   * Remove an entry from the list by ID
   * @param {string}  id  Unique entry ID
   */
  remove( id ) {
    if ( !id || typeof id !== 'string' ) return;
    this._alarms = this._alarms.filter( e => e.id !== id );
    this.saveData();
  }

  /**
   * Reset new entry indicators
   */
  reset() {
    this._alarms.forEach( e => { e.isNew = false; } );
    this.saveData();
  }

  /**
   * Remove all entries from the list
   */
  flush() {
    this._alarms = [];
    this.saveData();
  }

  /**
   * Cleanup the list and emit changes
   */
  _autoClean() {
    let time = Date.now();
    let expire = parseInt( this._options.expire ) | 0;
    let total = parseInt( this._options.total ) | 0;
    if ( expire ) this._alarms = this._alarms.filter( e => ( ( time - e.time ) / 1000 ) < expire );
    if ( total ) this._alarms = this._alarms.slice( 0, total );
  }
}
