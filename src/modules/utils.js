/**
 * Common utils
 */
module.exports = {

  // convert url string into an anchor element (parser)
  parseUrl( url, prop ) {
    let link = document.createElement( 'a' );
    link.href = url;
    let data = link[ prop ] || '';
    link = null;
    return data;
  },

  // convert URLs into clickable links
  linkUrl( text ) {
    return String( text || '' ).replace( /(https?\:\/\/[\w\-\.\?\=\&\%\/\#]+)/gi, '<a href="$1" target="_blank">$1</a>' );
  },

  // convert html tags to text content
  stripHtml( text, removeUrls ) {
    let div = document.createElement( 'div' );
    div.innerHTML = String( text || '' );
    let output = String( div.textContent || div.innerText || '' );
    if ( removeUrls ) output = output.replace( /(https?\:\/\/[\w\-\.\?\=\&\%\/\#]+)/gi, '' );
    return output;
  },

  // convert relative path to full url
  fullUrl( relpath ) {
    if ( /^([\w\-]+\:)?\/\/.*$/.test( relpath ) ) return relpath;
    let loc  = window.location;
    let path = String( loc.pathname || '' ).replace( /\/+$/g, '' );
    let rel  = String( relpath || '' ).replace( /^\/+/g, '' );
    return loc.protocol +'//'+ loc.host + path +'/'+ rel;
  },

  // play audio file
  playAudio( file, vol ) {
    if ( !file || typeof file !== 'string' ) return;
    // normalize volume
    vol = parseFloat( vol ) || 1;
    vol = ( vol > 1 ) ? vol / 100 : vol;
    vol = ( vol > 1 || vol < 0 ) ? 1 : vol;
    // load and play audio
    let audio = new Audio();
    audio.src = this.fullUrl( file );
    audio.volume = vol;
    audio.crossOrigin = 'anonymous';
    audio.addEventListener( 'canplaythrough', e => {
      try { audio.play(); } catch( err ) {}
    });
    audio.load();
  },

  // copy text to clipboard
  copyText( text ) {
    let elm = document.createElement( 'input' );
    document.body.appendChild( elm );
    elm.value = String( text || '' ).trim();
    elm.select();
    setTimeout( () => elm.remove(), 1000 );
    return document.execCommand( 'Copy' );
  },

  // clamp a number between min and max
  clamp( num, min, max ) {
    return Math.min( Math.max( num, min ), max );
  },

  // cut part of a string
  limit( str, length, append ) {
    str    = String( str );
    length = parseInt( length ) || 50;
    append = String( append || '' );
    return ( str.length > length ) ? str.substring( 0, length ) + append : str;
  },

  // alway keep a string at a certain length
  fill( str, length, char, append ) {
    str    = String( str );
    length = parseInt( length ) || 20;
    char   = String( char || ' ' );
    append = String( append || '' );
    if ( str.length > length ) return str.substring( 0, ( length - 3 ) ) + '...';
    return str + char.repeat( length - str.length ) + append;
  },

  // get noun word for a number
  noun( num, singular, plutal, append ) {
    append = String( append || '' );
    return String( num +' '+ ( parseFloat( num ) === 1 ? singular : plutal ) +' '+ append ).trim();
  },

  // format number to money
  money( num, fixed ) {
    num   = parseFloat( num ) || 0;
    fixed = parseInt( fixed ) || 0;
    let o = { style: 'decimal', minimumFractionDigits: fixed, maximumFractionDigits: fixed };
    return new Intl.NumberFormat( 'en-US', o ).format( num );
  },

  // fixed numbers
  fixed( num, decimals ) {
    if ( typeof decimals === 'number' ) return Number( num ).toFixed( decimals );
    if ( /(USD|PAX|DAI)/.test( decimals ) ) return this.money( num, 3 );
    return Number( num ).toFixed( 8 );
  },

  // get info about how long something has been
  elapsed( secs, suffix, short ) {
    secs = parseInt( secs ) || 0;
    if ( short && secs < 60 ) return 'Just now';
    let list = [];
    let data = {
      'M': Math.floor( secs / 2419200 ),
      'w': Math.floor( secs / 604800 % 4 ),
      'd': Math.floor( secs / 86400 % 7 ),
      'h': Math.floor( secs / 3600 % 24 ),
      'm': Math.floor( secs / 60 % 60 ),
    };
    if ( !short ) data.s = Math.floor( secs % 60 );
    Object.keys( data ).forEach( k => { if ( data[ k ] ) list.push( data[ k ] + k ); } );
    if ( suffix ) list.push( suffix );
    return list.join( ' ' );
  },

  // get data about current date and time
  dateData( time ) {
    let now = Date.now();

    if ( time ) {
      // timestamp or datestring, keep as is
      if ( typeof time === 'number' || /^[\w\-\+\:]+$/.test( time ) ) {
        now = time;
      }
      // other string, assume timezone
      else if ( typeof time === 'string' ) {
        now = new Date().toLocaleString( 'en-US', { time } );
      }
    }
    let _p      = ( n ) => ( n < 10 ) ? '0'+ n : ''+ n;
    let date    = new Date( now );
    let month   = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][ date.getMonth() ];
    let year    = date.getFullYear();
    let day     = _p( date.getDate() );
    let minute  = _p( date.getMinutes() );
    let second  = _p( date.getSeconds() );
    let fullh   = date.getHours();
    let ampm    = ( fullh > 12 ) ? 'PM' : 'AM';
    let hour    = ( fullh > 12 ) ? ( fullh - 12 ) : fullh;
    hour        = _p( hour === 0 ? 12 : hour );
    return { month, day, year, hour, minute, second, ampm };
  },

  // get readable date
  date( time, full ) {
    let { month, day, year, hour, minute, second, ampm } = this.dateData( time );
    let out = [ month +'/'+ day +'/'+ year ];
    if ( full ) out.push( hour +':'+ minute +':'+ second, ampm );
    return out.join( ' ' );
  },

  // get current time
  time( time ) {
    let { hour, minute, second, ampm } = this.dateData( time );
    return hour +':'+ minute +':'+ second +' '+ ampm;
  },

  // calculate percent change
  percent( current, last, toNum ) {
    let isnum   = Boolean( last > 0 );
    let isup    = Boolean( current >= last );
    let change  = isup  ? ( current - last ) : ( last - current );
    let percent = isnum ? ( change / last * 100.0 ) : 0.0;
    let sign    = isup  ? '+' : '-';
    let arrow   = isup  ? '▲' : '▼';
    let color   = isup  ? 'green' : 'red';
    if ( toNum === true ) return +Number( sign + percent ).toFixed( 3 );
    return { change, percent, sign, arrow, color };
  },

  // calc chart points for given dimensions and values
  points( width, height, values ) {
    width  = parseFloat( width ) || 0;
    height = parseFloat( height ) || 0;
    values = Array.isArray( values ) ? values : [];
    values = values.map( n => parseFloat( n ) || 0 );

    let min   = values.reduce( ( min, val ) => val < min ? val : min, values[ 0 ] );
    let max   = values.reduce( ( max, val ) => val > max ? val : max, values[ 0 ] );
    let len   = values.length;
    let half  = height / 2;
    let range = ( max > min ) ? ( max - min ) : height;
    let gap   = ( len > 1 ) ? ( width / ( len - 1 ) ) : 1;
    let out   = [];

    for ( let i = 0; i < len; ++i ) {
      let d = values[ i ];
      let val = 2 * ( ( d - min ) / range - 0.5 );
      let x = i * gap;
      let y = -val * half * 0.8 + half;
      out.push( { x, y } );
    }
    return out;
  },

  // compute placement for an absolute box on the screen
  boxPosition( triggerElm ) {
    let [ top, right, bottom, left ] = [ true, false, false, true ];

    if ( triggerElm instanceof HTMLElement ) {
      let box     = triggerElm.getBoundingClientRect();
      let posx    = box.left + ( triggerElm.offsetWidth / 2 );
      let posy    = box.top + ( triggerElm.offsetHeight / 2 );
      let centerx = ( window.innerWidth / 2 );
      let centery = ( window.innerHeight / 2 );

      top    = ( posy < centery ) ? true : false;
      right  = ( posx > centerx ) ? true : false;
      bottom = ( posy > centery ) ? true : false;
      left   = ( posx < centerx ) ? true : false;
      return { top, right, bottom, left };
    }
  },

  // check a key-press event for some common keys being pressed
  keyboard( e ) {
    let code = e.keyCode || e.key || 0;
    let up     = ( code === 38 );
    let down   = ( code === 40 );
    let left   = ( code === 37 );
    let right  = ( code === 39 );
    let back   = ( code === 8 );
    let escape = ( code === 27 );
    let space  = ( code === 32 );
    let enter  = ( code === 13 );
    return { up, down, left, right, back, escape, space, enter };
  },

  // shuffle an array
  shuffle( o ) {
    for ( let j, x, i = o.length; i; j = parseInt( Math.random() * i ), x = o[--i], o[i] = o[j], o[j] = x );
    return o;
  },

  // deep merge obj arguments
  deepMerge(){
    for ( let i = 1; i < arguments.length; i++ ) {
      for ( let key in arguments[ i ] )
        if ( arguments[ i ].hasOwnProperty( key ) ) {
          if ( typeof arguments[ 0 ][ key ] === 'object' && typeof arguments[ i ][ key ] === 'object' ) {
            this.deepMerge( arguments[ 0 ][ key ], arguments[ i ][ key ] );
          } else {
            arguments[ 0 ][ key ] = arguments[ i ][ key ];
          }
        }
      }
    return arguments[ 0 ];
  },

  // search objects in a list by key and search text
  search( list, key, text, fullword, fullcase ) {
    text = String( text || '' ).replace( /[^\w\s\|]+/g, '' );

    if ( text.length > 1 ) {
      let search  = fullword ? '\\b'+ text.replace( /[\|]+/g, '\\b|\\b' ) +'\\b' : text;
      let options = fullcase ? 'g' : 'gi';
      let regex   = new RegExp( search, options );
      let count   = list.length;
      let output  = [];

      while ( count-- ) {
        if ( String( list[ count ][ key ] || '' ).search( regex ) < 0 ) continue;
        output.push( list[ count ] );
      }
      return output;
    }
    return list;
  },

  // sort objects in an array by a key
  sort( list, key, order, ignore ) {
    return list.sort( ( a, b ) => {
      if ( a.hasOwnProperty( key ) ) {

        let _a = a[ key ];
        let _b = b[ key ];

        if ( ignore ) { // sort strings using same case
          _a = ( typeof _a === 'string' ) ? _a.toUpperCase() : _a;
          _b = ( typeof _b === 'string' ) ? _b.toUpperCase() : _b;
        }
        if ( order === 'asc' ) {
          if ( _a < _b ) return -1;
          if ( _a > _b ) return 1;
        }
        if ( order === 'desc' ) {
          if ( _a > _b ) return -1;
          if ( _a < _b ) return 1;
        }
      }
      return 0;
    });
  },

  // remove items from the start of a list
  trimLeft( list, max ) {
    return ( list.length > max ) ? list.slice( list.length - max ) : list;
  },

  // remove items from the end of a list
  trimRight( list, max ) {
    return ( list.length > max ) ? list.slice( 0, max ) : list;
  },

  // create unique hash from a string
  unique( str ) {
    str = String( str || '' ).replace( /[\r\n\t\s]+/g, ' ' ).trim();
    let hash = 5381, i = str.length;
    while ( --i ) hash = ( hash * 33 ) ^ str.charCodeAt( i );
    return 'unq_' + ( hash >>> 0 );
  },

  // random string for a given length
  randString( length ) {
    let chars  = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let total  = parseInt( length ) || 10;
    let output = '';

    while ( total ) {
      output += chars.charAt( Math.floor( Math.random() * chars.length ) );
      total--;
    }
    return output;
  },

  // get a unique ID string that uses the current timestamp and a random value
  idString() {
    return ( Date.now().toString( 36 ) + Math.random().toString( 36 ).substr( 2, 5 ) ).toUpperCase();
  },

}
