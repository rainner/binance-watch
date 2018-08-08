<template>
  <section class="tokenpage-wrap" :class="{ 'gain': ( modalData.percent > 0 ), 'loss': ( modalData.percent < 0 ) }">

    <!--  coin name and price -->
    <div class="tokenpage-header flex-grid">
      <div class="flex-grid-item flex-1">
        <div class="flex-row flex-middle">
          <TokenIcon class="push-right" :pairData="modalData"></TokenIcon>
          <h1 class="tokenpage-name text-bright">{{ modalData.name }}</h1>
          <div class="pad-left" v-if="coinRank">
            <span class="text-label text-clip">Rank</span> <br />
            <big class="text-secondary">#{{ coinRank | toCommas }}</big>
          </div>
        </div>
      </div>
      <div class="flex-grid-item">
        <div class="flex-row flex-middle">
          <div class="text-clip push-right">
            <span class="text-label text-clip">Price</span> <br />
            <big class="text-bright">{{ modalData.close | toSats }}</big>
          </div>
          <div class="text-clip">
            <span class="text-label text-clip">Open 24h</span> <br />
            <big class="text-default">{{ modalData.open | toSats }}</big>
          </div>
        </div>
      </div>
    </div>

    <hr />

    <!-- change and volume data  -->
    <div class="tokenpage-change flex-row flex-middle flex-space">
      <div class="text-clip push-right">
        <span class="text-label text-clip">Change 24h</span> <br />
        <big class="color">{{ modalData.sign }}{{ modalData.change | toSats }}</big>
      </div>
      <div class="text-clip">
        <span class="text-label text-clip">Percent 24h</span> <br />
        <big class="text-clip color">{{ modalData.sign }}{{ modalData.percent | toCents }}%</big>
        <big class="text-grey">{{ modalData.arrow }}</big>
      </div>
      <div class="text-clip">
        <span class="text-label text-clip">{{ modalData.asset }} Vol. 24h</span> <br />
        <big class="text-primary">{{ modalData.assetVolume | toCommas }}</big>
      </div>
      <div class="text-clip">
        <span class="text-label text-clip">{{ modalData.token }} Vol. 24h</span> <br />
        <big class="text-primary">{{ modalData.tokenVolume | toCommas }}</big>
      </div>
    </div>

    <hr />

    <!-- global token data from api -->
    <div class="tokenpage-global">
      <Spinner ref="globalSpinner"></Spinner>
      <div class="tokenpage-change flex-row flex-middle flex-space" v-if="coinRank">
        <div class="text-clip">
          <span class="text-label text-clip">Market Cap</span> <br />
          <big class="text-primary">{{ marketCap | toCommas }}</big>
        </div>
        <div class="text-clip">
          <span class="text-label text-clip">Supply</span> <br />
          <big class="text-primary">{{ totalSupply | toCommas }}</big>
        </div>
        <div class="text-clip">
          <span class="text-label text-clip">Total Volume</span> <br />
          <big class="text-bright">{{ totalVolume | toCommas }}</big>
        </div>
        <div class="text-clip">
          <span class="text-label text-clip">USD Value</span> <br />
          <big class="text-bright">${{ usdPrice | toCents }}</big>
        </div>
      </div>
    </div>

    <hr />

    <!-- draw line chart for symbol using candle data -->
    <div class="tokenpage-chart">
      <div class="text-label text-clip">Price Graph (7d)</div>
      <Spinner ref="chartSpinner"></Spinner>
      <LineChart :width="chartWidth" :height="chartHeight" :values="chartData" v-if="chartData.length"></LineChart>
    </div>

    <hr />

    <!-- events and alarms -->
    <Tabs class="tokenpage-tabs pad-top push-bottom" :data="{ alarmsCount, newsCount }">
      <section btn-class="icon-alarm iconLeft" :btn-name="[ 'Alarms ('+ alarmsCount +')' ]" active>
        <AlarmsList :alarmsData="alarmsData" :pairData="modalData" @listCount="onAlarmsCount"></AlarmsList>
      </section>
      <section btn-class="icon-calendar iconLeft" :btn-name="[ 'News ('+ newsCount +')' ]">
        <NewsList :newsData="newsData" :pairData="modalData" @listCount="onNewsCount"></NewsList>
      </section>
    </Tabs>

  </section>
</template>

<script>
import Spinner from './Spinner.vue';
import Tabs from './Tabs.vue';
import TokenIcon from './TokenIcon.vue';
import LineChart from './LineChart.vue';
import AlarmsList from './AlarmsList.vue';
import NewsList from './NewsList.vue';
import utils from '../modules/utils';

// component
export default {

  // component list
  components: { Spinner, Tabs, TokenIcon, LineChart, AlarmsList, NewsList },

  // component props
  props: {
    modalData: { type: Object, default: {}, required: true }, // pair data
    alarmsData: { type: Object, default() { return {} } },
    newsData: { type: Object, default() { return {} } },
  },

  // comonent data
  data() {
    return {
      coinRank: 0,
      marketCap: 0,
      totalSupply: 0,
      totalVolume: 0,
      curPrice: this.modalData.close,
      usdPrice: 0,
      alarmsCount: 0,
      newsCount: 0,
      // line chart
      chartWidth: 800,
      chartHeight: 120,
      chartData: [],
    }
  },

  // watch methods
  watch: {

    // update title as token data changes
    modalData: function() {
      let p = this.modalData;
      this.$bus.emit( 'setTitle', p.pair +' '+ p.arrow +' '+ p.sign + p.percent );
    }
  },

  // component methods
  methods: {

    // update alarms count for this token
    onAlarmsCount( count ) {
      this.alarmsCount = count;
    },

    // update events count for this token
    onNewsCount( count ) {
      this.newsCount = count;
    },

    // spinner helper
    spinner( name, method, message ) {
      if ( !this.$refs[ name ] || !method ) return;
      this.$refs[ name ][ method ]( message );
    },

    // fetch token data from api
    fetchGlobalData() {
      let token = this.modalData.token;
      token = ( token === 'BCC' ) ? 'BCH' : token;
      token = ( token === 'IOTA' ) ? 'IOT' : token;

      let endpoint = 'https://coincap.io/page/'+ token;

      this.spinner( 'globalSpinner', 'show', 'loading market data' );
      this.$ajax.get( endpoint, {
        type: 'json',
        cache: 3600,
        proxy: false,

        error: ( xhr, status, error ) => {
          this.$bus.emit( 'showNotice', error, 'warning' );
          this.spinner( 'globalSpinner', 'error', 'error fetching market data' );
        },

        success: ( xhr, status, response ) => {
          if ( !response || !response.id ) return this.spinner( 'globalSpinner', 'error', 'No data for '+ token );
          this.spinner( 'globalSpinner', 'hide' );

          if ( response.rank )         this.coinRank    = response.rank;
          if ( response.market_cap )   this.marketCap   = response.market_cap;
          if ( response.supply )       this.totalSupply = response.supply;
          if ( response.volume )       this.totalVolume = response.volume;
          if ( response.price_usd )    this.usdPrice    = response.price_usd;
        },
      });
    },

    // fetch last 24h candle data
    fetchChartData() {
      let symbol = this.modalData.symbol;
      let endpoint = 'https://api.binance.com/api/v1/klines?symbol='+ symbol +'&interval=1h&limit=168';

      this.spinner( 'chartSpinner', 'show', 'loading chart data' );
      this.$ajax.get( endpoint, {
        type: 'json',
        cache: 3600,

        error: ( xhr, status, error ) => {
          this.$bus.emit( 'showNotice', error, 'warning' );
          this.spinner( 'chartSpinner', 'error', 'error fetching chart data' );
        },

        success: ( xhr, status, response ) => {
          if ( !Array.isArray( response ) ) return this.spinner( 'chartSpinner', 'error', 'No chart for '+ symbol );
          this.spinner( 'chartSpinner', 'hide' );

          this.chartData = [];
          for ( let i = 0; i < response.length; ++i ) {
            this.chartData.push( parseFloat( response[ i ][ 4 ] ) ); // close price
          }
        },
      });
    },
  },

  // component mounted
  mounted() {
    this.fetchGlobalData();
    this.fetchChartData();
  },
}
</script>

<style lang="scss">
// symbol wrap
.tokenpage-wrap {
  position: relative;

  // change colors
  &.gain .color { color: $colorGain; }
  &.loss .color { color: $colorLoss; }

  .tokenpage-header {

    .tokenpage-name {
      font-size: 200%;
      line-height: 1.2em;
    }
  }

  .tokenpage-chart {
    .polyline { stroke: $colorPrimary; }
    .circle { fill: lighten( $colorPrimary, 12% ); }
  }
}
</style>
