/**
 * Scroller Class.
 * For calling custom function based on scroll position, or to auto-scroll.
 */
import Bus from './bus';

export default class Scroller extends Bus {

  /**
   * Constructor
   */
  constructor( target ) {
    super();
    this._tdef      = document.scrollingElement || document.documentElement || window;
    this._target    = ( target instanceof Element ) ? target : this._tdef;
    this._scrolling = false;
    this._pos       = 0;
    this._to        = 0;
    this._min       = 0;
    this._max       = 0;
    this._ease      = 10;
    this._triggers  = [];
    this._onScroll  = this._onScroll.bind( this );
    this.addTrigger( 'up' );
    this.addTrigger( 'down' );
    window.addEventListener( 'scroll', this._onScroll );
    window.addEventListener( 'resize', this._onScroll );
  }

  /**
   * Add custom scroll trigger
   * @param {string}    name   Trigger name
   * @param {number}    pos    Trigger scroll position
   * @param {function}  cb     Optional callback handler
   * @param {object}    data
   */
  addTrigger( name, pos, cb, data ) {
    let trigger  = String( name || '' ).trim().toLowerCase();
    let position = parseFloat( pos ) || 0;
    let callback = ( typeof cb === 'function' ) ? cb : function() {};
    let called   = false;
    if ( !trigger ) return;
    this._triggers.push( Object.assign( { trigger, position, called }, data ) );
    this.on( trigger, callback );
  }

  /**
   * Reset triggers called state to false
   */
  resetTriggers() {
    this._triggers.forEach( t => { called = false } );
  }

  /**
   * When elements enter and leave the viewport area
   * @param {*}         targets   CSS selector, or array list of target elements
   * @param {function}  callback  Callback function
   */
  onVisible( targets, callback ) {
    let elms = this._getElmList( targets );
    let emap = new Array( elms.length ).fill( false );
    this.addTrigger( 'reveal', 0, callback, { elms, emap } );
  }

  /**
   * Auto scroll page to a target destination
   * @param {*}  dest      String selector, number or element
   * @param {*}  callback  Callback function
   */
  jumpTo( dest, callback ) {
    const scrollHeight = Math.max( 0, Math.floor( this._target.scrollHeight || 0 ) );
    const clientHeight = Math.max( 0, Math.floor( this._target.clientHeight || 0 ) );

    this._max = Math.floor( scrollHeight - clientHeight );
    this._pos = this._target.scrollTop || 0;
    this._to  = this._pos;

    if ( typeof dest === 'number' ) {
      this._to = dest;
    }
    else if ( typeof dest === 'object' && dest instanceof Element ) {
      this._to = ( this._pos + dest.getBoundingClientRect().top ) || this._pos;
    }
    else if ( typeof dest === 'string' ) {
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
    this._jumpLoop( callback );
  }

  /**
   * Autoscroll animation loop
   */
  _jumpLoop( cb ) {
    if ( Math.abs( this._to - this._pos ) < 1 ) {
      this._scrolling = false;
      this._target.scrollTop = this._to;
      this._onScrollTick();
      if ( typeof cb === 'function' ) cb( this._to );
      return;
    }
    this._scrolling = true;
    this._pos += ( this._to - this._pos ) / this._ease;
    this._target.scrollTop = this._pos;
    window.requestAnimationFrame( () => { this._jumpLoop( cb ) } );
  }

  // check scroll behavior
  _onScrollTick() {
    let sp = this._target.scrollTop | 0;
    this.emit( 'scroll', sp );

    for ( let i = 0; i < this._triggers.length; ++i ) {
      let t = this._triggers[ i ];

      if ( t.trigger === 'up' ) {
        let check = ( sp < this._pos );
        if ( !t.called && check ) this.emit( t.trigger, sp );
        t.called = check;
      }
      if ( t.trigger === 'down' ) {
        let check = ( sp > this._pos );
        if ( !t.called && check ) this.emit( t.trigger, sp );
        t.called = check;
      }
      if ( t.trigger === 'more' ) {
        let check = ( sp > t.position );
        if ( !t.called && check ) this.emit( t.trigger, sp );
        t.called = check;
      }
      if ( t.trigger === 'less' ) {
        let check = ( sp < t.position );
        if ( !t.called && check ) this.emit( t.trigger, sp );
        t.called = check;
      }
      if ( t.trigger === 'reveal' && t.elms ) {
        for ( let i = 0; i < t.elms.length; ++i ) {
          let e = t.elms[ i ];
          let c = t.emap[ i ];
          let v = this._checkVisible( e );
          if ( !c && v ) this.emit( 'show', e, sp ); // entering
          if ( c && !v ) this.emit( 'hide', e, sp ); // leaving
          t.emap[ i ] = v;
        }
      }
    }
    this._pos = sp;
  }

  /**
   * Checks if an element is visible within the height of the scroll window
   * @param {element} elm  Element object
   */
  _checkVisible( elm ) {
    let height = this._target.clientHeight | 0;
    let box    = elm.getBoundingClientRect();
    let yPos   = box.top + ( box.height / 2 ); // elm middle
    return ( yPos >= 0 && yPos <= height );
  }

  /**
   * Handler for native scroll event
   * @param {object}  e  Event object
   */
  _onScroll( e ) {
    if ( this._scrolling ) return;
    this._scrolling = true;
    window.requestAnimationFrame( () => {
      this._onScrollTick();
      this._scrolling = false;
    });
  }

  /**
   * Resolve list of elements from an arg
   * @param {*}  elms  String selector, nodelist or array
   */
  _getElmList( elms ) {
    if ( typeof elms === 'string' ) return document.querySelectorAll( elms );
    if ( Array.isArray( elms ) || elms instanceof NodeList ) return elms;
    if ( elms instanceof Element ) return [ elms ];
    return [];
  }
}
