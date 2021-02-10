<template>
  <header class="topbar-wrap" :class="{ 'collapsed': header.collapsed }">
    <div class="container">

      <!-- main topbar row with logo and buttons -->
      <div class="topbar-main flex-row flex-middle flex-stretch">

        <!-- topbar logo -->
        <div class="topbar-logo">
          <h1 class="text-primary-hover clickable" @click="setRoute( '/' )">
            <i class="icon-chart-line"></i> <span class="text-uppercase text-clip if-medium">Binance Watch</span>
          </h1>
        </div>

        <!-- topbar top tokens -->
        <div class="topbar-prices flex-row flex-middle flex-1" v-if="options.prices.header">
          <div v-for="(a, i) in marketPrices" :key="a.token" class="text-clip clickable fx fx-slide-down" :class="'fx-delay-' + (i + 1)" @click="setRoute( a.route )">
            <span class="text-bright">{{ a.token }}</span>
            <span :class="{ 'text-gain': ( a.percent > 0 ), 'text-loss': ( a.percent < 0 ) }">{{ a.sign }}{{ a.percent | toFixed( 3 ) }}%</span> <br />
            <span class="text-default">{{ a.close | toFixed( a.market ) }}</span>
            <span class="text-faded">{{ a.market }}</span>
          </div>
        </div>

        <!-- topbar buttons and menu -->
        <div class="topbar-menu text-nowrap">

          <button
            class="topbar-btn"
            :class="{ 'icon-visible text-danger pulse': watching, 'icon-hidden text-grey': !watching }"
            @click="$bus.emit( 'toggleWatchform', 'toggle' )">
          </button>

          <Dropdown class="topbar-dropdown">
            <button slot="trigger" class="topbar-btn icon-signal" :class="{ 'text-gain': tickerStatus, 'text-danger': !tickerStatus }"></button>
            <div slot="list" class="text-center">

              <div class="form-label pad-h">Price Ticker Connection</div>

              <hr />
              <div class="pad-h push-bottom">
                <span class="text-default">Status:</span> &nbsp;
                <span v-if="tickerStatus == 0" class="text-loss">Disconnected <i class="icon-cry"></i></span>
                <span v-if="tickerStatus == 1" class="text-primary">Connecting... <i class="icon-clock"></i></span>
                <span v-if="tickerStatus == 2" class="text-gain">Connected <i class="icon-check"></i></span>
                <br />
                <span class="text-default">Time:</span> &nbsp;
                <span class="text-bright">{{ tickerTime }}</span>
              </div>

              <div class="pad-h">
                <button v-if="tickerStatus" class="form-btn icon-close iconLeft bg-danger-hover" @click="toggleConnection">Disconnect</button>
                <button v-else class="form-btn icon-connection iconLeft bg-success-hover" @click="toggleConnection">Connect</button>
              </div>

            </div>
          </Dropdown>

          <Dropdown class="topbar-dropdown" :class="{ 'alert-bubble': hasBubble }">
            <button slot="trigger" class="topbar-btn icon-menu"></button>
            <ul slot="list">
              <li class="heading">
                <span class="form-label">Main Navigation</span>
              </li>
              <li class="clickable text-bright-hover text-nowrap" @click="setRoute( '/' )">
                <i class="icon-chart-line iconLeft"></i> Live Ticker
              </li>
              <li class="clickable text-bright-hover text-nowrap" @click="setRoute( '/news' )">
                <i class="icon-feedback iconLeft"></i> Twitter News <span class="text-grey" v-if="newsCount">({{ newsCount }})</span>
              </li>
              <li class="clickable text-bright-hover text-nowrap" @click="setRoute( '/alarms' )">
                <i class="icon-alarm iconLeft"></i> Saved Alarms <span class="text-grey" v-if="alarmsData.length">({{ alarmsData.length }})</span>
              </li>
              <li class="clickable text-bright-hover text-nowrap" @click="setRoute( '/history' )">
                <i class="icon-clock iconLeft"></i> Recent History <span class="text-grey" v-if="historyData.length">({{ historyData.length }})</span>
              </li>
              <li class="clickable text-bright-hover text-nowrap" @click="setRoute( '/trade' )">
                <i class="icon-percent iconLeft"></i> Trade Bot
              </li>
              <li class="clickable text-bright-hover text-nowrap" @click="setRoute( '/options' )">
                <i class="icon-config iconLeft"></i> App Options
              </li>
              <li class="clickable text-bright-hover text-nowrap" @click="setRoute( '/about' )">
                <i class="icon-help iconLeft"></i> App Info
              </li>
            </ul>
          </Dropdown>

        </div>
      </div>

    </div>
  </header>
</template>

<script>
import Dropdown from './Dropdown.vue';

// component
export default {

  // component list
  components: { Dropdown },

  // component props
  props: {
    header: { type: Object, default() { return {} } },
    options: { type: Object, default() { return {} } },
    priceData: { type: Array, default() { return [] } },
    historyData: { type: Array, default() { return [] } },
    alarmsData: { type: Array, default() { return [] } },
    newsEntries: { type: Array, default() { return [] } },
    tickerStatus: { type: Number, default: 0 },
    tickerTime: { type: String, default: '' },
  },

  // component data
  data() {
    return {
      watching: false,
    }
  },

  // computed methods
  computed: {

    // compute number of active alarms for all tokens
    alarmsCount() {
      return this.alarmsData.filter( e => e.active ).length | 0;
    },

    // compute number of "new" history entries
    historyCount() {
      return this.historyData.filter( e => e.isNew ).length | 0;
    },

    // compute number of "new" news entries
    newsCount() {
      return this.newsEntries.filter( e => e.isNew ).length | 0;
    },

    // check if alert button should be visible
    hasBubble() {
      return ( this.historyCount || this.newsCount );
    },

    // get top 3 usdt coins based on volume
    marketPrices() {
      let market = this.options.prices.market || 'USDT';
      let list  = this.priceData.filter( p => ( p.market === market ) );
      return this.$utils.sort( list, 'percent', 'desc' ).slice( 0, 3 );
    },
  },

  // custom methods
  methods: {

    // set app url route
    setRoute( route ) {
      this.$router.setRoute( route );
    },

    // toggle socket connection
    toggleConnection() {
      if ( this.tickerStatus ) { this.$binance.stopTickerStream(); }
      else { this.$binance.startTickerStream( true ); }
    },
  },

  // on component created
  created() {
    this.$bus.on( 'priceWatch', status => { this.watching = status } );
  }
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
