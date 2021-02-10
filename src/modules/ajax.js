/**
 * Basic XHR ajax request module
 */
import store from './store';
import logger from './logger';
import utils from './utils';

// ajax class
export default class Ajax {

  /**
   * Constructor
   * @param {object}  options  Initial options
   */
  constructor( options ) {
    this._url = null;
    this._options = {
      // save response data to local store cache
      cache: false,
      // key prefix for local store cache
      prefix: 'ajax_data_',
      // proxy url to preppend to outgoing requests
      proxy: '',
    };
    this.setOptions( options );
  }

  /**
   * Merge options
   * @param {object}  options  Options object
   */
  setOptions( options ) {
    Object.assign( this._options, options );
  }

  /**
   * Convert object into a query string
   * @param {object}  data  Key/Val data pairs
   */
  serializeData( data ) {
    let q = [];
    if ( typeof data === 'object' ) {
      Object.keys( data ).forEach( k => {
        q.push( encodeURIComponent( k ) +'='+ encodeURIComponent( data[ k ] ) );
      });
    }
    return q.join( '&' );
  }

  /**
   * GET request alias
   */
  get( address, options ) {
    this.request( 'GET', address, options );
  }

  /**
   * POST request alias
   */
  post( address, options ) {
    this.request( 'POST', address, options );
  }

  /**
   * PUT request alias
   */
  put( address, options ) {
    this.request( 'PUT', address, options );
  }

  /**
   * DELETE request alias
   */
  delete( address, options ) {
    this.request( 'DELETE', address, options );
  }

  /**
   * AJAX request method
   * @param {string}  method   Request method verb
   * @param {string}  address  Endpoint URL
   * @param {object}  options  Request options
   */
  request( method, address, options ) {
    method  = String( method || '' ).toUpperCase();
    address = String( address || '' ).trim();
    options = Object.assign( {}, this._options, options );

    // setup options
    let isDone    = false;
    let type      = String( options.type || 'text' );
    let proxy     = String( options.proxy || '' ).trim();
    let timeout   = parseInt( options.timeout ) || 0;
    let headers   = Object.assign( {}, options.headers );
    let cacheTime = parseInt( options.cache ) || 0; // seconds to be cached
    let cacheKey  = options.prefix + utils.unique( method +'|'+ address );
    let xhr       = new XMLHttpRequest();

    // setup callbacks
    let onError   = ( typeof options.error === 'function' )   ? options.error   : function() {};
    let onSuccess = ( typeof options.success === 'function' ) ? options.success : function() {};
    let onDone    = ( typeof options.done === 'function' )    ? options.done    : function() {};

    // check params
    if ( !method ) return onError( xhr, 0, 'Must specify a request method to make a new request.' );
    if ( !address ) return onError( xhr, 0, 'Must specify a request url address to make a new request.' );

    // check cache
    if ( cacheTime ) {
      const cacheData = store.getData( cacheKey );
      if ( cacheData ) {
        onSuccess( xhr, 200, cacheData );
        onDone( xhr, 200, cacheData );
        isDone = true;
        return;
      }
    }

    // resolve full request url
    let fullUrl = utils.fullUrl( address );
    try { this._url = new URL( fullUrl ); }
    catch ( err ) {}

    // encode data for get requests
    if ( method === 'GET' && typeof options.data === 'object' ) {
      headers[ 'Content-type' ] = 'application/x-www-form-urlencoded';
      fullUrl += '?' + this.serializeData( options.data );
      options.data = null;
    }

    // init request handler
    xhr.open( method, proxy + fullUrl, true );
    xhr.responseType = type;

    // set timeout
    if ( timeout ) {
      xhr.timeout = ( timeout < 1000 ) ? 1000 * timeout : timeout;
    }

    // default headers
    xhr.setRequestHeader( 'Accept', 'application/json, text/plain, text/html, */*' );

    // send ajax header unless stated not to
    if ( !options.notAjax ) {
      xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
    }

    // check for basic auth data and set header
    if ( options.auth && typeof options.auth === 'object' ) {
      let username = String( options.auth.username || '' ).trim();
      let password = String( options.auth.password || '' ).trim();
      xhr.setRequestHeader( 'Authorization', 'Basic '+ btoa( username +':'+ password ) );
    }

    // custom headers
    Object.keys( headers ).forEach( name => {
      xhr.setRequestHeader( name, headers[ name ] );
    });

    // data load handler
    xhr.addEventListener( 'load', e => {
      let { status, response, error } = this._responseParams( 'load', xhr, type );

      logger( status, method, fullUrl );
      logger( response );

      if ( status && status < 400 ) {
        if ( cacheTime ) store.setData( cacheKey, response, cacheTime );
        onSuccess( xhr, status, response );
      } else {
        onError( xhr, status, error );
      }
      if ( !isDone ) onDone( xhr, status, response );
      isDone = true;
    });

    // request error handler
    xhr.addEventListener( 'error', e => {
      let { status, response, error } = this._responseParams( 'error', xhr, type );
      onError( xhr, status, error );
      if ( !isDone ) onDone( xhr, status, response );
      isDone = true;
    });

    // request abort handler
    xhr.addEventListener( 'abort', e => {
      let { status, response, error } = this._responseParams( 'abort', xhr, type );
      onError( xhr, status, error );
      if ( !isDone ) onDone( xhr, status, response );
      isDone = true;
    });

    // request timeout handler
    xhr.addEventListener( 'timeout', e => {
      let { status, response, error } = this._responseParams( 'timeout', xhr, type );
      onError( xhr, status, error );
      if ( !isDone ) onDone( xhr, status, response );
      isDone = true;
    });

    // send the request
    xhr.send( options.data || null );
  }

  /**
   * Parse information about the response
   * @param {string}  evt   Event type
   * @param {object}  xhr   XMLHttpRequest object
   * @param {string}  type  Expected response type
   */
  _responseParams( evt, xhr, type ) {
    let hostname = this._url.hostname || 'nohost';
    let status   = xhr.status | 0;
    let response = ( type === 'text' ) ? xhr.responseText : xhr.response;
    let error    = '';

    if ( evt === 'load' && status >= 400 && response ) {
      error = `${hostname}(${status}): `+ this._dataReduce( response );
    }
    if ( evt === 'error' ) {
      error = `${hostname}(${status}): The request has been aborted due to a network related problem.`;
    }
    if ( evt === 'abort' ) {
      error = `${hostname}(${status}): The request has been aborted by the client before completing.`;
    }
    if ( evt === 'timeout' ) {
      error = `${hostname}(${status}): The request has been aborted due to the server not responding.`;
    }
    if ( ( status <= 0 || status >= 400 ) && !error ) {
      error = `${hostname}(${status}): The request was rejected by the server and no error message was given.`;
    }
    return { status, response, error };
  }

  /**
   * Reduce data object into a single string line.
   * @param {object}  data     Object or string to be scanned
   * @param {array}   output   Output array
   */
  _dataReduce( data, output ) {
    output = output || [];

    if ( data && typeof data === 'string' ) {
      output.push( data );
    }
    else if ( data && typeof data === 'object' ) {
      Object.keys( data ).forEach( key => {
        this._dataReduce( data[ key ], output );
      });
    }
    return output.join( ' | ' ).replace( /[\t\r\n\s]+/g, ' ' ).trim();
  }

}

