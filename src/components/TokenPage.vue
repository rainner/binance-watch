<template>
  <section class="tokenpage-wrap" :class="{ 'gain': ( data.percent > 0 ), 'loss': ( data.percent < 0 ) }">

    <!--  coin name and price -->
    <div class="tokenpage-header flex-grid">
      <div class="flex-grid-item flex-1">
        <div class="flex-row flex-middle">
          <TokenIcon class="push-right" :data="data"></TokenIcon>
          <h1 class="tokenpage-name text-bright">{{ coinName }}</h1>
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
            <big class="text-bright">{{ data.close | toSats }}</big>
          </div>
          <div class="text-clip">
            <span class="text-label text-clip">Open 24h</span> <br />
            <big class="text-default">{{ data.open | toSats }}</big>
          </div>
        </div>
      </div>
    </div>

    <hr />

    <!-- change and volume data  -->
    <div class="tokenpage-change flex-row flex-middle flex-space">
      <div class="text-clip push-right">
        <span class="text-label text-clip">Change 24h</span> <br />
        <big class="color">{{ data.sign }}{{ data.change | toSats }}</big>
      </div>
      <div class="text-clip">
        <span class="text-label text-clip">Percent 24h</span> <br />
        <big class="text-clip color">{{ data.sign }}{{ data.percent | toCents }}%</big>
        <big class="text-grey">{{ data.arrow }}</big>
      </div>
      <div class="text-clip">
        <span class="text-label text-clip">{{ data.asset }} Vol. 24h</span> <br />
        <big class="text-primary">{{ data.assetVolume | toCommas }}</big>
      </div>
      <div class="text-clip">
        <span class="text-label text-clip">{{ data.token }} Vol. 24h</span> <br />
        <big class="text-primary">{{ data.tokenVolume | toCommas }}</big>
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
      <LineChart :symbol="data.symbol"></LineChart>
    </div>

    <hr />

    <!-- events and alarms -->
    <Tabs class="tokenpage-tabs pad-top push-bottom" :data="{ alarmsCount, eventsCount }">

      <!-- alarms tab -->
      <section btn-class="icon-alarm iconLeft" :btn-name="[ 'Price Alarms ('+ alarmsCount +')' ]" active>
        <AlarmsList :alarms="alarms" :data="data" @listCount="onAlarmsCount"></AlarmsList>
      </section>

      <!-- events tab -->
      <section btn-class="icon-calendar iconLeft" :btn-name="[ 'Upcoming Events ('+ eventsCount +')' ]">
        <EventsList :events="events" :data="data" @listCount="onEventsCount"></EventsList>
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
import EventsList from './EventsList.vue';

// component
export default {

  // component list
  components: { Spinner, Tabs, TokenIcon, LineChart, AlarmsList, EventsList },

  // component props
  props: {
    data: { type: Object, default: {}, required: true },
    alarms: { type: Object, default: {}, required: false },
    events: { type: Object, default() { return {} } },
    news: { type: Object, default() { return {} } },
  },

  // comonent data
  data() {
    return {
      ready: true,
      coinRank: 0,
      coinName: this.data.token,
      marketCap: 0,
      totalSupply: 0,
      totalVolume: 0,
      curPrice: this.data.close,
      usdPrice: 0,
      alarmsCount: 0,
      eventsCount: 0,
    }
  },

  // component methods
  methods: {

    // update alarms count for this token
    onAlarmsCount( count ) {
      this.alarmsCount = count;
    },

    // update events count for this token
    onEventsCount( count ) {
      this.eventsCount = count;
    },

    // spinner helper
    spinner( method, message ) {
      if ( !this.$refs.globalSpinner || !method ) return;
      this.$refs.globalSpinner[ method ]( message );
    },

    // fetch token data from api
    fetchGlobalData() {
      const endpoint = 'http://coincap.io/page/'+ this.data.token;

      this.spinner( 'show', 'loading market data' );
      this.$ajax.get( endpoint, {
        type: 'json',
        proxy: '',
        cache: 3600,

        error: ( xhr, status, error ) => {
          this.$bus.emit( 'showNotice', error, 'warning' );
          this.spinner( 'error', 'error fetching market data' );
        },

        success: ( xhr, status, response ) => {
          if ( !response || !response.id ) return this.spinner( 'error', 'No data for '+ this.data.token );
          this.spinner( 'hide' );

          if ( response.rank )         this.coinRank    = response.rank;
          if ( response.display_name ) this.coinName    = response.display_name;
          if ( response.market_cap )   this.marketCap   = response.market_cap;
          if ( response.supply )       this.totalSupply = response.supply;
          if ( response.volume )       this.totalVolume = response.volume;
          if ( response.price_usd )    this.usdPrice    = response.price_usd;
        },
      });
    },
  },

  // component mounted
  mounted() {
    this.fetchGlobalData();
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
}
</style>
