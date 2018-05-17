<template>
  <div class="tokenicon-wrap">
    <img class="tokenicon-image" @error="imageError" :src="imgfile" :alt="data.token" />
  </div>
</template>

<script>
// component
export default {

  // component props
  props: {
    data: { type: Object, default: {}, required: true },
  },

  // component data
  data() {
    return {
      imgfile: '',
      giveup: false,
    }
  },

  // custom mounted
  methods: {

    // handler for token images that don't exist
    imageError( e ) {
      // try a default token image file
      if ( !this.giveup ) {
        this.imgfile = 'public/images/icons/default_.png';
        this.giveup = true;
        return;
      }
      // no luck with images, try css styles
      e.target.classList.add( 'default' );
      this.imgfile = '';
    },
  },

  // component mounted
  mounted() {
    this.imgfile = this.data.icon || '';
  },
}
</script>

<style lang="scss">
// comp wrapper
.tokenicon-wrap {
  display: block;
  position: relative;
  width: $iconSize;
  min-height: $iconSize;

  .tokenicon-image {
    display: block;
    position: relative;
    width: $iconSize;
    height: auto;

    &.default {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow: hidden;
      color: $colorInfoText;
      background-color: $colorInfo;
      border-radius: 100%;
      height: $iconSize;
      line-height: $iconSize;
      letter-spacing: -1px;
      transform: rotate( -25deg );
    }
  }
}
</style>
