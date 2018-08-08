<template>
  <main class="tokenlist-wrap" :class="{ 'collapsed': scrollDir === 'down', 'opaque': scrollPos > 10 }">

    <!-- list spinner -->
    <Spinner class="tokenlist-spinner abs" ref="spinner"></Spinner>

    <!-- fixed list search/sorting controls -->
    <section class="tokenlist-controls">
      <div class="container">
        <div class="tokenlist-controls-row flex-row flex-middle flex-space">

          <!-- control input -->
          <div class="tokenlist-controls-input push-right">
            <div class="form-input">
              <div class="icon-search iconLeft"></div>
              <input class="push-right" type="text" v-model="searchToken" placeholder="Search ..." />
              <button class="icon-close text-primary-hover" @click="searchToken = ''" v-if="searchToken"></button>
            </div>
          </div>

          <!-- control heading -->
          <div class="tokenlist-controls-title push-right text-clip text-center flex-1 if-medium">
            <big>24h Change</big>
          </div>

          <!-- control dropdown menus -->
          <div class="tokenlist-controls-filters text-nowrap">
            <Dropdown>
              <button slot="trigger" class="form-btn bg-grey-hover icon-down-open" title="List Limit" v-tooltip>
                {{ limitCountLabel }}
              </button>
              <ul slot="list">
                <li class="clickable" @click="limitList( 10 )">
                  <i class="icon-list-add iconLeft"></i> 10 tokens
                </li>
                <li class="clickable" @click="limitList( 20 )">
                  <i class="icon-list-add iconLeft"></i> 20 tokens
                </li>
                <li class="clickable" @click="limitList( 50 )">
                  <i class="icon-list-add iconLeft"></i> 50 tokens
                </li>
                <li class="clickable" @click="limitList( 100 )">
                  <i class="icon-list-add iconLeft"></i> 100 tokens
                </li>
                <li class="clickable" @click="limitList( 0 )">
                  <i class="icon-list-add iconLeft"></i> All tokens
                </li>
              </ul>
            </Dropdown>&nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-grey-hover iconLeft"
                :class="{ 'icon-down': sortOrder === 'desc', 'icon-up': sortOrder === 'asc' }"
                v-text="sortByLabel" title="Sort Options" v-tooltip>
              </button>
              <ul slot="list">
                <li class="clickable" @click="toggleSort( 'token' )">
                  <i class="icon-bitcoin iconLeft"></i> Token
                </li>
                <li class="clickable" @click="toggleSort( 'percent' )">
                  <i class="icon-percent iconLeft"></i> Percent
                </li>
                <li class="clickable" @click="toggleSort( 'close' )">
                  <i class="icon-chart-line iconLeft"></i> Price
                </li>
                <li class="clickable" @click="toggleSort( 'change' )">
                  <i class="icon-clock iconLeft"></i> Change
                </li>
                <li class="clickable" @click="toggleSort( 'assetVolume' )">
                  <i class="icon-chart-area iconLeft"></i> Volume
                </li>
                <li class="clickable" @click="toggleSort( 'trades' )">
                  <i class="icon-reload iconLeft"></i> Trades
                </li>
              </ul>
            </Dropdown>&nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-star iconLeft"
                v-text="filterAsset" title="Filter Asset" v-tooltip>
              </button>
              <ul slot="list">
                <li class="clickable" v-for="asset in assetsList" :key="asset" @click="filterAsset = asset">
                  <i class="icon-star iconLeft"></i> {{ asset }}
                </li>
              </ul>
            </Dropdown>
          </div>

        </div>
      </div>
    </section>

    <!-- live ticker price list -->
    <section class="push-bottom" v-if="!listCount">
      <div class="container">
        <div class="card flex-row flex-middle flex-stretch">
          <div class="icon-help iconLarge push-right"></div>
          <div class="text-clip flex-1">
            <div v-if="searchToken">
              <span class="text-bright">No match for search: <span class="text-primary">{{ searchToken }}</span></span> &nbsp;
              <button class="icon-close iconLeft text-pill bg-grey-hover" @click.prevent="searchToken = ''">Reset</button> <br />
              <span class="text-grey">Can't find anything matching your search input.</span>
            </div>
            <div v-else>
              <span class="text-bright">No price data available</span> <br />
              <span class="text-grey">Price data from remote API has not loaded yet.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- live ticker price list -->
    <section class="tokenlist-list">
      <div class="container">

        <div v-for="p in tickerList"
          class="tokenlist-item flex-row flex-middle flex-stretch clickable"
          :class="{ 'gain': ( p.percent > 0 ), 'loss': ( p.percent < 0 ) }"
          @click.stop="setRoute( p.route )"
          :key="p.symbol">

          <div class="tokenlist-item-icon" :class="{ 'alarm-bubble': p.alarms }">
            <TokenIcon :pairData="p"></TokenIcon>
          </div>

          <div class="tokenlist-item-symbol text-clip flex-1">
            <big class="text-bright">{{ p.token }}</big> <br />
            <span class="text-default">{{ p.name }}</span>
          </div>

          <div class="tokenlist-item-price text-right text-clip flex-2">
            <big class="text-nowrap text-bright">{{ p.close | toSats }}</big>
            <span class="text-grey">{{ p.asset }}</span> <br />
            <span class="text-nowrap color">{{ p.sign }}{{ p.percent | toCents }}%</span>
            <span class="text-nowrap text-grey">{{ p.sign }}{{ p.change | toSats }}</span>
          </div>

          <div class="tokenlist-item-chart push-left flex-2 if-medium" :class="{ 'gain': ( p.percent > 0 ), 'loss': ( p.percent < 0 ) }">
            <LineChart :width="300" :height="38" :values="p.history"></LineChart>
          </div>

          <div class="tokenlist-item-volume text-right text-clip flex-2">
            <big class="text-nowrap text-bright">{{ p.assetVolume | toCommas }}</big>
            <span class="text-nowrap text-grey">{{ p.asset }}</span> <br />
            <span class="text-nowrap text-default">{{ p.tokenVolume | toCommas }}</span>
            <span class="text-nowrap text-grey">{{ p.token }}</span>
          </div>

          <div class="tokenlist-item-trades text-right text-clip flex-2 if-large">
            <big class="text-nowrap text-bright">{{ p.trades | toCommas }}</big> <br />
            <button class="text-primary-hover icon-chart-line iconLeft" @click.stop="tradeLink( p.token, p.asset )" :title="'Trade '+ p.token" v-tooltip>Trades</button>
          </div>

        </div>

        <!-- if there are more items not included in list due to limit option -->
        <div class="tokenlist-item flex-row flex-middle flex-stretch" v-if="listLeft">
          <div class="tokenlist-item-icon text-clip">
            <TokenIcon></TokenIcon>
          </div>
          <div class="tokenlist-item-price text-clip text-grey flex-1">
            <span class="text-default">{{ listLeftText }} more ...</span> <br />
            <button class="text-secondary-hover icon-list-add iconLeft" @click="limitList( 0 )">Show all</button>
          </div>
        </div>

      </div>
    </section>

  </main>
</template>

<script>
// components
import Spinner from './Spinner.vue';
import TokenIcon from './TokenIcon.vue';
import Dropdown from './Dropdown.vue';
import LineChart from './LineChart.vue';
import utils from '../modules/utils';

// component
export default {

  // component list
  components: { Spinner, TokenIcon, Dropdown, LineChart },

  // component props
  props: {
    active: { type: Boolean, default: false },
    options: { type: Object, default() { return {} } },
    socketStatus: { type: Number, default: 0, required: false },
    scrollDir: { type: String, default: '', required: false },
    scrollPos: { type: Number, default: 0, required: false },
    assetsList: { type: Array, default: [], required: false },
    priceData: { type: Array, default: [], required: true },
  },

  // comonent data
  data() {
    return {
      // filter/sorting/limit options
      filterAsset: 'BTC',
      searchToken: '',
      sortOrder: 'desc',
      sortBy: 'assetVolume',
      limitMin: 10,
      limitMax: 200,
      limitCount: 20,
      // filtered list data
      listCount: 0,
      listLeft: 0,
    }
  },

  // watch methods
  watch: {

    // update spinenr based on socket and price data status
    priceData: function() {
      if ( !this.$refs.spinner ) return;
      if ( !this.priceData.length ) {
        if ( this.socketStatus === 0 ) return this.$refs.spinner.error( 'Socket API not connected' );
        if ( this.socketStatus === 1 ) return this.$refs.spinner.show( 'Waiting for price data' );
      }
      this.$refs.spinner.hide();
    },
  },

  // computed methods
  computed: {

    // get filtered and sorted ticker list for display
    tickerList() {
      let list  = this.priceData.slice(); // copy
      let limit = parseInt( this.limitCount ) | 0;

      // filter by trading asset
      if ( this.filterAsset ) {
        list = list.filter( p => p.asset === this.filterAsset );
      }
      // filter by search text
      if ( this.searchToken && this.searchToken.length > 1 ) {
        list = utils.search( list, 'token', this.searchToken );
      }
      // sort list based column and order
      list = utils.sort( list, this.sortBy, this.sortOrder );

      // compute list totals before cutting the list
      let total = list.length;
      this.limitMax  = total;
      this.listCount = total;
      this.listLeft  = 0;

      // limit list to a number of entries
      if ( total && limit && limit < total ) {
        list = list.slice( 0, limit );
        this.listLeft = ( total - list.length );
      }
      return list;
    },

    // sort-by label for buttons, etc
    sortByLabel() {
      switch ( this.sortBy ) {
        case 'token'       :  return 'Token';
        case 'percent'     :  return 'Percent';
        case 'close'       :  return 'Price';
        case 'change'      :  return 'Change';
        case 'assetVolume' :  return 'Volume';
        case 'tokenVolume' :  return 'Volume';
        case 'trades'      :  return 'Trades';
        default            :  return 'Default';
      }
    },

    // text to show in limit filter controls
    limitCountLabel() {
      if ( this.limitCount && this.limitCount < this.listCount ) {
        return this.limitCount +'/'+ this.listCount;
      }
      return 'All '+ this.listCount;
    },

    // text about hidden list pair
    listLeftText() {
      let count = this.listLeft;
      let asset = this.filterAsset;
      return utils.noun( count, asset +' pair', asset +' pairs' );
    },
  },

  // custom mounted
  methods: {

    // proxy for setting a route
    setRoute( route ) {
      this.$bus.emit( 'setRoute', route );
    },

    // lick to binance site with ref id added
    tradeLink( token, asset ) {
      let pair = token +'_'+ asset;
      this.$bus.emit( 'handleClick', 'binance', '/trade.html?symbol='+ pair, '_blank' );
    },

    // build token history chart points for SVG polyline
    chartPoints( width, height, values ) {
      let data = utils.points( width, height, values );
      let out  = data.map( d => d.x +','+ d.y );
      return out.join( ' ' );
    },

    // set list limit value
    limitList( num ) {
      this.limitCount = parseInt( num ) | 0;
    },

    // change list sort order for selected key
    toggleSort( sortBy ) {
      if ( sortBy === this.sortBy ) {
        this.sortOrder = ( this.sortOrder === 'asc' ) ? 'desc' : 'asc';
        return;
      }
      this.sortBy = sortBy;
      this.sortOrder = ( this.sortBy === 'token' ) ? 'asc' : 'desc';
    },
  },

  // waiting for socket
  mounted() {
    if ( !this.$refs.spinner ) return;
    this.$refs.spinner.show( 'Connecting to socket API' );
  }
}
</script>

<style lang="scss">
// ticker wrap
.tokenlist-wrap {
  position: relative;
  padding-top: calc( #{$topbarHeight} + 4.5em );
  padding-bottom: $topbarHeight;
  min-height: 100vh;

  .tokenlist-controls {
    position: fixed;
    padding: calc( #{$topbarHeight} + 1em ) 0 1em 0;
    left: 0;
    top: 0;
    width: 100%;
    background-color: rgba( $colorDocument, 0 );
    z-index: ( $zindexElements - 1 );

    .form-input {
      background-color: lighten( $colorDocument, 4% );

      &:hover {
        background-color: lighten( $colorDocument, 6% );
      }
    }
  }

  .tokenlist-list {
    position: relative;

    .tokenlist-item {
      margin: 0 0 ( $lineWidth * 2 ) 0;
      padding: ( $padSpace / 2 ) $padSpace;
      background-color: $colorDocumentLight;
      border-radius: $lineJoin;

      &:hover { background-color: lighten( $colorDocumentLight, 2% ); }
      &.gain .color { color: $colorGain; }
      &.loss .color { color: $colorLoss; }

      .tokenlist-item-icon {
        margin-right: 1em;
        width: $iconSize;
      }
      .tokenlist-item-symbol,
      .tokenlist-item-price,
      .tokenlist-item-trades,
      .tokenlist-item-volume {
        margin-top: .1em;
      }
      .tokenlist-item-chart {
        padding: .5em;
        background-color: rgba( #000, 0.2 );
        border-radius: $lineJoin;

        .polyline { stroke: $colorDefault; }
        &.gain .polyline { stroke: $colorGain; }
        &.loss .polyline { stroke: $colorLoss; }

        .circle { fill: $colorDefault; }
        &.gain .circle { fill: $colorGain; }
        &.loss .circle { fill: $colorLoss; }
      }
    }
  }

  // collapsed mode
  &.collapsed {
    .tokenlist-controls {
      transform: translateY( -#{$topbarHeight} );
    }
  }

  // opaque mode
  &.opaque {
    .tokenlist-controls {
      background-color: rgba( 0, 0, 0, 0.85 );
      box-shadow: $shadowBold;
    }
  }
}
</style>
