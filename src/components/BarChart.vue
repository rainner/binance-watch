<template>
  <section class="barchart-wrap" :style="{ 'min-height': height +'px' }">
    <div class="barchart-heading" v-if="heading">{{ heading }}</div>
    <div class="barchart-lines"><hr /><hr /><hr /></div>
    <div class="barchart-graph">
      <div class="barchart-column clickable" v-for="d in chartData" :key="d.label" @click="$emit( 'click', d )">
        <div class="barchart-value">{{ d.value }}</div>
        <div class="barchart-bar"><div :class="d.clss" :style="{ height: d.size +'px' }"></div></div>
        <div class="barchart-label">{{ d.label }}</div>
      </div>
    </div>
  </section>
</template>

<script>
export default {

  // component props
  props: {
    // data: [ {label, value}, ... ]
    data: { type: Array, default: [], required: true },
    heading: { type: String, default: '' },
    height: { type: Number, default: 90 },
  },

  // computed methods
  computed: {

    // build new chart data
    chartData() {
      let list = [];
      let values = [];

      this.data.forEach( d => values.push( parseFloat( d.value ) || 0 ) );
      let min = values.reduce( ( min, val ) => val < min ? val : min, values[ 0 ] );
      let max = values.reduce( ( max, val ) => val > max ? val : max, values[ 0 ] );

      for ( let i = 0; i < values.length; ++i ) {
        let data    = this.data[ i ];
        let num     = values[ i ];
        let ratio   = ( max > 0 ) ? ( num / max ) : 0.1;
        let size    = Math.floor( ratio * this.height );
        let percent = Math.floor( ratio * 100 );
        let clss    = 'bg-grey';
        if ( percent > 20 ) { clss = 'bg-bright'; }
        if ( percent > 40 ) { clss = 'bg-secondary'; }
        if ( percent > 60 ) { clss = 'bg-primary'; }
        list.push( Object.assign( data, { size, percent, clss } ) );
      }
      return list;
    }
  },
}
</script>

<style lang="scss">
.barchart-wrap {
  position: relative;

  .barchart-heading {
    position: absolute;
    width: 100%;
    left: 0;
    top: 0;
    text-align: center;
    font-size: 70%;
    line-height: 1em;
    opacity: 0.5;
    z-index: 2;
  }

  .barchart-lines {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 1;

    & > hr {
      display: block;
      flex: 1;
      width: 100%;
      height: 0;
      border: 0;
      border-top: 1px dashed rgba( #fff, 0.1 );
    }
  }

  .barchart-graph {
    display: flex;
    position: relative;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-around;
    z-index: 3;

    .barchart-column {
      position: relative;
      text-align: center;

      .barchart-bar {
        & > div {
          margin: auto auto 0 auto;
          width: 4px;
          background-color: $colorSecondary;
          border-radius: $lineJoin;
        }
      }
      .barchart-value,
      .barchart-label {
        display: block;
        font-size: 70%;
        line-height: 1em;
      }
      .barchart-value {
        padding-bottom: .5em;
      }
      .barchart-label {
        padding-top: .5em;
      }

      &:hover {
        .barchart-value,
        .barchart-label {
          color: $colorBright;
        }
      }
    }
  }
}
</style>
