/**
 * Scrape crypto news data from a fetched document
 */
import scraper from './scraper';

let last = [];

export default function newsScraper( dom ) {

  let time    = Date.now();
  let checked = false;
  let total   = 0;
  let count   = 0;

  const list = scraper( dom, {
    items  : '.news .news-post',
    params : {
      title : '.news-widget > .news-widget-title',
      info  : '.news-widget > .news-widget-content',
      link  : '.news-widget > a',
    }
  });

  for ( let i = 0; i < list.length; ++i ) {
    let a = list[ i ];
    if ( !last.filter( b => b.title === a.title ).length ) count++;
  }

  last  = list;
  total = list.length;
  return { time, checked, total, count, list };
}
