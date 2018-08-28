<template>
  <div class="tokenicon-wrap">
    <img class="tokenicon-image" @error="imageError" :src="image" :alt="alt" />
  </div>
</template>

<script>
// component
export default {

  // component props
  props: {
    image: { type: String, default: '', required: true },
    alt: { type: String, default: 'ICON' },
  },

  // custom mounted
  methods: {

    // handler for token images that don't exist
    imageError( e ) {
      e.target.classList.add( 'default' );
    },
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
    overflow: hidden;
    text-align: center;
    width: $iconSize;
    height: auto;

    &.default {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
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
