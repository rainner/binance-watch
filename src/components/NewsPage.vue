<template>
  <main class="newspage-wrap" :class="{ 'collapsed': scrollDir === 'down', 'opaque': scrollPos > 10 }">

    <!-- list spinner -->
    <Spinner class="newspage-spinner abs" ref="spinner"></Spinner>

    <!-- controls section -->
    <section class="newspage-controls">
      <div class="container">
        <div class="newspage-controls-row flex-row flex-middle flex-space">

          <!-- control input -->
          <div class="newspage-controls-input push-right">
            <div class="form-input">
              <div class="icon-search iconLeft"></div>
              <input class="push-right" type="text" v-model="filterSearch" placeholder="Search ..." />
              <button class="icon-close text-primary-hover" @click="filterSearch = ''" v-if="filterSearch"></button>
            </div>
          </div>

          <!-- control heading -->
          <div class="newspage-controls-title push-right text-clip text-center flex-1">
            <big>News &amp; Events ({{ lastCount }}/{{ totalCount }})</big>
          </div>

          <!-- control dropdown menus -->
          <div class="newspage-controls-filters text-nowrap">
            <button
              class="form-btn bg-grey-hover icon-reload iconLeft"
              :class="{ 'iconSpin': working }"
              :disabled="working"
              @click="fetchAll"
              title="Fetch News"
              v-tooltip>
              Fetch
            </button> &nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-down-open iconLeft" title="Filter Source" v-tooltip>{{ filterLabel }}</button>
              <ul slot="list">
                <li class="clickable" v-for="s in newsSources" :key="s.key" @click="filterBy( s.key )">
                  <i class="icon-feedback iconLeft"></i> {{ s.name }}
                </li>
              </ul>
            </Dropdown> &nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-grey-hover icon-config" title="Options" v-tooltip></button>
              <div slot="list">

                <div class="form-label">News &amp; Notifications Options</div>
                <Toggle class="push-top" :text="'Auto re-fetch latest news'" v-model="options.news.refetch" @change="applyOptions"></Toggle>
                <Toggle class="push-top" :text="'Notify when news is available'" v-model="options.news.notify" @change="applyOptions"></Toggle>
                <Toggle class="push-top" :text="'E-mail notifications'" v-model="options.news.send" @change="applyOptions"></Toggle>
                <hr />

                <div class="form-label">News &amp; Sentiment Chart Data</div>
                <div class="pad-left">
                  <p><button class="icon-reload iconLeft text-bright-hover" @click="resetNews">Reset news data</button></p>
                  <p><button class="icon-reload iconLeft text-bright-hover" @click="updateChart">Reload chart data</button></p>
                  <p><button class="icon-close iconLeft text-bright-hover" @click="clearChart">Clear chart data</button></p>
                </div>
              </div>
            </Dropdown>
          </div>

        </div>
      </div>
    </section>

    <!-- chart section -->
    <section class="push-bottom" v-if="chartData.length">
      <div class="container">
        <div class="card newspage-chart">
          <div class="newspage-chart-row flex-row flex-middle flex-stretch text-grey">
            <div class="newspage-chart-sm text-nowrap">Token</div>
            <div class="newspage-chart-md text-clip">Name</div>
            <div class="newspage-chart-sm text-nowrap text-right">Count</div>
            <div class="flex-5 text-nowrap if-medium">Mention %</div>
            <div class="newspage-chart-sm text-nowrap text-right">Score</div>
            <div class="newspage-chart-md text-nowrap if-small">Sentiment</div>
            <div class="flex-1 text-nowrap text-right">Details</div>
          </div>
          <div class="newspage-chart-row flex-row flex-middle flex-stretch clickable" v-for="d in chartData" :key="d.token" @click="filterSearch = d.search">
            <div class="newspage-chart-sm text-clip text-bright icon-search iconLeft">{{ d.token }}</div>
            <div class="newspage-chart-md text-nowrap text-default">{{ d.name }}</div>
            <div class="newspage-chart-sm text-nowrap text-right">{{ d.count }}</div>
            <div class="flex-5 text-nowrap if-medium"><span class="newspage-chart-bar" :class="d.barColor" :style="{ 'width': d.barPercent +'%' }"></span></div>
            <div class="newspage-chart-sm text-nowrap text-right" :class="d.scoreColor">{{ d.scoreStr }}</div>
            <div class="newspage-chart-md text-nowrap if-small" :class="d.scoreColor">{{ d.scoreWord }}</div>
            <div class="flex-1 text-nowrap text-right">
              <button class="icon-info iconLeft text-primary-hover" @click.stop="$bus.emit( 'setRoute', d.route )">Info</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- fallback section -->
    <section class="push-bottom" v-if="!filterList.length">
      <div class="container">
        <div class="card flex-row flex-middle flex-stretch">
          <div class="icon-help iconLarge text-grey push-right"></div>
          <div class="flex-1">
            <div v-if="filterSearch">
              <span class="text-bright">No match for search: <span class="text-primary">{{ filterSearch }}</span></span> &nbsp;
              <button class="icon-close iconLeft text-pill bg-grey-hover" @click.prevent="filterSearch = ''">Reset</button> <br />
              <span class="text-grey">Can't find anything matching your search input.</span>
            </div>
            <div v-else-if="filterType">
              <span class="text-bright">No entries loaded for source: <span class="text-primary">{{ filterLabel }}</span></span> &nbsp;
              <button class="icon-close iconLeft text-pill bg-grey-hover" @click.prevent="filterType = ''">Reset</button> <br />
              <span class="text-grey">There are no entries available for the selected news source.</span>
            </div>
            <div v-else>
              <span class="text-bright">No news data available</span> &nbsp;
              <button class="icon-reload iconLeft text-pill bg-grey-hover" :disabled="working" @click.prevent="fetchAll">Fetch</button> <br />
              <span class="text-grey">News data from remote sources has not loaded yet.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- news list -->
    <section class="newspage-list">
      <div class="container">
        <div class="newspage-list-item flex-row flex-middle flex-stretch" v-for="( n, i ) in filterList" :key="n.id">
          <div class="flex-1 push-right text-clip">
            <a class="icon-feedback text-default iconLeft" :class="{ 'text-bright': isNewEntry( i ) }" :href="n.link" target="_blank" rel="noopener">{{ n.title }}</a>
          </div>
          <div class="text-nowrap if-medium">
            <span class="text-grey">{{ n.source }}</span>
          </div>
        </div>
      </div>
    </section>

  </main>
</template>

<script>
// modules
import Spinner from './Spinner.vue';
import Dropdown from './Dropdown.vue';
import BarChart from './BarChart.vue';
import Toggle from './Toggle.vue';
import scraper from '../modules/scraper';
import sentiment from '../modules/sentiment';
import utils from '../modules/utils';

// component
export default {

  // component list
  components: { Spinner, Dropdown, BarChart, Toggle },

  // component props
  props: {
    active: { type: Boolean, default: false },
    options: { type: Object, default() { return {} } },
    scrollDir: { type: String, default: '' },
    scrollPos: { type: Number, default: 0 },
    priceData: { type: Array, default: [] },
  },

  // component data
  data() {
    return {
      // news sources data
      newsSources: [
        { key: 'binance',  name: 'Binance News',       cb: 'fetchBinance' },
        { key: 'events',   name: 'Crypto Calendar',    cb: 'fetchEvents' },
        { key: 'reddit',   name: 'Crypto Subreddit',   cb: 'fetchReddit' },
        { key: 'ccnews',   name: 'Crypto News (CCN)',  cb: 'fetchCCN' },
        { key: 'coinlib',  name: 'Coinlib News',       cb: 'fetchCoinlib' },
        { key: 'ambnews',  name: 'AMB Crypto News',    cb: 'fetchAMB' },
        { key: '',         name: 'All Sources',        cb: '' },
      ],
      // news data
      lastList: [],
      newsList: [],
      coinsCache: {},
      chartData: [],
      // count data
      lastCount: 0,
      totalCount: 0,
      maxCount: 200,
      // list filter options
      filterSearch: '',
      filterType: '',
      filterLimit: 0,
      // other
      timeout: 10,
      refetchTime: 300,
      proxyDomain: '',
      working: false,
      loaded: false,
      sto: null,
    }
  },

  // watch methods
  watch: {

    // don't show spinner if list is full
    newsList: function() {
      if ( !this.$refs.spinner ) return;
      if ( this.newsList.length ) this.$refs.spinner.hide();
    },
  },

  // computed methods
  computed: {

    // get filtered list
    filterList() {
      let list  = this.newsList.slice(); // copy
      let limit = parseInt( this.filterLimit ) | 0;

      // filter by news type
      if ( this.filterType ) {
        list = list.filter( n => n.type === this.filterType );
      }
      // filter by search text
      if ( this.filterSearch && this.filterSearch.length > 1 ) {
        list = utils.search( list, 'title', this.filterSearch );
      }
      // limit list to a number of entries
      if ( limit && limit < list.length ) {
        list = list.slice( 0, limit );
      }
      return list;
    },

    // sort-by label for buttons, etc
    filterLabel() {
      let s = this.newsSources.filter( s => s.key === this.filterType ).shift();
      return s.name || '';
    },
  },

  // custom methods
  methods: {

    // apply options
    applyOptions() {
      this.$bus.emit( 'setOptions' );
    },

    // set filter type
    filterBy( type ) {
      this.filterType = type;
    },

    // used to assign a class for new entries in the list
    isNewEntry( index ) {
      if ( this.filterType || this.filterSearch ) return false;
      return ( this.lastCount && index < this.lastCount ) ? true : false;
    },

    // wrapper for page spinner
    spinner( method, message ) {
      if ( !this.$refs.spinner ) return;
      this.$refs.spinner[ method ]( message );
    },

    // emit news data
    emitData() {
      let count = this.lastCount;
      let total = this.totalCount;
      let list  = this.newsList.slice();
      this.$bus.emit( 'newsData', { count, total, list } );
    },

    // add news to notification and msg queue
    setNotifications() {
      if ( !this.lastCount || this.lastCount === this.totalCount ) return;
      let icon = utils.fullUrl( 'public/images/notification.png' );

      // add alert bubble to main menu
      if ( !this.active ) {
        this.$bus.emit( 'mainMenuAlert' );
      }
      // show notification of last news item added
      if ( this.options.news.notify ) {
        let item  = this.newsList[ 0 ];
        let title = 'Latest Crypto News ('+ this.lastCount +')';
        this.$notify.add( title, item.title, icon, item.link );
      }
      // send notification via api
      if ( this.options.news.send ) {
        for ( let i = 0; i < this.lastCount; ++i ) {
          let item  = this.newsList[ i ];
          let title = 'Latest Crypto News:';
          let info  = `<a href="${ item.link }">${ item.title }</a>`;
          this.$bus.emit( 'msgQueue', { title, info, icon } );
        }
      }
    },

    // draw token chart from profile data
    updateChart() {
      let data = [];

      // keep local cache of loaded binance tokens and their names
      this.priceData.forEach( p => {
        this.coinsCache[ p.token ] = p.name || p.token;
      });

      // check token symbol and name against all loaded news titles
      Object.keys( this.coinsCache ).forEach( token => {
        let name       = this.coinsCache[ token ];
        let search     = token +'|'+ name;
        let asset      = ( token === 'BTC' ) ? 'USDT' : 'BTC';
        let route      = '/symbol/'+ token + asset;
        let score      = 0;
        let scoreStr   = '';
        let scoreColor = 'text-default';
        let scoreWord  = 'Neutral';
        let sign       = '';
        let list       = utils.search( this.newsList, 'title', search );
        let count      = list.length;

        if ( count > 1 ) {
          for ( let i = 0; i < list.length; ++i ) {
            let d = sentiment.analyze( list[ i ].title );
            score += d.score;
          }
          if ( score > 0 ) { scoreColor = 'text-gain'; scoreWord = 'Positive'; sign = '+'; }
          if ( score < 0 ) { scoreColor = 'text-loss'; scoreWord = 'Negative'; sign = '-'; }

          scoreStr = sign + String( Math.abs( score ) );
          data.push( { token, name, search, route, count, score, scoreStr, scoreColor, scoreWord } );
        }
      });

      // calculate percent for each data enrtry
      let max = data.reduce( ( m, d ) => d.count > m ? d.count : m, 0 );
      data = data.map( d => {
        let ratio = ( max > 0 ) ? ( d.count / max ) : 0.1;
        let barPercent = Math.round( ratio * 100 );
        let barColor = 'bg-grey';
        if ( barPercent > 20 ) { barColor = 'bg-bright'; }
        if ( barPercent > 40 ) { barColor = 'bg-secondary'; }
        if ( barPercent > 60 ) { barColor = 'bg-primary'; }
        return Object.assign( d, { barPercent, barColor } );
      });

      // assign final chart data
      this.chartData = data;
    },

    // clear chart data
    clearChart() {
      this.chartData = [];
    },

    // reset news data
    resetNews() {
      this.newsList = [];
      this.fetchAll();
    },

    // preppend new item to news list
    addNews( type, source, title, link ) {
      let exist = this.newsList.filter( n => ( n.title === title || n.link === link ) ).length;
      if ( exist ) return;

      let id   = utils.randString( 20 );
      let time = Date.now();

      // new entries go on top of list, first time goes on bottom in order as loaded
      if ( this.loaded ) { this.newsList.unshift( { id, time, type, source, title, link } ); }
      else { this.newsList.push( { id, time, type, source, title, link } ); }

      this.newsList = this.newsList.slice( 0, this.maxCount );
      this.totalCount = this.newsList.length;
      this.lastCount += 1;
    },

    // clear autofetch timeout
    clearTimeout() {
      if ( this.sto ) clearTimeout( this.sto );
    },

    // auto fetch news on interval
    autoFetch( force ) {
      this.clearTimeout();
      this.sto = setTimeout( this.autoFetch, 1000 * this.refetchTime );
      if ( !this.options.news.refetch && !force ) return;
      this.fetchAll();
    },

    // fetch all news
    fetchAll() {
      let plist = [];
      this.working = true;
      this.lastCount = 0;
      this.newsSources.forEach( s => {
        if ( s.cb ) plist.push( this[ s.cb ]() );
      });
      Promise.all( plist )
      .then( () => {
        this.loaded = true;
        this.working = false;
        this.spinner( 'hide' );
        this.updateChart();
        this.setNotifications();
        this.emitData();
      })
      .catch( err => {
        let msg = err.message || err || 'There was a problem fetching latest news entries, check the console.';
        this.$bus.emit( 'showNotice', msg, 'warning' );
        console.info( 'Error:', msg );
      });
    },

    // fetch news data from cryptocurrencynews
    fetchReddit() {
      return new Promise( resolve => {
        const query    = encodeURIComponent( 'flair:General-News' );
        const params   = 'restrict_sr=1&include_facets=0&include_over_18=1&sort=new&t=all&q='+ query;
        const endpoint = 'https://www.reddit.com/r/CryptoCurrency/search.json?'+ params;

        this.$ajax.get( endpoint, {
          type: 'json',
          timeout: this.timeout,
          done: ( xhr, status, response ) => {
            if ( response && response.data && response.data.children ) {
              let list = response.data.children;

              for ( let i = 0; i < list.length; ++i ) {
                let item = list[ i ].data;
                if ( !item.title || !item.url ) continue;
                this.addNews( 'reddit', 'reddit.com', item.title, item.url );
              }
            }
            resolve();
          }
        });
      });
    },

    // fetch news data from ambcrypto
    fetchAMB() {
      return new Promise( resolve => {
        const endpoint = 'https://ambcrypto.com/category/altcoins-news/';

        this.$ajax.get( endpoint, {
          type: 'document',
          timeout: this.timeout,
          done: ( xhr, status, dom ) => {
            const list = scraper( dom, {
              items  : '.mvp-blog-story-wrap',
              params : {
                title : '.mvp-blog-story-text h2',
                link  : 'a',
              }
            });
            for ( let i = 0; i < list.length; ++i ) {
              let item = list[ i ];
              if ( !item.title || !item.link ) continue;
              this.addNews( 'ambnews', 'ambcrypto.com', item.title, item.link );
            }
            resolve();
          }
        });
      });
    },

    // fetch news data from newsapi
    fetchCCN() {
      return new Promise( resolve => {
        const endpoint = 'https://www.ccn.com/wp-admin/admin-ajax.php';
        const fdata    = new FormData();

        fdata.append( 'action', 'loadmore' );
        fdata.append( 'query', 'a:3:{s:3:"cat";i:132;s:14:"posts_per_page";i:30;s:5:"order";s:4:"DESC";}' );

        this.$ajax.post( endpoint, {
          type: 'document',
          timeout: this.timeout,
          data: fdata,
          done: ( xhr, status, dom ) => {
            const list = scraper( dom, {
              items  : 'article',
              params : {
                title : '.entry-title > a',
                link  : '.entry-title > a',
              }
            });
            for ( let i = 0; i < list.length; ++i ) {
              let item = list[ i ];
              if ( !item.title || !item.link ) continue;
              this.addNews( 'ccnews', 'ccn.com', item.title, item.link );
            }
            resolve();
          }
        });
      });
    },

    // fetch news from coinlib.io site
    fetchCoinlib() {
      return new Promise( resolve => {
        const endpoint = 'https://coinlib.io/news';

        this.$ajax.get( endpoint, {
          type: 'document',
          timeout: this.timeout,
          done: ( xhr, status, dom ) => {
            const list = scraper( dom, {
              items  : '.news-post',
              params : {
                title : '.news-content',
                link  : '.news-widget > a',
              }
            });
            for ( let i = 0; i < list.length; ++i ) {
              let item = list[ i ];
              if ( !item.title || !item.link ) continue;
              this.addNews( 'coinlib', 'coinlib.io', item.title, item.link );
            }
            resolve();
          }
        });
      });
    },

    // fetch news from binance site
    fetchBinance() {
      return new Promise( resolve => {
        const domain   = 'support.binance.com';
        const endpoint = 'https://'+ domain +'/hc/en-us/categories/115000056351-Announcements';

        this.$ajax.get( endpoint, {
          type: 'document',
          timeout: this.timeout,
          done: ( xhr, status, dom ) => {
            const list = scraper( dom, {
              items  : '.article-list > .article-list-item',
              params : {
                title : '.article-list-link', // innerHtml
                link  : '.article-list-link', // (link) href
              }
            });
            for ( let i = 0; i < list.length; ++i ) {
              let item = list[ i ];
              if ( !item.title || !item.link ) continue;
              item.link = item.link.replace( this.proxyDomain, domain );
              this.addNews( 'binance', 'binance.com', item.title, item.link );
            }
            resolve();
          }
        });
      });
    },

    // fetch data from coinmarketcal
    fetchEvents() {
      return new Promise( resolve => {
        const atoken   = 'ODM0OGY4MWFlNWU3M2I4YThiYTc2ZmQyMTIwMjkyMmQwNjRhZDk4MzA3NTgwODM4ZjkyYzcyZTg1N2NjNDA2Yw';
        const endpoint = 'https://api.coinmarketcal.com/v1/events?access_token='+ atoken +'&page=1&max=20&showOnly=hot_events';

        this.$ajax.get( endpoint, {
          type: 'json',
          timeout: this.timeout,
          done: ( xhr, status, list ) => {
            if ( Array.isArray( list ) ) {
              for ( let i = 0; i < list.length; ++i ) {
                let item = list[ i ];
                if ( !item.title || !item.coins || !item.description || !item.source ) continue;
                let { month, day, year, hour, minute, second, ampm } = utils.dateData( item.date_event );
                let date  = [ month, day, year ].join( '/' );
                let coins = '('+ item.coins.reduce( ( arr, coin ) => { arr.push( coin.symbol ); return arr; }, [] ).join( ', ' ) +')';
                let title = date +' '+ coins +': '+ item.title +' - '+ item.description.replace( /[\"\(\)]+/g, '' );
                this.addNews( 'events', 'coinmarketcal.com', title, item.source );
              }
            }
            resolve();
          }
        });
      });
    },
  },

  // component mounted
  mounted() {
    this.proxyDomain = String( this.options.proxy ).replace( /^https?\:\/\/|\/.*$/g, '' );
    this.spinner( 'show', 'waiting for news data' );
    this.autoFetch( true );
  },

  // component destroyed
  destroyed() {
    this.clearTimeout();
  },
}
</script>

<style lang="scss">
// comp wrapper
.newspage-wrap {
  position: relative;
  padding-top: calc( #{$topbarHeight} + 4.5em );
  padding-bottom: $topbarHeight;
  min-height: 100vh;

  .newspage-controls {
    position: fixed;
    padding: calc( #{$topbarHeight} + 1em ) 0 1em 0;
    left: 0;
    top: 0;
    width: 100%;
    background-color: rgba( $colorDocument, 0 );
    z-index: ( $zindexElements - 1 );

    .form-input {
      background-color: lighten( $colorDocument, 4% );

      &:hover {
        background-color: lighten( $colorDocument, 6% );
      }
    }

    .newspage-controls-title {
      display: none;
      @media #{$screenMedium} {
        display: block;
      }
    }
  }

  .newspage-chart {
    position: relative;
    padding: ( $padSpace / 2 ) 0;
    font-size: 90%;

    .newspage-chart-row {
      position: relative;
      padding: .1em $padSpace;

      &:first-of-type {
        margin-bottom: ( $padSpace / 2 );
      }
      & + .newspage-chart-row {
        border-top: 1px $lineStyle $lineColor;
      }
      & + .newspage-chart-row:hover {
        background-color: rgba( #000, 0.1 );
      }
      .newspage-chart-sm {
        width: 80px;
      }
      .newspage-chart-md {
        width: 180px;
      }
      .newspage-chart-bar {
        display: block;
        height: 5px;
        background-color: $colorInfo;
        border-radius: $lineJoin;
      }
      & > div + div {
        margin-left: 1em;
      }
    }
  }

  .newspage-list {
    position: relative;

    .newspage-list-item {
      margin: 0 0 ( $lineWidth * 2 ) 0;
      padding: ( $padSpace / 2 ) $padSpace;
      background-color: $colorDocumentLight;
      border-radius: $lineJoin;

      &:hover {
        background-color: lighten( $colorDocumentLight, 2% );
      }
    }
  }

  // collapsed mode
  &.collapsed {
    .newspage-controls {
      transform: translateY( -#{$topbarHeight} );
    }
  }

  // opaque mode
  &.opaque {
    .newspage-controls {
      background-color: rgba( 0, 0, 0, 0.85 );
      box-shadow: $shadowBold;
    }
  }
}
</style>
