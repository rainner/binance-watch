<template>
  <div class="app-wrap">

    <!-- topbar with logo and menu -->
    <Topbar
      :options="options"
      :watching="watching"
      :socketStatus="socketStatus"
      :socketTime="socketTime"
      :scrollDir="scrollDir"
      :scrollPos="scrollPos"
      :priceData="priceData"
      :historyData="historyData"
      :alarmsData="alarmsData"
      :newsData="newsData">
    </Topbar>

    <!-- price watch form -->
    <WatchForm
      ref="watchform"
      :options="options"
      :socketStatus="socketStatus"
      :scrollDir="scrollDir"
      :scrollPos="scrollPos"
      :assetsList="assetsList"
      :priceData="priceData"
      @onStartWatch="watching = true"
      @onStopWatch="watching = false">
    </WatchForm>

    <!-- main app pages wrapper -->
    <main class="app-main">

      <!-- main ticker list component -->
      <TokenList
        class="app-page"
        :class="{ 'visible': mainComp === 'TokenList' }"
        :active="( mainComp === 'TokenList' )"
        :options="options"
        :socketStatus="socketStatus"
        :scrollDir="scrollDir"
        :scrollPos="scrollPos"
        :assetsList="assetsList"
        :priceData="priceData">
      </TokenList>

      <!-- news aggregator page -->
      <NewsPage
        class="app-page"
        :class="{ 'visible': mainComp === 'NewsPage' }"
        :active="( mainComp === 'NewsPage' )"
        :options="options"
        :scrollDir="scrollDir"
        :scrollPos="scrollPos"
        :priceData="priceData"
        :coinsData="coinsData">
      </NewsPage>

    </main>

    <!-- common modal component -->
    <Modal ref="modal" @onDone="modalDone">
      <component
        :is="modalComp"
        :options="options"
        :modalData="modalData"
        :historyData="historyData"
        :alarmsData="alarmsData"
        :newsData="newsData">
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
      :class="{ 'visible': scrollDir === 'down' }"
      @click="handleClick( 'scroll', 0 )">
    </button>

  </div>
</template>

<style lang="scss">
// app common styles
@import "../scss/reset";
@import "../scss/common";
@import "../scss/animations";
@import "../scss/flexbox";
@import "../scss/fontello";
@import "../scss/emoji";
@import "../scss/type";
@import "../scss/forms";
@import "../scss/tooltip";
@import "../scss/modifiers";
</style>

<script>
// custom modules
import appOptions from '../configs/options';
import Binance from '../modules/binance';
import Scroller from '../modules/scroller';
import msgQueue from '../modules/queue';
import mailgun from '../modules/mailgun';
import telegram from '../modules/telegram';
import utils from '../modules/utils';

// sub components
import Topbar from './Topbar.vue';
import Modal from './Modal.vue';
import Notify from './Notify.vue';
import WatchForm from './WatchForm.vue';
import TokenList from './TokenList.vue';
import NewsPage from './NewsPage.vue';
import AboutPage from './AboutPage.vue';
import OptionsPage from './OptionsPage.vue';
import HistoryPage from './HistoryPage.vue';
import AlarmsList from './AlarmsList.vue';
import DonatePage from './DonatePage.vue';
import TokenPage from './TokenPage.vue';

// helper class instances
const _binance = new Binance();
const _scroller = new Scroller();

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
    DonatePage,
    TokenPage,
  },

  // component data
  data() {
    return {
      refid: '12268078',
      title: 'Binance Watch',
      optKey: 'app_options_data',
      options: appOptions,
      watching: false,
      // app data
      priceList: [],
      priceData: [],
      assetsList: [],
      historyData: [],
      alarmsData: {},
      newsData: {},
      coinsData: {},
      // page and modal related
      mainComp: '',
      modalComp: '',
      modalData: {},
      // socket related data
      socketStatus: 0, // ( 0: off, 1: wait, 2: on )
      socketStart: 0,
      socketInt: null,
      socketReconnect: false,
      socketTime: '',
      // page scroll data
      scrollDir: '',
      scrollPos: 0,
    }
  },

  // custom methods
  methods: {

    // merge new options and save
    setOptions( options ) {
      setTimeout( () => {
        this.options = utils.deepMerge( {}, this.options, options );
        let a = this.options.audio;

        this.$ajax.setOptions( { proxy: this.options.proxy } );
        this.$notify.setOptions( { soundEnabled: a.enabled, soundVolume: a.volume, soundFile: a.file } );
        this.$store.setData( this.optKey, this.options );
      }, 100 );
    },

    // load saved options data from local store
    loadOptions() {
      let options = this.$store.getData( this.optKey );
      let a = this.options.audio;

      this.options = utils.deepMerge( {}, this.options, options );
      this.$ajax.setOptions( { proxy: this.options.proxy } );
      this.$notify.setOptions( { soundEnabled: a.enabled, soundVolume: a.volume, soundFile: a.file } );
    },

    // set loaded news data from somewhere
    updateNewsData( data ) {
      this.newsData = Object.assign( {}, this.newsData, data );
    },

    // set a url hash route
    setRoute( route ) {
      this.$router.setRoute( route );
    },

    // setup app routes
    setupRoutes() {
      // page routes
      this.$router.on( '/', () => { this.showPage( 'TokenList', 'Price List' ) } );
      this.$router.on( '/news', () => { this.showPage( 'NewsPage', 'Latest News' ) } );
      // modal routes
      this.$router.on( '/history', () => { this.showModal( 'HistoryPage', 'Recent Alert History' ) } );
      this.$router.on( '/alarms', () => { this.showModal( 'AlarmsList', 'Active Price Alarms' ) } );
      this.$router.on( '/about', () => { this.showModal( 'AboutPage', 'About This App' ) } );
      this.$router.on( '/options', () => { this.showModal( 'OptionsPage', 'Options & Settings' ) } );
      this.$router.on( '/donate', () => { this.showModal( 'DonatePage', 'Make a Donation' ) } );
      // symbol modal route
      this.$router.on( '/symbol/([A-Z]+)', symbol => {
        let d = this.priceData.filter( p => p.symbol === symbol ).shift();
        if ( d ) this.showModal( 'TokenPage', d.pair +' Info ', d );
      });
      // show current route asap
      setTimeout( () => {
        this.$router.trigger( window.location.hash || '/' );
      }, 400 );
    },

    // setup msg queue to go off on a timer
    setupMsgQueue() {
      msgQueue.onBatch( 60, queue => {
        let plist = [];
        plist.push( mailgun( this.$ajax, this.options.mailgun, queue ) );
        plist.push( telegram( this.$ajax, this.options.telegram, queue ) );

        Promise.all( plist )
          .then( msgs => { msgs.forEach( msg => { if ( msg ) this.showNotice( msg, 'info' ) } ) } )
          .catch( err => { if ( err ) this.showNotice( err, 'warning' ) } );
      });
    },

    // add data to outgoing msg queue
    addMsgQueue( data ) {
      msgQueue.add( data );
    },

    // setup notifications data handler
    setupNotifications() {
      this.$notify.permission();
      this.$notify.loadAlarms();
      this.$notify.onChange( alarms => { this.alarmsData = alarms; } );
      this.alarmsData = this.$notify.getAlarms();
    },

    // setup history data handler
    setupHistoryData() {
      this.$history.loadData();
      this.$history.onChange( data => { this.historyData = data; } );
      this.historyData = this.$history.getData();
    },

    // setup global event bus handlers
    setupGlobalHandlers() {
      this.$bus.on( 'setOptions', this.setOptions );
      this.$bus.on( 'setTitle', this.setTitle );
      this.$bus.on( 'setRoute', this.setRoute );
      this.$bus.on( 'toggleSocket', this.toggleSocket );
      this.$bus.on( 'toggleWatchform', this.toggleWatchform );
      this.$bus.on( 'newsData', this.updateNewsData );
      this.$bus.on( 'showModal', this.showModal );
      this.$bus.on( 'closeModal', this.closeModal );
      this.$bus.on( 'showNotice', this.showNotice );
      this.$bus.on( 'handleClick', this.handleClick );
      this.$bus.on( 'msgQueue', this.addMsgQueue );
    },

    // setup scroller handlers
    setupScrollHandlers() {
      this.$bus.on( 'jumpTo', ( dest, cb ) => _scroller.jumpTo( dest, cb ) );
      _scroller.onChange( pos => { this.scrollPos = pos; } );
      _scroller.onDown( pos => { this.scrollDir = 'down'; } );
      _scroller.onUp( pos => { this.scrollDir = 'up'; } );
    },

    // setup socket handlers
    setupSocketHandlers() {
      _binance.on( 'open', this.onSocketOpen );
      _binance.on( 'error', this.onSocketError );
      _binance.on( 'close', this.onSocketClose );
    },

    // show socket related notifications
    socketNotify( message ) {
      if ( document.hasFocus() ) return;
      let d = new Date();
      this.$notify.add( 'Socket Status', message +' \nNow: '+ d.toLocaleString() );
    },

    // when socket connection opens
    onSocketOpen( ws, e ) {
      this.socketStatus = 1;
      this.socketStart = Date.now();
      this.socketInt = setInterval( this.priceDataIntervalHandler, 1000 );
      this.showNotice( 'Socket connection active.', 'success' );
      this.socketNotify( 'Socket connection is now active.' );
    },

    // when socket connection ends
    onSocketClose( ws, e ) {
      if ( this.socketInt ) clearInterval( this.socketInt );
      this.socketStatus = 0;
      this.socketStart = 0;
      this.toggleWatchform( 'stop' );
      this.showNotice( 'Socket connection closed.', 'warning' );
      this.socketNotify( 'Socket connection has closed.' );

      if ( this.socketReconnect ) {
        setTimeout( () => { this.toggleSocket( true ); }, 5000 );
      }
    },

    // when socket connection ends
    onSocketError( ws, e ) {
      if ( this.socketInt ) clearInterval( this.socketInt );
      this.socketStatus = 0;
      this.socketStart = 0;
      this.showNotice( 'Socket connection error.', 'warning' );
      this.socketNotify( 'Socket connection error, check the console for more details.' );
      console.info( 'Socket-Error:', e.message || e );
    },

    // handle socket connection
    toggleSocket( toggle ) {
      this.socketStatus = 1;
      this.socketReconnect = toggle;

      if ( toggle === true && !this.socketStart ) {
        _binance.getPrices( this.onTickerData );
      }
      if ( toggle === false && this.socketStart ) {
        _binance.close();
      }
    },

    // add base asset pair to the list
    saveAssetPair( asset ) {
      if ( !asset || this.assetsList.indexOf( asset ) >= 0 ) return;
      this.assetsList.push( asset );
    },

    // update pair data inside modals
    updateModalPairData( pair ) {
      if ( !this.modalData || !this.modalData.symbol ) return;
      if ( !pair || !pair.symbol || this.modalData.symbol !== pair.symbol ) return;
      this.modalData = pair;
    },

    // updates price data list from socket on an interval
    priceDataIntervalHandler() {
      let data  = [];
      let total = this.priceList.length;
      let secs  = ( Date.now() - this.socketStart ) / 1000;

      for ( let i = 0; i < total; ++i ) {
        let p = this.priceList[ i ];
        p.alarms = this.$notify.alarmsCount( p.symbol );

        if ( p.alarms ) {
          this.$notify.checkAlarm( p.symbol, p.close, ( title, info, alertData ) => {
            let icon = utils.fullUrl( alertData.image );
            this.addMsgQueue( { title, info, icon } );
            this.$history.add( title, info, icon );
            this.$bus.emit( 'mainMenuAlert' );
          });
        }
        this.saveAssetPair( p.asset );
        this.updateModalPairData( p );
        data.push( p );
      }
      this.socketTime = utils.elapsed( secs );
      this.priceData  = data;
    },

    // when live price data is recieved
    onTickerData( list ) {
      this.priceList = list;
      this.socketStatus = 2;
    },

    // control watchform component
    toggleWatchform( action ) {
      if ( !this.$refs.watchform ) return;
      switch ( action ) {
        case 'open'   :  return this.$refs.watchform.open();
        case 'close'  :  return this.$refs.watchform.close();
        case 'toggle' :  return this.$refs.watchform.toggle();
        case 'start'  :  return this.$refs.watchform.startWatch();
        case 'stop'   :  return this.$refs.watchform.stopWatch();
      }
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

      if ( action === 'scroll' )  return _scroller.jumpTo( dest );
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
      title = title || component;
      this.mainComp = component;
      this.setTitle( title );
      this.toggleWatchform( 'close' );
      this.closeModal();
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
          done: ( xhr, status, words ) => {
            if ( typeof words !== 'object' ) return;
            this.$sentiment.merge( words );
          }
        });
      });
    },

    // fetch list of all tokens and their names from API
    fetchCoinsData() {
      this.$ajax.get( 'https://coincap.io/map', {
        type: 'json',
        proxy: false,
        done: ( xhr, status, list ) => {
          if ( !Array.isArray( list ) ) return;
          let data = {};
          for ( let i = 0; i < list.length; ++i ) {
            let token = String( list[ i ].symbol || '' ).toUpperCase();
            let name  = String( list[ i ].name || '' ).replace( /[^\w\.\-]+/g, ' ' ).replace( /[\.]+/g, '.' ).replace( /[\-]+/g, '-' ).replace( /[\n\r\t\s]+/g, ' ' ).trim();
            if ( token === 'BCH' ) token = 'BCC';
            if ( token === 'MIOTA' ) token = 'IOTA';
            if ( token && name ) data[ token ] = name;
          }
          _binance.setNames( data );
          this.coinsData = data;
        },
      });
    },
  },

  // init app data and handlers
  beforeMount() {
    this.loadOptions();
    this.setupRoutes();
    this.setupMsgQueue();
    this.setupNotifications();
    this.setupHistoryData();
    this.setupGlobalHandlers();
    this.setupSocketHandlers();
    this.setupScrollHandlers();
    this.fetchSentimentWords();
    this.fetchCoinsData();
  },

  // start socket and other external data
  mounted() {
    this.setTitle();
    this.toggleSocket( true );
  },

  // cleanup and close connetions
  destroyed() {
    this.toggleSocket( false );
  },
}
</script>

<style lang="scss">

.app-main {
  display: block;
  position: relative;

  .app-page {
    display: none;
    transition: none;
    animation: fadeIn $fxSpeed $fxEase forwards;

    &.visible {
      display: block;
    }
  }
}
</style>


