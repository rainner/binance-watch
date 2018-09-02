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
            <big>Twitter News ({{ newCount }}/{{ twitterEntries.length }})</big>
          </div>

          <!-- control dropdown menus -->
          <div class="newspage-controls-filters text-nowrap">

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-down-open iconLeft" title="Filter Source" v-tooltip>{{ filterLabel }}</button>
              <div slot="list">

                <div class="flex-row flex-top flex-space pad-h push-bottom">
                  <div class="flex-1 push-right form-label">Twitter News Sources ({{ accountsList.length }})</div>
                  <button v-if="filterHandle" class="text-bright-hover icon-list iconLeft" @click="filterHandle = ''">Show all</button>
                </div>

                <div class="twitter-accounts-list push-bottom border-top border-bottom">
                  <div class="twitter-accounts-item flex-row flex-middle flex-stretch" v-for="a in accountsList" :key="a.handle">
                    <div class="flex-1 text-clip clickable push-right" title="Show tweets" v-tooltip @click="applyFilters( '', a.handle )">
                      <span class="icon-twtr iconLeft text-clip" :class="{ 'text-gain': a.active, 'text-danger text-striked': a.error !== '' }">{{ a.name }}</span>
                    </div>
                    <div class="push-right">
                      <span class="clickable" title="Fetch" @click="fetchByHandle( a.handle )" v-tooltip>
                        <span v-if="a.checking" class="text-badge text-primary">...</span>
                        <span v-else class="text-badge">{{ a.count }}</span>
                      </span>
                    </div>
                    <button class="icon-close text-danger-hover" title="Remove account" v-tooltip @click="removeTwitterHandler( a.handle )"></button>
                  </div>
                </div>

                <form class="twitter-accounts-form pad-h push-bottom" action="#" autocomplete="off" @submit.prevent="accountFormHandler">
                  <div class="form-input text-nowrap">
                    <div class="icon-twtr iconLeft"></div>
                    <input class="flex-1" type="text" name="handle" placeholder="Add twitter @handle..." />
                    <button class="icon-add text-primary-hover" type="submit"></button>
                  </div>
                </form>

                <div class="form-label pad-h push-bottom">Load or Save Accounts</div>

                <div class="text-nowrap pad-h">
                  <button class="icon-add iconLeft text-bright-hover" @click="importAccounts()">Import List</button>
                  <span class="text-grey">&nbsp;&nbsp;</span>
                  <button class="icon-save iconLeft text-bright-hover" @click="exportAccounts()">Export List</button>
                </div>

              </div>
            </Dropdown> &nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-grey-hover icon-config" title="Options" v-tooltip></button>
              <div slot="list" class="pad-h">

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">News &amp; Notifications Options</div>
                  <Toggle :text="'Auto re-fetch latest news'" v-model="options.news.refetch" @change="applyOptions"></Toggle>
                  <Toggle :text="'Notify when news is available'" v-model="options.news.notify" @change="applyOptions"></Toggle>
                  <Toggle :text="'E-mail news notifications'" v-model="options.news.send" @change="applyOptions"></Toggle>
                  <Toggle :text="'Force case-sensitive search'" v-model="options.search.strict" @change="applyOptions"></Toggle>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">How often to send fetch requests</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="1" max="60" step="1" v-model="options.news.interval" @change="applyOptions" />
                    <span class="text-bright">{{ options.news.interval | toNoun( 'sec', 'secs' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Delay re-fetching from same source</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="60" max="600" step="1" v-model="options.news.delay" @change="applyOptions" />
                    <span class="text-bright">{{ options.news.delay | toNoun( 'sec', 'secs' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Tweets to fetch from each source</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="1" max="10" step="1" v-model="options.news.tweets" @change="applyOptions" />
                    <span class="text-bright">{{ options.news.tweets | toNoun( 'tweet', 'tweets' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Limit tweets by days posted</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="1" max="30" step="1" v-model="options.news.days" @change="applyOptions" />
                    <span class="text-bright">{{ options.news.days | toNoun( 'day', 'days' ) }}</span>
                  </div>
                </div>

                <div class="push-bottom">
                  <div class="form-label push-bottom push-small">Total number fo tweets to store</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="10" max="1000" step="1" v-model="options.news.total" @change="applyOptions" />
                    <span class="text-bright">{{ options.news.total }}</span>
                  </div>
                </div>

                <div>
                  <div class="form-label push-bottom push-small">Limit visible tweets on page</div>
                  <div class="flex-row flex-middle flex-stretch">
                    <input class="flex-1 push-right" type="range" min="10" max="100" step="1" v-model="options.news.max" @change="applyOptions" />
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
    <section class="push-bottom" v-if="chartData.length">
      <div class="container">
        <div class="card newspage-chart">
          <div class="newspage-chart-header">
            <div class="newspage-chart-row flex-row flex-middle flex-stretch">
              <div class="newspage-chart-md text-clip">
                <span class="clickable" @click="sortChart( 'name' )">
                  Name <i v-if="chartSort === 'name'" :class="{ 'icon-up': chartOrder === 'asc', 'icon-down': chartOrder === 'desc' }" class="text-primary"></i>
                </span>
              </div>
              <div class="newspage-chart-sm text-clip if-small">
                <span class="clickable" @click="sortChart( 'token' )">
                  Token <i v-if="chartSort === 'token'" :class="{ 'icon-up': chartOrder === 'asc', 'icon-down': chartOrder === 'desc' }" class="text-primary"></i>
                </span>
              </div>
              <div class="newspage-chart-sm text-nowrap text-right if-small">
                <span class="clickable" @click="sortChart( 'count' )">
                  Tweets <i v-if="chartSort === 'count'" :class="{ 'icon-up': chartOrder === 'asc', 'icon-down': chartOrder === 'desc' }" class="text-primary"></i>
                </span>
              </div>
              <div class="flex-5 text-nowrap text-grey if-medium">
                <span>Mention %</span>
              </div>
              <div class="newspage-chart-md text-nowrap">
                <span class="clickable" @click="sortChart( 'sentiment' )">
                  Sentiment <i v-if="chartSort === 'sentiment'" :class="{ 'icon-up': chartOrder === 'asc', 'icon-down': chartOrder === 'desc' }" class="text-primary"></i>
                </span>
              </div>
              <div class="flex-1 text-nowrap text-grey text-right">
                <span>Details</span>
              </div>
            </div>
          </div>
          <div class="newspage-chart-content">
            <div class="newspage-chart-row flex-row flex-middle flex-stretch clickable" v-for="d in chartList" :key="d.token" @click="applyFilters( d.search, '' )">
              <div class="newspage-chart-md text-clip text-bright"><i class="icon-search text-grey"></i> {{ d.name }}</div>
              <div class="newspage-chart-sm text-clip text-default if-small">{{ d.token }}</div>
              <div class="newspage-chart-sm text-nowrap text-right if-small">{{ d.count }}</div>
              <div class="flex-5 text-nowrap if-medium">
                <span v-if="d.barPercent" class="newspage-chart-bar" :class="d.barColor" :style="{ 'width': d.barPercent +'%' }"></span>
              </div>
              <div class="newspage-chart-md text-nowrap text-monospace" :class="d.styles" v-html="d.sentiment"></div>
              <div class="flex-1 text-nowrap text-right">
                <button v-if="d.route" class="text-default-hover icon-chart-line" @click.stop="$bus.emit( 'setRoute', d.route )"></button>
              </div>
            </div>
          </div>
          <div class="newspage-chart-footer">
            <div class="newspage-chart-row flex-row flex-middle flex-stretch text-grey">
              <div class="flex-1 text-clip">Sentiment analysis for {{ chartData.length | toNoun( 'token', 'tokens' ) }} found in all available tweets.</div>
              <div class="text-right">
                <button class="icon-reload iconLeft text-grey-hover" @click="updateChart( true )">Reload</button> &nbsp;
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
        <div class="card flex-row flex-middle flex-stretch">
          <div class="icon-help iconLarge text-grey push-right"></div>
          <div class="flex-1">
            <div v-if="filterSearch">
              <h3 class="text-bright">No Match For <span class="text-primary">{{ filterSearch }}</span></h3>
              <span class="text-grey">Can't find anything matching your search input.</span>
            </div>
            <div v-else-if="filterHandle">
              <h3 class="text-bright">No News Data For <a class="text-primary-hover" :href="'https://twitter.com/'+ filterHandle" target="_blank">{{ filterLabel }}</a></h3>
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
    <section class="newspage-list" id="newspage-list">
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
                <a class="text-default-hover text-small icon-link iconLeft" :href="t.link" target="_blank" title="View tweet" v-tooltip>{{ t.time | toElapsed }} ago</a> &nbsp;
                <button type="button" class="icon-close text-danger-hover" title="Delete" @click="deleteTweet( t.id )" v-tooltip></button>
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
      twitterIgnore: [],
      twitterCounter: 0,
      twitterInterval: null,
      twitterDelay: 1000,
      // filter options
      filterSearch: '',
      filterHandle: '',
      // coins data
      totalTokens: 0,
      chartData: [],
      chartSort: 'name',
      chartOrder: 'asc',
      // count data
      newCount: 0,
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

    // get sorted chart list
    chartList() {
      let list = this.chartData.slice(); // copy
      list = utils.sort( list, this.chartSort, this.chartOrder );
      return list;
    },

    // get filtered list
    tweetsList() {
      let list = this.twitterEntries.slice(); // copy

      // filter by account handle
      if ( this.filterHandle ) {
        list = list.filter( t => t.handle === this.filterHandle );
      }
      // filter by search text against tweet name, handle and text
      if ( this.filterSearch && this.filterSearch.length > 1 ) {
        list = utils.search( list, 'text', this.filterSearch, this.options.search.strict );
      }
      // limit number of tweets visible
      if ( this.options.news.max ) {
        list = list.slice( 0, this.options.news.max );
      }
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
      return utils.sort( list, 'name', 'asc' );
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

    // open external link
    openLink( link ) {
      window.open( link, '_blank' );
    },

    // apply options
    applyOptions( options ) {
      this.$bus.emit( 'setOptions', options );
      this.updateHandlerOptions();
      this.setupTwitterInterval();
      this.sortCapTweets();
      this.saveTweets();
    },

    // emit news data
    emitData() {
      let count = this.newCount;
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

    // add news to notification and msg queue
    setNotification( tweet ) {
      let { time, handle, name, text, avatar, link } = tweet;
      let isaway = ( !this.active || !document.hasFocus() );

      // remove html and urls from tweet text
      text = utils.stripHtml( text, true );
      if ( !text ) return;

      // show tweet notification only if enabled and away
      if ( this.options.news.notify && isaway ) {
        let secs = ( Date.now() - time ) / 1000;
        let elapsed = utils.elapsed( secs );
        text = 'Tweeted '+ elapsed +' ago... \n\n' + text;
        this.$notify.add( '@'+ handle, text, avatar, link );
        this.$bus.emit( 'mainMenuAlert' );
      }
      // always send notification via api if enabled
      if ( this.options.news.send ) {
        let info  = `<a href="${ link }">${ text }</a>`;
        this.$bus.emit( 'msgQueue', { name, info, avatar } );
      }
    },

    // sort sentiment chart
    sortChart( prop ) {
      if ( !this.chartData.length ) return;
      if ( !prop || typeof prop !== 'string' ) return;

      if ( prop === this.chartSort ) {
        this.chartOrder = ( this.chartOrder === 'asc' ) ? 'desc' : 'asc';
      } else {
        this.chartOrder = 'asc';
      }
      this.chartSort = prop;
    },

    // scan tweets against list of tokens from api and build sentiment analysis data for chart
    updateChart( notify ) {
      let data = [];
      let tokens = [];

      // build unique list of tokens from binance api
      this.priceData.forEach( p => {
        if ( tokens.filter( t => t.token === p.token ).length ) return;
        let { token, name } = p;
        let asset = ( token === 'BTC' ) ? 'USDT' : 'BTC';
        let route = '/symbol/'+ token + asset;
        tokens.push( { token, name, route } );
      });

      // add other things to the list
      tokens.push( { token: 'Crypto', name: 'Cryptocurrency', route: '/symbol/BTCUSDT' } );
      tokens.push( { token: 'XBT', name: 'BTC Contract', route: '/symbol/BTCUSDT' } );

      // build sentiment
      tokens.forEach( p => {
        let token  = p.token;
        let name   = p.name;
        let route  = p.route;
        let search = token +'|'+ name;
        let list   = utils.search( this.twitterEntries, 'text', search, this.options.search.strict );
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

      if ( notify === true ) {
        if ( !data.length ) return this.$bus.emit( 'showNotice', 'No token mentions found yet.', 'warning' );
        return this.$bus.emit( 'showNotice', 'Sentiment table has been reloaded.', 'success' );
      }
    },

    // export list of account handles as json file
    exportAccounts() {
      let list = this.twitterHandlers.map( t => t.handle ); // list of handles
      let data = 'data:text/json;charset=utf-8,'+ encodeURIComponent( JSON.stringify( list ) );
      let link = document.createElement( 'a' );
      link.setAttribute( 'style', 'display:block; overflow:hidden; visibility:hidden; max-height:0;' );
      link.setAttribute( 'href', data );
      link.setAttribute( 'download', 'twitter_handles_'+ Date.now() +'.json' );
      document.body.appendChild( link );
      link.click();
      link.remove();
    },

    // import list of account handles from json file
    importAccounts() {
      let input = document.createElement( 'input' );
      input.setAttribute( 'style', 'display:block; overflow:hidden; visibility:hidden; max-height:0;' );
      input.setAttribute( 'type', 'file' );
      input.setAttribute( 'accept', '.json' );
      input.addEventListener( 'change', this.onFileImport );
      document.body.appendChild( input );
      input.click();
      input.remove();
    },

     // handler for file select event
    onFileImport( e ) {
      if ( !e || !e.target ) return;
      if ( !e.target.files || !e.target.files.length ) return;
      if ( !( 'FileReader' in window ) ) return this.$bus.emit( 'showNotice', 'File import not supported.', 'warning' );

      let reader = new FileReader();
      reader.readAsText( e.target.files[ 0 ], 'utf-8' );
      reader.addEventListener( 'load', e => {

        let list   = JSON.parse( e.target.result || '[]' ) || [];
        let total  = list.length || 0;
        let loaded = utils.noun( total, 'account', 'accounts' );
        let count  = 0;

        if ( !Array.isArray( list ) || !total ) {
          return this.$bus.emit( 'showNotice', 'Invalid file data.', 'warning' );
        }
        for ( let handle of list ) {
          if ( this.createTwitterHandler( handle ) ) count++;
        }
        if ( !count ) {
          return this.$bus.emit( 'showNotice', 'There was a problem importing '+ loaded +' from file.', 'warning' );
        }
        this.$bus.emit( 'showNotice', 'Imported '+ count +'/'+ total +' accounts from file.', 'success' );
        this.saveNewsSources();
      });
    },

    // check if tweets needs to be ignored
    checkIgnore( tweet ) {
      return this.twitterIgnore.filter( tid => tid === tweet.id ).length;
    },

    // check if tweets exists
    hasTweet( tweet ) {
      return this.twitterEntries.filter( t => t.id === tweet.id ).length;
    },

    // check if tweet is too old
    oldTweet( tweet ) {
      let days = parseInt( this.options.news.days ) | 0;
      let secs = ( Date.now() - tweet.time ) / 1000;
      let age  = Math.ceil( secs / 86400 );
      return ( age > days );
    },

    // manage tweets list
    sortCapTweets( tweet ) {
      let list  = this.twitterEntries.slice(); // copy
      let total = parseInt( this.options.news.total ) || 10;
      let istw  = ( typeof tweet === 'object' && 'id' in tweet );

      // add new tweet to list
      if ( istw ) {
        tweet.isNew = true;
        list.push( tweet );
      }

      // filter out old tweets
      list = list.filter( t => {
        return !this.oldTweet( t );
      });

      // sort tweets from new to old
      list = list.sort( ( a, b ) => {
        if ( a.time > b.time ) return -1;
        if ( a.time < b.time ) return 1;
        return 0;
      });

      // cap and update
      list = list.slice( 0, total );
      this.newCount = list.filter( t => t.isNew ).length;
      this.twitterEntries = list;

      // check if new tweet is still in the list after sorting and slicing
      if ( istw ) return list.filter( t => t.id === tweet.id ).length ? true : false;
      return true;
    },

    // remove single tweet from list by id
    deleteTweet( id ) {
      if ( !id ) return;
      this.twitterEntries = this.twitterEntries.filter( t => t.id !== id );
      this.twitterIgnore = this.twitterIgnore.filter( tid => tid !== id );
      this.twitterIgnore.push( id ); // remember
    },

    // reset number of new entries
    resetTweets() {
      this.twitterEntries.forEach( t => { t.isNew = false; } );
      this.newCount = 0;
      this.emitData();
      this.saveTweets();
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
      this.twitterIgnore = [];
      this.newCount = 0;
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

    // fetch handler
    onTweetsHandler( err, handle, tweets ) {
      // there was a problem fetching tweets, log
      if ( err ) console.warn( err );
      // done checking this handle, remove indicator
      if ( handle ) this.twitterChecking = this.twitterChecking.filter( h => h !== handle );
      // no tweets found for this handle
      if ( !Array.isArray( tweets ) || !tweets.length ) return;
      // add new tweets to the list
      let count = 0;
      for ( let tweet of tweets ) {
        if ( this.checkIgnore( tweet ) ) continue;     // ignore
        if ( this.oldTweet( tweet ) ) continue;        // too old
        if ( this.hasTweet( tweet ) ) continue;        // already exists
        if ( !this.sortCapTweets( tweet ) ) continue;  // was not added
        this.setNotification( tweet );                 // added
        count++;
      }
      // update and save only if something was added
      if ( count ) {
        this.saveTweets();
        this.emitData();
      }
    },

    // save current list of tracked accounts to store
    saveNewsSources( notice ) {
      const sources = this.twitterHandlers.map( tw => tw.handle );
      this.options.news.sources = sources;
      this.applyOptions( this.options );
      if ( notice ) {
        if ( typeof notice === 'string' ) this.$bus.emit( 'showNotice', notice, 'success' );
        this.$bus.emit( 'showNotice', 'Accounts list updated successfully.', 'success' );
      }
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

    // update common options for twitter handler instances
    updateHandlerOptions( handler ) {
      const limitCount = parseInt( this.options.news.tweets ) || 1;
      const fetchDelay = parseInt( this.options.news.delay ) || 300;
      if ( handler ) return handler.setOptions( { fetchDelay, limitCount } ); // update one
      this.twitterHandlers.forEach( h => h.setOptions( { fetchDelay, limitCount } ) ); // update all
    },

    // create new instance of Twitter handler for a handle
    createTwitterHandler( handle, fetch, save ) {
      if ( !handle ) return false;

      if ( this.twitterHandlers.filter( t => t.handle === handle ).length ) {
        if ( save ) this.$bus.emit( 'showNotice', 'Account already exists.', 'warning' );
        return true;
      }
      try {
        const handler = new Twitter( handle );
        this.updateHandlerOptions( handler );
        this.twitterHandlers.push( handler );
        if ( fetch ) this.fetchByHandle( handle );
        if ( save ) this.saveNewsSources( true );
        return true;
      }
      catch( err ) {
        console.warn( 'createTwitterHandlerError:', err.message || err );
        return false;
      }
    },

    // remove instance of Twitter handler from list
    removeTwitterHandler( handle ) {
      if ( !confirm( 'Stop tracking tweets from @'+ handle +'?' ) ) return;
      this.twitterHandlers = this.twitterHandlers.filter( t => t.handle !== handle );
      this.twitterEntries  = this.twitterEntries.filter( t => t.handle !== handle );
      this.twitterChecking = this.twitterChecking.filter( h => h !== handle );
      this.resetFilters();
      this.sortCapTweets();
      this.emitData();
      this.saveNewsSources( true );
      this.saveTweets();
    },

    // main method to fetch tweets for a handle
    fetchByHandle( handle ) {
      const tw = this.twitterHandlers.filter( t => t.handle === handle ).shift();
      if ( !tw ) return this.$bus.emit( 'showNotice', 'Could not find account @'+ handle +'.', 'warning' );
      if ( this.twitterChecking.filter( h => h === tw.handle ).length ) return; // already fetching
      this.twitterChecking.push( tw.handle ); // fetching indicator
      tw.fetchTweets( this.$ajax, this.onTweetsHandler ); // fetch
    },

    // used to auto-fetch tweets from an interval goin down the list
    fetchByInterval() {
      if ( !this.options.news.refetch ) return;
      if ( !this.twitterHandlers.length ) return;
      const last = this.twitterHandlers.length - 1;
      const tw = this.twitterHandlers[ this.twitterCounter ];
      if ( tw ) this.fetchByHandle( tw.handle );
      this.twitterCounter = ( this.twitterCounter < last ) ? ( this.twitterCounter + 1 ) : 0;
    },

    // start the tweets interval handler
    setupTwitterInterval() {
      const seconds = parseInt( this.options.news.interval ) || 5;
      if ( this.twitterInterval ) clearInterval( this.twitterInterval );
      this.twitterInterval = setInterval( this.fetchByInterval, 1000 * seconds );
    },

    // load and start tracking twitter accounts for latest tweets
    setupTwitterTrackers() {
      this.twitterHandlers = [];
      const accounts = utils.shuffle( this.options.news.sources || [] );
      for ( let handle of accounts ) this.createTwitterHandler( handle );
    },
  },

  // component mounted
  mounted() {
    this.loadTweets();
    this.sortCapTweets();
    this.setupTwitterTrackers();
    this.setupTwitterInterval();
    this.fetchByInterval();
    this.$bus.on( 'resetNews', this.resetTweets );
    // set new tweets as read when going away from page
    document.body.setAttribute( 'tabindex', '0' ); // chrome fix
    document.body.addEventListener( 'blur', this.resetTweets );
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
      max-height: 302px;

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

    .newspage-chart-header {
      padding-bottom: ( $padSpace / 2 );
      border-bottom: $lineWidth $lineStyle $lineColor;
    }

    .newspage-chart-footer {
      padding-top: ( $padSpace / 2 );
      border-top: $lineWidth $lineStyle $lineColor;
    }

    .newspage-chart-content {
      overflow: hidden;
      overflow-y: auto;
      max-height: 325px;

      & > .newspage-chart-row:nth-child( odd ) {
        background-color: rgba( #000, 0.085 );
      }
      & > .newspage-chart-row:hover {
        background-color: rgba( #000, 0.2 );
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
