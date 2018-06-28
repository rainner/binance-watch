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

          <div class="flex-row flex-top flex-space">
            <div class="push-right icon-bell iconLeft text-clip">
              <span v-if="active" class="text-gain">Watching for price change on selected {{ options.asset }} pairs.</span>
              <span v-else>Get notifications for price action on pairs based on custom options.</span>
            </div>
            <div class="text-nowrap">
              <span class="icon-gauge iconLeft text-primary">{{ pairsCount() }}</span>
            </div>
          </div>

          <hr />

          <!-- form inputs -->
          <div class="watchform-controls flex-row flex-top flex-space flex-wrap">

            <div class="form-input text-nowrap push-bottom">
              <div class="icon-down-open">
                <select v-model="options.asset">
                  <option v-for="asset in assetsList" :key="asset" :value="asset">{{ asset }} Pairs</option>
                </select>
              </div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open">
                <select v-model="options.priceType">
                  <option value="change">Price Change</option>
                  <option value="gain">Price Gain</option>
                  <option value="loss">Price Loss</option>
                </select>
              </div>
              <input class="flex-1 push-right" type="range" min="0" max="100" step="1" v-model="options.priceChange" />
              <div :class="{ 'text-grey': options.priceChange === '0' }">{{ options.priceChange }}%</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open">
                <select v-model="options.volumeType">
                  <option value="change">Vol Change</option>
                  <option value="gain">Vol Gain</option>
                  <option value="loss">Vol Loss</option>
                </select>
              </div>
              <input class="flex-1 push-right" type="range" min="0" max="100" step="1" v-model="options.volumeChange" />
              <div :class="{ 'text-grey': options.volumeChange === '0' }">{{ options.volumeChange }}%</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open">
                <select v-model="options.priceCheck">
                  <option value="above">Price Above</option>
                  <option value="below">Price Below</option>
                </select>
              </div>
              <input class="push-right" type="text" placeholder="0.00000000" v-model="options.price" @keyup="numInput" />
              <div class="text-grey">{{ options.asset }}</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="push-right icon-down-open">
                <select v-model="options.volumeCheck">
                  <option value="above">Vol Above</option>
                  <option value="below">Vol Below</option>
                </select>
              </div>
              <input class="push-right" type="text" placeholder="0" v-model="options.volume" @keyup="numInput" />
              <div class="text-grey">{{ options.asset }}</div>
            </div>

            <div class="form-input text-nowrap push-bottom">
              <div class="icon-down-open">
                <select v-model="options.notify">
                  <option value="repeat">Repeat all</option>
                  <option value="once">Once per pair</option>
                </select>
              </div>
            </div>

            <button
              class="form-btn iconLeft"
              :class="{ 'bg-danger-hover icon-stop': active, 'bg-success-hover icon-play': !active }"
              @click="toggleWatch">
                {{ active ? elapsed : 'START' }}
            </button>

          </div>

        </div>
      </div>
    </section>
  </div>
</template>

<script>
// modules
import utils from '../modules/utils';

// component
export default {

  // component props
  props: {
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
      // user options
      options: {
        asset: 'BTC', // asset pair
        // price
        priceType: 'change', // change, gain, loss
        priceChange: '2', // change percent
        priceCheck: 'below', // above, below
        price: '', // custom price limit
        // volume
        volumeType: 'gain', // change, gain, loss
        volumeChange: '5', // change percent
        volumeCheck: 'above', // above, below
        volume: '', // custom volume limit
        // other
        notify: 'repeat',
      }
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
      this.options.price  = String( this.options.price ).replace( /[^\d\.\-]+/g, '' );
      this.options.volume = String( this.options.volume ).replace( /[^\d\.\-]+/g, '' );
    },

    // compute elapsed time for price watch
    computeWatchTime() {
      let seconds  = ( Date.now() - this.start ) / 1000;
      let elapsed  = utils.elapsed( seconds );
      this.elapsed = elapsed ? elapsed : '0s';
    },

    // start price watch
    startWatch() {
      if ( this.watchSto ) clearInterval( this.watchSto );
      if ( this.timerSto ) clearInterval( this.timerSto );
      if ( this.active ) return;

      if ( this.socketStatus !== 2 ) {
        return this.$bus.emit( 'showNotice', 'Socket connection is not active.', 'warning' );
      }
      this.watchSto = setInterval( this.checkPrices, 2000 );
      this.timerSto = setInterval( this.computeWatchTime, 1000 );
      this.start    = Date.now();
      this.active   = true;

      this.buildSnapshot();
      this.computeWatchTime();
      this.checkPrices();
      this.$emit( 'onStartWatch' );
      this.$bus.emit( 'showNotice', 'Price watch is now active.', 'success' );
    },

    // stop price watch
    stopWatch() {
      if ( this.watchSto ) clearInterval( this.watchSto );
      if ( this.timerSto ) clearInterval( this.timerSto );
      if ( !this.active ) return;

      this.active = false;
      this.snapshot = {};
      this.$emit( 'onStopWatch' );
      this.$bus.emit( 'showNotice', 'Price watch has stopped.', 'warning' );
    },

    // toggle price watch
    toggleWatch( e ) {
      e && e.preventDefault();
      if ( this.active ) { this.stopWatch(); }
      else { this.startWatch(); }
    },

    // make a copy of current prices to start comparing against
    buildSnapshot() {
      let time = Date.now();
      let checked = false;

      this.priceData.forEach( p => {
        let { symbol, token, asset, close, assetVolume } = p;
        this.snapshot[ symbol ] = { symbol, token, asset, close, assetVolume, time, checked };
      });
    },

    // compare watch form options against pair data from price list, snapshot, or both
    checkFormOptions( p ) {
      let asset = String( this.options.asset || '' );
      let priceCheck = String( this.options.priceCheck || '' );
      let price = parseFloat( this.options.price ) || 0;
      let volumeCheck = String( this.options.volumeCheck || '' );
      let volume = parseInt( this.options.volume ) || 0;

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
      let asset = String( this.options.asset || '' );
      this.priceData.forEach( p => { if ( this.checkFormOptions( p ) ) count++ } );
      return utils.noun( count, asset +' pair', asset +' pairs' );
    },

    // check current prices against snapshot based on options
    checkPrices() {
      let priceType    = String( this.options.priceType || '' );
      let priceChange  = parseFloat( this.options.priceChange ) || 0;
      let volumeType   = String( this.options.volumeType || '' );
      let volumeChange = parseFloat( this.options.volumeChange ) || 0;
      let notify       = String( this.options.notify || 'once' );
      let now          = Date.now();

      this.priceData.forEach( p => {
        if ( !this.snapshot.hasOwnProperty( p.symbol ) ) return;
        if ( !this.checkFormOptions( p ) ) return;

        // get snapshot, price and volume change data
        let s  = this.snapshot[ p.symbol ];
        let pc = utils.percent( p.close, s.close );
        let vc = utils.percent( p.assetVolume, s.assetVolume );

        // already notified
        if ( notify === 'once' && s.checked ) return;

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

        // we have a hit, prep notification
        let pricePerc = pc.sign + Number( pc.percent ).toFixed( 2 ) + '%';
        let volPerc   = vc.sign + Number( vc.percent ).toFixed( 2 ) + '%';
        let curPrice  = 'Price '+ pc.arrow +' '+ pricePerc +' ('+ Number( p.close ).toFixed( 8 ) +' '+ p.asset +')';
        let curVol    = 'Volume '+ vc.arrow +' '+ volPerc +' ('+ utils.money( p.assetVolume, 0 ) +' '+ p.asset +')';
        let elapsed   = 'Last '+ utils.elapsed( ( now - s.time ) / 1000 );
        let title     = p.name +' ('+ p.pair +')';
        let info      = [ curPrice, curVol, elapsed ].join( '\n' );
        let icon      = utils.fullUrl( p.icon );

        // update symbol snapshot data
        this.snapshot[ p.symbol ].close = p.close;
        this.snapshot[ p.symbol ].assetVolume = p.assetVolume;
        this.snapshot[ p.symbol ].time = now;
        this.snapshot[ p.symbol ].checked = true;

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
