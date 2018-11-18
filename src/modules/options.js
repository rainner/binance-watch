/**
 * App Options helper class
 */
import Bus from './bus';
import store from './store';
import utils from './utils';

export default class Options extends Bus {

  /**
   * Constructor
   */
  constructor( options ) {
    super();
    this._key = 'app_options_data';
    this._options = {};
    this.setOptions( options );
  }

  /**
   * Loads and sets saved data from store
   */
  loadOptions() {
    let options = store.getData( this._key );
    this.setOptions( options );
  }

  /**
   * Set new options data and save to store
   * @param {object}  options  Options object
   */
  saveOptions( options ) {
    this.setOptions( options );
    store.setData( this._key, this._options );
  }

  /**
   * Set new options data and emit changes
   * @param {object}  options  Options object
   */
  setOptions( options ) {
    this._options = utils.deepMerge( {}, this._options, options );
    this.emit( 'update', this._options );
  }

  /**
   * Get options by name, or all
   * @param {string}  key  Options object key
   * @param {*}       def  Optional default value
   */
  getOptions( key, def ) {
    if ( key && typeof key === 'string' ) {
      if ( this._options.hasOwnProperty( key ) ) return this._options[ key ];
      return def;
    }
    return this._options;
  }

}
