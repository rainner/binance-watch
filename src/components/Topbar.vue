<template>
  <header class="topbar-wrap" :class="{ 'collapsed': scrollDir === 'down' }">
    <div class="container">

      <!-- main topbar row with logo and buttons -->
      <div class="topbar-main flex-row flex-middle flex-space">
        <!-- topbar logo -->
        <div class="topbar-logo text-clip">
          <h1 class="icon-chart-line iconLeft text-clip text-primary-hover clickable" @click="$emit( 'setRoute', '/' )">
            Binance Watch
          </h1>
        </div>
        <!-- topbar buttons and menu -->
        <div class="topbar-menu text-nowrap">

          <button
            class="topbar-btn icon-alarm"
            :class="{ 'text-success pulse': watching, 'text-danger': !watching }"
            @click="$emit( 'toggleWatchform', 'toggle' )">
          </button>

          <Dropdown class="topbar-dropdown">
            <button slot="trigger"
              class="topbar-btn icon-connection"
              :class="{ 'text-success': isConnected, 'text-danger': !isConnected }">
            </button>
            <div slot="list" class="text-center">
              <big>Socket Connection</big>
              <hr />

              <span class="text-default">Status:</span> &nbsp;
              <span v-if="socketStatus == 0" class="text-loss">Diconnected <i class="icon-cry"></i></span>
              <span v-else-if="socketStatus == 1" class="text-primary">Waiting... <i class="icon-clock"></i></span>
              <span v-else-if="socketStatus == 2" class="text-gain">Connected <i class="icon-check"></i></span>
              <br />

              <span class="text-default">Time:</span> &nbsp;
              <span class="text-bright">{{ socketTime }}</span>
              <hr />

              <button v-if="isConnected" class="form-btn icon-close iconLeft bg-danger-hover" @click="toggleConnection">Disconnect</button>
              <button v-else class="form-btn icon-connection iconLeft bg-success-hover" @click="toggleConnection">Connect</button>
            </div>
          </Dropdown>

          <dropdown class="topbar-dropdown" :class="{ 'alert-bubble': hasBubble }">
            <button slot="trigger" class="topbar-btn icon-menu"></button>
            <ul slot="list">
              <li class="clickable text-primary-hover text-nowrap" @click="$emit( 'setRoute', '/' )">
                <i class="icon-chart-line iconLeft"></i> Prices
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="onNewsClick">
                <i class="icon-feedback iconLeft"></i> News <span v-if="news.count">({{ news.count }})</span>
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="$emit( 'setRoute', '/history' )">
                <i class="icon-clock iconLeft"></i> History <span v-if="history.length">({{ history.length }})</span>
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="$emit( 'setRoute', '/alarms' )">
                <i class="icon-alarm iconLeft"></i> Alarms <span v-if="alarmsCount">({{ alarmsCount }})</span>
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="$emit( 'setRoute', '/about' )">
                <i class="icon-help iconLeft"></i> About
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="$emit( 'setRoute', '/options' )">
                <i class="icon-config iconLeft"></i> Options
              </li>
              <li class="clickable text-primary-hover text-nowrap" @click="$emit( 'setRoute', '/donate' )">
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
    watching: { type: Boolean, default: false, required: false },
    socketStatus: { type: Number, default: 0, required: false },
    socketTime: { type: String, default: '', required: false },
    scrollDir: { type: String, default: '', required: false },
    scrollPos: { type: Number, default: 0, required: false },
    history: { type: Array, default: [] },
    alarms: { type: Object, default() { return {} } },
    news: { type: Object, default() { return {} } },
  },

  // computed methods
  computed: {

    // check if socket is connected
    isConnected() {
      return ( this.socketStatus > 0 ) ? true : false;
    },

    // see if there are new events or news
    hasBubble() {
      return this.news.count ? true : false;
    },

    // get total number of alerms
    alarmsCount() {
      let count = 0;
      Object.keys( this.alarms ).forEach( a => { count += this.alarms[ a ].length } );
      return count;
    },
  },

  // custom methods
  methods: {

    // toggle socket connection
    toggleConnection() {
      this.$bus.emit( 'toggleSocket', !this.isConnected );
    },

    // special handler for the news menu item to reset count and change route
    onNewsClick( e ) {
      this.$bus.emit( 'resetNewsCount' );
      this.$emit( 'setRoute', '/news' );
    }

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
