<template>
  <div class="spinner-overlay" :class="{ 'visible': visible, 'failed': failed }" @click.stop="click">
    <div class="spinner-content">
      <div class="spinner-wheel"></div>
      <div class="spinner-messge" v-if="message" v-text="message"></div>
    </div>
  </div>
</template>

<script>
// component
export default {

  // component props
  props: {
    active: { type: Boolean, default: false },
    text: { type: String, default: 'Loading' },
  },

  // component data
  data() {
    return {
      visible: false,
      failed: false,
      message: '',
    }
  },

  // custom methods
  methods: {

    // show the spinner
    show( message ) {
      this.$emit( 'onShow' );
      this.visible = true;
      this.failed  = false;
      this.message = String( message || '' ).trim();
    },

    // show error state spinner
    error( message ) {
      this.$emit( 'onError' );
      this.visible = true;
      this.failed  = true;
      this.message = String( message || '' ).trim();
    },

    // hise the spinner
    hide() {
      this.$emit( 'onHide' );
      this.visible = false;
      this.failed  = false;
      this.message = '';
    },

    // on spinner click
    click( e ) {
      this.$emit( 'onClick', e );
    },

  },

  // check initial state on mount
  mounted() {
    if ( this.active ) {
      this.show( this.text );
    }
  }
}
</script>

<style lang='scss'>

@keyframes showSpinner {
    0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes spinRight {
    0% { transform: rotate( 0deg ); }
  100% { transform: rotate( 359deg ); }
}
@keyframes spinLeft {
    0% { transform: rotate( 359deg ); }
  100% { transform: rotate( 0deg ); }
}

// inner content spinner
.spinner-overlay {
  display: none;
  position: relative;
  overflow: hidden;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;

  // visible state
  &.visible {
    display: flex;
  }

  // full-page fixed spinner with overlay
  &.fixed {
    position: fixed;
    background-color: $colorOverlay;
    z-index: ( $zindexAlerts - 10 );
  }

  // absolute positioned spinner with overlay
  &.abs {
    position: absolute;
    background-color: rgba( black, .2 );
    z-index: auto;
  }

  // rounded edges
  &.rounded {
    border-radius: $lineJoin;
  }

  // main flex centered content
  .spinner-content {
    position: relative;
    animation: showSpinner $fxSpeed $fxEase forwards;

    .spinner-wheel {
      position: relative;
      margin: 0 auto;
      width: 42px;
      height: 42px;
      cursor: pointer;

      &:before, &:after {
        content: '';
        display: block;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        border: 4px solid $colorPrimary;
        border-radius: 100%;
        transition: none;
      }
      &:before {
        box-shadow: $shadowDark;
        border-top-color: transparent;
        opacity: 0.9;
        z-index: 2;
        animation: spinRight 1s linear infinite;
      }
      &:after {
        border-top-color: transparent;
        border-bottom-color: transparent;
        opacity: 0.2;
        z-index: 1;
        animation: spinLeft 1.5s linear infinite;
      }
    }

    .spinner-messge {
      display: block;
      pointer-events: none;
      margin: .4em 0 0 0;
      font-size: 80%;
      line-height: 1em;
      text-transform: uppercase;
      color: #fff;
      opacity: 0.4;
    }
  }

  // failed state
  &.failed {
    .spinner-content .spinner-wheel:before,
    .spinner-content .spinner-wheel:after {
      animation: none;
      border-color: $colorDanger;
    }
  }

}
</style>
