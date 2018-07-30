<template>
  <main class="newspage-wrap" :class="{ 'collapsed': scrollDir === 'down', 'opaque': scrollPos > 10 }">

    <!-- controls section -->
    <section class="newspage-controls">
      <div class="container">
        <div class="newspage-controls-row flex-row flex-middle flex-space">

          <!-- control input -->
          <div class="newspage-controls-search push-right">
            <div class="form-input">
              <div class="icon-search iconLeft"></div>
              <input class="push-right" type="text" v-model="filterSearch" placeholder="Search ..." />
              <button class="icon-close text-primary-hover" @click="filterSearch = ''" v-if="filterSearch"></button>
            </div>
          </div>

          <!-- control heading -->
          <div class="newspage-controls-title push-right text-clip text-center flex-1">
            <big>Twitter News ({{ lastCount }}/{{ twitterEntries.length }})</big>
          </div>

          <!-- control dropdown menus -->
          <div class="newspage-controls-filters text-nowrap">

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-down-open iconLeft" title="Filter Source" v-tooltip>{{ filterLabel }}</button>
              <div slot="list">

                <div class="flex-row flex-top flex-space pad-h">
                  <div class="flex-1 push-right form-label">Twitter Accounts</div>
                  <button v-if="filterHandle" class="icon-list iconLeft" @click="filterHandle = ''">Show all</button>
                </div>

                <div class="twitter-accounts-list push-bottom border-top border-bottom">
                  <div class="twitter-accounts-item flex-row flex-middle flex-stretch" v-for="a in accountsList" :key="a.handle">
                    <div class="flex-1 text-clip clickable push-right" title="Show tweets" v-tooltip @click="applyFilters( '', a.handle )">
                      <span class="icon-twtr iconLeft text-clip" :class="{ 'text-gain': a.active, 'text-danger text-striked': a.error !== '' }">{{ a.name }}</span>
                    </div>
                    <div class="push-right">
                      <span v-if="a.checking" class="text-badge text-primary">...</span>
                      <span v-else class="text-badge">{{ a.count }}</span>
                    </div>
                    <button class="icon-close text-danger-hover" title="Remove account" v-tooltip @click="removeTwitterHandler( a.handle )"></button>
                  </div>
                </div>

                <div class="form-label pad-h">Add New Account</div>

                <form class="twitter-accounts-form pad-h" action="#" autocomplete="off" @submit.prevent="accountFormHandler">
                  <div class="form-input text-nowrap">
                    <div class="icon-twtr iconLeft"></div>
                    <input class="flex-1" type="text" name="handle" placeholder="Twitter handle..." />
                    <button class="icon-add text-primary-hover" type="submit"></button>
                  </div>
                </form>

              </div>
            </Dropdown> &nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-grey-hover icon-config" title="Options" v-tooltip></button>
              <div slot="list" class="pad-h">

                <div class="form-label">News &amp; Notifications Options</div>
                <Toggle class="push-top" :text="'Auto re-fetch latest news'" v-model="options.news.refetch" @change="applyOptions"></Toggle>
                <Toggle class="push-top" :text="'Notify when news is available'" v-model="options.news.notify" @change="applyOptions"></Toggle>
                <Toggle class="push-top" :text="'E-mail notifications'" v-model="options.news.send" @change="applyOptions"></Toggle>

                <hr />
                <div class="form-label">Limit Number of Entries</div>
                <div class="flex-row flex-middle flex-stretch">
                  <input class="flex-1 push-right" type="range" min="10" max="200" step="5" v-model="options.news.max" @change="applyOptions" />
                  <span class="text-primary">{{ options.news.max }}</span>
                </div>

                <hr />
                <div class="form-label">Other Options</div>
                <button class="icon-reload iconLeft text-pill bg-info-hover" @click="updateChart( true )">Update sentiment data</button> <br />
                <button class="icon-close iconLeft text-pill bg-info-hover" @click="flushTweets()">Flush tweets cache</button> <br />
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
            <div class="newspage-chart-sm text-nowrap text-right">Tweets</div>
            <div class="flex-5 text-nowrap if-medium">Mention %</div>
            <div class="newspage-chart-md text-nowrap if-small">Sentiment</div>
            <div class="flex-1 text-nowrap text-right">Details</div>
          </div>
          <div class="newspage-chart-row flex-row flex-middle flex-stretch clickable" v-for="d in chartData" :key="d.token" @click="filterSearch = d.search">
            <div class="newspage-chart-sm text-clip text-bright">{{ d.token }}</div>
            <div class="newspage-chart-md text-nowrap text-default">{{ d.name }}</div>
            <div class="newspage-chart-sm text-nowrap text-right">{{ d.count }}</div>
            <div class="flex-5 text-nowrap if-medium"><span class="newspage-chart-bar" :class="d.barColor" :style="{ 'width': d.barPercent +'%' }"></span></div>
            <div class="newspage-chart-md text-nowrap text-monospace if-small" :class="d.styles" v-html="d.sentiment"></div>
            <div class="flex-1 text-nowrap text-right">
              <button class="icon-search iconLeft text-default-hover" @click.stop="$bus.emit( 'setRoute', d.route )">Details</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- fallback section -->
    <section class="push-bottom" v-if="!tweetsList.length">
      <div class="container">
        <div class="card flex-row flex-middle flex-stretch">
          <div class="icon-help iconLarge text-grey push-right"></div>
          <div class="flex-1">
            <div v-if="filterSearch">
              <h3 class="text-bright">No Match For <span class="text-primary">{{ filterSearch }}</span></h3>
              <span class="text-grey">Can't find anything matching your search input.</span>
            </div>
            <div v-else-if="filterHandle">
              <h3 class="text-bright">No News Data For <span class="text-primary">{{ filterLabel }}</span></h3>
              <span class="text-grey">There are no entries available for the selected news source.</span>
            </div>
            <div v-else>
              <h3 class="text-primary">No News Data Yet</h3>
              <span class="text-grey">News data from remote sources has not loaded yet.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- news list -->
    <section class="newspage-list">
      <div class="container">

        <div class="newspage-list-item flex-row flex-top flex-stretch" v-for="t in tweetsList" :key="t.id">

          <div class="push-right" :class="{ 'alert-bubble': t.isNew }">
            <img class="newspage-list-image" :src="t.avatar" :alt="t.handle" />
          </div>

          <div class="flex-1">
            <div class="newspage-list-header flex-row flex-space">
              <h3 class="text-clip clickable" @click="openLink( 'https://twitter.com/'+ t.handle )">
                <span class="text-primary-hover">{{ t.name }}</span> &nbsp;
                <small class="text-smaller text-grey-hover">@{{ t.handle }}</small>
              </h3>
              <div class="text-clip if-small">
                <small class="text-grey icon-clock iconLeft">{{ t.time }}</small> &nbsp;
                <a class="text-primary-hover icon-link" :href="t.link" target="_blank" title="Open tweet" v-tooltip></a>
              </div>
            </div>
            <div class="newspage-list-text text-bright text-wrap" v-html="t.text"></div>
          </div>

        </div>

      </div>
    </section>

  </main>
</template>

<script>
// modules
import Dropdown from './Dropdown.vue';
import Toggle from './Toggle.vue';
import Twitter from '../modules/twitter';
import utils from '../modules/utils';

// component
export default {

  // component list
  components: { Dropdown, Toggle },

  // component props
  props: {
    options: { type: Object, default() { return {} }, required: true },
    active: { type: Boolean, default: false },
    scrollDir: { type: String, default: '' },
    scrollPos: { type: Number, default: 0 },
    priceData: { type: Array, default: [] },
  },

  // component data
  data() {
    return {
      storeKey: 'tweets_list_data',
      // news data
      twitterHandlers: [],
      twitterEntries: [],
      twitterChecking: [],
      twitterCounter: 0,
      twitterInterval: null,
      // filter options
      filterSearch: '',
      filterHandle: '',
      // coins data
      totalTokens: 0,
      chartData: [],
      // count data
      lastCount: 0,
      maxCount: 50,
    }
  },

  // watchers
  watch: {

    // update chart data when new tokens load from socket api
    priceData() {
      if ( this.priceData.length > this.totalTokens ) {
        this.totalTokens = this.priceData.length;
        this.updateChart();
      }
    },

    // update chart data when tweets change
    twitterEntries() {
      this.updateChart();
    },
  },

  // computed methods
  computed: {

    // get filtered list
    tweetsList() {
      let list = this.twitterEntries.slice(); // copy

      // filter by account handle
      if ( this.filterHandle ) {
        list = list.filter( t => t.handle === this.filterHandle );
      }
      // filter by search text against tweet name, handle and text
      if ( this.filterSearch && this.filterSearch.length > 1 ) {
        list = utils.search( list, 'text', this.filterSearch );
      }
      // check if a tweet is "new"
      list = list.map( ( t, i ) => {
        t.isNew = ( i < this.lastCount );
        return t;
      })
      // done
      return list;
    },

    // build twitter accounts list from handler list with checking indicator
    accountsList() {
      let list = this.twitterHandlers.map( tw => {
        let { uid, handle, name, avatar, url, last, error } = tw.getData();
        let active = ( handle === this.filterHandle );
        let checking = this.twitterChecking.filter( h => h === handle ).length;
        let count = this.twitterEntries.filter( t => t.handle === handle ).length;
        return { uid, handle, name, avatar, url, last, error, active, checking, count };
      });
      return list.sort( ( a, b ) => {
        let _a = a.name.toUpperCase();
        let _b = b.name.toUpperCase();
        if ( _a < _b ) return -1;
        if ( _a > _b ) return 1;
        return 0;
      });
    },

    // sort-by label for buttons, etc
    filterLabel() {
      let l = this.twitterHandlers.length;
      let t = this.twitterHandlers.filter( tw => tw.handle === this.filterHandle ).shift();
      if ( t && t.handle ) return '@'+ t.handle;
      return 'All Sources ('+ l +')';
    },
  },

  // custom methods
  methods: {

    // apply options
    applyOptions( options ) {
      this.$bus.emit( 'setOptions', options );
    },

    // open external link
    openLink( link ) {
      window.open( link, '_blank' );
    },

    // emit news data
    emitData() {
      let count = this.lastCount;
      let total = this.twitterEntries.length;
      let list  = this.twitterEntries.slice();
      this.$bus.emit( 'newsData', { count, total, list } );
    },

    // apply filters
    applyFilters( search, handle ) {
      this.filterSearch = String( search || '' ).trim();
      this.filterHandle = String( handle || '' ).trim();
    },

    // reset filters
    resetFilters() {
      this.filterSearch = '';
      this.filterHandle = '';
    },

    // reset number of new entries since last checked
    resetCount() {
      if ( !this.active ) return;
      this.lastCount = 0;
      this.emitData();
    },

    // add news to notification and msg queue
    setNotification( tweet ) {
      let { name, text, avatar, link } = tweet;
      let isaway = ( !this.active || !document.hasFocus() );

      // remove html and urls from tweet text
      text = utils.stripHtml( text, true );

      // increase new entries indicator if away
      if ( isaway ) {
        this.lastCount += 1;
        this.$bus.emit( 'mainMenuAlert' );
      }
      // show tweet notification only if enabled and away
      if ( this.options.news.notify && isaway ) {
        this.$notify.add( '💬  '+ name, text, avatar, e => { this.$bus.emit( 'setRoute', '/news' ) } );
      }
      // always send notification via api if enabled
      if ( this.options.news.send ) {
        let info  = `<a href="${ link }">${ text }</a>`;
        this.$bus.emit( 'msgQueue', { name, info, avatar } );
      }
    },

    // scan tweets against list of tokens from api and build sentiment analysis data for chart
    updateChart( notify ) {
      let data = [];
      this.priceData.forEach( p => {
        if ( p.asset !== 'BTC' ) return;

        let token  = p.token;
        let name   = p.name;
        let search = token +'|'+ name;
        let list   = utils.search( this.twitterEntries, 'text', search, true );
        let count  = list.length;
        if ( !count ) return;

        let asset  = ( token === 'BTC' ) ? 'USDT' : 'BTC';
        let route  = '/symbol/'+ token + asset;
        let text   = list.reduce( ( a, t ) => a += ' '+ t.text, '' ).trim();
        let sdata  = this.$sentiment.analyze( text );
        let { score, positive, negative, comparative, sign, word, styles, sentiment } = sdata;
        data.push( { token, name, search, route, count, score, styles, sentiment } );
      });

      let max = data.reduce( ( m, d ) => d.count > m ? d.count : m, 0 );
      this.chartData = data.map( d => {
        let ratio = ( max > 0 ) ? ( d.count / max ) : 0.1;
        let barPercent = Math.round( ratio * 100 );
        let barColor = 'bg-grey';
        if ( barPercent > 20 ) { barColor = 'bg-bright'; }
        if ( barPercent > 40 ) { barColor = 'bg-secondary'; }
        if ( barPercent > 60 ) { barColor = 'bg-primary'; }
        return Object.assign( d, { barPercent, barColor } );
      });

      if ( notify ) {
        if ( !data.length ) return this.$bus.emit( 'showNotice', 'No token mentions found yet.', 'warning' );
        return this.$bus.emit( 'showNotice', 'Analisys data has been updated.', 'success' );
      }
    },

    // save tweets list to local store
    saveTweets() {
      if ( !this.twitterEntries.length ) return;
      this.$store.setData( this.storeKey, this.twitterEntries );
    },

    // flush list of saved tweets from store
    flushTweets() {
      if ( !confirm( 'Delete cached tweets?' ) ) return;
      this.twitterEntries = [];
      this.$store.setData( this.storeKey, this.twitterEntries );
      this.$bus.emit( 'showNotice', 'Cached tweets have been deleted.', 'success' );
      this.emitData();
    },

    // load saved tweets from local store
    loadTweets() {
      let tweets = this.$store.getData( this.storeKey );
      if ( Array.isArray( tweets ) ) this.twitterEntries = tweets;
      this.emitData();
    },

    // add new tweets to the list
    onTweetsHandler( err, handle, tweets ) {
      if ( err ) {
        console.warn( err );
      }
      if ( handle ) {
        this.twitterChecking = this.twitterChecking.filter( h => h !== handle );
      }
      if ( Array.isArray( tweets ) && tweets.length ) {
        let tweet;
        for ( tweet of tweets ) {
          if ( this.twitterEntries.filter( t => t.id === tweet.id ).length ) return;
          this.twitterEntries.unshift( tweet );
          this.twitterEntries = this.twitterEntries.slice( 0, this.options.news.max );
        }
        this.setNotification( tweet );
        this.updateChart();
        this.emitData();
        this.saveTweets();
      }
    },

    // save current list of tracked accounts to store
    saveNewsSources() {
      const sources = this.twitterHandlers.map( tw => tw.handle );
      this.options.news.sources = sources;
      this.applyOptions( this.options );
      this.$bus.emit( 'showNotice', 'News source list has been saved.', 'success' );
    },

    // handle adding accounts from a form
    accountFormHandler( e ) {
      if ( !e || !e.target ) return;
      let handle = String( e.target.handle.value || '' ).replace( /[^\w]+/g, '' ).trim();
      if ( !handle ) return this.$bus.emit( 'showNotice', 'Please enter a valid twitter handle.', 'warning' );
      this.createTwitterHandler( handle, true, true );
      this.resetFilters();
      e.target.reset();
    },

    // create new instance of Twitter handler for a handle
    createTwitterHandler( handle, fetch, save ) {
      if ( !handle || this.twitterHandlers.filter( t => t.handle === handle ).length ) return;
      this.twitterHandlers.push( new Twitter( handle, { fetchDelay: 300, limitCount: 1 } ) );
      if ( fetch ) this.fetchByHandle( handle );
      if ( save ) this.saveNewsSources();
    },

    // remove instance of Twitter handler from list
    removeTwitterHandler( handle ) {
      if ( !confirm( 'Stop tracking tweets from @'+ handle +'?' ) ) return;
      this.twitterHandlers = this.twitterHandlers.filter( t => t.handle !== handle );
      this.twitterEntries  = this.twitterEntries.filter( t => t.handle !== handle );
      this.twitterChecking = this.twitterChecking.filter( h => h !== handle );
      this.saveNewsSources();
      this.saveTweets();
      this.resetFilters();
      this.updateChart();
    },

    // fetches tweets manually for a handle
    fetchByHandle( handle ) {
      const tw = this.twitterHandlers.filter( t => t.handle === handle ).shift();
      if ( !tw ) return this.$bus.emit( 'showNotice', 'Could not find account @'+ handle +'.', 'warning' );
      if ( this.twitterChecking.filter( h => h === handle ).length ) return; // fetching...
      this.twitterChecking.push( tw.handle );
      tw.fetchTweets( this.$ajax, this.onTweetsHandler );
    },

    // fetches tweets on an interval
    fetchByInterval() {
      if ( !this.options.news.refetch ) return;
      if ( !this.twitterHandlers.length ) return;
      const last = this.twitterHandlers.length - 1;
      const tw = this.twitterHandlers[ this.twitterCounter ];
      if ( tw ) this.fetchByHandle( tw.handle );
      this.twitterCounter = ( this.twitterCounter < last ) ? ( this.twitterCounter + 1 ) : 0;
    },

    // load and start tracking twitter accounts for latest tweets
    setupTwitterTrackers() {
      this.twitterHandlers = [];
      let accounts = utils.shuffle( this.options.news.sources || [] );
      for ( let handle of accounts ) this.createTwitterHandler( handle );
      if ( this.twitterInterval ) clearInterval( this.twitterInterval );
      this.twitterInterval = setInterval( this.fetchByInterval, 5000 );
      this.fetchByInterval();
    },
  },

  // component mounted
  mounted() {
    this.setupTwitterTrackers();
    this.loadTweets();
    document.addEventListener( 'blur', this.resetCount );
  },

  // component destroyed
  destroyed() {
    this.twitterHandlers = [];
    this.twitterEntries  = [];
    this.twitterChecking = [];
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

    .newspage-controls-search {
      .form-input {
        background-color: lighten( $colorDocument, 4% );

        &:hover {
          background-color: lighten( $colorDocument, 6% );
        }
      }
    }

    .newspage-controls-title {
      display: none;
      @media #{$screenMedium} {
        display: block;
      }
    }

    .twitter-accounts-list {
      overflow-y: auto;
      min-width: 300px;
      max-height: 300px;

      .twitter-accounts-item {
        padding: .5em 1em;
        background-color: rgba( 0, 0, 0, 0 );

        &:hover {
          background-color: rgba( 0, 0, 0, 0.08 );
        }
        & + .twitter-accounts-item {
          border-top: $lineWidth $lineStyle $lineColor;
        }
      }
    }
  }

  .newspage-chart {
    position: relative;
    padding: ( $padSpace / 2 ) 0;

    .newspage-chart-row {
      position: relative;
      padding: 0 $padSpace;

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
      padding: $padSpace;
      background-color: $colorDocumentLight;
      border-radius: $lineJoin;

      &:hover {
        background-color: lighten( $colorDocumentLight, 2% );
      }

      .newspage-list-image {
        display: block;
        overflow: hidden;
        background-color: $colorGrey;
        text-align: center;
        width: 68px;
        height: 68px;
        line-height: 68px;
        border-radius: 100px;
        color: $colorDocument;
      }

      .newspage-list-header {
        margin-bottom: .4em;
        padding-bottom: .4em;
        border-bottom: $lineWidth $lineStyle $lineColor;
      }

      .newspage-list-text {
        position: relative;
        overflow: hidden;

        a {
          text-decoration: underline;
          color: $colorDefault;
        }
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
