/**
 * Handle talking to coincap.io to get coin related data
 * https://docs.coincap.io/
 */
import Bus from './bus';

export default class Coincap extends Bus {

  /**
   * Constructor
   */
  constructor() {
    super();
    this._ajax  = null;
    this._coins = {};
  }

  /**
   * Set ajax module reference to use for requests
   */
  useAjax( ajax ) {
    this._ajax = ajax;
  }

  /**
   * Get tokens data object
   */
  getData() {
    return this._coins;
  }

  /**
   * fetch list of all tokens and their names from API
   */
  fetchAll() {
    if ( !this._ajax ) return;
    this._ajax.get( `https://api.coincap.io/v2/assets?limit=2000`, {
      type: 'json',
      cache: 600,
      proxy: false,
      success: ( xhr, status, res ) => {
        if ( !res || !Array.isArray( res.data ) ) return;
        for ( let c of res.data ) { this._coins[ c.symbol ] = c; }
        this.emit( 'allcoins', this._coins );
      }
    });
  }

  /**
   * Fetch market cap data for a token
   */
  fetchCoin( id, cb ) {
    if ( !this._ajax || !id ) return;
    this._ajax.get( `https://api.coincap.io/v2/assets/${id}`, {
      type: 'json',
      cache: 300,
      proxy: false,
      success: ( xhr, status, res ) => {
        if ( !res || !res.data ) return;
        if ( typeof cb === 'function' ) cb( res.data );
        this.emit( 'coindata', res.data );
      }
    });
  }

}
