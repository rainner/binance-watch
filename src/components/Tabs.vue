<template>
  <div class="tabs-wrap" ref="container" @click.stop="hideDropdown">
    <div class="tabs-toggle" v-if="!inline" @click.stop="toggleDropdown">
      <span class="icon-menu text-clip">&nbsp;&nbsp;{{ tabName }}</span>
    </div>
    <nav class="tabs-nav" :class="{ 'tabs-inline': inline, 'tabs-drop': !inline, 'visible': visible }">
      <button v-for="(tab, index) in tabs" :class="[ { 'active': tab.active }, tab.styles ]" :key="tab.name" @click="activateTab( index )">
        {{ tab.name }}
      </button>
    </nav>
    <div class="tabs-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
// component
export default {

  // component props
  props: {
    data: { type: Object, default() { return {} } },
  },

  // component data
  data() {
    return {
      slides: [],     // content slides
      tabs: [],       // tabs data from slides
      index: 0,       // index of current selected tab
      inline: false,  // if tabs will be displayed inline (flex-row)
      visible: false, // dropdown tabs visible state
      width: 0,       // computed width taken by all tabs inline
    }
  },

  // watch methods
  watch: {

    // rebuild the tabs when some external data changes
    data: function() {
      this.buildTabs();
    },
  },

  // computed methods
  computed: {

    // name of active tab
    tabName() {
      if ( !this.tabs.length ) return '';
      return this.tabs[ this.index ].name;
    },
  },

  // custom methods
  methods: {

    // reset local data
    resetData() {
      this.slides = [];
      this.tabs = [];
    },

    // toggle tabs dropdown
    toggleDropdown( e ) {
      if ( this.inline ) return;
      this.visible = !this.visible;
    },

    // show tabs dropdown
    showDropdown( e ) {
      if ( this.inline ) return;
      this.visible = true;
    },

    // hide tabs dropdown
    hideDropdown( e ) {
      if ( this.inline ) return;
      this.visible = false;
    },

    // set active tab
    activateTab( index ) {
      this.index = ( typeof index === 'number' ) ? parseInt( index ) : this.index;

      for ( let i = 0; i < this.slides.length; ++i ) {
        this.slides[ i ].classList.remove( 'active' );
      }
      this.slides[ this.index ].classList.add( 'active' );
      this.hideDropdown();
      this.buildTabs();
    },

    // calculate total tabs width inline
    calculateWidth() {
      let div = document.createElement( 'div' );
      div.style.position = 'absolute';
      div.style.left = '-1000px';
      div.style.padding = '0 1em 0 0';

      document.body.appendChild( div );
      this.width = 0;

      for ( let i = 0; i < this.tabs.length; ++i ) {
        div.innerHTML = this.tabs[ i ].name;
        this.width += div.clientWidth || 0;
      }
      document.body.removeChild( div );
    },

    // resolse tabs display type (inline, dropdown)
    resolveTabs() {
      let boxWidth = this.$refs.container.offsetWidth || 0;
      this.inline = ( window.innerWidth > 720 && this.width < boxWidth );
    },

    // build tabs from slides
    buildSlides() {
      let slots  = this.$slots.default.filter( e => ( e.elm instanceof Element ) );
      let index  = 0;
      let slides = [];

      for ( let i = 0; i < slots.length; ++i ) {
        let slide = slots[ i ].elm;
        if ( slide.hasAttribute( 'active' ) ) this.index = i;
        slide.setAttribute( 'class', 'tabs-slide fx fx-fade-in' );
        slides.push( slide );
      }
      this.slides = slides;
    },

    // create list of tabs from loaded slides (sections)
    buildTabs() {
      let tabs = [];

      for ( let i = 0; i < this.slides.length; ++i ) {
        let slide  = this.slides[ i ];
        let styles = slide.getAttribute( 'btn-class' ) || '';
        let name   = slide.getAttribute( 'btn-name' ) || 'Tab '+ ( i + 1 );
        let active = ( i === this.index ) ? true : false;
        tabs.push( { styles, name, active } );
      }
      this.tabs = tabs;
    },

  },

  // on mounted
  mounted() {
    this.buildSlides();
    this.activateTab();
    this.calculateWidth();
    this.resolveTabs();
    window.addEventListener( 'resize', this.resolveTabs );
  },

  // on destroyed
  destroyed() {
    this.resetData();
    window.removeEventListener( 'resize', this.resolveTabs );
  },
}
</script>

<style lang='scss'>

@keyframes showDropMenu {
    0% { transform: scale( 0.5 ); opacity: 0; }
  100% { transform: scale( 1 ); opacity: 1; }
}

.tabs-wrap {
  display: block;
  position: relative;

  .tabs-toggle {
    display: block;
    cursor: pointer;
    padding: ( $padSpace * .6 ) $padSpace;
    color: $colorSecondary;
    background-color: rgba( black, 0.1 );
    border-radius: $lineJoin $lineJoin 0 0;
  }

  .tabs-nav {
    display: block;
    list-style: none;
    margin: 0;
    padding: 0;

    button {
      display: block;
      text-align: center;
      @include textClip;

      &.active  {
        color: $colorBright;
      }
    }
  }

  .tabs-drop {
    display: none;
    position: absolute;
    padding: ( $padSpace / 2 ) 0;
    left: 0;
    top: 0;
    background-color: lighten( $colorDocumentLight, 5% );
    border-radius: $lineJoin;
    box-shadow: $shadowBold;
    animation: showDropMenu $fxSpeed $fxEaseBounce forwards;
    z-index: 2;

    &.visible {
      display: block;
    }
    button {
      width: 100%;
      text-align: left;
      padding: ( $padSpace / 2 ) $padSpace;
      border-bottom: 1px $lineStyle $lineColor;
      background-color: rgba( 0, 0, 0, 0.0000001 );

      &:last-of-type {
        border: 0;
      }
      &:hover, &.active {
        background-color: rgba( 0, 0, 0, 0.05 );
      }
    }
  }

  .tabs-inline {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: stretch;

    button {
      flex: 1;
      padding: ( $padSpace * .6 ) 0;
      border-bottom: $lineWidth solid $colorGrey;
      background-color: rgba( black, 0.1 );
      border-radius: $lineJoin $lineJoin 0 0;

      &:hover {
        background-color: rgba( black, 0.16 );
      }
      &.active {
        background-color: rgba( black, 0.2 );
        border-color: $colorSecondary;
        color: $colorSecondary;
      }
      & + button {
        margin-left: $lineWidth;
      }
    }
  }

  .tabs-content {
    display: block;
    position: relative;
    padding: $padSpace 0 0 0;
    z-index: 1;

    .tabs-slide {
      display: none;
      position: relative;
      margin: 0;
      padding: 0;

      &.active {
        display: block;
      }
    }
  }
}
</style>
