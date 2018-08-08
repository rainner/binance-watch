/**
 * Common utils
 */
module.exports = {

  // timeout cache
  _sto: {},

  // custom wrapper for setTimeout
  delay( name, seconds, callback ) {
    if ( !name || typeof callback !== 'function' ) return;
    if ( this._sto[ name ] ) clearTimeout( this._sto[ name ] );
    this._sto[ name ] = setTimeout( callback, 1000 * ( seconds | 0 ) );
  },

  // convert url string into an anchor element (parser)
  parseUrl( url, prop ) {
    let link = document.createElement( 'a' );
    link.href = url;
    let data = link[ prop ] || '';
    link = null;
    return data;
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
    let loc  = window.location;
    let path = String( loc.pathname || '' ).replace( /\/+$/g, '' );
    let rel  = String( relpath || '' ).replace( /^\/+/g, '' );
    return loc.protocol +'//'+ loc.host + path +'/'+ rel;
  },

  // to trimmed string
  toStr( input, deft ) {
    return String( String( input ) || deft ).trim();
  },

  // to integer
  toInt( input, deft ) {
    input = parseInt( input ) || false;
    deft  = parseInt( deft )  || 0;
    return ( input !== false ) ? input : deft;
  },

  // to float
  toFloat( input, deft ) {
    input = parseFloat( input ) || false;
    deft  = parseFloat( deft )  || 0;
    return ( input !== false ) ? input : deft;
  },

  // to boolean
  toBool( input ) {
    if ( typeof input === 'string' ) { // assume true, unless...
      return /^(0|n|no|off|false)$/i.test( input ) ? false : true;
    }
    return input ? true : false;
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
    return Number( num ).toFixed( fixed | 0 ).replace( /./g, ( c, i, a ) => {
      return i && c !== "." && ( ( a.length - i ) % 3 === 0 ) ? ',' + c : c;
    });
  },

  // convert candle time (1m, 1h, etc) into readable string
  candleTime( candle, count, add ) {
    count  = Math.max( 1, parseInt( count ) || 1 );
    add    = parseInt( add ) || 0;
    let numb    = parseInt( candle ) || 1;
    let letter  = String( candle ).replace( /[^a-zA-Z]+/g, '' );
    let map     = { 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800, 'M': 2419200 };
    let seconds = ( Number( map[ letter ] || 0 ) * numb ) * count + add;
    return this.elapsed( seconds );
  },

  // get info about how long something has been
  elapsed( seconds ) {
    seconds = parseInt( seconds ) || 0;
    if ( !seconds ) return '0s';

    let out = [], list = [];
    list.push( [ 'M', Math.floor( seconds / 2419200 ) ] );
    list.push( [ 'w', Math.floor( seconds / 604800 % 4 ) ] );
    list.push( [ 'd', Math.floor( seconds / 86400 % 7 ) ] );
    list.push( [ 'h', Math.floor( seconds / 3600 % 24 ) ] );
    list.push( [ 'm', Math.floor( seconds / 60 % 60 ) ] );;
    list.push( [ 's', Math.floor( seconds % 60 ) ] );
    list.forEach( arr => {
      let [ letter, time ] = arr;
      if ( time ) out.push( time + letter );
    });
    return out.join( ' ' );
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
  date( time ) {
    let { month, day, year, hour, minute, second, ampm } = this.dateData( time );
    return month +' '+ day +' '+ year +' '+ hour +':'+ minute +':'+ second +' '+ ampm;
  },

  // get current time
  time( time ) {
    let { month, day, year, hour, minute, second, ampm } = this.dateData( time );
    return hour +':'+ minute +':'+ second +' '+ ampm;
  },

  // calculate percent change
  percent( current, last ) {
    let isnum   = Boolean( last > 0 );
    let isup    = Boolean( current >= last );
    let change  = isup  ? ( current - last ) : ( last - current );
    let percent = isnum ? ( change / last * 100.0 ) : 0.0;
    let sign    = isup  ? '+' : '-';
    let arrow   = isup  ? '▲' : '▼';
    let color   = isup  ? 'green' : 'red';
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

  // return matching results from a list
  search( list, key, match, strict ) {
    if ( !Array.isArray( list ) || !key || !match ) return [];
    let search  = '\\b'+ String( match || '' ).replace( /[\|]+/g, '\\b|\\b' ) +'\\b';
    let options = strict ? 'g' : 'gi';
    let regex   = new RegExp( search, options );
    return list.filter( obj => obj[ key ].search( regex ) >= 0 );
  },

  // sort objects in an array by a key
  sort( list, key, order ) {
    if ( !Array.isArray( list ) || !key ) return [];
    if ( !key || typeof key !== 'string' ) return list;

    // check order, default to ascending
    order = ( order && /^(asc|desc)$/i.test( order ) ) ? order.toLowerCase() : 'asc';

    return list.sort( ( a, b ) => {
      let _a = a[ key ];
      let _b = b[ key ];

      if ( _a && _b ) {
        // ignore case when soerting strings
        _a = ( typeof _a === 'string' ) ? _a.toUpperCase() : _a;
        _b = ( typeof _b === 'string' ) ? _b.toUpperCase() : _b;

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

  // look over anything with a custom callback: loop( data, ( key, val ) => { ... } )
  loop( data, callback ) {
    if ( Array.isArray( data ) ) {
      return data.forEach( ( item, i ) => { callback( i, item ) } );
    }
    else if ( typeof data === 'string' ) {
      data.trim().split( /\s+/g ).forEach( ( word, i ) => { callback( i, word ) } );
    }
    else if ( typeof data === 'object' ) {
      Object.keys( data ).forEach( ( key, i ) => { callback( key, data[ key ] ) } );
    }
    else if ( typeof data === 'number' ) {
      let i = 0, len = parseInt( data ) || 1;
      for ( i; i < len; ++i ) callback( i, null );
    }
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
