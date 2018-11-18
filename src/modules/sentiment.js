/**
 * Basic sentiment analysis module
 */
export default {

  // score list data
  _afinn: {},

  // words that negate the score of a following word
  _negators: [
    "cant",
    "can't",
    "dont",
    "don't",
    "doesnt",
    "doesn't",
    "not",
    "non",
    "wont",
    "won't",
    "isnt",
    "isn't",
    "wouldnt",
    "wouldn't",
    "couldnt",
    "couldn't",
    "didnt",
    "didn't",
    "wasnt",
    "wasn't",
    "havent",
    "haven't",
    "ain't",
    "aint",
    "werent",
    "weren't",
  ],

  // build afinn wordlist
  merge( list ) {
    this._afinn = Object.assign( this._afinn, list );
  },

  // analyse sentiment for text
  analyze( text ) {
    let score = 0;
    let negative = 0;
    let positive = 0;
    let comparative = 0;
    let list = this._splitWords( text );
    let total = list.length;
    let i = total;

    // loop filtered input words
    while ( i-- ) {
      if ( !this._afinn.hasOwnProperty( list[ i ] ) ) continue; // not found

      let w = list[ i ]; // current word
      let p = ( i > 0 ) ? list[ i - 1 ] : ''; // previous word
      let s = parseFloat( this._afinn[ w ] ) | 0; // word score

      if ( !p || !s ) continue; // no score
      if ( this._negators.indexOf( p ) >= 0 ) s *= -1; // flip score
      if ( s > 0 ) positive += s;
      if ( s < 0 ) negative += s;
      score += s;
    }

    // sentiment string params
    let params                 = [ '',  'Neutral',  'icon-help iconLeft text-info' ];
    // positive
    if ( score ===  1 ) params = [ '+', 'Ok',       'icon-help iconLeft text-success' ];
    if ( score >    1 ) params = [ '+', 'Positive', 'icon-like iconLeft text-success' ];
    if ( score >   10 ) params = [ '+', 'Positive', 'icon-like iconLeft text-gain' ];
    // negative
    if ( score === -1 ) params = [ '-', 'Ok',       'icon-help iconLeft text-danger' ];
    if ( score <   -1 ) params = [ '-', 'Negative', 'icon-dislike iconLeft text-danger' ];
    if ( score <  -10 ) params = [ '-', 'Negative', 'icon-dislike iconLeft text-loss' ];

    // build sentiment info
    let [ sign, word, styles ] = params;
    let sentiment = [ word, sign + Math.abs( score ) ].join( ' ' );

    // build final data
    comparative = total ? ( score / total ) : 0;
    return { score, positive, negative, comparative, sign, word, styles, sentiment };
  },

  // filter input text into word list
  _splitWords( input ) {
    let div = document.createElement( 'div' );
    div.innerHTML = String( input || '' );

    // strip html
    let output = String( div.textContent || div.innerText || '' )
    .toLowerCase()
    .trim();

    // clean string
    output = output
    .replace( /([\`\'\’]+)/g, "'" ) // normalize apostrophes
    .replace( /([\“\”\“\”\"]+)/g, '"' ) // normalize quotes
    .replace( /([\-]+)/g, '-' ) // normalize dashes
    .replace( /([^a-z\'\-]+)/g, ' ' ) // only allow these
    .replace( /[\t\r\n\s\uFEFF\xA0]+/g, ' ' ) // remove whitespace
    .trim();

    // split
    return output.split( /\s+/g );
  },
};
