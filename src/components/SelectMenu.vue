<template>
  <div class="select-wrap" ref="menu" @mouseleave="listHide">
    <button class="select-trigger text-nowrap" :class="css" type="button" ref="trigger" @click="onClick" @focus="onFocus">
      {{ text || 'Select...' }} <i class="icon-down-open text-info"></i>
    </button>
    <div class="select-container" :class="{ 'visible': visible, 'top': top, 'bottom': bottom }">
      <ul class="select-list">
        <li v-if="!optionsList.length">No options</li>
        <li v-for="( o, i ) of optionsList" :key="o.value" :class="{ 'active': o.active }" @click.stop="changeOption( i, true )">{{ o.text }}</li>
      </ul>
    </div>
    <div class="select-elements">
      <slot></slot>
    </div>
  </div>
</template>

<script>
// component
export default {

  // component props
  props: {
    options: { type: Array, default() { return [] } },
    css: { type: String, default: '' },
    value: { default: null },
  },

  // component data
  data() {
    return {
      visible: false,
      top: false,
      bottom: false,
      index: -1,
      optlist: [],
      val: null,
      text: '',
    }
  },

  // watch methods
  watch: {

    options() {
      this.loadOptions();
    },
    value() {
      this.updateOption();
    },
  },

  // computed methods
  computed: {

    // build menu list
    optionsList() {
      return this.optlist.map( ( option, index ) => {
        option.active = ( index === this.index ) ? true : false;
        return option;
      });
    },
  },

  // custom methods
  methods: {

    // on trigger click
    onClick( e ) {
      this.$emit( 'click', e );
      this.listShow();
    },

    // on trigger focus
    onFocus( e ) {
      this.$emit( 'focus', e );
      this.listShow();
    },

    // reset selected values
    resetValues() {
      this.index = -1;
      this.val   = null;
      this.text  = '';
    },

    // set selected values
    setValues( index ) {
      let deft   = { value: null, text: '' };
      let option = this.optlist[ index ] || deft;
      this.val   = option.value;
      this.text  = option.text;
      this.index = index;
    },

    // change current select option
    changeOption( index, hide ) {
      this.setValues( index );
      this.$emit( 'input', this.val );
      this.$emit( 'change', this.val );
      if ( hide ) this.listHide();
    },

    // update selected option values
    updateOption() {
      this.resetValues();
      for ( let i = 0; i < this.optlist.length; ++i ) {
        if ( this.optlist[ i ].value === this.value ) {
          return this.setValues( i );
        }
      }
    },

    // load options from nested slots elements, or props
    loadOptions() {
      let slots   = ( this.$slots && this.$slots.default ) ? this.$slots.default : [];
      let list    = slots.filter( e => ( e.elm instanceof HTMLOptionElement ) );
      let optlist = [];

      for ( let i = 0; i < list.length; ++i ) {
        let elm   = list[ i ].elm;
        let value = elm.value;
        let text  = String( elm.textContent || value || '' ).trim();
        // unserialize values
        if ( /^\-?[\d\.]+$/.test( value ) ) value = parseFloat( value ) || 0;
        if ( value === 'true' ) value = true;
        if ( value === 'false' ) value = false;
        optlist.push( { value, text } );
      }
      this.optlist = optlist.length ? optlist : this.options.slice();
      this.updateOption();
    },

    // show menu
    listShow( e ) {
      if ( this.visible || !this.$refs.trigger ) return;
      let pos      = this.$utils.boxPosition( this.$refs.trigger );
      this.top     = pos.top;
      this.bottom  = pos.bottom;
      this.visible = true;
    },

    // hide menu
    listHide( e ) {
      this.visible = false;
    },

    // detect click outside container
    clickOut( e ) {
      if ( !this.$refs.menu.contains( e.target ) ) {
        this.listHide( e );
      }
    },

    // change option on arrow key press
    keyDown( e ) {
      let key   = this.$utils.keyboard( e );
      let first = 0;
      let total = this.optlist.length;
      let last  = total ? ( total - 1 ) : 0;

      if ( !this.visible || !total ) return;

      if ( key.up && this.index > first ) {
        e.preventDefault();
        return this.changeOption( this.index - 1 );
      }
      if ( key.down && this.index < last ) {
        e.preventDefault();
        return this.changeOption( this.index + 1 );
      }
      if ( key.enter ) {
        e.preventDefault();
        return this.changeOption( this.index, true );
      }
    },
  },

  // comonent mounted
  mounted() {
    this.loadOptions();
    document.addEventListener( 'click', this.clickOut );
    document.addEventListener( 'keydown', this.keyDown );
  },

  // comonent destroyed
  destroyed() {
    document.removeEventListener( 'click', this.clickOut );
    document.removeEventListener( 'keydown', this.keyDown );
  },
}
</script>

<style lang="scss">
.select-wrap {
  display: block;
  position: relative;
  text-align: left;
  white-space: nowrap;

  .select-trigger {
    display: block;
    background-color: transparent;
    color: $colorBright;
    width: 100%;
    cursor: pointer;
  }

  .select-container {
    @include commonDropdown;
    padding: ( $padSpace * .3 ) 0;
    min-width: 100%;

    .select-list {
      display: block;
      list-style: none;
      overflow: hidden;
      overflow-y: auto;
      min-width: 100px;
      max-height: 200px;

      & > li {
        display: block;
        margin: 0;
        padding: ( $padSpace / 2 ) ( $padSpace * 1.6 );
        background-color: rgba( black, 0 );
        line-height: 1.2rem;
        cursor: pointer;

        & + li {
          margin-top: $lineWidth;
        }
        &:hover {
          background-color: rgba( black, .1 );
        }
        &.active {
          background-color: rgba( black, .2 );
          color: $colorPrimary;
        }
      }

    }
  }

  .select-elements {
    pointer-events: none;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
  }
}
</style>
