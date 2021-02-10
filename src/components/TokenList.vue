<template>
  <main class="page-wrap" :class="{ 'collapsed': header.collapsed, 'opaque': header.opaque }">

    <!-- fixed list search/sorting controls -->
    <section class="page-topbar">
      <div class="container">
        <div class="flex-row flex-middle flex-space">

          <!-- control search -->
          <Search class="light push-right" v-model="searchStr"></Search>

          <!-- control heading -->
          <div class="flex-1 text-clip text-big text-center push-right if-medium">24h Change</div>

          <!-- control dropdown menus -->
          <div class="text-nowrap">

            <Dropdown>
              <button slot="trigger" class="form-btn bg-info-hover icon-down-open">{{ limitCountLabel }}</button>
              <ul slot="list">
                <li class="heading">
                  <span class="form-label">List Limit Options</span>
                </li>
                <li class="clickable" :class="{ 'active': activeLimit( 10 ) }" @click="limitList( 10 )">
                  <i class="icon-list-add iconLeft"></i> 10 tokens
                </li>
                <li class="clickable" :class="{ 'active': activeLimit( 20 ) }"  @click="limitList( 20 )">
                  <i class="icon-list-add iconLeft"></i> 20 tokens
                </li>
                <li class="clickable" :class="{ 'active': activeLimit( 50 ) }"  @click="limitList( 50 )">
                  <i class="icon-list-add iconLeft"></i> 50 tokens
                </li>
                <li class="clickable" :class="{ 'active': activeLimit( 100 ) }"  @click="limitList( 100 )">
                  <i class="icon-list-add iconLeft"></i> 100 tokens
                </li>
                <li class="clickable" :class="{ 'active': activeLimit( 0 ) }"  @click="limitList( 0 )">
                  <i class="icon-list-add iconLeft"></i> All tokens
                </li>
              </ul>
            </Dropdown>&nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-info-hover iconLeft">
                <i :class="$sorter.getStyles( 'ticker' )"></i> {{ sortByLabel }}
              </button>
              <ul slot="list">
                <li class="heading">
                  <span class="form-label">List Sorting Options</span>
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'token' ) }" @click="$sorter.sortOrder( 'ticker', 'token', 'asc' )">
                  <i class="icon-bitcoin iconLeft"></i> Token
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'percent' ) }" @click="$sorter.sortOrder( 'ticker', 'percent', 'desc' )">
                  <i class="icon-percent iconLeft"></i> Percent
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'close' ) }" @click="$sorter.sortOrder( 'ticker', 'close', 'desc' )">
                  <i class="icon-chart-line iconLeft"></i> Price
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'volatility' ) }" @click="$sorter.sortOrder( 'ticker', 'volatility', 'desc' )">
                  <i class="icon-chart-line iconLeft"></i> Volatility
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'danger' ) }" @click="$sorter.sortOrder( 'ticker', 'danger', 'desc' )">
                  <i class="icon-alert iconLeft"></i> Danger
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'change' ) }" @click="$sorter.sortOrder( 'ticker', 'change', 'desc' )">
                  <i class="icon-clock iconLeft"></i> Change
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'marketVolume' ) }" @click="$sorter.sortOrder( 'ticker', 'marketVolume', 'desc' )">
                  <i class="icon-chart-area iconLeft"></i> Volume
                </li>
                <li class="clickable" :class="{ 'active': activeSort( 'trades' ) }" @click="$sorter.sortOrder( 'ticker', 'trades', 'desc' )">
                  <i class="icon-reload iconLeft"></i> Trades
                </li>
              </ul>
            </Dropdown>&nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-star iconLeft" v-text="options.prices.market"></button>
              <div slot="list">
                <div class="pad-h push-bottom">
                  <span class="form-label">Filter by Market</span>
                </div>
                <div class="tablelist-wrap">
                  <div class="tablelist-content">
                    <div class="tablelist-row flex-row flex-middle flex-stretch clickable" v-for="m of marketsData" :key="m.token" :class="{ 'active': activeMarket( m.token ) }" @click="toggleMarket( m.token )">
                      <div class="flex-1"><i class="icon-star iconLeft"></i> {{ m.token }}</div>
                      <div class="pad-left">{{ m.count }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Dropdown>&nbsp;

            <Dropdown>
              <button slot="trigger" class="form-btn bg-primary-hover icon-config"></button>
              <div slot="list" class="pad-h">
                <div class="form-label push-bottom push-small">Live Price Options</div>
                <Toggle :text="'Show top coins price in header'" v-model="options.prices.header" @change="saveOptions"></Toggle>
                <Toggle :text="'Show price chart for in list'" v-model="options.prices.chart" @change="saveOptions"></Toggle>
              </div>
            </Dropdown>

          </div>

        </div>
      </div>
    </section>

    <!-- empty list message -->
    <section class="push-bottom" v-if="!listCount">
      <div class="container">
        <div class="card pad-all flex-row flex-middle flex-stretch">
          <div class="icon-help iconLarge push-right"></div>
          <div class="text-clip flex-1">
            <div v-if="searchStr">
              <span class="text-bright">No match for <span class="text-secondary">{{ searchStr }}</span></span> <br />
              <span class="text-info">Can't find anything matching your search input.</span>
            </div>
            <div v-else>
              <span class="text-bright">No price data available</span> <br />
              <span class="text-info">Price data from remote API has not loaded yet.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- live ticker price list -->
    <section class="pagelist-wrap">
      <div class="container">

        <div class="pagelist-item flex-row flex-middle flex-stretch" v-if="tickerList.length">
          <div class="iconWidth push-right if-small"></div>
          <div class="push-right text-clip flex-1"><span class="clickable" @click="$sorter.sortOrder( 'ticker', 'token', 'asc' )">Token</span></div>
          <div class="push-right text-clip flex-1"><span class="clickable" @click="$sorter.sortOrder( 'ticker', 'close', 'desc' )">Price</span></div>
          <div class="well push-right flex-1 if-medium disabled" v-if="options.prices.chart"></div>
          <div class="push-right text-clip flex-1"><span class="clickable" @click="$sorter.sortOrder( 'ticker', 'percent', 'desc' )">Percent</span></div>
          <div class="push-right text-clip flex-1"><span class="clickable" @click="$sorter.sortOrder( 'ticker', 'marketVolume', 'desc' )">Volume</span></div>
          <div class="text-right text-clip flex-1 if-large"><span class="clickable" @click="$sorter.sortOrder( 'ticker', 'trades', 'desc' )">Book</span></div>
        </div>

        <div v-for="p in tickerList" class="pagelist-item flex-row flex-middle flex-stretch clickable" :class="p.style" @click.stop="setRoute( p.route )" :key="p.symbol">

          <div class="push-right if-small" :class="{ 'alarm-bubble': p.alarms }">
            <TokenIcon :image="p.image" :alt="p.token"></TokenIcon>
          </div>

          <div class="push-right text-clip flex-1">
            <big class="text-primary">{{ p.token }}</big> <br />
            <span class="text-secondary">{{ p.name }}</span>
          </div>

          <div class="push-right text-clip flex-1">
            <big class="text-nowrap text-bright">{{ p.close | toFixed( p.market ) }} <span class="text-info">{{ p.market }}</span></big> <br />
            <span class="text-nowrap color">{{ p.sign }}{{ p.change | toFixed( p.market ) }} <span class="text-info">24H</span></span>
          </div>

          <div class="well push-right flex-1 if-medium" v-if="options.prices.chart">
            <LineChart :width="200" :height="28" :values="p.history"></LineChart>
          </div>

          <div class="push-right text-clip flex-1">
            <big class="text-nowrap color">{{ p.sign }}{{ p.percent | toMoney( 3 ) }}%</big> <br />
            <span class="icon-chart-line iconLeft" title="High/Low Volatility Score" v-tooltip>{{ p.volatility | toFixed( 3 ) }}</span>
          </div>

          <div class="push-right text-clip flex-1">
            <big class="text-nowrap text-bright">{{ p.marketVolume | toMoney }} <span class="text-nowrap text-info">{{ p.market }}</span></big> <br />
            <span class="text-nowrap text-default">{{ p.tokenVolume | toMoney }} <span class="text-nowrap text-info">{{ p.token }}</span></span>
          </div>

          <div class="text-right text-clip flex-1 if-large">
            <big class="text-nowrap text-bright">{{ p.trades | toMoney }}</big> <br />
            <button class="text-primary-hover" @click.stop="tradeLink( p.token, p.market )" :title="'Trade '+ p.token" v-tooltip>Trades</button>
          </div>

        </div>

        <!-- if there are more items not included in list due to limit option -->
        <div class="pagelist-item flex-row flex-middle flex-space" v-if="listCount">
          <div class="text-info icon-list iconLeft">{{ listLeftText }}</div>
          <button v-if="listLeft" class="text-bright-hover icon-list-add iconLeft" @click="limitList( 0 )">Show all</button>
        </div>

      </div>
    </section>

    <!-- list spinner -->
    <Spinner class="fixed" ref="spinner"></Spinner>

  </main>
</template>

<script>
import Spinner from './Spinner.vue';
import Search from './Search.vue';
import TokenIcon from './TokenIcon.vue';
import Dropdown from './Dropdown.vue';
import Toggle from './Toggle.vue';
import LineChart from './LineChart.vue';

// component
export default {

  // component list
  components: { Spinner, Search, TokenIcon, Dropdown, Toggle, LineChart },

  // component props
  props: {
    header: { type: Object, default() { return {} } },
    options: { type: Object, default() { return {} }, required: true },
    sortData: { type: Object, default() { return {} }, required: true },
    priceData: { type: Array, default() { return [] }, required: true },
    marketsData: { type: Object, default() { return {} }, required: true },
    tickerStatus: { type: Number, default: 0 },
  },

  // comonent data
  data() {
    return {
      searchStr: '',
      listCount: 0,
      listLeft: 0,
    }
  },

  // watch methods
  watch: {

    priceData() {
      this.updateSpinner();
    },
    tickerStatus() {
      this.updateSpinner();
    },
  },

  // computed methods
  computed: {

    // get filtered and sorted ticker list for display
    tickerList() {
      let { market } = this.options.prices;
      let { column, order } = this.sortData.ticker;

      let limit = parseInt( this.options.prices.limit ) | 0;
      let regex = ( this.searchStr.length > 1 ) ? new RegExp( '^('+ this.searchStr +')', 'i' ) : null;
      let count = this.priceData.length;
      let list  = [];

      // filter the list
      while ( count-- ) {
        let p = this.priceData[ count ];
        if ( market && p.market !== market ) continue;
        if ( regex && !( regex.test( p.token ) || regex.test( p.name ) ) ) continue;
        list.push( p );
      }
      // sort the list
      list = this.$utils.sort( list, column, order );

      // update paging totals
      let total = list.length;
      this.listCount = total;
      this.listLeft = 0;

      // trim the list
      if ( total && limit && limit < total ) {
        list = list.slice( 0, limit );
        this.listLeft = ( total - list.length );
      }
      return list;
    },

    // sort-by label for buttons, etc
    sortByLabel() {
      let { column } = this.sortData.ticker;
      switch ( column ) {
        case 'token'        :  return 'Token';
        case 'percent'      :  return 'Percent';
        case 'close'        :  return 'Price';
        case 'volatility'   :  return 'Volatility';
        case 'danger'       :  return 'Danger';
        case 'change'       :  return 'Change';
        case 'marketVolume' :  return 'Volume';
        case 'tokenVolume'  :  return 'Volume';
        case 'trades'       :  return 'Trades';
        default             :  return 'Default';
      }
    },

    // text to show in limit filter controls
    limitCountLabel() {
      let limit = parseInt( this.options.prices.limit ) | 0;
      if ( limit && limit < this.listCount ) return limit +'/'+ this.listCount;
      return 'All '+ this.listCount;
    },

    // text about hidden list pair
    listLeftText() {
      let total  = this.listCount;
      let remain = this.listLeft;
      let market = this.options.prices.market;
      let limit  = this.options.prices.limit;
      let count  = this.$utils.noun( total, market +' token pair', market +' token pairs' );
      if ( remain ) return 'Showing '+ limit +' of '+ count;
      return 'Showing all '+ count;
    },
  },

  // custom mounted
  methods: {

    // check if key is active sort option
    activeSort( column ) {
      return ( this.sortData.ticker.column === column );
    },

    // check if num is active list limit option
    activeLimit( limit ) {
      return ( this.options.prices.limit === limit );
    },

    // check if market is active selected market
    activeMarket( market ) {
      return ( this.options.prices.market === market );
    },

    // apply options
    saveOptions() {
      this.$opts.saveOptions( this.options );
    },

    // set app url route
    setRoute( route ) {
      this.$router.setRoute( route );
    },

    // lick to binance site with ref id added
    tradeLink( token, market ) {
      this.$bus.emit( 'handleClick', 'binance', '/en/trade/'+ token +'_'+ market +'/', '_blank' );
    },

    // set list limit value
    limitList( num ) {
      this.options.prices.limit = parseInt( num ) | 0;
      this.saveOptions();
    },

    // filter by asset
    toggleMarket( market ) {
      this.options.prices.market = String( market || 'USDT' );
      this.saveOptions();
    },

    // update page spinner
    updateSpinner() {
      if ( !this.$refs.spinner ) return;
      if ( this.tickerList.length ) return this.$refs.spinner.hide();
      if ( this.tickerStatus === 0 ) return this.$refs.spinner.error( 'Socket API not connected' );
      if ( this.tickerStatus === 1 ) return this.$refs.spinner.show( 'Waiting for price data' );
    },
  },

  // on component mounted
  mounted() {
    this.updateSpinner();
  }
}
</script>

<style lang="scss">
.pagelist-item-chart {
  padding: .5em;
  background-image: radial-gradient( ellipse at top right, rgba( #000, 0.2 ) 0%, rgba( #000, 0 ) 100% );
  border-radius: $lineJoin;
}
</style>
