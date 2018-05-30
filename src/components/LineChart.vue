<template>
  <section class="linechart-wrap">
    <svg :viewBox="svgBox">
      <polyline class="polyline" fill="none" stroke="#f0f0f0" stroke-width="2" stroke-linecap="round" :points="chartPoints" />
    </svg>
  </section>
</template>

<script>
import utils from '../modules/utils';

export default {

  // component props
  props: {
    width: { type: Number, default: 800, required: true },
    height: { type: Number, default: 100, required: true },
    values: { type: Array, default: [], required: true },
  },

  // computed methods
  computed: {

    // svg view box size
    svgBox() {
      return '0 0 '+ this.width +' '+ this.height;
    },

    // build points for SVG polyline
    chartPoints() {
      let data = utils.points( this.width, this.height, this.values );
      let out  = data.map( d => d.x +','+ d.y );
      return out.join( ' ' );
    },
  },
}
</script>

<style lang="scss">
.linechart-wrap {
  display: block;
  position: relative;
}
</style>
