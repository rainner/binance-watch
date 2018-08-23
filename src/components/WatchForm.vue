<template>
  <div class="watchform-overlay" :class="{ 'visible': visible, 'under': under }" @click.stop="close">
    <section class="watchform-wrap" :class="{ 'collapsed': scrollDir === 'down' }" @click.stop>

      <!-- close button -->
      <button class="watchform-close text-primary-hover" @click.stop="close">
        <span class="icon-close iconLeft">Close</span>
      </button>

      <!-- inner container -->
      <div class="watchform-container" ref="watchform">
        <div class="container">

          <div class="flex-row flex-middle flex-stretch">
            <div class="flex-1 push-right">
              <span class="icon-config iconLeft">Presets:</span>
              <button v-for="p in watchPresets" :key="p.name" type="button" class="push-left text-info-hover" @click.prevent="applyPreset( p.name )">{{ p.name }}</button>
            </div>
            <div class="text-nowrap">
              <span class="icon-gauge iconLeft text-primary">{{ pairsCount() }}</span>
            </div>
          </div>

          <hr />

          <!-- form inputs -->
          <form class="watchform-controls flex-row flex-middle flex-space flex-wrap" @submit.prevent @change="formChange">

            <div class="form-input text-nowrap push-bottom">
              <div class="icon-down-open iconFaded">
                <select v-model="watchOptions.asset">
                  <option v-for="asset in assetsList" :key="asset" :value="asset">{{ asset }} Pairs</option>
                </select>
              </div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open iconFaded">
                <select v-model="watchOptions.priceType">
                  <option value="change">Price Change</option>
                  <option value="gain">Price Gain</option>
                  <option value="loss">Price Loss</option>
                </select>
              </div>
              <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.priceChange" />
              <div :class="{ 'text-grey': watchOptions.priceChange === '0' }">{{ watchOptions.priceChange }}%</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open iconFaded">
                <select v-model="watchOptions.volumeType">
                  <option value="change">Vol Change</option>
                  <option value="gain">Vol Gain</option>
                  <option value="loss">Vol Loss</option>
                </select>
              </div>
              <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.volumeChange" />
              <div :class="{ 'text-grey': watchOptions.volumeChange === '0' }">{{ watchOptions.volumeChange }}%</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open iconFaded">
                <select v-model="watchOptions.timeCheck">
                  <option value="less">Within last</option>
                  <option value="more">Wait past</option>
                </select>
              </div>
              <input class="flex-1 push-right" type="range" min="0" max="60" step="1" v-model="watchOptions.timeLimit" />
              <div :class="{ 'text-grey': watchOptions.timeLimit === '0' }">{{ watchOptions.timeLimit | toNoun( 'min', 'mins' ) }}</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open iconFaded">
                <select v-model="watchOptions.priceCheck">
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                </select>
              </div>
              <input class="push-right" type="text" placeholder="0.00000000" v-model="watchOptions.price" @keyup="numInput" />
              <div class="text-grey">{{ watchOptions.asset }}</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open iconFaded">
                <select v-model="watchOptions.volumeCheck">
                  <option value="above">Vol Above</option>
                  <option value="below">Vol Below</option>
                </select>
              </div>
              <input class="push-right" type="text" placeholder="0" v-model="watchOptions.volume" @keyup="numInput" />
              <div class="text-grey">{{ watchOptions.asset }}</div>
            </div>

             <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open iconFaded">
                <select v-model="watchOptions.filterType">
                  <option value="allow">Allow Tokens</option>
                  <option value="deny">Deny Tokens</option>
                </select>
              </div>
              <input class="push-right" type="text" placeholder="TOKEN1, TOKEN2, ..." v-model="watchOptions.filterText"  />
            </div>

            <button
              type="button"
              class="form-btn iconLeft"
              :class="{ 'bg-danger-hover icon-stop': active, 'bg-success-hover icon-play': !active }"
              @click.prevent="toggleWatch">
                {{ active ? 'Watching '+ elapsed +' ...' : 'Start watching ...' }}
            </button>

          </form>

        </div>
      </div>
    </section>
  </div>
</template>

<script>
// modules
import presetOptions from "../configs/presets";
import utils from '../modules/utils';

// component
export default {

  // component props
  props: {
    options: { type: Object, default() { return {} } },
    socketStatus: { type: Number, default: 0, required: false },
    scrollDir: { type: String, default: '', required: false },
    scrollPos: { type: Number, default: 0, required: false },
    assetsList: { type: Array, default: [], required: false },
    priceData: { type: Array, default: [], required: true },
  },

  // comonent data
  data() {
    return {
      // display
      visible: false,
      under: true,
      closeSto: null,
      // price watch
      active: false,
      watchSto: null,
      timerSto: null,
      start: 0,
      elapsed: '',
      snapshot: {},
      // watchform options
      watchPresets: presetOptions,
      watchOptions: {
        asset: 'BTC', // asset pair
        priceType: 'change', // change, gain, loss
        priceChange: '2', // change percent
        priceCheck: 'below', // above, below
        price: '', // custom price limit
        volumeType: 'gain', // change, gain, loss
        volumeChange: '2', // change percent
        volumeCheck: 'above', // above, below
        volume: '', // custom volume limit
        timeCheck: 'less', // more, less
        timeLimit: '30', // limit change by time (mins)
        filterType: 'deny', // deny, allow
        filterText: '', // csv tokens str
      },
    }
  },

  // custom methods
  methods: {

    // open from container
    open( e ) {
      if ( this.visible ) return;
      this.$emit( 'onOpen' );
      this.under = false;
      this.visible = true;
      const elm = this.$refs.watchform;
      const box = elm.firstChild.getBoundingClientRect();
      elm.style.maxHeight = box.height +'px';
    },

    // close from container
    close( e ) {
      if ( !this.visible ) return;
      if ( this.closeSto ) clearTimeout( this.closeSto );
      this.$emit( 'onClose', e );
      this.closeSto = setTimeout( this.onDone, 400 );
      this.$refs.watchform.style.maxHeight = '0px';
      this.visible = false;
    },

    // toggle open/close
    toggle( e ) {
      if ( this.visible ) { this.close( e ); }
      else { this.open( e ); }
    },

    // when the form is done animating out
    onDone( e ) {
      if ( this.under ) return;
      this.$emit( 'onDone', e );
      this.under = true;
    },

    // only allow numbers for some form inputs
    numInput( e ) {
      this.watchOptions.price  = String( this.watchOptions.price ).replace( /[^\d\.\-]+/g, '' );
      this.watchOptions.volume = String( this.watchOptions.volume ).replace( /[^\d\.\-]+/g, '' );
    },

    // compute elapsed time for price watch
    computeWatchTime() {
      let seconds  = ( Date.now() - this.start ) / 1000;
      let elapsed  = utils.elapsed( seconds );
      this.elapsed = elapsed ? elapsed : '0s';
    },

    // add a preset
    addPreset( name, options ) {
      if ( !name || this.watchPresets.filter( p => p.name === name ).length ) return;
      options = Object.assign( {}, this.watchOptions, options );
      this.watchPresets.push( { name, options } );
    },

    // remove preset
    removePreset( name ) {
      if ( !name ) return;
      this.watchPresets = this.watchPresets.filter( p => p.name !== name );
    },

    // apply a preset
    applyPreset( name ) {
      let preset = name ? this.watchPresets.filter( p => p.name === name ).shift() : null;
      if ( preset ) {
        this.watchOptions = Object.assign( this.watchOptions, preset.options );
        this.formChange();
      }
    },

    // watch tick handler
    onWatch() {
      this.computeWatchTime();
      this.checkPrices();
    },

    // start price watch
    startWatch() {
      if ( this.active ) return;
      if ( this.socketStatus !== 2 ) return this.$bus.emit( 'showNotice', 'Socket connection is not active.', 'warning' );
      if ( this.watchSto ) clearInterval( this.watchSto );

      this.buildSnapshot();
      this.start    = Date.now();
      this.watchSto = setInterval( this.onWatch, 1000 );
      this.active   = true;

      this.$bus.emit( 'showNotice', 'Price watch is now active.', 'success' );
      this.$emit( 'onStartWatch' );
    },

    // stop price watch
    stopWatch() {
      if ( !this.active ) return;
      if ( this.watchSto ) clearInterval( this.watchSto );

      this.active = false;
      this.snapshot = {};

      this.$notify.flush();
      this.$bus.emit( 'showNotice', 'Price watch has stopped.', 'warning' );
      this.$emit( 'onStopWatch' );
    },

    // toggle price watch
    toggleWatch( e ) {
      e && e.preventDefault();
      if ( this.active ) { this.stopWatch(); }
      else { this.startWatch(); }
    },

    // reset some things when the form is changed while runnig
    formChange( e ) {
      this.buildSnapshot();
      this.$notify.flush();
    },

    // make a copy of current prices to start comparing against
    buildSnapshot() {
      let checked = Date.now();
      this.priceData.forEach( p => {
        let { symbol, token, asset, close, assetVolume } = p;
        this.snapshot[ symbol ] = { symbol, token, asset, close, assetVolume, checked };
      });
    },

    // compare watch form options against pair data from price list, snapshot, or both
    checkFormOptions( p ) {
      let asset = String( this.watchOptions.asset || '' );
      let priceCheck = String( this.watchOptions.priceCheck || '' );
      let price = parseFloat( this.watchOptions.price ) || 0;
      let volumeCheck = String( this.watchOptions.volumeCheck || '' );
      let volume = parseInt( this.watchOptions.volume ) || 0;

      if ( asset && p.asset !== asset ) return false;
      if ( price && priceCheck === 'above' && p.close < price ) return false;
      if ( price && priceCheck === 'below' && p.close > price ) return false;
      if ( volume && volumeCheck === 'above' && p.assetVolume < volume ) return false;
      if ( volume && volumeCheck === 'below' && p.assetVolume > volume ) return false;
      return true;
    },

    // count total pairs for select option
    pairsCount() {
      let count = 0;
      let asset = String( this.watchOptions.asset || '' );
      this.priceData.forEach( p => { if ( this.checkFormOptions( p ) ) count++ } );
      return utils.noun( count, asset +' pair', asset +' pairs' );
    },

    // check current prices against snapshot based on options
    checkPrices() {
      let priceType    = String( this.watchOptions.priceType || '' );
      let priceChange  = parseFloat( this.watchOptions.priceChange ) || 0;
      let volumeType   = String( this.watchOptions.volumeType || '' );
      let volumeChange = parseFloat( this.watchOptions.volumeChange ) || 0;
      let timeCheck    = String( this.watchOptions.timeCheck || 'less' );
      let timeLimit    = ( parseInt( this.watchOptions.timeLimit ) || 0 ) * 60; // convert mins to secs
      let filterType   = String( this.watchOptions.filterType || '' );
      let filterText   = String( this.watchOptions.filterText || '' );
      let now          = Date.now();

      this.priceData.forEach( p => {
        if ( !this.snapshot.hasOwnProperty( p.symbol ) ) return;
        if ( !this.checkFormOptions( p ) ) return;

        // filter token name
        if ( filterText && filterText.length > 1 ) {
          let reg = new RegExp( '^('+ filterText.trim().split( /[^a-zA-Z]+/g ).join( '|' ).toUpperCase() +')$' );
          if ( filterType === 'allow' && !reg.test( p.token ) ) return;
          if ( filterType === 'deny' && reg.test( p.token ) ) return;
        }

        // get snapshot, price and volume change data
        let s  = this.snapshot[ p.symbol ];
        let pc = utils.percent( p.close, s.close );
        let vc = utils.percent( p.assetVolume, s.assetVolume );
        let t  = ( now - s.checked ) / 1000; // secs since last checked

        // nothing to check
        if ( !priceChange && !volumeChange ) return;

        // check price change data
        if ( priceChange ) {
          if ( priceType === 'gain' && pc.sign === '-' ) return;
          if ( priceType === 'loss' && pc.sign === '+' ) return;
          if ( pc.percent < priceChange ) return;
        }

        // check volume change data
        if ( volumeChange ) {
          if ( volumeType === 'gain' && vc.sign === '-' ) return;
          if ( volumeType === 'loss' && vc.sign === '+' ) return;
          if ( vc.percent < volumeChange ) return;
        }

        // update symbol snapshot data
        this.snapshot[ p.symbol ].close = p.close;
        this.snapshot[ p.symbol ].assetVolume = p.assetVolume;
        this.snapshot[ p.symbol ].checked = now;

        // check time period
        if ( timeCheck && timeLimit ) {
          if ( timeCheck === 'less' && t > timeLimit ) return;
          if ( timeCheck === 'more' && t < timeLimit ) return;
        }

        // resolve emoji title icons
        let emoji = '🔔 ';
        if ( p.percent >= 5 ) emoji = '🚀 ';
        if ( p.percent <= -5 ) emoji = '🆘 ';

        // we have a hit, prep notification info
        let pricePerc = pc.sign + Number( pc.percent ).toFixed( 2 ) + '%';
        let volPerc   = vc.sign + Number( vc.percent ).toFixed( 2 ) + '%';
        let elapsed   = 'Change ⌚ '+ utils.elapsed( t );
        let curPrice  = 'Price '+ pc.arrow +' '+ pricePerc +' ('+ Number( p.close ).toFixed( 8 ) +' '+ p.asset +')';
        let curVol    = 'Volume '+ vc.arrow +' '+ volPerc +' ('+ utils.money( p.assetVolume, 0 ) +' '+ p.asset +')';
        let title     = [ emoji, p.name, '('+ p.pair +')', p.sign + Number( p.percent ).toFixed( 2 ) +'%' ].join( ' ' );
        let info      = [ elapsed, curPrice, curVol ].join( '\n' );
        let icon      = utils.fullUrl( p.icon );

        // norify, add to history and mail queue
        this.$history.add( title, info, icon );
        this.$notify.add( title, info, icon, e => { this.$bus.emit( 'setRoute', p.route ) } );
        this.$bus.emit( 'msgQueue', { title, info, icon } );
        this.$bus.emit( 'mainMenuAlert' );
      });
    },
  },
}
</script>

<style lang="scss">
// watchform
.watchform-overlay {
  display: block;
  position: fixed;
  overflow: hidden;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba( $colorOverlay, 0 );
  z-index: ( $zindexElements + 5 );

  // main wrapper
  .watchform-wrap {
    display: block;
    position: relative;
    margin: $topbarHeight 0 0 0;
    background-color: darken( $colorDocumentLight, 2% );

    // collapsed mode
    &.collapsed {
      transform: translateY( -#{$topbarHeight} );
    }

    // close button
    .watchform-close {
      display: block;
      position: absolute;
      width: auto;
      left: 50%;
      top: 100%;
      padding: 0 2em .6em 2em;
      text-align: center;
      background-color: darken( $colorDocumentLight, 2% );
      border-radius: 0 0 100px 100px;
      transform: translateX( -50% );
      box-shadow: 0 8px 4px rgba( 0, 0, 0, 0.2 );
      opacity: 0;
    }

    // main form container
    .watchform-container {
      display: block;
      overflow: hidden;
      max-height: 0;
      transition: max-height $fxSpeed $fxEase;

      .container {
        padding-top: 1em;
        padding-bottom: 2em;
      }

      .watchform-controls {
        margin: 0 -( $padSpace / 2 );

        .form-input,
        .form-btn {
          margin: ( $padSpace / 2 );
        }
      }
    }

  }

  // visible state
  &.visible {
    pointer-events: auto;
    background-color: $colorOverlay;

    .watchform-wrap { box-shadow: $shadowPaper; }
    .watchform-close { opacity: 1; }
  }

  // hidden state
  &.under {
    pointer-events: none;
    z-index: $zindexUnder;
  }
}
</style>
