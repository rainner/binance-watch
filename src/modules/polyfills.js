/**
 * String trimming
 */
(function() {
  'use strict';

  if ( !String.prototype.trim ) {
    String.prototype.trim = function() {
      return this.replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '' );
    };
  }
  if ( !String.prototype.trimLeft ){
    String.prototype.trimLeft = function() {
      return this.replace( /^[\s\uFEFF\xA0]+/g, '' );
    };
  }
  if ( !String.prototype.trimRight ) {
    String.prototype.trimRight = function() {
      return this.replace( /[\s\uFEFF\xA0]+$/g, '' );
    };
  }
})();

/**
 * Object.keys
 */
(function() {
  if ( typeof Object.keys != 'function' ) {
    Object.keys = (function() {
      'use strict';

      var hasOwnProperty = Object.prototype.hasOwnProperty,
          hasDontEnumBug = !({ toString: null }).propertyIsEnumerable( 'toString' ),
          dontEnums = ['toString','toLocaleString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','constructor'],
          dontEnumsLength = dontEnums.length;

      return function( obj ) {
        if ( typeof obj !== 'function' && ( typeof obj !== 'object' || obj === null ) ) {
          throw new TypeError( 'Object.keys called on non-object' );
        }
        var result = [], prop, i;

        for ( prop in obj ) {
          if ( hasOwnProperty.call( obj, prop ) ) {
            result.push( prop );
          }
        }
        if ( hasDontEnumBug ) {
          for ( i = 0; i < dontEnumsLength; i++ ) {
            if ( hasOwnProperty.call( obj, dontEnums[i] ) ) {
              result.push( dontEnums[i] );
            }
          }
        }
        return result;
      };
    })();
  }
})();

/**
 * Object.assign
 */
(function() {
  if ( typeof Object.assign != 'function' ) {
    Object.assign = (function() {
      'use strict';

      return function( target ) {
        if ( target === undefined || target === null ) {
          throw new TypeError( 'Cannot convert undefined or null to object' );
        }
        var output = Object( target );

        for ( var index = 1; index < arguments.length; index++ ) {
          var source = arguments[ index ];

          if ( source !== undefined && source !== null ) {
            for ( var nextKey in source ) {
              if ( source.hasOwnProperty( nextKey ) ) {
                output[ nextKey ] = source[ nextKey ];
              }
            }
          }
        }
        return output;
      };
    })();
  }
})();

/**
 * Request Animation Frame
 */
(function() {
  'use strict';

  if ( typeof window !== 'object' ) return;

  var vendors  = ['webkit', 'moz'];
  var lastTime = 0;

  for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x ) {
    window.requestAnimationFrame = window[ vendors[x] + 'RequestAnimationFrame' ];
    window.cancelAnimationFrame  = window[ vendors[x] + 'CancelAnimationFrame' ] || window[ vendors[x] + 'CancelRequestAnimationFrame' ];
  }
  if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = function( callback, element ) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
      var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if ( !window.cancelAnimationFrame ) {
    window.cancelAnimationFrame = function( id ) {
      clearTimeout( id );
    };
  }
})();

/**
 * Element selector match support
 */
(function() {
  'use strict';

  if ( !Element.prototype.matches ) {
    Element.prototype.matches =
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function( s ) {
      var matches = ( this.document || this.ownerDocument ).querySelectorAll( s ), i = matches.length;
      while ( --i >= 0 && matches.item( i ) !== this ) {}
      return i > -1;
    };
  }
})();

/**
 * Element classList support
 */
(function() {
  'use strict';

  if ( typeof window !== 'object' ) return;
  if ( typeof window.Element === 'undefined' ) return;
  if ( 'classList' in document.documentElement ) return;

  var prototype = Array.prototype,
      push      = prototype.push,
      splice    = prototype.splice,
      join      = prototype.join;

  var indexOf = prototype.indexOf || function( item ) {
    for ( var i = 0, t = this.length; i < t; ++i ) {
      if ( i in this && this[i] === item ) return i;
    }
    return -1;
  };

  function DOMTokenList( el ) {
    this.el = el;

    var classes = String( el.className || '' ).trim().split( /\s+/ );

    for ( var i = 0, t = classes.length; i < t; ++i ) {
      push.call( this, classes[i] );
    }
  };

  DOMTokenList.prototype = {

    item: function( index ) {
      return this[ index ] || null;
    },
    contains: function( token ) {
      return indexOf.call( this, token ) != -1;
    },
    add: function( token ) {
      if( this.contains( token ) ) return;
      push.call( this, token );
      this.el.className = this.toString();
    },
    remove: function( token ) {
      var index = indexOf.call( this, token );
      if( index == -1 ) return;
      splice.call( this, index, 1 );
      this.el.className = this.toString();
    },
    toggle: function( token ) {
      var index = indexOf.call( this, token );
      if( index == -1 ){ push.call( this, token ); }
      else{ splice.call( this, index, 1 ); }
      this.el.className = this.toString();
    },
    toString: function() {
      return join.call( this, ' ' );
    },
  };

  window.DOMTokenList = DOMTokenList;

  function defineElementGetter( obj, prop, getter ) {
    if( Object.defineProperty ) {
      Object.defineProperty( obj, prop, { get: getter } );
    } else {
      obj.__defineGetter__( prop, getter );
    }
  }
  defineElementGetter( Element.prototype, 'classList', function() {
    return new DOMTokenList( this );
  });
})();








