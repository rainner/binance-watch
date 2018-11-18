<template>
  <section :class="modalData.style">

    <!--  coin name and price -->
    <div class="flex-row flex-middle flex-space">

      <div class="text-nowrap push-right">
        <div class="flex-row flex-middle">
          <div class="push-right if-medium">
            <TokenIcon :image="modalData.image" :alt="modalData.token"></TokenIcon>
          </div>
          <div>
            <div class="form-label">{{ modalData.token }} <span v-if="coinRank">#{{ coinRank | toMoney }}</span></div>
            <big class="text-bright">{{ modalData.name }}</big>
          </div>
        </div>
      </div>

      <div class="text-nowrap text-right push-right">
        <div class="form-label">{{ modalData.asset }} Price</div>
        <big class="text-bright">{{ modalData.close | toFixed( modalData.asset ) }}</big>
      </div>

      <div class="text-nowrap text-right push-right">
        <div class="form-label">Chg 24h</div>
        <big class="color">{{ modalData.sign }}{{ modalData.percent | toFixed( 3 ) }}%</big>
      </div>

      <div class="text-nowrap">
        <button class="form-btn bg-primary-hover icon-chart-line iconLeft" @click="tradeLink()">Trade</button>
      </div>

    </div>

    <hr />

    <div class="flex-grid push-bottom">

      <div class="flex-1 well text-nowrap">
        <div class="form-label">High 24h</div>
        <big class="text-bright">{{ modalData.high | toFixed( modalData.asset ) }}</big>
      </div>

      <div class="flex-1 well text-nowrap">
        <div class="form-label">Low 24h</div>
        <big class="text-bright">{{ modalData.low | toFixed( modalData.asset ) }}</big>
      </div>

      <div class="flex-1 well text-nowrap">
        <div class="form-label">{{ modalData.asset }} Vol 24h</div>
        <big class="text-bright">{{ modalData.assetVolume | toMoney }}</big>
      </div>

      <div class="flex-1 well text-nowrap">
        <div class="form-label">{{ modalData.token }} Vol 24h</div>
        <big class="text-bright">{{ modalData.tokenVolume | toMoney }}</big>
      </div>

      <div class="flex-1 well text-nowrap">
        <div class="form-label">Market Cap</div>
        <big class="text-bright">{{ marketCap | toMoney }}</big>
      </div>

      <div class="flex-1 well text-nowrap">
        <div class="form-label">Supply</div>
        <big class="text-bright">{{ totalSupply | toMoney }}</big>
      </div>

      <div class="flex-1 well text-nowrap">
        <div class="form-label">Total Volume</div>
        <big class="text-bright">{{ totalVolume | toMoney }}</big>
      </div>

      <div class="flex-1 well text-nowrap">
        <div class="form-label">USD Value</div>
        <big class="text-bright">${{ usdPrice | toMoney( 3 ) }}</big>
      </div>

    </div>

    <!-- draw line chart for symbol using candle data -->
    <div class="text-nowrap well push-bottom">
      <div class="flex-row flex-middle flex-space">
        <div class="form-label text-clip push-right">7D Graph</div>
        <div class="form-label text-clip push-right">24h Volatility <span class="text-bright">{{ modalData.volatility | toFixed( 1 ) }}%</span></div>
        <div class="form-label text-clip">P&amp;D Danger <span class="text-bright">{{ modalData.danger | toFixed( 1 ) }}%</span></div>
      </div>
      <LineChart :width="chartWidth" :height="chartHeight" :values="chartData"></LineChart>
      <Spinner class="abs rounded" ref="chartSpinner"></Spinner>
    </div>

    <!-- events and alarms -->
    <Tabs class="tokenpage-tabs" :data="{ alarmsCount, newsCount }">
      <section btn-class="icon-alarm iconLeft" :btn-name="[ 'Alarms ('+ alarmsCount +')' ]" active>
        <AlarmsList :alarmsData="alarmsData" :pairData="modalData" @listCount="onAlarmsCount"></AlarmsList>
      </section>
      <section btn-class="icon-calendar iconLeft" :btn-name="[ 'News ('+ newsCount +')' ]">
        <NewsList :newsEntries="newsEntries" :pairData="modalData" @listCount="onNewsCount"></NewsList>
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

// component
export default {

  // component list
  components: { Spinner, Tabs, TokenIcon, LineChart, AlarmsList, NewsList },

  // component props
  props: {
    modalData: { type: Object, default() { return {} }, required: true }, // pair data
    alarmsData: { type: Array, default() { return [] } },
    newsEntries: { type: Array, default() { return [] } },
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

    // lick to binance site with ref id added
    tradeLink() {
      let { token, asset } = this.modalData;
      this.$bus.emit( 'handleClick', 'binance', '/en/trade/'+ token +'_'+ asset +'/', '_blank' );
    },

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
      token = ( token === 'BCC' )  ? 'BCH'   : token;
      token = ( token === 'IOTA' ) ? 'IOT'   : token;
      token = ( token === 'YOYO' ) ? 'YOYOW' : token;

      this.$ajax.get( 'https://coincap.io/page/'+ token, {
        type: 'json',
        cache: 600,
        proxy: false,

        success: ( xhr, status, response ) => {
          if ( !response || !response.id ) return;
          if ( response.rank )         this.coinRank    = response.rank;
          if ( response.market_cap )   this.marketCap   = response.market_cap;
          if ( response.supply )       this.totalSupply = response.supply;
          if ( response.volume )       this.totalVolume = response.volume;
          if ( response.price_usd )    this.usdPrice    = response.price_usd;
        },
        error: ( xhr, status, error ) => {
          this.$bus.emit( 'showNotice', error, 'warning' );
        }
      });
    },

    // fetch last 24h candle data
    fetchChartData() {
      let symbol = this.modalData.symbol;
      let endpoint = 'https://api.binance.com/api/v1/klines?symbol='+ symbol +'&interval=1h&limit=168';
      this.spinner( 'chartSpinner', 'show', 'loading chart data' );

      this.$ajax.get( endpoint, {
        type: 'json',
        cache: 600,

        success: ( xhr, status, response ) => {
          this.spinner( 'chartSpinner', 'hide' );
          this.chartData = [];
          for ( let i = 0; i < response.length; ++i ) {
            this.chartData.push( parseFloat( response[ i ][ 4 ] ) ); // close price
          }
        },
        error: ( xhr, status, error ) => {
          this.spinner( 'chartSpinner', 'error', 'No chart for '+ symbol );
          this.$bus.emit( 'showNotice', error, 'warning' );
        }
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

