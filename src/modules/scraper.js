/**
 * Parse html document into list of items based on given selectors
 */

// let list = scraper( HTMLDocument, {
//   items  : '.news .news-post',
//   params : {
//     title : '.news-widget > .news-widget-title',
//     info  : '.news-widget > .news-widget-content',
//     link  : '.news-widget > a',
//   }
// });

export default function scraper( dom, options ) {

  let opts = Object.assign( { items: '', params: {} }, options );
  let list = [];

  if ( dom instanceof HTMLDocument ) {
    let elms = dom.querySelectorAll( opts.items );

    for ( let i = 0; i < elms.length; i++ ) {
      let e = elms[ i ];
      let skip = false;
      let item = {};

      Object.keys( opts.params ).forEach( p => {
        let elm = e.querySelector( opts.params[ p ] );
        let val = '';

        if ( !elm || !elm.tagName ) { skip = true; return; }
        if ( /^(IMG|I?FRAME|AUDIO|VIDEO|EMBED)$/.test( elm.tagName ) ) { val = elm.src; } else
        if ( /^(INPUT|SELECT|TEXTAREA)$/.test( elm.tagName ) ) { val = elm.value; } else
        if ( elm.tagName === 'A' ) { val = elm.href; }
        else { val = elm.innerHTML; }

        item[ p ] = String( val || '' ).replace( /<[^>]*>/g, '' ).replace( /\s\s+/g, ' ' ).trim();
      });

      if ( skip ) continue;
      list.push( item );
    }
  }
  return list;
}

