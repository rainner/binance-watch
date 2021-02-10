<template>
  <div class="dropdown-menu" ref="menu" @mouseleave="listHide">
    <div class="dropdown-trigger clickable" ref="trigger" @click="listShow">
      <slot name="trigger"></slot>
    </div>
    <div class="dropdown-container" :class="{ 'visible': visible, 'top': top, 'right': right, 'bottom': bottom, 'left': left }" @click.stop>
      <slot name="list"></slot>
    </div>
  </div>
</template>

<script>
// component
export default {

  // component data
  data() {
    return {
      visible: false,
      top: true,
      right: false,
      bottom: false,
      left: true,
    }
  },

  // custom methods
  methods: {

    // show dropdown
    listShow( e ) {
      if ( this.visible || !this.$refs.trigger ) return;
      let pos      = this.$utils.boxPosition( this.$refs.trigger );
      this.top     = pos.top;
      this.right   = pos.right;
      this.bottom  = pos.bottom;
      this.left    = pos.left;
      this.visible = true;
    },

    // hide dropdown
    listHide( e ) {
      this.visible = false;
    },

    // detect click outside container
    _clickOut( e ) {
      if ( !this.$refs.menu.contains( e.target ) ) {
        this.listHide( e );
      }
    },

  },

  // comonent mounted
  mounted() {
    document.addEventListener( 'click', this._clickOut );
  },

  // comonent destroyed
  destroyed() {
    document.removeEventListener( 'click', this._clickOut );
  }
}
</script>

<style lang='scss'>
.dropdown-menu {
  display: inline-block;
  position: relative;
  overflow: visible;

  .dropdown-trigger {
    display: inline-block;
    cursor: pointer;
  }

  .dropdown-container {
    @include commonDropdown;
    padding: $padSpace 0;
    min-width: 240px;
    max-width: 420px;

    & > ul {
      display: block;
      list-style: none;
      margin: 0;
      padding: 0;

      // dropdown list item
      & > li {
        display: block;
        margin: 0;
        text-align: left;
        white-space: nowrap;

        & + li {
          margin-top: $lineWidth;
        }

        &.heading {
          margin: 0 0 $padSpace 0;
          padding: 0 $padSpace;
        }

        &.clickable {
          padding: ( $padSpace / 2 ) ( $padSpace * 1.6 );
          background-color: rgba( black, 0 );
          line-height: 1.2rem;

          &:hover {
            background-color: rgba( black, .1 );
          }
          &.active {
            background-color: rgba( black, .2 );
            color: $colorPrimary;
          }
        }

        input {
          padding: 0;
          border-radius: 0;
          background-color: transparent;
          box-shadow: none;
          line-height: 2em;
        }
      }

    }
  }
}
</style>
