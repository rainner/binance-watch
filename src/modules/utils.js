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
    let min = values.reduce( ( min, val ) => val < min ? val : min, values[ 0 ] );
    let max = values.reduce( ( max, val ) => val > max ? val : max, values[ 0 ] );
    let len = values.length;
    let range = max - min;
    let gap = width / ( len - 1 );
    let out = [];

    for ( let i = 0; i < values.length; ++i ) {
      let d = values[ i ];
      let val = 2 * ( ( d - min ) / range - 0.5 );
      let x = i * gap;
      let y = -val * height / 2 * 0.9 + height / 2;
      out.push( { x, y } );
    }
    return out;
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
