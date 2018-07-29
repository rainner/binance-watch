<template>
  <header class="topbar-wrap" :class="{ 'collapsed': scrollDir === 'down' }">
    <div class="container">

      <!-- main topbar row with logo and buttons -->
      <div class="topbar-main flex-row flex-middle flex-stretch">

        <!-- topbar logo -->
        <div class="topbar-logo text-clip">
          <h1 class="text-clip text-primary-hover clickable" @click="setRoute( '/' )">
            <i class="icon-chart-line"></i> <span class="text-uppercase text-clip if-medium">Binance Watch</span>
          </h1>
        </div>

        <!-- topbar buttons and menu -->
        <div class="topbar-prices flex-row flex-middle flex-1">
          <div class="text-clip clickable" v-for="a in assetPrices" :key="a.token" @click="setRoute( a.route )">
            <span class="text-bright">{{ a.token }}</span>
            <span :class="{ 'text-gain': ( a.percent > 0 ), 'text-loss': ( a.percent < 0 ) }">{{ a.sign }}{{ a.percent | toCents }}%</span> <br />
            <span class="text-default">${{ a.close | toCurrency }} {{ a.arrow }}</span> <br />
          </div>
        </div>

        <!-- topbar buttons and menu -->
        <div class="topbar-menu text-nowrap">

          <button
            class="topbar-btn icon-alarm"
            :class="{ 'text-gain pulse': watching, 'text-grey': !watching }"
            @click="$bus.emit( 'toggleWatchform', 'toggle' )">
          </button>

          <Dropdown class="topbar-dropdown">
            <button slot="trigger" class="topbar-btn icon-signal" :class="{ 'text-gain': isConnected, 'text-danger': !isConnected }"></button>
            <div slot="list" class="text-center">

              <div class="form-label pad-h">Socket Connection</div>

              <hr />
              <div class="pad-h push-bottom">
                <span class="text-default">Status:</span> &nbsp;
                <span v-if="socketStatus == 0" class="text-loss">Diconnected <i class="icon-cry"></i></span>
                <span v-else-if="socketStatus == 1" class="text-primary">Waiting... <i class="icon-clock"></i></span>
                <span v-else-if="socketStatus == 2" class="text-gain">Connected <i class="icon-check"></i></span>
                <br />
                <span class="text-default">Time:</span> &nbsp;
                <span class="text-bright">{{ socketTime }}</span>
              </div>

              <div class="pad-h">
                <button v-if="isConnected" class="form-btn icon-close iconLeft bg-danger-hover" @click="toggleConnection">Disconnect</button>
                <button v-else class="form-btn icon-connection iconLeft bg-success-hover" @click="toggleConnection">Connect</button>
              </div>

            </div>
          </Dropdown>

          <Dropdown class="topbar-dropdown" :class="{ 'alert-bubble': alertCount }">
            <button slot="trigger" class="topbar-btn icon-menu" @click="resetCount"></button>
            <ul slot="list">
              <li class="clickable text-primary-hover text-nowrap" @click="setRoute( '/' )">
                <i class="icon-chart-line iconLeft"></i> Prices
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="setRoute( '/news' )">
                <i class="icon-feedback iconLeft"></i> News <span class="text-grey" v-if="newsData.count">({{ newsData.count }})</span>
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="setRoute( '/history' )">
                <i class="icon-clock iconLeft"></i> History <span class="text-grey" v-if="historyData.length">({{ historyData.length }})</span>
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="setRoute( '/alarms' )">
                <i class="icon-alarm iconLeft"></i> Alarms <span class="text-grey" v-if="alarmsCount">({{ alarmsCount }})</span>
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="setRoute( '/about' )">
                <i class="icon-help iconLeft"></i> About
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="setRoute( '/options' )">
                <i class="icon-config iconLeft"></i> Options
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="setRoute( '/donate' )">
                <i class="icon-like iconLeft"></i> Donate
              </li>
            </ul>
          </Dropdown>

        </div>
      </div>

    </div>
  </header>
</template>

<script>
// components
import Dropdown from './Dropdown.vue';

// component
export default {

  // component list
  components: { Dropdown },

  // component props
  props: {
    watching: { type: Boolean, default: false },
    socketStatus: { type: Number, default: 0 },
    socketTime: { type: String, default: '' },
    scrollDir: { type: String, default: '' },
    scrollPos: { type: Number, default: 0 },
    priceData: { type: Array, default: [] },
    historyData: { type: Array, default: [] },
    alarmsData: { type: Object, default() { return {} } },
    newsData: { type: Object, default() { return {} } },
  },

  // component data
  data() {
    return {
      alertCount: 0,
    }
  },

  // computed methods
  computed: {

    // check if socket is connected
    isConnected() {
      return ( this.socketStatus > 0 ) ? true : false;
    },

    // get total number of alerms
    alarmsCount() {
      let count = 0;
      Object.keys( this.alarmsData ).forEach( a => { count += this.alarmsData[ a ].length } );
      return count;
    },

    // get a few top tokens to be listed on topbar
    assetPrices() {
      let tokens = /^(BTC|ETH|LTC)$/;
      let asset  = 'USDT';
      return this.priceData.filter( p => ( tokens.test( p.token ) && p.asset === asset ) );
    },
  },

  // custom methods
  methods: {

    // reset bubble alert count
    resetCount() {
      this.alertCount = 0;
    },

    // increase bubble alert count
    increaseCount() {
      this.alertCount += 1;
    },

    // toggle socket connection
    toggleConnection() {
      this.$bus.emit( 'toggleSocket', !this.isConnected );
    },

    // proxy for settings a route
    setRoute( route, reset ) {
      this.$bus.emit( 'setRoute', route );
      if ( reset ) this.resetCount();
    },
  },

  // component mounted
  mounted() {
    // used to add the alert bubble to the menu
    this.$bus.on( 'mainMenuAlert', this.increaseCount );
    this.$bus.on( 'mainMenuReset', this.resetCount );
  },
}
</script>

<style lang="scss">
// topbar wrapper
.topbar-wrap {
  display: block;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  background-color: $colorDocumentLight;
  z-index: ( $zindexElements + 10 );

  // main topbar container
  .topbar-main {
    height: $topbarHeight;

    // topbar logo
    .topbar-logo {
      h1 {
        font-size: 150%;
        line-height: 1em;
        text-transform: uppercase;
      }
    }
    // top asset prices
    .topbar-prices {
      font-size: 80%;
      line-height: 1.1em;
      letter-spacing: 0;
      font-weight: normal;

      & > div {
        margin-left: $padSpace / 1.5;
        padding-left: $padSpace / 1.5;
        border-left: $lineWidth $lineStyle $lineColor;
      }

       @media #{$screenSmall} {
        letter-spacing: 1px;

        & > div {
          margin-left: $padSpace;
          padding-left: $padSpace;
        }
      }
    }
    // button/links
    .topbar-btn {
      display: inline-block;
      margin: 0 0 0 .5em;
      font-size: 180%;
      line-height: 1em;
      color: $colorDefault;

      &.pulse {
        animation: pulseFade 1s linear infinite;
      }

      &:before {
        opacity: 1;
      }
      &:hover:before {
        opacity: .8;
      }
    }
    // dropdown component
    .topbar-dropdown {
      display: inline-block;
      position: relative;
    }
  }

  // collapsed mode
  &.collapsed {
    transform: translateY( -#{$topbarHeight} );
  }
}
</style>
