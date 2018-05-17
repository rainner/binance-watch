<template>
  <div class="notify-wrap">
    <div class="notify-alert"
      v-for="alert in alerts"
      :class="[ 'notify-' + alert.type, { 'notify-closed': alert.closed } ]"
      :key="alert.id">
        <span class="notify-message">{{ alert.message }}</span>
        <button class="notify-close icon-close" @click.stop="close( alert.id )"></button>
    </div>
  </div>
</template>

<script>
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
      timeout = ( !timeout && type !== 'error' ) ? 5000 : timeout;

      let alert = {
        id: 'alert-' + Math.random().toString( 36 ).replace( /[^a-z]+/g, '' ).substr( 0, 5 ),
        message: message || 'No message available.',
        type: type || 'info',
        closed: false,
      };
      if ( timeout && typeof timeout === 'number' ) {
        setTimeout( () => { this.close( alert.id ); }, timeout );
      }
      this.$emit( 'onShow', alert );
      this.alerts.push( alert );
    },

    // close alert by id
    close( id ) {
      for ( let i = 0; i < this.alerts.length; ++i ) {
        let alert = this.alerts[ i ];
        if ( alert.id === id && !alert.closed ) {
          this.$emit( 'onClose', alert );
          this.alerts[ i ].closed = true; // animate out, then...
          setTimeout( () => { this.alerts.splice( i, 1 ); }, 500 );
        }
      }
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

@keyframes notifyShow {
    0% { transform: translateY( 20px ) scale( 0.8 ); opacity: 0; }
  100% { transform: translateY( 0 ) scale( 1 ); opacity: 1; }
}
@keyframes notifyRemove {
    0% { transform: scale( 1 ); opacity: 1; }
  100% { transform: scale( 0.8 ); opacity: 0; }
}

.notify-wrap {
  position: fixed;
  pointer-events: none;
  width: 100%;
  padding: $padSpace;
  left: 0;
  bottom: 0;
  transition: none;
  z-index: $zindexAlerts;

  .notify-alert {
    position: relative;
    pointer-events: auto;
    margin: 0 0 $padSpace 0;
    padding: $padSpace 2em;
    line-height: 1.2em;
    background-color: $colorDefault;
    color: $colorDefaultText;
    @include borderAccent;
    border-radius: $lineJoin;
    box-shadow: $shadowBold;
    animation: notifyShow $fxSpeed $fxEaseBounce forwards;

    @media #{$screenMedium} {
      width: 600px;
      margin: 0 auto $padSpace auto;
    }

    &.notify-closed {
      animation: notifyRemove $fxSpeed $fxEase forwards;
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
      color: darken( $colorBright, 60% );
      background-color: $colorBright;
      border-radius: 100px;
      box-shadow: $shadowPaper;

      &:hover {
        background-color: darken( $colorBright, 10% );
      }
    }
  }
}

</style>
