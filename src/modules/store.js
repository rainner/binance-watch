/**
 * Web cache handler
 */

export default {

  // local props
  _api    : 'localStorage',
  _prefix : 'webcache_',
  _ttl    : 0,

  // save data to cache
  setData( key, data, time ) {
    return this._save( key, data, time );
  },

  // get saved data for a key as is
  getData( key ) {
    this._clean();
    return this._fetch( key );
  },

  // delete saved data for key
  deleteData( key ) {
    return this._delete( key );
  },

  // santizer for keys
  _key( key ) {
    return this._prefix + String( key || '' ).replace( /[^\w]+/g, '_' );
  },

  // error handler
  _error( e ) {
    let _code = e.code    |  0;
    let _name = e.name    || 'UnknownError';
    let _info = e.message || 'Problem with ' + this._api +' browser API.' ;
    console.error( 'StorageError ('+ _code +'):', _info, '('+ _name +').' );
    return false;
  },

  // try saving the data and handle any errors
  _save( key, data, ttl ) {
    try {
      const _store  = window[ this._api ];
      const _key    = this._key( key );
      const _time   = Date.now();
      const _ttl    = parseInt( ttl ) || this._ttl;
      const _string = JSON.stringify( { _time, _ttl, data } );
      _store.setItem( _key, _string );
      return true;
    }
    catch ( e ) {
      return this._error( e );
    }
  },

  // try fetching data for key
  _fetch( key ) {
    try {
      const _store  = window[ this._api ];
      const _key    = this._key( key );
      const _parsed = JSON.parse( _store.getItem( _key ) || '{}' );
      return ( _parsed && _parsed.data ) ? _parsed.data : null;
    }
    catch ( e ) {
      return this._error( e );
    }
  },

  // try deleting data by key
  _delete( key ) {
    try {
      const _store = window[ this._api ];
      const _key   = this._key( key );
      _store.removeItem( _key );
      return true;
    }
    catch ( e ) {
      return this._error( e );
    }
  },

  // clean all expired items from storage
  _clean() {
    try {
      const _store = window[ this._api ];
      const _time  = Date.now();

      // loop keys
      for ( let i = 0; i < _store.length; i++ ) {

        // make sure it's a key managed by this object
        const _key = _store.key( i );
        if ( _key.indexOf( this._prefix ) < 0 ) continue;

        // get data for key
        const _data = JSON.parse( _store.getItem( _key ) || '{}' );
        if ( !_data._time || !_data._ttl ) continue; // need these

        // check if enough time has passed and delete key
        const _secs = ( _time - _data._time ) / 1000;
        if ( _secs < _data._ttl ) continue; // still fresh
        _store.removeItem( _key );
      }
      return true;
    }
    catch ( e ) {
      return this._error( e );
    }
  },

}
