<template>
  <main class="newspage-wrap" :class="{ 'collapsed': scrollDir === 'down', 'opaque': scrollPos > 10 }">

    <!-- fixed list search/filter controls -->
    <div class="newspage-controls">
      <div class="container">

        <!-- control elements -->
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
          <div class="newspage-controls-title push-right text-clip text-grey text-center flex-1">
            <big>News &amp; Events ({{ newsList.length }})</big>
          </div>

          <!-- control dropdown menus -->
          <div class="newspage-controls-filters text-nowrap">

            <!-- refectch news btn -->
            <button class="form-btn bg-grey-hover icon-reload iconLeft" :disabled="working > 0" @click="fetchAll">Re-fetch</button> &nbsp;

            <!-- filter menu -->
            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-down-open iconLeft">{{ filterLabel }}</button>
              <ul slot="list">
                <li class="clickable" v-for="s in newsSources" :key="s.key" @click="filterBy( s.key )">
                  <i class="icon-feedback iconLeft"></i> {{ s.name }}
                </li>
              </ul>
            </Dropdown>

          </div>
        </div>

      </div>
    </div>

    <!-- news list -->
    <div class="newspage-list">
      <div class="container">

        <div class="flex-row flex-middle flex-stretch border-top pad-top push-top" v-if="filterSearch && !filterList.length">
          <div class="tokenlist-item-icon icon-help iconMedium push-right"></div>
          <div class="tokenlist-item-symbol text-clip flex-1">
            <big class="text-danger">Found nothing matching: {{ filterSearch }}.</big> <br />
            <span class="text-grey">There are a total of {{ totalCount }} news and event entries available.</span>
          </div>
        </div>

        <div class="newspage-chart push-bottom" v-if="filterList.length">
          <BarChart :data="chartData" @click="chartClick"></BarChart>
        </div>

        <div class="newspage-list-item flex-row flex-middle flex-stretch" v-for="n in filterList" :key="n.id">
          <div class="flex-1 push-right text-clip">
            <a class="icon-feedback iconLeft" :href="n.link" target="_blank" rel="noopener">{{ n.title }}</a>
          </div>
          <div class="push-right text-nowrap if-medium">
            <span class="text-grey">{{ n.source }}</span>
          </div>
          <div>
            <a class="text-pill icon-link iconLeft" :href="n.link" target="_blank" rel="noopener">Source</a>
          </div>
        </div>

      </div>
    </div>

  </main>
</template>

<script>
// modules
import Dropdown from './Dropdown.vue';
import BarChart from './BarChart.vue';
import scraper from '../modules/scraper';
import utils from '../modules/utils';

// component
export default {

  // component list
  components: { Dropdown, BarChart },

  // component props
  props: {
    options: { type: Object, default() { return {} } },
    scrollDir: { type: String, default: '' },
    scrollPos: { type: Number, default: 0 },
    priceData: { type: Array, default: [] },
    coinsData: { type: Object, default() { return {} } },
  },

  // component data
  data() {
    return {
      // news data
      lastList: [],
      newsList: [],
      profileData: {},
      chartData: [],
      // count data
      totalCount: 0,
      newCount: 0,
      lastCount: 0,
      maxCount: 200,
      // list filter options
      filterSearch: '',
      filterType: '',
      filterLimit: 0,
      // other
      refetchTime: 300,
      proxyDomain: '',
      working: 0,
      loaded: false,
      sto: null,
      // news sources data
      newsSources: [
        { key: 'reddit',   name: 'Crypto Subreddit',       cb: 'fetchReddit' },
        { key: 'ccnews',   name: 'Crypto News (CCN)',      cb: 'fetchCCN' },
        { key: 'events',   name: 'Crypto Calendar',        cb: 'fetchEvents' },
        { key: 'binance',  name: 'Binance Announcements',  cb: 'fetchBinance' },
        { key: '',         name: 'All News Sources',       cb: '' },
      ],
    }
  },

  // watch
  watch: {

    // watch api fetch counter
    working: function() {
      // still fetching...
      if ( this.working > 0 ) return;

      // show notification when something new gets added to the news list
      if ( this.lastCount && this.lastCount !== this.totalCount ) {
        let n = this.newsList[ 0 ];
        this.$notify.add( 'Latest News ('+ this.lastCount +')', n.title, null, n.link );
      }
      // first run done
      this.loaded = true;
      this.updateChart();
    }
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

    // reset newCount
    resetCount() {
      this.newCount = 0;
      this.emitData();
    },

    // fetch all news
    fetchAll() {
      this.lastCount = 0;
      this.newsSources.forEach( s => {
        if ( s.cb ) this[ s.cb ]();
      });
    },

    // auto fetch news on interval
    autoFetch( force ) {
      if ( this.sto ) clearTimeout( this.sto );
      this.sto = setTimeout( this.autoFetch, 1000 * this.refetchTime );
      if ( !this.options.autoRefetch && !force ) return;
      this.fetchAll();
    },

    // clear fetch timeout intervals
    clearTimeout() {
      if ( this.sto ) clearTimeout( this.sto );
    },

    // emit news data
    emitData() {
      let total = this.totalCount;
      let count = this.newCount;
      let list  = this.newsList.slice();
      this.$emit( 'newsData', { total, count, list } );
    },

    // set filter type
    filterBy( type ) {
      this.filterType = type;
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

      this.newsList   = this.newsList.slice( 0, this.maxCount );
      this.totalCount = this.newsList.length;
      this.newCount   = ( this.newCount >= this.totalCount ) ? this.totalCount : ( this.newCount + 1 );
      this.lastCount += 1;
    },

    // fetch news data from cryptocurrencynews
    fetchReddit() {
      const type = 'reddit';
      const query = encodeURIComponent( 'flair:General-News' );
      const endpoint = 'https://www.reddit.com/r/CryptoCurrency/search.json?q='+ query +'&restrict_sr=1&include_facets=0&include_over_18=1&sort=new&t=all';
      const source = utils.parseUrl( endpoint, 'host' );

      this.working++;
      this.$ajax.get( endpoint, {
        type: 'json',
        done: ( xhr, status, response ) => { this.working--; },
        success: ( xhr, status, response ) => {

          if ( !response || !response.data || !response.data.children ) return;
          let list = response.data.children;

          for ( let i = 0; i < list.length; ++i ) {
            let item = list[ i ].data;
            if ( !item.title || !item.url ) continue;
            this.addNews( type, source, item.title, item.url );
          }
          this.emitData();
        }
      });
    },

     // fetch news data from newsapi
    fetchCCN() {
      const type = 'ccnews';
      const endpoint = 'https://www.ccn.com/wp-admin/admin-ajax.php';
      const source = utils.parseUrl( endpoint, 'host' );

      const fd = new FormData()
      fd.append( 'action', 'loadmore' );
      fd.append( 'query', 'a:3:{s:3:"cat";i:132;s:14:"posts_per_page";i:30;s:5:"order";s:4:"DESC";}' );

      this.working++;
      this.$ajax.post( endpoint, {
        type: 'document',
        data: fd,
        done: ( xhr, status, dom ) => { this.working--; },
        success: ( xhr, status, dom ) => {

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
            this.addNews( type, source, item.title, item.link );
          }
          this.emitData();
        }
      });
    },

    // fetch news from binance site
    fetchBinance() {
      const type = 'binance';
      const endpointDomain = 'support.binance.com';
      const endpoint = 'https://'+ endpointDomain +'/hc/en-us/categories/115000056351-Announcements';
      const source = utils.parseUrl( endpoint, 'host' );

      this.working++;
      this.$ajax.get( endpoint, {
        type: 'document',
        done: ( xhr, status, dom ) => { this.working--; },
        success: ( xhr, status, dom ) => {

          const list = scraper( dom, {
            items  : '.article-list > .article-list-item ',
            params : {
              title : '.article-list-link', // innerHtml
              link  : '.article-list-link', // (link) href
            }
          });

          for ( let i = 0; i < list.length; ++i ) {
            let item = list[ i ];
            if ( !item.title || !item.link ) continue;
            item.link = item.link.replace( this.proxyDomain, endpointDomain );
            this.addNews( type, source, item.title, item.link );
          }
          this.emitData();
        }
      });
    },

    // fetch data from coinmarketcal
    fetchEvents() {
      const type = 'events';
      const atoken = 'ODM0OGY4MWFlNWU3M2I4YThiYTc2ZmQyMTIwMjkyMmQwNjRhZDk4MzA3NTgwODM4ZjkyYzcyZTg1N2NjNDA2Yw';
      const endpoint = 'https://api.coinmarketcal.com/v1/events?access_token='+ atoken +'&page=1&max=20&showOnly=hot_events';
      const source = utils.parseUrl( endpoint, 'host' );

      this.working++;
      this.$ajax.get( endpoint, {
        type: 'json',
        done: ( xhr, status, list ) => { this.working--; },
        success: ( xhr, status, list ) => {

          if ( !list || !Array.isArray( list ) ) return;

          for ( let i = 0; i < list.length; ++i ) {
            let item = list[ i ];
            if ( !item.title || !item.coins || !item.description || !item.source ) continue;

            let { month, day, year, hour, minute, second, ampm } = utils.dateData( item.date_event );
            let date  = [ month, day, year ].join( '/' );
            let coins = '('+ item.coins.reduce( ( arr, coin ) => { arr.push( coin.symbol ); return arr; }, [] ).join( ', ' ) +')';
            let title = date +' '+ coins +': '+ item.title +' - '+ item.description.replace( /[\"\(\)]+/g, '' );

            this.addNews( type, source, title, item.source );
          }
          this.emitData();
        }
      });
    },

    // on chart column click
    chartClick( data ) {
      this.filterSearch = data.search;
    },

    // draw token chart from profile data
    updateChart() {
      let data   = [];
      let tokens = {};

      // pair token from priceData with name from coinsData
      this.priceData.forEach( p => {
        if ( !this.coinsData.hasOwnProperty( p.token ) ) return;
        tokens[ p.token ] = this.coinsData[ p.token ];
      });
      // check token symbol and name against all loaded news titles
      Object.keys( tokens ).forEach( t => {
        let label  = t;
        let search = t +'|'+ tokens[ t ];
        let value  = utils.search( this.newsList, 'title', search ).length;
        if ( value > 1 ) data.push( { label, value, search } );
      });
      // update data
      this.chartData = data;
    },
  },

  // component mounted
  mounted() {
    this.proxyDomain = String( this.options.corsProxyUrl ).replace( /^https?\:\/\/|\/.*$/g, '' );
    this.$bus.on( 'resetNewsCount', this.resetCount );
    this.autoFetch( true );
  },

  // component destroyed
  destroyed() {
    this.clearTimeout();
  }
}
</script>

<style lang="scss">
// comp wrapper
.newspage-wrap {
  position: relative;
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
    padding: $padSpace;
    background-color: $lineColor;
    border-radius: $lineJoin;
  }

  .newspage-list {
    position: relative;
    padding: calc( #{$topbarHeight} + 4.5em ) 0;

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
    .newspage-controls,
    .newspage-list {
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
