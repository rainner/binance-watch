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
      :history="historyData"
      :alarms="alarmsData"
      :news="newsData"
      @setRoute="setRoute"
      @toggleWatchform="toggleWatchform">
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
      @setRoute="setRoute"
      @onStartWatch="watching = true"
      @onStopWatch="watching = false">
    </WatchForm>

    <!--  main app pages wrapper -->
    <main id="app-main" class="app-main">

      <!-- main ticker list component -->
      <TokenList
        id="tokenlist"
        class="app-page"
        :class="{ 'visible': mainComp === 'tokenlist' }"
        :options="options"
        :socketStatus="socketStatus"
        :scrollDir="scrollDir"
        :scrollPos="scrollPos"
        :assetsList="assetsList"
        :priceData="priceData"
        @setRoute="setRoute">
      </TokenList>

      <!-- news aggregator page -->
      <NewsPage
        id="newspage"
        class="app-page"
        :class="{ 'visible': mainComp === 'newspage' }"
        :options="options"
        :scrollDir="scrollDir"
        :scrollPos="scrollPos"
        :priceData="priceData"
        @newsData="updateNewsData"
        @setRoute="setRoute">
      </NewsPage>

    </main>

    <!-- common modal component -->
    <Modal ref="modal" @onDone="modalDone">
      <component
        :is="modalComp"
        :data="modalData"
        :options="options"
        :watching="watching"
        :socketStatus="socketStatus"
        :history="historyData"
        :alarms="alarmsData"
        @setRoute="setRoute"
        @saveOptions="setOptions">
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
@import "../scss/type";
@import "../scss/forms";
@import "../scss/tooltip";
@import "../scss/modifiers";
</style>

<script>
// custom modules
import Stream from '../modules/stream';
import Scroller from '../modules/scroller';
import utils from '../modules/utils';

// sub components
import Topbar from './Topbar.vue';
import Modal from './Modal.vue';
import Notify from './Notify.vue';
import WatchForm from './WatchForm.vue';
import TokenList from './TokenList.vue';
import NewsPage from './NewsPage.vue';

// modal components
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
      // app options
      title: 'Binance Watch',
      optKey: 'app_options_data',
      options: {
        // play notification sounds
        playSound: true,
        // toggle to auto refetch news and events data
        autoRefetch: true,
        // toggle for latest news notifications
        notifyNews: true,
        // cors proxy url
        corsProxyUrl: 'https://cors-anywhere.herokuapp.com/',
        // twitter name for notifications
        twitterName: '',
        // email address for notifications
        emailAddress: '',
      },
      // app data
      watching: false,
      priceData: [],
      assetsList: [],
      historyData: [],
      alarmsData: {},
      newsData: {},
      // page and modal related
      mainComp: 'tokenlist',
      modalComp: '',
      modalData: {},
      // socket related data
      socketStatus: 0, // ( 0: off, 1: connecting, 2: connected)
      socketStart: 0,
      socketInt: null,
      socketTime: '',
      // page scroll data
      scrollDir: '',
      scrollPos: 0,
    }
  },

  // watch methods
  watch: {
    // update socket status based on price data
    priceData: function() {
      if ( !this.socketStatus ) return; // off, leave as is
      this.socketStatus = !this.priceData.length ? 1 : 2; // waiting, or done
    }
  },

  // custom methods
  methods: {

    // load saved options data from local store
    loadOptions() {
      let options = this.$store.getData( this.optKey );
      this.options = Object.assign( this.options, options );
    },

    // merge new options and save
    setOptions( options ) {
      setTimeout( () => {
        this.options = Object.assign( {}, this.options, options );
        this.$ajax.setOptions( { proxy: this.options.corsProxyUrl } );
        this.$notify.setOptions( { soundEnabled: this.options.playSound } );
        this.$store.setData( this.optKey, this.options );
      }, 100 );
    },

    // set a url hash route
    setRoute( route ) {
      this.$router.setRoute( route );
    },

    // setup app routes
    setupRoutes() {
      // default route
      this.$router.on( '/', () => { this.togglePageView( 'tokenlist' ) } );
      this.$router.on( '/news', () => { this.togglePageView( 'newspage' ) } );
      // common modal routes
      this.$router.on( '/history', () => { this.showModal( 'HistoryPage', 'Recent Alert History' ) } );
      this.$router.on( '/alarms', () => { this.showModal( 'AlarmsList', 'Active Price Alarms' ) } );
      this.$router.on( '/about', () => { this.showModal( 'AboutPage', 'About This App' ) } );
      this.$router.on( '/options', () => { this.showModal( 'OptionsPage', 'Options & Settings' ) } );
      this.$router.on( '/donate', () => { this.showModal( 'DonatePage', 'Make a Donation' ) } );
      // symbol modal route
      this.$router.on( '/symbol/([A-Z]+)', symbol => {
        let d = this.priceData.filter( p => p.symbol === symbol ).shift();
        if ( d ) this.showModal( 'TokenPage', d.arrow +' '+ d.token +' / '+ d.asset, d );
      });
    },

    // change visible page component
    togglePageView( name ) {
      this.mainComp = name;
      this.closeModal();
    },

    // handler for news data, from component
    updateNewsData( data ) {
      this.newsData = data;
    },

    // load history data from handler
    loadHistory() {
      this.historyData = this.$history.getData();
    },

    // load alarms data from handler
    loadAlarms() {
      this.alarmsData = this.$notify.getAlarms();
    },

    // check if custom alarms need to be sent out on a timer
    checkAlarms() {
      utils.delay( 'alarms', 10, this.checkAlarms );
      this.priceData.forEach( p => {
        this.$notify.checkAlarm( p.symbol, p.close, ( title, info, alertData ) => {
          // add alert to history
          this.$history.add( title, info );
        });
      });
      this.loadHistory();
      this.loadAlarms();
    },

    // when live price data is recieved
    onTickerData( priceData ) {
      this.priceData = priceData;
      this.priceData.forEach( p => {

        // if modal is open for a symbol, pass latest price data to it
        if ( this.modalData && this.modalData.symbol && this.modalData.symbol === p.symbol ) {
          this.modalData = p;
        }
        // add main asset token to the list
        if ( this.assetsList.indexOf( p.asset ) < 0 ) {
          this.assetsList.push( p.asset );
        }
      });
    },

    // when socket connection opens
    onSocketOpen( ws, e ) {
      this.socketStatus = 1;
      this.socketStart = Date.now();
      this.socketInt = setInterval( this.computeSocketTime, 1000 );
      this.assetsList = [];
      this.showNotice( 'Socket connection active', 'success' );
    },

    // when socket connection ends
    onSocketError( ws, e ) {
      if ( this.socketInt ) clearInterval( this.socketInt );
      this.socketStatus = 0;
      this.priceData = [];
      this.showNotice( 'Socket connection error', 'error' );
      console.error( e );
    },

    // when socket connection ends
    onSocketClose( ws, e ) {
      if ( this.socketInt ) clearInterval( this.socketInt );
      this.socketStatus = 0;
      this.priceData = [];
      this.showNotice( 'Socket connection closed', 'warning' );
    },

    // convert socket timestamp to text
    computeSocketTime() {
      if ( !this.socketStart ) return;
      let secs = ( Date.now() - this.socketStart ) / 1000;
      this.socketTime = utils.elapsed( secs );
    },

    // handle socket connection
    toggleSocket( toggle ) {
      this.toggleWatchform( 'stop' );

      if ( toggle === true && !this.socketStatus ) {
        this.socketStatus = 1;
        _stream.getTickerData( this.onTickerData );
      }
      if ( toggle === false ) {
        this.socketStatus = 0;
        _stream.closeSockets();
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
    setTitle( title ) {
      if ( this.modalComp ) return;
      let list = [ this.title ];
      title = String( title || '' ).trim();
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
    },

    // show modal window
    showModal( component, title, data ) {
      if ( !this.$refs.modal ) return;
      title = title || component;
      this.setTitle( title );
      this.modalComp = component;
      this.modalData = Object.assign( {}, data );
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
      this.setRoute( '/' );
      this.setTitle();
    },

    // show css alert
    showNotice( message, type, timeout ) {
      if ( !this.$refs.notify ) return;
      this.$refs.notify.show( message, type, timeout );
    },
  },

  // init app data and handlers
  beforeMount() {
    this.loadOptions();
    this.setupRoutes();
    // config global shared objects
    this.$ajax.setOptions( { proxy: this.options.corsProxyUrl } );
    this.$notify.setOptions( { soundEnabled: this.options.playSound } );
    this.$notify.permission();
    this.$notify.loadAlarms();
    this.$history.loadData();
    // setup global event bus handlers
    this.$bus.on( 'setOptions', this.setOptions );
    this.$bus.on( 'setTitle', this.setTitle );
    this.$bus.on( 'setRoute', this.setRoute );
    this.$bus.on( 'toggleSocket', this.toggleSocket );
    this.$bus.on( 'showModal', this.showModal );
    this.$bus.on( 'closeModal', this.closeModal );
    this.$bus.on( 'showNotice', this.showNotice );
    this.$bus.on( 'handleClick', this.handleClick );
    this.$bus.on( 'loadHistory', this.loadHistory );
    this.$bus.on( 'loadAlarms', this.loadAlarms );
    // setup socket handlers
    _stream.on( 'open', this.onSocketOpen );
    _stream.on( 'error', this.onSocketError );
    _stream.on( 'close', this.onSocketClose );
    // setup scroller handlers
    _scroller.onChange( pos => { this.scrollPos = pos; } );
    _scroller.onDown( pos => { this.scrollDir = 'down'; } );
    _scroller.onUp( pos => { this.scrollDir = 'up'; } );
  },

  // start socket and other external data
  mounted() {
    this.setTitle();
    this.toggleSocket( true );
    this.loadHistory();
    this.loadAlarms();
    this.checkAlarms();
    setTimeout( () => { this.$router.trigger( window.location.hash ) }, 100 );
  },

  // cleanup and close connetions
  destroyed() {
    this.toggleSocket( false );
  },
}
</script>

<style lang="scss">

.app-main {

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


