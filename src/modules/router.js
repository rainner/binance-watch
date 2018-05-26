/**
 * Basic URL hash router
 */
export default class Router {

  // constructor
  constructor() {
    this._routes = {};
    this._history = [];
    this._init();
  }

  // get routes data
  getRoutes() {
    return this._routes;
  }

  // get last route from history
  getLastRoute() {
    let total = this._history.length;
    if ( total > 1 ) return this._history[ total - 2 ];
    if ( total > 0 ) return this._history[ total - 1 ];
    return '';
  }

  // set a url hash route
  setRoute( route ) {
    route = this._path( route );
    window.location.hash = route;
    this._history.push( route );

    if ( this._history.length > 5 ) {
      this._history = this._history.slice( 0, 5 );
    }
  }

  // add custom route and callback to list
  on( route, callback ) {
    route = this._path( route );
    if ( !route || typeof callback !== 'function' ) return;
    this._routes[ route ] = callback;
  }

  // trigegr saved handler for a path
  trigger( path ) {
    path = this._path( path );
    if ( !path ) return;

    Object.keys( this._routes ).forEach( route => {
      let cb = this._routes[ route ];

      // path matches route, call handler as is
      if ( path === route ) return cb();

      // use regexp to test route
      let reg = new RegExp( '^'+ route +'$' );
      let matches = reg.exec( path );

      // found something, pass regexp matches as arguments to handler
      if ( matches ) {
        matches = Array.from( matches );
        matches.shift();
        cb.apply( cb, matches );
      }
    });
  }

  // clean path
  _path( path ) {
    return '/'+ String( path || '' ).replace( /^[\#\/]+|[\/]+$/g, '' ).trim();
  }

  // start watching for hash changes
  _init() {
    window.addEventListener( 'hashchange', e => {
      this.trigger( window.location.hash );
    });
  }
}
