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
              <button slot="trigger" class="form-btn bg-primary-hover icon-down-open iconLeft" v-text="filterByLabel" title="Filter Type" v-tooltip></button>
              <ul slot="list">
                <li class="clickable" @click="filterBy( 'reddit' )">
                  <i class="icon-feedback iconLeft"></i> Reddit Posts
                </li>
                <li class="clickable" @click="filterBy( 'coinlib' )">
                  <i class="icon-feedback iconLeft"></i> Coinlib News
                </li>
                <li class="clickable" @click="filterBy( 'binance' )">
                  <i class="icon-chart-line iconLeft"></i> Binance News
                </li>
                <li class="clickable" @click="filterBy( 'events' )">
                  <i class="icon-calendar iconLeft"></i> Upcoming Events
                </li>
                <li class="clickable" @click="filterBy( '' )">
                  <i class="icon-list-add iconLeft"></i> Show All
                </li>
              </ul>
            </Dropdown>

          </div>
        </div>

      </div>
    </div>

    <div class="newspage-list">
      <div class="container">
        <div class="newspage-list-item flex-row flex-middle flex-stretch" v-for="n in filterList" :key="n.id">
          <div class="flex-1 push-right text-clip">
            <a class="icon-feedback iconLeft" :href="n.link" target="_blank" rel="noopener">{{ n.title }}</a>
          </div>
          <div class="push-right text-nowrap">
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
import scraper from '../modules/scraper';
import utils from '../modules/utils';

// component
export default {

  // component list
  components: { Dropdown },

  // component props
  props: {
    options: { type: Object, default() { return {} } },
    scrollDir: { type: String, default: '', required: false },
    scrollPos: { type: Number, default: 0, required: false },
    priceData: { type: Array, default: [], required: false },
  },

  // component data
  data() {
    return {
      // news data
      lastList: [],
      newsList: [],
      profileData: {},
      // count data
      totalCount: 0,
      newCount: 0,
      maxCount: 200,
      // list filter options
      filterSearch: '',
      filterType: '',
      filterLimit: 0,
      // other
      refetchTime: 300,
      proxyDomain: '',
      working: 0,
      sto: null,
    }
  },

  // watch
  watch: {

    // build profile after news data has loaded
    working: function() {
      // still working ...
      if ( this.working > 0 ) return;

      // new entries available
      if ( this.newCount && this.newCount !== this.totalCount ) {
        let n = this.newsList[ 0 ];
        this.$notify.add( 'Latest News ('+ this.newCount +')', n.title, null, n.link );
      }
      // scan news titles for token mentions
      // this.buildProfile();
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
      if ( this.filterSearch ) {
        list = list.filter( n => n.title.indexOf( this.filterSearch.toUpperCase() ) !== -1 );
      }
      // limit list to a number of entries
      if ( limit && limit < list.length ) {
        list = list.slice( 0, limit );
      }
      return list;
    },

    // sort-by label for buttons, etc
    filterByLabel() {
      switch ( this.filterType ) {
        case 'reddit'  : return 'Reddit Posts';
        case 'coinlib' : return 'Coinlib News';
        case 'binance' : return 'Binance News';
        case 'events'  : return 'Upcoming Events';
        default        : return 'All Entries';
      }
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
      this.fetchEvents();
      this.fetchBinance();
      this.fetchCoinlib();
      this.fetchReddit();
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

      let id = utils.randString( 20 );
      let time = Date.now();
      this.newsList.unshift( { id, time, type, source, title, link } );

      if ( this.newsList.length > this.maxCount ) {
        this.newsList = this.newsList.slice( 0, this.maxCount );
      }
      this.totalCount = this.newsList.length;
      this.newCount = ( this.newCount >= this.totalCount ) ? this.totalCount : ( this.newCount + 1 );
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

    // fetch news data from coinlib
    fetchCoinlib() {
      const type = 'coinlib';
      const endpoint = 'https://coinlib.io/news';
      const source = utils.parseUrl( endpoint, 'host' );

      this.working++;
      this.$ajax.get( endpoint, {
        type: 'document',
        done: ( xhr, status, dom ) => { this.working--; },
        success: ( xhr, status, dom ) => {

          const list = scraper( dom, {
            items  : '.news .news-post',
            params : {
              title : '.news-widget > .news-widget-title',
              link  : '.news-widget > a',
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
      const endpoint = 'https://'+ endpointDomain +'/hc/en-us/sections/115000202591-Latest-News';
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
      const endpoint = 'https://coinmarketcal.com/?form[filter_by][]=hot_events';
      const source = utils.parseUrl( endpoint, 'host' );

      this.working++;
      this.$ajax.get( endpoint, {
        type: 'document',
        done: ( xhr, status, dom ) => { this.working--; },
        success: ( xhr, status, dom ) => {

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
            let item = list[ i ];
            if ( !item.date || !item.coin || !item.info || !item.link ) continue;
            this.addNews( type, source, item.coin +' - '+ item.info +' - '+ item.date, item.link );
          }
          this.emitData();
        }
      });
    },

    // build token keyword count from loaded news data
    buildProfile() {
      let tokens = {};

      // 1. add all available tokens to list
      this.priceData.forEach( p => { tokens[ p.token ] = 0; } );

      // 2. loop over all loaded news entries
      this.newsList.forEach( n => {

        // 3. convert news title into list of unique words
        let words = n.title.replace( /[\(\)]+/g, '' ).split( /\s+/g );
        words = Array.from( new Set( words ) );

        // 4. loop over each word
        words.forEach( w => {

          // 5. see if one of the words match a token name
          if ( tokens.hasOwnProperty( w ) ) tokens[ w ]++;
        });
      });

      // 6. remove tokens with zero count
      Object.keys( tokens ).forEach( k => {
        if ( tokens[ k ] < 1 ) delete tokens[ k ];
      });

      // 7. save profile data
      this.profileData = tokens;
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
