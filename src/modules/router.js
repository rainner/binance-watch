/**
 * Basic URL hash router
 */
export default class Router {

  // constructor
  constructor() {
    this._routes = {};
    this._init();
  }

  // get routes data
  getRoutes() {
    return this._routes;
  }

  // set a url hash route
  setRoute( route ) {
    route = this._path( route );
    window.location.hash = route;
  }

  // add custom route and callback to list
  on( route, callback ) {
    route = this._path( route );
    if ( !route || typeof callback !== 'function' ) return;
    this._routes[ route ] = callback;
  }

  // delete route handler
  off( route ) {
    route = this._path( route );
    if ( this._routes.hasOwnProperty( route ) ) {
      delete this._routes[ route ];
    }
  }

  // trigger saved handler for a path
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
    const _w = window;
    _w.addEventListener( 'hashchange', e => { this.trigger( _w.location.hash ) } );
    _w.addEventListener( 'load', e => { this.trigger( _w.location.hash ) } );
  }
}
