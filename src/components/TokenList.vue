<template>
  <main class="tokenlist-wrap" :class="{ 'collapsed': scrollDir === 'down', 'opaque': scrollPos > 10 }">

    <!-- list spinner -->
    <Spinner class="tokenlist-spinner abs" ref="spinner"></Spinner>

    <!-- fixed list search/sorting controls -->
    <div class="tokenlist-controls">
      <div class="container">

        <!-- control elements -->
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
          <div class="tokenlist-controls-title push-right text-clip text-grey text-center flex-1">
            <big>24h Change</big>
          </div>

          <!-- control dropdown menus -->
          <div class="tokenlist-controls-filters text-nowrap">
            <!-- sort menu -->
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

            <!-- assets menu -->
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
    </div>

    <!-- live ticker price list -->
    <div class="tokenlist-list">
      <div class="container">

        <div class="flex-row flex-middle flex-stretch border-top pad-top push-top" v-if="searchToken && !filterList.length">
          <div class="tokenlist-item-icon icon-help iconLarge push-right"></div>
          <div class="tokenlist-item-symbol text-clip flex-1">
            <big class="text-danger">Found nothing matching: {{ searchToken }}.</big> <br />
            <span class="text-grey">There are a total of {{ priceData.length }} symbols loaded from the API</span>
          </div>
        </div>

        <div v-for="p in filterList"
          class="tokenlist-item flex-row flex-middle flex-stretch clickable"
          :class="{ 'gain': ( p.percent > 0 ), 'loss': ( p.percent < 0 ) }"
          @click="$emit( 'setRoute', '/symbol/'+ p.symbol )"
          :key="p.symbol">

          <div class="tokenlist-item-icon text-clip">
            <TokenIcon :data="p"></TokenIcon>
          </div>

          <div class="tokenlist-item-symbol text-clip flex-1">
            <big class="text-bright-hover">{{ p.token }}</big> <br />
            <span class="text-nowrap color">{{ p.sign }}{{ p.percent | toCents }}% {{ p.arrow }}</span>
          </div>

          <div class="tokenlist-item-price text-clip flex-2">
            <big class="text-nowrap text-bright">{{ p.close | toSats }}</big>
            <span class="text-default">{{ p.asset }}</span> <br />
            <span class="text-nowrap color">{{ p.sign }}{{ p.change | toSats }}</span>
          </div>

          <div class="tokenlist-item-trades text-right text-clip flex-1">
            <big class="text-nowrap text-bright">{{ p.trades | toCommas }}</big> <br />
            <span class="text-default">Trades</span>
          </div>

          <div class="tokenlist-item-volume text-right text-clip flex-1">
            <big class="text-nowrap text-bright">{{ p.assetVolume | toCommas }} {{ p.asset }}</big> <br />
            <span class="text-nowrap">{{ p.tokenVolume | toCommas }} {{ p.token }}</span>
          </div>

        </div>
      </div>

    </div>

  </main>
</template>

<script>
// components
import Spinner from './Spinner.vue';
import TokenIcon from './TokenIcon.vue';
import Dropdown from './Dropdown.vue';
import utils from '../modules/utils';

// component
export default {

  // component list
  components: { Spinner, TokenIcon, Dropdown },

  // component props
  props: {
    socketStatus: { type: Number, default: 0, required: false },
    scrollDir: { type: String, default: '', required: false },
    scrollPos: { type: Number, default: 0, required: false },
    assetsList: { type: Array, default: [], required: false },
    priceData: { type: Array, default: [], required: true },
  },

  // comonent data
  data() {
    return {
      filterAsset: 'BTC',
      searchToken: '',
      sortOrder: 'desc',
      sortBy: 'assetVolume',
    }
  },

  // watch methods
  watch: {

    // update spinenr based on socket and price data status
    socketStatus: function() {
      if ( !this.$refs.spinner ) return;
      if ( this.socketStatus === 0 ) return this.$refs.spinner.error( 'Socket API not connected' );
      if ( this.socketStatus === 1 ) return this.$refs.spinner.show( 'Waiting for price data' );
      if ( this.socketStatus === 2 ) return this.$refs.spinner.hide();
    }
  },

  // computed methods
  computed: {

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

    // filter and search ticker list
    filterList() {
      let list = this.priceData;

      let compare = ( a, b ) => {
        let _a = a[ this.sortBy ];
        let _b = b[ this.sortBy ];

        if ( this.sortOrder === 'asc' ) {
          if ( _a < _b ) return -1;
          if ( _a > _b ) return 1;
        }
        if ( this.sortOrder === 'desc' ) {
          if ( _a > _b ) return -1;
          if ( _a < _b ) return 1;
        }
        return 0;
      }
      if ( this.filterAsset ) {
        list = list.filter( p => p.asset === this.filterAsset );
      }
      if ( this.searchToken ) {
        list = list.filter( p => p.token.indexOf( this.searchToken.toUpperCase() ) !== -1 );
      }
      return list.sort( compare );
    }
  },

  // custom mounted
  methods: {

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

    .tokenlist-controls-title {
      display: none;
      @media #{$screenMedium} {
        display: block;
      }
    }
  }

  .tokenlist-list {
    position: relative;
    padding: calc( #{$topbarHeight} + 4.5em ) 0;

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
      .tokenlist-item-trades {
        display: none;
        @media #{$screenMedium} {
          display: block;
        }
      }
    }
  }

  // collapsed mode
  &.collapsed {
    .tokenlist-controls,
    .tokenlist-list {
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
