/**
 * Basic XHR ajax request module
 */
import store from './store';
import md5 from './md5';

// ajax class
export default class Ajax {

  // constructor
  constructor( options ) {
    this._options = {
      // save response data to local store cache
      cache: false,
      // key prefix for local store cache
      prefix: 'ajax_data_',
      // proxy url to preppend to outgoing requests
      proxy: '',
    };
    this._url = null;
    this.setOptions( options );
  }

  // merge news options
  setOptions( options ) {
    this._options = Object.assign( this._options, options );
  }

  // alias for get request
  get( address, options ) {
    this.request( 'GET', address, options );
  }

  // alias for post request
  post( address, options ) {
    this.request( 'POST', address, options );
  }

  // alias for put request
  put( address, options ) {
    this.request( 'PUT', address, options );
  }

  // alias for delete request
  delete( address, options ) {
    this.request( 'DELETE', address, options );
  }

  // main request method
  request( method, address, options ) {
    method  = String( method || '' ).toUpperCase();
    address = String( address || '' ).trim();
    options = Object.assign( {}, this._options, options );

    // setup options
    let isDone    = false;
    let type      = String( options.type || 'text' );
    let timeout   = parseInt( options.timeout ) || 0;
    let headers   = Object.assign( {}, options.headers );
    let cacheTime = parseInt( options.cache ) || 0; // seconds to be cached
    let cacheKey  = options.prefix + md5( method +'|'+ address );
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
      if ( cacheData ) return onSuccess( xhr, 200, cacheData );
    }

    // encode data for get requests
    if ( method === 'GET' && typeof options.data === 'object' ) {
      headers[ 'Content-type' ] = 'application/x-www-form-urlencoded';
      address += '?' + this._encode( options.data );
      options.data = null;
    }

    // add proxy to url if needed
    if ( options.proxy && typeof options.proxy === 'string' ) {
      address = options.proxy.trim() + address;
    }

    // build info about url
    try { this._url = new URL( address ); }
    catch ( err ) { this._url = null; }

    // init request handler
    xhr.open( method, address, true );
    xhr.responseType = type;

    // set timeout
    if ( timeout ) {
      xhr.timeout = ( timeout < 1000 ) ? 1000 * timeout : timeout;
    }

    // default headers
    xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
    xhr.setRequestHeader( 'Accept', 'application/json, text/plain, text/html, */*' );

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
      let { status, response, error, host } = this._responseParams( xhr, type );

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
      let { status, response, error, host } = this._responseParams( xhr, type );
      onError( xhr, status, error );
      if ( !isDone ) onDone( xhr, status, response );
      isDone = true;
    });

    // request abort handler
    xhr.addEventListener( 'abort', e => {
      let { status, response, error, host } = this._responseParams( xhr, type );
      onError( xhr, status, 'The HTTP request has been aborted by the client ('+ host +').' );
      if ( !isDone ) onDone( xhr, status, response );
      isDone = true;
    });

    // request timeout handler
    xhr.addEventListener( 'timeout', e => {
      let { status, response, error, host } = this._responseParams( xhr, type );
      onError( xhr, status, 'The HTTP request has been aborted due to the server not responding in time ('+ host +').' );
      if ( !isDone ) onDone( xhr, status, response );
      isDone = true;
    });

    // send the request
    xhr.send( options.data || null );
  }

  // get response status and data from xhr
  _responseParams( xhr, type ) {
    let host     = this._getHost();
    let status   = xhr.status | 0;
    let response = ( type === 'text' ) ? xhr.responseText : xhr.response;
    let error    = '';
    // error based on status codes
    if ( status === 400 ) error = status +': The request could not be understood by the server due to malformed syntax ('+ host +').';
    if ( status === 401 ) error = status +': You are not authorized to view the response of this request without authentication ('+ host +').';
    if ( status === 403 ) error = status +': The server understood the request, but is refusing to fulfill it ('+ host +').';
    if ( status === 404 ) error = status +': The server did not find anything matching the requested route ('+ host +').';
    if ( status === 405 ) error = status +': The method specified for this request is not allowed for the requested route ('+ host +').';
    if ( status === 407 ) error = status +': The client must first authenticate itself with the proxy server to make requests ('+ host +').';
    if ( status === 408 ) error = status +': The server did not produce a response in time for the requested route ('+ host +').';
    if ( status === 500 ) error = status +': The server encountered an unexpected condition which prevented it from fulfilling the request ('+ host +').';
    if ( status === 503 ) error = status +': The server is unable to handle the request due to temporary overloading or maintenance ('+ host +').';
    // fallback error messages
    if ( !error && status ) error = status +': There has been a problem with the response from the server ('+ host +').';
    if ( !error ) error = 'There has been a problem sending the request to the server ('+ host +').';
    // response params
    return { status, response, error, host };
  }

  // get host name for current request
  _getHost() {
    if ( !this._url ) return '';
    let proto = this._url.protocol || 'http:';
    let host  = this._url.host     || 'localhost';
    return proto +'//'+ host +'/...';
  }

  // url encode object data
  _encode( data ) {
    let output = [];
    Object.keys( data ).forEach( key => {
      output.push( encodeURIComponent( key ) +'='+ encodeURIComponent( data[ key ] ) );
    });
    return output.join( '&' );
  }

}

