<template>
  <div class="app-wrap">

    <!-- topbar with logo and menu -->
    <Topbar
      :header="header"
      :options="options"
      :tickerStatus="tickerStatus"
      :tickerTime="tickerTime"
      :priceData="priceData"
      :historyData="historyData"
      :alarmsData="alarmsData"
      :newsEntries="newsEntries">
    </Topbar>

    <!-- price watch form -->
    <WatchForm
      :header="header"
      :options="options"
      :tickerStatus="tickerStatus"
      :assetsList="assetsList"
      :marketsData="marketsData"
      :priceData="priceData">
    </WatchForm>

    <!-- main app pages wrapper -->
    <div class="app-main">
      <keep-alive>
        <component
          :is="mainComp"
          :key="mainComp"
          :header="header"
          :options="options"
          :sortData="sortData"
          :tickerStatus="tickerStatus"
          :assetsList="assetsList"
          :marketsData="marketsData"
          :priceData="priceData"
          :newsHandlers="newsHandlers"
          :newsEntries="newsEntries"
          :coinsData="coinsData"
          class="fx fx-fade-in">
        </component>
      </keep-alive>
    </div>

    <!-- common modal component -->
    <Modal ref="modal" @onDone="modalDone">
      <component
        :is="modalComp"
        :options="options"
        :sortData="sortData"
        :modalData="modalData"
        :historyData="historyData"
        :alarmsData="alarmsData"
        :newsEntries="newsEntries">
      </component>
    </Modal>

    <!-- common notification component -->
    <Notify
      ref="notify">
    </Notify>

    <!-- back-to-top button -->
    <button
      id="btt"
      class="icon-up"
      :class="{ 'visible': header.collapsed }"
      @click="handleClick( 'scroll', 0 )">
    </button>

  </div>
</template>

<style lang="scss">
@import "../scss/reset";
@import "../scss/common";
@import "../scss/animations";
@import "../scss/flexbox";
@import "../scss/fontello";
@import "../scss/emoji";
@import "../scss/type";
@import "../scss/forms";
@import "../scss/prompt";
@import "../scss/tooltip";
@import "../scss/modifiers";
</style>

<script>
import Topbar from './Topbar.vue';
import Modal from './Modal.vue';
import Notify from './Notify.vue';
import WatchForm from './WatchForm.vue';
import TokenList from './TokenList.vue';
import NewsPage from './NewsPage.vue';
import TradePage from './TradePage.vue';
import AboutPage from './AboutPage.vue';
import OptionsPage from './OptionsPage.vue';
import HistoryPage from './HistoryPage.vue';
import AlarmsList from './AlarmsList.vue';
import TokenPage from './TokenPage.vue';

// component
export default {

  // component list
  components: {
    Topbar,
    Modal,
    Notify,
    WatchForm,
    AboutPage,
    OptionsPage,
    HistoryPage,
    TokenList,
    AlarmsList,
    NewsPage,
    TradePage,
    TokenPage,
  },

  // component data
  data() {
    return {
      refid: '12268078',
      title: 'Binance Watch',
      // app options and data
      options: {},
      sortData: {},
      priceData: [],
      assetsList: [],
      newsHandlers: [],
      newsEntries: [],
      historyData: [],
      alarmsData: [],
      quoteSymbols: [],
      marketsData: {},
      coinsData: {},
      // page and modal related
      mainComp: '',
      modalComp: '',
      modalData: {},
      // ticker related data
      tickerStatus: 0, // ( 0: off, 1: wait, 2: on )
      tickerStart: 0,
      tickerTime: '',
      // fixed header props
      header: {
        collapsed: false,
        opaque: false
      },
    }
  },

  // custom methods
  methods: {

    // update app options and pass it on to other handlers
    updateOptions( options ) {
      this.options = options;

      this.$ajax.setOptions( {
        proxy: this.options.proxy,
      });
      this.$notify.setOptions( {
        enabled: this.options.notify.enabled,
        duration: this.options.notify.duration,
        sound: this.options.audio.enabled,
        volume: this.options.audio.volume,
        audio: this.options.audio.file,
      });
      this.$news.setOptions( {
        enabled: this.options.news.enabled,
        interval: this.options.news.interval,
        delay: this.options.news.delay,
        days: this.options.news.days,
        tweets: this.options.news.tweets,
        total: this.options.news.total,
      });
      this.$messenger.setOptions( {
        mailgin: this.options.mailgin,
        telegram: this.options.telegram,
      });
      this.$binance.setApiKey( this.options.binance.apikey );
      this.$binance.setApiSecret( this.options.binance.apisecret );
    },

    // setup options class handlers and load saved options
    setupOptionsHandlers() {
      this.$opts.on( 'update', this.updateOptions );
      this.$opts.loadOptions();
    },

    // setup sort order data handler
    setupSorterHandlers() {
      this.$sorter.setKey( 'ticker', 'marketVolume', 'desc' );
      this.$sorter.setKey( 'sentiment', 'count', 'desc' );
      this.$sorter.setKey( 'balances', 'asset', 'asc' );
      this.$sorter.setKey( 'orders', 'time', 'desc' );
      this.$sorter.setKey( 'trades', 'time', 'desc' );
      this.$sorter.setKey( 'sessions', 'time', 'desc' );
      this.$sorter.on( 'change', data => { this.sortData = data } );
      this.$sorter.on( 'load', data => { this.sortData = data } );
      this.$sorter.loadData();
    },

    // setup app routes
    setupRoutes() {
      // page routes
      this.$router.on( '/', () => { this.showPage( 'TokenList', 'Price List' ) } );
      this.$router.on( '/news', () => { this.showPage( 'NewsPage', 'Twitter News' ) } );
      this.$router.on( '/trade', () => { this.showPage( 'TradePage', 'Trade Bot' ) } );
      // modal routes
      this.$router.on( '/history', () => { this.showModal( 'HistoryPage', 'Recent Alert History' ) } );
      this.$router.on( '/alarms', () => { this.showModal( 'AlarmsList', 'Saved Price Alarms' ) } );
      this.$router.on( '/about', () => { this.showModal( 'AboutPage', 'About This App' ) } );
      this.$router.on( '/options', () => { this.showModal( 'OptionsPage', 'Options & Settings' ) } );
      // symbol modal route
      this.$router.on( '/symbol/([A-Z]+)', symbol => {
        let d = this.priceData.filter( p => p.symbol === symbol ).shift();
        if ( d ) return this.showModal( 'TokenPage', d.pair +' Info ', d );
        this.$router.setRoute( '/' );
      });
    },

    // set a url hash route
    setRoute( route ) {
      this.$router.setRoute( route );
    },

    // setup global event bus handlers
    setupGlobalHandlers() {
      this.$bus.on( 'setTitle', this.setTitle );
      this.$bus.on( 'setRoute', this.setRoute );
      this.$bus.on( 'showModal', this.showModal );
      this.$bus.on( 'closeModal', this.closeModal );
      this.$bus.on( 'showNotice', this.showNotice );
      this.$bus.on( 'handleClick', this.handleClick );
    },

    // setup alarms class handlers
    setupAlarmsHandlers() {
      this.$alarms.on( 'update', data => { this.alarmsData = data } );
      this.$alarms.loadData();
    },

    // setup history class handlers
    setupHistoryHandlers() {
      this.$history.on( 'update', data => { this.historyData = data } );
      this.$history.loadData();
    },

    // setup twitter news handlers
    setupNewsHandlers() {
      this.$news.useAjax( this.$ajax );
      this.$news.on( 'error', err => { console.warn( err ) } );
      this.$news.on( 'handlers', data => { this.newsHandlers = data } );
      this.$news.on( 'tweets', data => { this.newsEntries = data } );
    },

    // setup msg queue to go off on a timer
    setupMessengerHandlers() {
      this.$messenger.useAjax( this.$ajax );
      this.$messenger.on( 'sent', info => { this.showNotice( info, 'info' ) } );
      this.$messenger.start();
    },

    // setup scroller handlers
    setupScrollHandlers() {
      this.$scroller.on( 'scroll', pos => { this.onScrollChange( 'scroll', pos ) } );
      this.$scroller.on( 'down', pos => { this.onScrollChange( 'down', pos ) } );
      this.$scroller.on( 'up', pos => { this.onScrollChange( 'up', pos ) } );
    },

    // setup coincap data handlers
    setupCoincapHandlers() {
      this.$coincap.useAjax( this.$ajax );
      this.$coincap.on( 'allcoins', this.onCoincapData );
      this.$coincap.fetchAll();
    },

    // setup binance live ticker data handlers
    setupTickerHandlers() {
      this.$binance.useAjax( this.$ajax );
      this.$binance.on( 'sock_fail', this.onSockFail );
      this.$binance.on( 'ticker_init', this.onTickerInit );
      this.$binance.on( 'ticker_fail', this.onTickerFail );
      this.$binance.on( 'ticker_error', this.onTickerError );
      this.$binance.on( 'ticker_close', this.onTickerClose );
      this.$binance.on( 'ticker_open', this.onTickerOpen );
      this.$binance.on( 'ticker_data', this.onTickerData );
      this.$binance.on( 'ticker_prices', this.onTickerPrices );
      this.$binance.on( 'markets_data', this.onMarketsData );
      this.$binance.fetchMarketsData();
      this.$binance.startTickerStream( true );
    },

    // handle coincap all coins data
    onCoincapData( coins ) {
      this.coinsData = coins;
      this.$binance.setCoinData( coins );
    },

    // handle binance available markets data
    onMarketsData( markets ) {
      const list = Object.keys( markets );
      this.assetsList = list;
      this.marketsData = markets;
    },

    // when scroll position updates
    onScrollChange( dir, pos ) {
      if ( dir === 'scroll' ) { this.header.opaque = ( pos > 10 ); }
      if ( dir === 'down' ) { this.header.collapsed = true; }
      if ( dir === 'up' ) { this.header.collapsed = false; }
    },

    // show socket related notifications
    tickerNotify( title, message ) {
      if ( document.hasFocus() ) return;
      let d = new Date();
      this.$notify.add( title, message +' \nNow: '+ d.toLocaleString() );
    },

    // on socket init fail
    onSockFail( error ) {
      this.tickerStatus = 0;
      this.showNotice( error, 'error' );
    },

    // on socket conenction attempt
    onTickerInit( time ) {
      this.tickerStatus = 0;
      this.tickerStart = time;
    },

    // on socket failure to start
    onTickerFail( error ) {
      this.tickerStatus = 0;
      this.showNotice( error, 'error' );
    },

    // when socket connection ends
    onTickerError( e ) {
      let info = String( e.message || 'Price ticker API connection failed, check the console for more details.' );
      this.tickerStatus = 0;
      this.tickerNotify( 'Ticker Error', info );
      this.showNotice( info, 'error' );
    },

    // when socket connection ends
    onTickerClose( e ) {
      this.tickerStatus = 0;
      this.$bus.emit( 'toggleWatchform', 'stop' );
      this.$bus.emit( 'toggleTradeBot', 'stop' );
    },

    // when socket connection opens
    onTickerOpen( e ) {
      this.tickerStatus = 1;
      this.tickerStart = Date.now();
    },

    // when socket connection has data
    onTickerData( data ) {
      this.tickerStatus = 2;
    },

    // updates price data list from socket on an interval
    onTickerPrices( prices ) {
      for ( let i = 0; i < prices.length; ++i ) {
        let p = prices[ i ];
        p.alarms = this.$alarms.getCount( p.symbol );
        this.updateModalPairData( p );
        this.checkPairAlarms( p );
      }
      let secs = ( Date.now() - this.tickerStart ) / 1000;
      this.tickerTime = this.$utils.elapsed( secs, '', true );
      this.priceData = prices;
    },

    // check if alarms need to go off for a pair
    checkPairAlarms( pair ) {
      this.$alarms.check( pair.symbol, pair.close, ( title, info, a ) => {
        let icon = this.$utils.fullUrl( a.image );
        this.$notify.add( title, info, icon, e => { this.setRoute( '/history' ) } );
        this.$messenger.add( title, info, icon );
        this.$history.add( title, info, icon );
      });
    },

    // build page title
    setTitle( info ) {
      let title = String( info || '' ).trim();
      let list  = [ this.title ];
      if ( title ) list.unshift( title );
      document.title = list.join( ' | ' );
    },

    // handler for click events passed through the event bus
    handleClick() {
      let args    = Array.from( arguments );
      let action  = args.length ? args.shift() : '';
      let dest    = args.length ? args.shift() : '';
      let target  = args.length ? args.shift() : '_blank';

      if ( action === 'scroll' )  return this.$scroller.jumpTo( dest );
      if ( action === 'link' )    return window.open( dest, target );
      if ( action === 'reload' )  return window.location.reload();
      if ( action === 'return' )  return window.history.back();

      if ( action === 'binance' ) {
        let symb = /\?/g.test( dest ) ? '&' : '?';
        let base = 'https://www.binance.com' + dest + symb + 'ref=' + this.refid;
        return window.open( base, target );
      }
    },

    // change visible page component
    showPage( component, title ) {
      this.closeModal();
      this.$bus.emit( 'toggleWatchform', 'close' );
      this.setTitle( title || component );
      this.mainComp = component;
    },

    // show modal window
    showModal( component, title, data ) {
      if ( !this.$refs.modal ) return;
      title = title || component;
      this.setTitle( title );
      this.modalComp = component;
      this.modalData = data;
      this.$refs.modal.show( title );
    },

    // update pair data inside modals
    updateModalPairData( pair ) {
      if ( !this.modalData || !this.modalData.symbol ) return;
      if ( !pair || !pair.symbol || this.modalData.symbol !== pair.symbol ) return;
      this.modalData = pair;
    },

    // close modal window, if open
    closeModal() {
      if ( !this.$refs.modal ) return;
      this.$refs.modal.close();
    },

    // on modal close event
    modalDone() {
      this.modalComp = '';
      this.modalData = {};
      window.history.back();
    },

    // show css alert
    showNotice( message, type, timeout ) {
      if ( !this.$refs.notify ) return;
      this.$refs.notify.show( message, type, timeout );
    },

    // fetch wordlist files for sentiment analysis
    fetchSentimentWords() {
      Array( 'words' ).forEach( file => {
        this.$ajax.get( 'public/afinn/'+ file +'.json', {
          type: 'json',
          proxy: false,
          success: ( xhr, status, words ) => this.$sentiment.merge( words ),
        });
      });
    },

    // hide initial page spinner
    hideInitSpinner() {
      const spinner = document.querySelector( '#_spnr' );
      if ( spinner ) spinner.style.display = 'none';
    }
  },

  // on component created
  created() {
    this.setupOptionsHandlers();
    this.setupSorterHandlers();
    this.setupGlobalHandlers();
    this.setupAlarmsHandlers();
    this.setupHistoryHandlers();
    this.setupNewsHandlers();
    this.setupMessengerHandlers();
    this.setupScrollHandlers();
    this.setupCoincapHandlers();
    this.setupTickerHandlers();
    this.setupRoutes();
  },

  // on component mounted
  mounted() {
    this.$router.trigger( window.location.hash || '/' );
    this.fetchSentimentWords();
    this.hideInitSpinner();
  },

  // on component destroyed
  destroyed() {
    this.$binance.stopTickerStream();
    this.$news.stopTimer();
  },
}
</script>

