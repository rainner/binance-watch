<template>
  <main class="page-wrap" :class="{ 'collapsed': header.collapsed, 'opaque': header.opaque }">

    <!-- controls section -->
    <section class="page-topbar">
      <div class="container">
        <div class="flex-row flex-middle flex-space">

          <!-- control search -->
          <Search class="light push-right" v-model="searchStr"></Search>

          <!-- control heading -->
          <div class="flex-1 text-clip text-big text-center push-right if-medium">
            Twitter News ({{ newCount }}/{{ newsEntries.length }})
          </div>

          <!-- control dropdown menus -->
          <div class="text-nowrap">

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-down-open iconLeft">{{ filterLabel }}</button>
              <div slot="list">

                <div class="flex-row flex-top flex-space pad-h push-bottom">
                  <div class="flex-1 push-right form-label icon-twtr iconLeft">Twitter Accounts ({{ accountsList.length }})</div>
                  <button v-if="searchHandle" class="text-bright-hover icon-list iconLeft" @click="searchHandle = ''">Show all</button>
                </div>

                <div class="tablelist-wrap push-bottom">
                  <div class="tablelist-content">
                    <div class="tablelist-row flex-row flex-middle flex-stretch" v-for="a in accountsList" :key="a.handle">
                      <div class="flex-1 text-bright-hover text-clip clickable push-right" @click="applyFilters( '', a.handle )">
                        <span class="text-info icon-twtr"></span>
                        <span class="text-clip" :class="{ 'text-gain': a.active, 'text-danger text-striked': a.error }" :title="a.name" v-tooltip>@{{ a.handle }}</span>
                      </div>
                      <div class="push-right">
                        <span class="clickable" title="Fetch" @click="fetchByHandle( a.handle )" v-tooltip>
                          <span v-if="a.fetching" class="text-badge text-primary">...</span>
                          <span v-else class="text-badge">{{ a.count }}</span>
                        </span>
                      </div>
                      <button class="icon-close text-danger-hover" title="Remove" v-tooltip @click="removeTwitterHandler( a.handle )"></button>
                    </div>
                  </div>
                </div>

                <form class="twitter-accounts-form pad-h push-bottom" action="#" autocomplete="off" @submit.prevent="accountFormHandler">
                  <div class="form-input text-nowrap">
                    <div class="icon-twtr iconLeft"></div>
                    <input class="flex-1" type="text" name="handle" placeholder="Add twitter @handle..." />
                    <button class="icon-add text-primary-hover" type="submit"></button>
                  </div>
                </form>

                <div class="text-nowrap pad-h">
                  <button class="icon-add iconLeft text-bright-hover" @click="importAccounts()">Import List</button>
                  <span class="text-grey">&nbsp;&nbsp;</span>
                  <button class="icon-save iconLeft text-bright-hover" @click="exportAccounts()">Export List</button>
                </div>

              </div>
            </Dropdown> &nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-config"></button>
              <div slot="list" class="pad-h">

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">News &amp; Notifications Options</div>
                  <Toggle :text="'Auto re-fetch latest news'" v-model="options.news.enabled" @change="saveOptions"></Toggle>
                  <Toggle :text="'Notify when news is available'" v-model="options.news.notify" @change="saveOptions"></Toggle>
                  <Toggle :text="'E-mail news notifications'" v-model="options.news.send" @change="saveOptions"></Toggle>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">How often to send fetch requests</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="1" max="60" step="1" v-model="options.news.interval" @change="saveOptions" />
                    <span class="text-bright">{{ options.news.interval | toNoun( 'sec', 'secs' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Delay re-fetching from same source</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="60" max="600" step="10" v-model="options.news.delay" @change="saveOptions" />
                    <span class="text-bright">{{ options.news.delay | toNoun( 'sec', 'secs' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Tweets to fetch from each source</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="1" max="10" step="1" v-model="options.news.tweets" @change="saveOptions" />
                    <span class="text-bright">{{ options.news.tweets | toNoun( 'tweet', 'tweets' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Limit tweets by days posted</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="1" max="30" step="1" v-model="options.news.days" @change="saveOptions" />
                    <span class="text-bright">{{ options.news.days | toNoun( 'day', 'days' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Total number of tweets to store</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="10" max="200" step="10" v-model="options.news.total" @change="saveOptions" />
                    <span class="text-bright">{{ options.news.total }}</span>
                  </div>
                </div>

                <div>
                  <div class="form-label push-bottom push-small">Limit visible tweets on page</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="10" max="100" step="10" v-model="options.news.max" @change="saveOptions" />
                    <span class="text-bright">{{ options.news.max }}</span>
                  </div>
                </div>

              </div>
            </Dropdown>

          </div>

        </div>
      </div>
    </section>

    <!-- chart section -->
    <section class="push-bottom">
      <div class="container">

        <div class="card tablelist-wrap">

          <!-- list headers -->
          <div class="tablelist-header">
            <div class="flex-row flex-middle flex-stretch">
              <div class="tablelist-20 text-clip push-right">
                <span class="clickable" @click="$sorter.sortOrder( 'sentiment', 'name', 'asc' )">
                  Name <i class="text-primary" :class="$sorter.getStyles( 'sentiment', 'name' )"></i>
                </span>
              </div>
              <div class="tablelist-10 text-nowrap push-right if-small">
                <span class="clickable" @click="$sorter.sortOrder( 'sentiment', 'token', 'asc' )">
                  Token <i class="text-primary" :class="$sorter.getStyles( 'sentiment', 'token' )"></i>
                </span>
              </div>
              <div class="tablelist-10 text-nowrap text-right push-right if-small">
                <span class="clickable" @click="$sorter.sortOrder( 'sentiment', 'count', 'desc' )">
                  Tweets <i class="text-primary" :class="$sorter.getStyles( 'sentiment', 'count' )"></i>
                </span>
              </div>
              <div class="tablelist-30 text-nowrap text-grey push-right if-medium">
                <span class="clickable" @click="$sorter.sortOrder( 'sentiment', 'barPercent', 'desc' )">
                  Mention % <i class="text-primary" :class="$sorter.getStyles( 'sentiment', 'barPercent' )"></i>
                </span>
              </div>
              <div class="tablelist-20 text-nowrap push-right">
                <span class="clickable" @click="$sorter.sortOrder( 'sentiment', 'sentiment', 'asc' )">
                  Sentiment <i class="text-primary" :class="$sorter.getStyles( 'sentiment', 'sentiment' )"></i>
                </span>
              </div>
              <div class="tablelist-10 text-nowrap text-grey text-right">
                Details
              </div>
            </div>
          </div>

          <!-- list default greet message -->
          <div class="tablelist-content pad-v text-center text-info" v-if="!chartData.length">
            <div class="icon-chart-line iconLarge"></div>
            <div>Sentiment analysis data for each Binance token based on loaded tweets.</div>
            <div v-html="sentimentInfoText"></div>
          </div>

          <!-- list items -->
          <div class="tablelist-content" v-if="chartData.length">
            <div class="tablelist-row flex-row flex-middle flex-stretch" v-for="d in chartList" :key="d.token">
              <div class="tablelist-20 text-clip text-primary push-right">
                <button title="Search" @click="applyFilters( d.search, '' )" v-tooltip><i class="icon-search text-info"></i> {{ d.name }}</button>
              </div>
              <div class="tablelist-10 text-clip text-secondary push-right if-small">{{ d.token }}</div>
              <div class="tablelist-10 text-nowrap text-right push-right if-small">{{ d.count }}</div>
              <div class="tablelist-30 text-nowrap push-right if-medium">
                <div v-if="d.barPercent" class="percent-bar">
                  <div :class="d.barColor" :style="{ 'width': d.barPercent +'%' }"></div>
                </div>
              </div>
              <div class="tablelist-20 text-nowrap push-right" :class="d.styles" v-html="d.sentiment"></div>
              <div class="tablelist-10 text-nowrap text-right">
                <button v-if="d.route" class="icon-chart-line iconLeft text-btn bg-info-hover" @click.stop="$bus.emit( 'setRoute', d.route )">Info</button>
              </div>
            </div>
          </div>

          <!-- list bottom info -->
          <div class="tablelist-header">
            <div class="newspage-chart-row flex-row flex-middle flex-stretch text-grey">
              <div class="flex-1 text-clip">Sentiment analysis for {{ chartData.length | toNoun( 'token', 'tokens' ) }} found in all available tweets.</div>
              <div class="text-right">
                <button class="icon-close iconLeft text-danger-hover" @click="flushTweets()">Flush Data</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- fallback section -->
    <section class="push-bottom" v-if="!tweetsList.length">
      <div class="container">
        <div class="card pad-all flex-row flex-middle flex-stretch">
          <div class="icon-help iconLarge text-grey push-right"></div>
          <div class="flex-1">
            <div v-if="searchStr">
              <h3 class="text-bright">No Match For <span class="text-primary">{{ searchStr }}</span></h3>
              <span class="text-grey">Can't find anything matching your search input.</span>
            </div>
            <div v-else-if="searchHandle">
              <h3 class="text-bright">No News Data For <a class="text-primary-hover" :href="'https://twitter.com/'+ searchHandle" target="_blank">{{ filterLabel }}</a></h3>
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
    <section class="pagelist-wrap" id="newspage-list">
      <div class="container">

        <div class="pagelist-item flex-row flex-top flex-stretch" v-for="t in tweetsList" :key="t.id">
          <div class="push-right" :class="{ 'alert-bubble': t.isNew }">
            <img class="img-round" :src="t.avatar" width="68" height="68" :alt="t.handle" />
          </div>
          <div class="flex-1">
            <div class="flex-row flex-space push-bottom">
              <h3 class="text-clip clickable" @click="openLink( 'https://twitter.com/'+ t.handle )">
                <span class="text-primary-hover">{{ t.name }}</span>
                <small class="text-smaller text-grey-hover">@{{ t.handle }}</small>
              </h3>
              <div class="text-clip if-small">
                <a class="text-secondary-hover" :href="t.link" target="_blank" title="View tweet" v-tooltip>{{ t.time | toElapsed( 'ago', true ) }}</a> &nbsp;
                <button type="button" class="icon-close text-danger-hover" title="Delete" @click="deleteTweet( t.id )" v-tooltip></button>
              </div>
            </div>
            <div class="text-small text-wrap" v-html="tweetHtml( t.text )"></div>
          </div>
        </div>

      </div>
    </section>

  </main>
</template>

<script>
import Search from './Search.vue';
import Dropdown from './Dropdown.vue';
import Toggle from './Toggle.vue';
import files from '../modules/files';
import twitterAccounts from '../configs/twitterAccounts';

// component
export default {

  // component list
  components: { Search, Dropdown, Toggle },

  // component props
  props: {
    header: { type: Object, default() { return {} } },
    options: { type: Object, default() { return {} }, required: true },
    sortData: { type: Object, default() { return {} }, required: true },
    priceData: { type: Array, default() { return [] }, required: true },
    newsHandlers: { type: Array, default() { return [] }, required: true },
    newsEntries: { type: Array, default() { return [] }, required: true },
  },

  // component data
  data() {
    return {
      // filter options
      searchStr: '',
      searchHandle: '',
      // coins data
      totalTokens: 0,
      chartData: [],
      chartSort: 'count',
      chartOrder: 'desc',
      // count data
      newCount: 0,
      maxCount: 50,
    }
  },

  // watchers
  watch: {

    // update chart when options change
    options() {
      this.updateChart();
    },

    // update chart data when new tokens load from socket api
    priceData() {
      if ( this.priceData.length > this.totalTokens ) {
        this.totalTokens = this.priceData.length;
        this.updateChart();
      }
    },

    // update chart data when tweets change
    newsEntries() {
      this.updateChart();
    },
  },

  // computed methods
  computed: {

    // get sorted chart list
    chartList() {
      let { column, order } = this.sortData.sentiment;
      let list = this.chartData.slice(); // copy
      list = this.$utils.sort( list, column, order ); // sort
      return list;
    },

    // get filtered list
    tweetsList() {
      let { fullword, fullcase } = this.options.search;
      let list = this.newsEntries.slice(); // copy

      if ( this.searchHandle ) {
        list = list.filter( t => t.handle === this.searchHandle );
      }
      if ( this.searchStr && this.searchStr.length > 1 ) {
        list = this.$utils.search( list, 'text', this.searchStr, fullword, fullcase );
      }
      if ( this.options.news.max ) {
        list = list.slice( 0, this.options.news.max );
      }
      return list;
    },

    // build twitter accounts list from handler list with checking indicator
    accountsList() {
      let list = this.newsHandlers.map( tw => {
        let { uid, handle, name, avatar, url, last, fetching, error } = tw.getData();
        let active = ( handle === this.searchHandle );
        let count = this.newsEntries.filter( t => t.handle === handle ).length;
        return { uid, handle, name, avatar, url, last, error, active, fetching, count };
      });
      return this.$utils.sort( list, 'count', 'desc' );
    },

    // sort-by label for buttons, etc
    filterLabel() {
      let l = this.newsHandlers.length;
      let t = this.newsHandlers.filter( tw => tw.handle === this.searchHandle ).shift();
      if ( t && t.handle ) return '@'+ t.handle;
      return 'All Sources ('+ l +')';
    },

    // calculate default message for sentiment chart
    sentimentInfoText() {
      // no twitter handles to fetch from
      if ( !this.newsHandlers.length ) {
        return 'Not tracking any Twitter accounts, use the Sources menu above to track accounts...';
      }
      // option enabled, but no token data loaded yet
      if ( this.options.news.enabled && !this.priceData.length ) {
        return 'Currently waiting for tokens to load from the Binance socket API...';
      }
      // option enabled, but no tweets data loaded yet
      if ( this.options.news.enabled && !this.newsEntries.length ) {
        return 'Currently waiting for tweets data to load for tracked Twitter accounts...';
      }
      // option to fetch disabled and there are no tweets to scan
      if ( !this.options.news.enabled && !this.newsEntries.length ) {
        return 'No tweets loaded, use the <i class="icon-config"></i> Gear icon to enable fetching.';
      }
    },
  },

  // custom methods
  methods: {

    // open external link
    openLink( link ) {
      window.open( link, '_blank' );
    },

    // apply options
    saveOptions() {
      this.$opts.saveOptions( this.options );
    },

    // apply filters
    applyFilters( search, handle ) {
      this.searchStr = String( search || '' ).trim();
      this.searchHandle = String( handle || '' ).trim();
    },

    // reset filters
    resetFilters() {
      this.searchStr = '';
      this.searchHandle = '';
    },

    // scan tweets against list of tokens from api and build sentiment analysis data for chart
    updateChart() {
      let { fullword, fullcase } = this.options.search;
      let tokens = [];
      let data = [];

      // build unique list of tokens from binance api
      this.priceData.forEach( p => {
        if ( tokens.filter( t => t.token === p.token ).length ) return;
        let { token, name } = p;
        let asset = ( token === 'BTC' ) ? 'USDT' : 'BTC';
        let route = '/symbol/'+ token + asset;
        tokens.push( { token, name, route } );
      });
      // add other things to the list
      if ( this.priceData.length ) {
        tokens.push( { token: 'Crypto', name: 'Cryptocurrency', route: '/symbol/BTCUSDT' } );
        tokens.push( { token: 'XBT', name: 'BTC Contract', route: '/symbol/BTCUSDT' } );
      }
      // build sentiment
      tokens.forEach( p => {
        let token  = p.token;
        let name   = p.name;
        let route  = p.route;
        let search = token +'|'+ name;
        let list   = this.$utils.search( this.newsEntries, 'text', search, fullword, fullcase );
        let count  = list.length;
        if ( !count ) return;
        let text   = list.reduce( ( a, t ) => a += ' '+ t.text, '' ).trim();
        let sdata  = this.$sentiment.analyze( text );
        let { score, positive, negative, comparative, sign, word, styles, sentiment } = sdata;
        data.push( { token, name, search, route, count, score, styles, sentiment } );
      });
      // calculate percent
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
    },

    // convert links inside a tweet into html
    tweetHtml( text ) {
      return this.$utils.linkUrl( text );
    },

    // when a new entry is added to news list
    onNewsEntry( tweet ) {
      let { time, handle, name, text, avatar, link } = tweet;
      let secs    = ( Date.now() - time ) / 1000;
      let mins    = Math.floor( secs / 60 );
      let elapsed = this.$utils.elapsed( secs );
      let isaway  = ( !document.hasFocus() );
      let isnew   = ( Math.floor( secs / 60 ) <= 60 ); // within 1hr

      // remove html and urls from tweet text
      text = this.$utils.stripHtml( text, true );
      if ( !text ) return;

      // show tweet notification only if enabled and away
      if ( this.options.news.notify && isnew && isaway ) {
        text = 'Tweeted '+ elapsed +' ago... \n\n' + text;
        this.$notify.add( '@'+ handle, text, avatar, link );
      }
      // always send notification via api if enabled
      if ( this.options.news.send ) {
        let info = `<a href="${ link }">${ text }</a>`;
        this.$messenger.add( name, info, avatar );
      }
    },

    // export list of account handles as json file
    exportAccounts() {
      let list = this.newsHandlers.map( t => t.handle );
      files.exportData( 'binance_watch_news_sources', list );
    },

    // import list of account handles from json file
    importAccounts() {
      files.importData( accounts => {
        let total = accounts.length | 0;
        let saved = this.$news.importAccounts( accounts, true, true );
        this.$bus.emit( 'showNotice', 'Imported '+ saved +'/'+ total +' twitter accounts.', 'success' );
      });
    },

    // fetch tweets for an account by handle
    fetchByHandle( handle ) {
      if ( this.$news.fetchByHandle( handle ) ) {
        this.$bus.emit( 'showNotice', 'Fetching latest tweets from @'+ handle +'...', 'success' );
      }
    },

    // remove single tweet from list by id
    deleteTweet( id ) {
      if ( !this.$news.blockTweet( id ) ) return;
      this.$bus.emit( 'showNotice', 'News entry has been removed.', 'success' );
    },

    // flush list of saved tweets from store
    flushTweets() {
      if ( !confirm( 'Remove all news entries?' ) ) return;
      this.$news.flushTweets();
      this.$bus.emit( 'showNotice', 'All news entries have been deleted.', 'success' );
    },

    // handle adding accounts from a form
    accountFormHandler( e ) {
      if ( !e || !e.target ) return;

      let handle = String( e.target.handle.value || '' ).replace( /[^\w]+/g, '' ).trim();
      if ( !handle ) return this.$bus.emit( 'showNotice', 'Please enter a valid twitter handle.', 'warning' );

      let added = this.$news.trackAccount( handle, true, true );
      if ( added ) { this.$bus.emit( 'showNotice', 'Started tracking tweets from @'+ handle +'.', 'success' ); }
      else { this.$bus.emit( 'showNotice', 'Could not add account @'+ handle +'.', 'warning' ); }

      this.resetFilters();
      e.target.reset();
    },

    // remove instance of Twitter handler from list
    removeTwitterHandler( handle ) {
      if ( !confirm( 'Stop tracking tweets from @'+ handle +'?' ) ) return;

      let removed = this.$news.untrackAccount( handle );
      if ( removed ) { this.$bus.emit( 'showNotice', 'Stopped tracking tweets from @'+ handle +'.', 'success' ); }
      else { this.$bus.emit( 'showNotice', 'Could not remove account @'+ handle +'.', 'warning' ); }

      this.resetFilters();
    },

    // mark tweets as viewed
    resetTweets() {
      if ( document.visibilityState === 'visible' ) return;
      this.$news.resetTweets(); // reset when hidden
    },
  },

  // on component beforeMount
  beforeMount() {
    this.$news.on( 'tweet', this.onNewsEntry );
    this.$news.importAccounts( twitterAccounts ); // default accounts
  },

  // on component mounted
  mounted() {
    this.$news.loadAccounts(); // load saved accounts
    this.$news.loadTweets(); // load saved tweets
    document.addEventListener( 'visibilitychange', this.resetTweets );
  },

  // on component destroyed
  destroyed() {
    document.removeEventListener( 'visibilitychange', this.resetTweets );
  },
}
</script>

