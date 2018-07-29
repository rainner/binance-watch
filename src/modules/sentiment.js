/**
 * Basic sentiment analysis module
 */
module.exports = {

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
    "ain't",
    "aint",
    "werent",
    "weren't",
  ],

  // words that add to the score of a following word
  _amplifiers: [
    "very",
    "way",
    "shockinly",
    "fucking",
    "fuckin",
    "insanely",
    "ridiculously",
    "amazingly",
    "crazy",
    "really",
  ],

  // common acronyms translations
  _translate: {
    "dae": "does anybody else",
    "ama": "ask me anything",
    "dm": "direct message",
    "eli5": "explain like i'm five",
    "fml": "fuck my life",
    "ftfy": "fixed that for you",
    "hifw": "how i felt when",
    "mrw": "my reaction when",
    "mfw": "my face when",
    "mirl": "me in real life",
    "icymi": "in case you missed it",
    "idgaf": "i don't give a fuck",
    "imo": "in my opinion",
    "imho": "in my humble opinion",
    "irl": "in real life",
    "jsyk": "just so you know",
    "nsfw": "not safe for work",
    "nsfl": "not safe for life",
    "tbt": "throwback thursday",
    "tldr": "too long didn't read",
    "ymmv": "your mileage may vary",
    "yolo": "you only live once",
    "til": "today i learned",
    "wysiwyg": "what you see is what you get",
    "lol": "laughing out loud",
    "lmao": "laughing my ass off",
    "rofl": "rolling on floor laughing",
    "dafuq": "what the fuck",
    "rekt": "wrecked",
    "hodl": "hold on for dear life",
    "2fa": "two factor authentication",
  },

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

    while ( i-- ) {
      if ( !this._afinn.hasOwnProperty( list[ i ] ) ) continue; // not found

      let w = list[ i ]; // current word
      let p = ( i > 0 ) ? list[ i - 1 ] : ''; // previous word
      let s = parseFloat( this._afinn[ w ] ) | 0; // word score

      if ( p && s !== 0 ) {
        if ( this._negators.indexOf( p ) >= 0 ) s = -Math.abs( s ); // negate
        if ( this._amplifiers.indexOf( p ) >= 0 ) s += s; // amplify
      }
      if ( s > 0 ) positive += s;
      if ( s < 0 ) negative += s;
      score += s;
    }
    let params = [ '🤔', 'Neutral', 'text-info', '+' ];
    if ( score >  0 )  params = [ '😍', 'Positive', 'text-success', '+' ];
    if ( score >  5 )  params = [ '💗', 'Loved', 'text-gain', '+' ];
    if ( score <  0 )  params = [ '😱', 'Negative', 'text-danger', '-' ];
    if ( score < -5 )  params = [ '🤬', 'Hated', 'text-loss', '-' ];

    let [ icon, word, styles, sign ] = params;
    let scoreNum  = Math.abs( score );
    let scoreStr  = String( sign + ( scoreNum < 10 ? '0'+ scoreNum : ''+ scoreNum ) );
    let sentiment = [ icon, scoreStr, word ].join( '&nbsp;' );

    comparative = total ? ( score / total ) : 0;
    return { score, positive, negative, comparative, icon, word, styles, sign, sentiment };
  },

  // filter input text into word list
  _splitWords( input ) {
    let div = document.createElement( 'div' );
    div.innerHTML = String( input || '' );

    // strip html
    let output = String( div.textContent || div.innerText || '' )
    .toLowerCase()
    .trim();

    // translate acronyms
    Object.keys( this._translate ).forEach( acro => {
      const regx = new RegExp( '\\b('+ acro +')\\b', 'gi' );
      output = output.replace( regx, this._translate[ acro ] );
    });

    // clean string
    output = output
    .replace( /(https?\:\/\/[^\/\s]+\b)/g, ' ' ) // replace first part of links
    .replace( /([\`\'\’]+)/g, "'" ) // normalize apostrophes
    .replace( /([\“\”\“\”\"]+)/g, '"' ) // normalize quotes
    .replace( /([^a-zA-Z0-9\']+)/g, ' $1 ' ) // add space around special chars
    .replace( /[\-\"\{\}\[\]\(\)\~\!\@\#\$\%\^\&\*\=\_\+\:\;\,\.\/\?\<\>]+/gi, ' ' ) // remove some special chars
    .replace( /[\t\r\n\s\uFEFF\xA0]+/g, ' ' ) // remove whitespace
    .trim();

    // split
    return output.split( /\s+/g );
  },
};
