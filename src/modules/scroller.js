/**
 * Scroller Class.
 * For calling custom function based on scroll position, or to auto-scroll.
 */
export default class Scroller {

  // constructor
  constructor( target, options ) {
    let _t = document.scrollingElement || document.documentElement || window;

    this._options = Object.assign( {
      // setInterval time in milliseconds to control the throttled scroll handler.
      intervalTime: 200,
      // interpolation factor number for the scrolling animation (bigger = slower).
      easeFactor: 10,
      // ...
    }, options );

    this._target    = ( target instanceof Element ) ? target : _t;
    this._pos       = 0;
    this._to        = 0;
    this._min       = 0;
    this._max       = 0;
    this._scrolling = true;
    this._scrollcb  = null;
    this._callbacks = [];
    this._jumpcb    = null;
    this._onTick    = this._onTick.bind( this );
    this._onScroll  = this._onScroll.bind( this );
    this._onResize  = this._onResize.bind( this );
    this._loop      = this._loop.bind( this );
    this._sint      = setInterval( this._onTick, this._options.intervalTime );

    window.addEventListener( 'scroll', this._onScroll, false );
    window.addEventListener( 'resize', this._onResize, false );
  }

  // function to call on actual scroll event
  onScroll( callback ) {
    this._scrollcb = callback;
  }

  // when scroll position changes
  onChange( callback ) {
    this._addCallback( false, 0, callback );
  }

  // when scroll direction is going up
  onUp( callback ) {
    this._addCallback( 'up', 0, callback );
  }

  // when scroll direction is going down
  onDown( callback ) {
    this._addCallback( 'down', 0, callback );
  }

  // when scroll position is more than given pos
  moreThan( pos, callback ) {
    this._addCallback( 'more', pos, callback );
  }

  // when scroll position is less than given pos
  lessThan( pos, callback ) {
    this._addCallback( 'less', pos, callback );
  }

  // when elements enter and leave the viewport area
  onVisible( target, callback ) {
    let elms = this._getElmList( target );
    let emap = new Array( elms.length ).fill( false );
    this._addCallback( 'reveal', 0, callback, { elms, emap } );
  }

  // auto scroll page to a target destination
  jumpTo( dest, callback ) {
    let _h = Math.max( 0, Math.floor( this._target.scrollHeight || 0, this._target.clientHeight || 0 ) );

    this._pos = this._target.scrollTop | 0;
    this._to  = this._pos;
    this._max = Math.floor( _h - this._target.clientHeight || 0 );

    if ( typeof dest === "number" ) {
      this._to = dest;
    }
    else if ( typeof dest === "object" && dest instanceof Element ) {
      this._to = ( this._pos + dest.getBoundingClientRect().top ) || this._pos;
    }
    else if ( typeof dest === "string" ) {
      dest = dest.trim();
      if ( /^(up|top)$/i.test( dest ) ) { this._to = this._min; } else
      if ( /^(middle|center)$/i.test( dest ) ) { this._to = this._max / 2; } else
      if ( /^(down|bottom)$/i.test( dest ) ) { this._to = this._max; } else
      if ( /^([0-9]+)$/.test( dest ) ) { this._to = parseInt( dest ); }
      else {
        let node = document.querySelector( dest );
        this._to = node ? ( this._pos + node.getBoundingClientRect().top ) : this._pos;
      }
    }
    this._to = Math.max( this._min, Math.min( this._to, this._max ) );
    this._jumpcb = callback;
    this._loop();
  }

  // reset callbacks that only fire once, so they can fire agan
  resetCallbacks() {
    for ( let i = 0; i < this._callbacks.length; ++i ) {
      this._callbacks[ i ].called = false;
    }
  }

  // called from setInterval ticks
  _onTick() {
    if ( !this._scrolling ) return;

    let sp     = this._target.scrollTop | 0;
    let height = this._target.clientHeight | 0;

    for ( let i = 0; i < this._callbacks.length; ++i ) {
      let cb = this._callbacks[ i ];

      if ( !cb.trigger ) {
        cb.called = false;
        cb.callback( sp );
        continue;
      }

      if ( cb.trigger === 'up' ) {
        let check = ( sp < this._pos );
        if ( !cb.called && check ) cb.callback( sp );
        cb.called = check;
        continue;
      }

      if ( cb.trigger === 'down' ) {
        let check = ( sp > this._pos );
        if ( !cb.called && check ) cb.callback( sp );
        cb.called = check;
        continue;
      }

      if ( cb.trigger === 'more' ) {
        let check = ( sp > cb.position );
        if ( !cb.called && check ) cb.callback( sp );
        cb.called = check;
        continue;
      }

      if ( cb.trigger === 'less' ) {
        let check = ( sp < cb.position );
        if ( !cb.called && check ) cb.callback( sp );
        cb.called = check;
        continue;
      }

      if ( cb.trigger === 'reveal' ) {
        for ( let x = 0; x < cb.elms.length; ++x ) {
          let elm     = cb.elms[ x ];
          let called  = cb.emap[ x ];
          let box     = elm.getBoundingClientRect();
          let yPos    = box.top + ( box.height / 2 );
          let visible = ( yPos >= 0 && yPos <= height );

          if ( ( !called && visible ) || ( called && !visible ) ) {
            cb.callback( elm, visible, sp );
          }
          cb.emap[ x ] = visible;
        }
        continue;
      }
    }
    this._pos = sp;
    this._scrolling = false;
  }

  // on target scroll
  _onScroll( e ) {
    this._scrolling = true;
    if ( typeof this._scrollcb === 'function' ) this._scrollcb( e );
  }

  // on page resize
  _onResize( e ) {
    this._scrolling = true;
  }

  // add custom callback to the list
  _addCallback( trigger, position, callback, other ) {
    if ( typeof callback !== 'function' ) return;
    this._callbacks.push( Object.assign( {
      called   : false,         // if already called
      trigger  : trigger,       // how to call it (more/less than, or none)
      position : position | 0,  // when to call it, or none
      callback : callback,      // custom callback
    }, other ) );
  }

  // resolve list of elements from an arg
  _getElmList( elms ) {
    if ( typeof elms === 'string' ) {
      return document.querySelectorAll( elms );
    }
    if ( Array.isArray( elms ) || elms instanceof NodeList ) {
      return elms;
    }
    if ( elms instanceof Element ) {
      return [ elms ];
    }
    return [];
  }

  // auto-scroll animation loop
  _loop() {
    if ( Math.abs( this._to - this._pos ) < 1 ) {
      this._target.scrollTop = this._to;
      this._scrolling = false;

      if ( typeof this._jumpcb === 'function' ) {
        this._jumpcb.call( this, this._to ); // call once and reset
        this._jumpcb = null;
      }
      return;
    }
    this._pos += ( this._to - this._pos ) / this._options.easeFactor;
    this._target.scrollTop = this._pos;
    requestAnimationFrame( this._loop );
  }

}
