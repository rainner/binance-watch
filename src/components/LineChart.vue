<template>
  <section :class="{ 'transparent': !values.length }">
    <svg :viewBox="svgBox" xmlns="http://www.w3.org/2000/svg">
      <polyline class="polyline" fill="none" stroke="#f0f0f0" stroke-width="2" stroke-linecap="round" :points="chartPoints" />
      <circle class="circle" :cx="cx" :cy="cy" r="3" fill="#f0f0f0" stroke="none" />
    </svg>
  </section>
</template>

<script>
// component
export default {

  // component props
  props: {
    width: { type: Number, default: 800, required: true },
    height: { type: Number, default: 100, required: true },
    values: { type: Array, default: [], required: true },
  },

  // data
  data() {
    return {
      cx: 0,
      cy: 0,
    }
  },

  // computed methods
  computed: {

    // svg view box size
    svgBox() {
      return '0 0 '+ this.width +' '+ this.height;
    },

    // build points for SVG polyline
    chartPoints() {
      let data = this.$utils.points( this.width, this.height, this.values );
      let last = data.length ? data[ data.length - 1 ] : { x: 0, y: 0 };
      let list = data.map( d => ( d.x - 8 ) +','+ d.y );
      this.cx  = last.x - 3;
      this.cy  = last.y;
      return list.join( ' ' );
    },
  },
}
</script>
