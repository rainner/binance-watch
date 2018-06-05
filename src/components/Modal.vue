<template>
  <div class="modal-overlay" :class="{ 'visible': visible, 'under': under }" @click.stop="close">
    <section class="modal-container" ref="container" @click.stop>
      <header class="modal-header">
        <div class="modal-title text-clip">{{ title }}</div>
        <button class="modal-close icon-close" @click.stop="close"></button>
      </header>
      <main class="modal-body">
        <slot></slot>
      </main>
    </section>
  </div>
</template>

<script>
// modal component
export default {

  // component data
  data() {
    return {
      title: '',
      visible: false,
      under: true,
      sto: null,
    }
  },

  // custom methods
  methods: {

    // show the modal window
    show( title ) {
      if ( this.visible ) return;
      this.$emit( 'onShow' );
      this.title = title || 'Modal Window';
      this.under = false;
      this.visible = true;
    },

    // close the modal
    close( e ) {
      if ( !this.visible ) return;
      if ( this.sto ) clearTimeout( this.sto );
      this.sto = setTimeout( this.onDone, 400 );
      this.$emit( 'onClose', e );
      this.visible = false;
    },

    // when the modal is done animating out
    onDone( e ) {
      if ( this.under ) return;
      this.$emit( 'onDone', e );
      this.under = true;
    },

    // check for escape key
    onKey( e ) {
      if ( e.keyCode !== 27 ) return;
      this.close( e );
    },
  },

  // on destroyed
  destroyed() {
    document.removeEventListener( 'keydown', this.onKey );
  },
}
</script>

<style lang='scss'>
// modal overlay
.modal-overlay {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: fixed;
  overflow: hidden;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: $colorOverlay;
  pointer-events: auto;
  opacity: 0;
  z-index: ( $zindexModals - 1 );

  .modal-container {
    margin: 0 auto;
    width: calc( 100vw - ( #{$padSpace} * 3 ) );
    max-width: $sizeMedium;
    background-color: $colorDocumentLight;
    @include borderEffect;
    border-radius: $lineJoin;
    box-shadow: $shadowBold;
    transform: scale( 0.5 );

    .modal-header {
      display: flex;
      flex-direction: row;
      align-content: center;
      justify-content: space-between;
      padding: $padSpace;
      line-height: 1.2em;
      border-bottom: $lineWidth $lineStyle $lineColor;

      .modal-title, .modal-close {
        display: inline-block;
        font-size: 120%;
        font-weight: normal;
        text-transform: capitalize;
        vertical-align: middle;
        line-height: 1.2em;
      }

      .modal-title {
        flex: 1;
        opacity: 0.6;
      }
      .modal-close {
        cursor: pointer;
        color: $colorBright;
        opacity: 1;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .modal-body {
      display: block;
      position: relative;
      overflow: hidden;
      overflow-y: auto;
      margin: $padSpace 0;
      padding: 0 $padSpace;
      min-height: 100px;
      max-height: calc( 100vh - 150px );
    }
  }
}

.modal-overlay.visible {
  opacity: 1;

  .modal-container {
    transform: scale( 1 );
  }
}

.modal-overlay.under {
  pointer-events: none;
  z-index: $zindexUnder;
}

</style>
