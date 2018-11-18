<template>
  <div class="modal-overlay" :class="{ 'visible': visible, 'under': under }" @click.stop="close">
    <section class="modal-container" ref="container" @click.stop>
      <header class="flex-row flex-middle flex-stretch pad-all border-bottom">
        <div class="flex-1 text-clip text-bright">{{ title }}</div>
        <button class="text-danger-hover icon-close" @click.stop="close"></button>
      </header>
      <main class="modal-body">
        <slot></slot>
      </main>
    </section>
  </div>
</template>

<script>
// component
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
    width: calc( 100% - ( #{$padSpace} * 2 ) );
    max-width: calc( #{$sizeMedium} + ( #{$padSpace} * 2 ) );
    background-color: $colorDocumentLight;
    border-radius: $lineJoin;
    box-shadow: $shadowBold;
    transform: scale( 0.5 );

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
// visible state
.modal-overlay.visible {
  opacity: 1;
  .modal-container {
    transform: scale( 1 );
  }
}
// inactive state
.modal-overlay.under {
  pointer-events: none;
  z-index: $zindexUnder;
}
</style>
