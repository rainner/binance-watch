<template>
  <section class="linechart-wrap">
    <Spinner ref="spinner"></Spinner>
    <div class="linechart-canvas" :class="{ 'visible': ready }">
      <canvas ref="canvas"></canvas>
    </div>
  </section>
</template>

<script>
// components/modules
import Spinner from './Spinner.vue';

export default {

  // component list
  components: { Spinner },

  // component props
  props: {
    symbol: { type: String, required: true },
    interval: { type: String, default: '1h', required: false },
    limit: { type: Number, default: 168, required: false },
  },

  // comonent data
  data() {
    return {
      width: 800,
      height: 100,
      ready: false,
    }
  },

  // custom mounted
  methods: {

    // spinner helper
    spinner( method, message ) {
      if ( !this.$refs.spinner || !method ) return;
      this.$refs.spinner[ method ]( message );
    },

    // fetch last 24h candle data
    fetchCandles() {
      const endpoint = 'https://api.binance.com/api/v1/klines?symbol='+ this.symbol +'&interval='+ this.interval +'&limit='+ this.limit;

      this.spinner( 'show', 'loading chart data' );
      this.$ajax.get( endpoint, {
        type: 'json',
        cache: 3600,

        error: ( xhr, status, error ) => {
          this.$bus.emit( 'showNotice', error, 'warning' );
          this.spinner( 'error', 'error fetching chart data' );
        },

        success: ( xhr, status, response ) => {
          if ( !Array.isArray( response ) ) return this.spinner( 'error', 'No chart for '+ this.symbol );
          this.spinner( 'hide' );

          let data = [];
          for ( let i = 0; i < response.length; ++i ) {
            data.push( parseFloat( response[ i ][ 4 ] ) ); // close price
          }
          this.makeCanvas( data );
        },
      });
    },

    // process data and draw basic line chart
    makeCanvas( data ) {
      let canvas = this.$refs.canvas;
      let context = canvas.getContext( '2d' );
      let min = data.reduce( ( min, val ) => val < min ? val : min, data[ 0 ] );
      let max = data.reduce( ( max, val ) => val > max ? val : max, data[ 0 ] );
      let len = data.length;
      let range = max - min;
      let gap = this.width / ( len - 1 );
      let start = data[ 0 ];
      let end = data[ data.length - 1 ];

      canvas.width = this.width;
      canvas.height = this.height;

      context.clearRect( 0, 0, this.width, this.height );
      context.beginPath();
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.strokeStyle = '#f0b90b';

      for ( let i = 0; i < data.length; ++i ) {
        let d = data[ i ];
        let val = 2 * ( ( d - min ) / range - 0.5 );
        let x = i * gap;
        let y = -val * this.height / 2 * 0.9 + this.height / 2;
        if ( i === 0 ) { context.moveTo( x, y ); }
        else { context.lineTo( x, y ); }
      }
      context.stroke();
      context.closePath();
      this.ready = true;
    },

  },

  // comonent mounted
  mounted() {
    this.fetchCandles();
  },

}
</script>

<style lang="scss">
// comp wrapper
.linechart-wrap {
  display: block;
  position: relative;

  .linechart-canvas {
    display: block;
    position: relative;
    overflow: hidden;
    max-height: 0;

    &.visible {
      max-height: 200px;
    }
    & > canvas {
      display: block;
      width: 100%;
      height: auto;
      margin: 0 auto;
    }
  }
}
</style>
