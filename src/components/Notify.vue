<template>
  <section class="notify-wrap">
    <div v-for="a in alerts" class="notify-alert" :class="[ 'notify-' + a.type, { 'notify-closed': a.closed } ]" :key="a.id">
      <span class="notify-message">{{ a.message }}</span>
      <button class="notify-close icon-close" @click.stop="close( a.id )"></button>
    </div>
  </section>
</template>

<script>
// component
export default {

  // component data
  data() {
    return {
      alerts: [],
    }
  },

  // custom methods
  methods: {

    // show new alert, types: (success, error, warning, info)
    show( message, type, timeout ) {
      message    = String( message || 'No message available.' );
      type       = String( type || 'info' );
      timeout    = Number( ( !timeout && type !== 'error' ) ? 5000 : timeout ) || 0;

      let id     = this.$utils.randString( 20 );
      let sto    = timeout ? setTimeout( () => this.close( id ), timeout ) : 0;
      let closed = false;

      if ( this.alerts.length >= 5 ) {
        let a = this.alerts.pop();
        if ( a.sto ) clearTimeout( a.sto );
        this.remove( a.id );
      }
      this.alerts.push( { id, message, type, timeout, sto, closed } );
    },

    // close alert by id
    close( id ) {
      this.alerts.forEach( ( a, i ) => {
        if ( a.id !== id ) return;
        a.closed = true; // animate out, then...
        setTimeout( () => this.remove( id ), 500 );
      });
    },

    // remove lert from the list
    remove( id ) {
      this.alerts = this.alerts.filter( a => ( a.id !== id ) );
    },

    // alias
    info( message, timeout ) {
      this.show( message, 'info', timeout );
    },

    // alias
    success( message, timeout ) {
      this.show( message, 'success', timeout );
    },

    // alias
    warning( message, timeout ) {
      this.show( message, 'warning', timeout );
    },

    // alias
    error( message, timeout ) {
      this.show( message, 'error', timeout );
    },

  },
}
</script>

<style lang='scss'>
.notify-wrap {
  display: block;
  position: fixed;
  pointer-events: none;
  width: 100%;
  max-width: $sizeMedium;
  padding: 0 $padSpace;
  left: 50%;
  bottom: 0;
  transition: none;
  transform: translateX( -50% );
  z-index: $zindexAlerts;

  .notify-alert {
    display: block;
    position: relative;
    pointer-events: auto;
    margin: 0 0 $padSpace 0;
    padding: $padSpace ( $padSpace * 2 );
    line-height: normal;
    background-color: $colorDefault;
    color: $colorDefaultText;
    border-radius: $lineJoin;
    box-shadow: $shadowBold;
    animation: zoomIn $fxSpeed $fxEase forwards;

    &.notify-closed {
      animation: zoomOut $fxSpeed $fxEase forwards;
    }
    &.notify-success {
      background-color: $colorSuccess;
      color: $colorSuccessText;
    }
    &.notify-warning {
      background-color: $colorWarning;
      color: $colorWarningText;
    }
    &.notify-error {
      background-color: $colorDanger;
      color: $colorDangerText;
    }
    &.notify-info {
      background-color: $colorInfo;
      color: $colorInfoText;
    }
    .notify-message {
      font-weight: normal;
    }
    .notify-close {
      display: inline-block;
      position: absolute;
      cursor: pointer;
      top: -10px;
      right: -10px;
      width: 2em;
      line-height: 1em;
      padding: 0.5em;
      background-color: $colorBright;
      color: $colorInfo;
      border-radius: 100px;
      box-shadow: $shadowPaper;

      &:hover {
        background-color: darken( $colorBright, 10% );
      }
    }
  }
}

</style>
