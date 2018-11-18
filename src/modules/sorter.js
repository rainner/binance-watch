/**
 * Helper module for sorting lists
 */
import Bus from './bus';
import store from './store';

export default class Sorter extends Bus {

  /**
   * Constructor
   */
  constructor( target ) {
    super();
    this._key = 'list_sort_data';
    this._lists = {};
  }

  /**
   * Save sort data to store
   */
  saveData() {
    store.setData( this._key, this._lists );
    this.emit( 'save', this._lists );
  }

  /**
   * Load sort data from store
   */
  loadData() {
    let data = store.getData( this._key );
    this._lists = data || this._lists;
    this.emit( 'load', this._lists );
  }

  /**
   *  Get all sort data
   */
  getData() {
    return this._lists;
  }

  /**
   * Set sort data for a key
   */
  setKey( key, column, order, search ) {
    column = String( column || 'id' );
    order  = String( order || 'asc' );
    search = String( search || '' );
    this._lists[ key ] = { column, order, search };
    return this._lists[ key ];
  }

  /**
   * Get sort data for a key
   */
  getKey( key ) {
    return this._lists[ key ] || null;
  }

  /**
   * Set new sort order for a key
   */
  sortOrder( key, column, order ) {
    let d = this._lists[ key ] || null;
    if ( d ) {
      if ( column !== d.column ) { d.order = order || 'asc'; }
      else { d.order = ( d.order === 'asc' ) ? 'desc' : 'asc'; }
      d.column = column;
    }
    this.emit( 'change', this._lists );
    this.saveData();
    return d;
  }

  /**
   * Apply search text for a key
   */
  setSearch( key, text ) {
    let d = this._lists[ key ] || null;
    if ( d ) d.search = String( text || '' ).trim();
    this.emit( 'change', this._lists );
    return d;
  }

  /**
   * Check if sort column is active for a key
   */
  checkActive( key, column ) {
    let d = this._lists[ key ] || null;
    if ( d ) return ( d.column === column );
    return false;
  }

  /**
   * Get css icon style for a key
   */
  getStyles( key, column ) {
    let d = this._lists[ key ] || null;
    let c = column || d.column;
    if ( d && c === d.column && d.order === 'asc' ) return 'icon-up';
    if ( d && c === d.column && d.order === 'desc' ) return 'icon-down';
    return 'hidden';
  }

}
