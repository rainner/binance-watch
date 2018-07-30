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
import Stream from '../modules/stream';
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
const _stream = new Stream();
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
        this.$ajax.setOptions( { proxy: this.options.proxy } );
        this.$notify.setOptions( { soundEnabled: this.options.sound } );
        this.$store.setData( this.optKey, this.options );
      }, 100 );
    },

    // load saved options data from local store
    loadOptions() {
      let options = this.$store.getData( this.optKey );
      this.options = utils.deepMerge( {}, this.options, options );
      this.$ajax.setOptions( { proxy: this.options.proxy } );
      this.$notify.setOptions( { soundEnabled: this.options.sound } );
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
      _scroller.onChange( pos => { this.scrollPos = pos; } );
      _scroller.onDown( pos => { this.scrollDir = 'down'; } );
      _scroller.onUp( pos => { this.scrollDir = 'up'; } );
    },

    // setup socket handlers
    setupSocketHandlers() {
      _stream.on( 'open', this.onSocketOpen );
      _stream.on( 'error', this.onSocketError );
      _stream.on( 'close', this.onSocketClose );
    },

    // convert socket timestamp to text
    computeSocketTime() {
      if ( !this.socketStart ) return;
      let secs = ( Date.now() - this.socketStart ) / 1000;
      this.socketTime = utils.elapsed( secs );
    },

    // when socket connection opens
    onSocketOpen( ws, e ) {
      this.socketStatus = 1;
      this.socketStart = Date.now();
      this.socketInt = setInterval( this.computeSocketTime, 1000 );
      this.showNotice( 'Socket connection active.', 'success' );
    },

    // when socket connection ends
    onSocketError( ws, e ) {
      if ( this.socketInt ) clearInterval( this.socketInt );
      this.socketStatus = 0;
      this.socketStart = 0;
      console.info( 'Socket-Error:', e.message || e );
      this.showNotice( 'Socket connection error.', 'warning' );
    },

    // when socket connection ends
    onSocketClose( ws, e ) {
      if ( this.socketInt ) clearInterval( this.socketInt );
      this.socketStatus = 0;
      this.socketStart = 0;
      this.showNotice( 'Socket connection closed.', 'warning' );
      this.toggleWatchform( 'stop' );
    },

    // handle socket connection
    toggleSocket( toggle ) {
      this.socketStatus = 1;

      if ( toggle === true && !this.socketStart ) {
        return _stream.getTickerData( this.onTickerData );
      }
      if ( toggle === false && this.socketStart ) {
        return _stream.closeSockets();
      }
    },

    // when live price data is recieved
    onTickerData( list ) {
      this.priceData = list;
      this.socketStatus = 2;

      for ( let i = 0; i < this.priceData.length; ++i ) {
        let p    = this.priceData[ i ];
        p.name   = this.coinsData[ p.token ] || p.name || p.token;
        p.alarms = this.alarmsData.hasOwnProperty( p.symbol ) ? this.alarmsData[ p.symbol ].length : 0;

        // add main asset token to the list
        if ( this.assetsList.indexOf( p.asset ) < 0 ) {
          this.assetsList.push( p.asset );
        }
        // if modal is open for a symbol, pass latest price data to it
        if ( this.modalData && this.modalData.symbol && this.modalData.symbol === p.symbol ) {
          this.modalData = p;
        }
        // trigger custom alarms for pair
        this.$notify.checkAlarm( p.symbol, p.close, ( title, info, alertData ) => {
          let icon = utils.fullUrl( alertData.icon );
          this.addMsgQueue( { title, info, icon } );
          this.$history.add( title, info, icon );
          this.$bus.emit( 'mainMenuAlert' );
        });
      }
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
      Array( 'words', 'emoji' ).forEach( file => {
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
            let token = String( list[ i ].symbol || '' );
            let name  = String( list[ i ].name || '' ).replace( /[^\w\-]+/g, ' ' ).replace( /\s\s+/g, ' ' ).trim();
            if ( token && name ) data[ token ] = name;
          }
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


