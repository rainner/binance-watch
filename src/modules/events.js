/**
 * Scrape crypto events data from a fetched document
 */
import scraper from './scraper';

let last = [];

export default function eventsScraper( dom ) {

  let time    = Date.now();
  let checked = false;
  let total   = 0;
  let count   = 0;

  const list = scraper( dom, {
    items  : '#explore > .container > .row > .content-box',
    params : {
      date : 'h5:nth-child(1) > strong',
      coin : 'h5:nth-child(2) > strong',
      info : 'h5:nth-child(3)',
      link : '.content-box-info > a:last-of-type',
    }
  });

  for ( let i = 0; i < list.length; ++i ) {
    let a = list[ i ];
    if ( !last.filter( b => b.info === a.info ).length ) count++;
  }

  last  = list;
  total = list.length;
  return { time, checked, total, count, list };
}
