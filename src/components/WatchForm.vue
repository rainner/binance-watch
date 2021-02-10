<template>
  <div class="watchform-overlay" :class="{ 'visible': visible, 'overflow': overflow, 'under': under }" @click.stop="close">
    <section class="watchform-wrap" :class="{ 'collapsed': header.collapsed }" @click.stop>

      <!-- close button -->
      <button class="watchform-close text-primary-hover" @click.stop="close">
        <span class="icon-close iconLeft">Close</span>
      </button>

      <!-- inner container -->
      <div class="watchform-container" ref="watchform">
        <div class="container">

          <div class="flex-row flex-middle flex-stretch">
            <div class="flex-1 text-info push-right">
              <span class="text-bright icon-config iconLeft">Presets:</span>
              <button v-for="p in presetsList" :key="p.name" class="push-left" :class="{ 'text-gain': p.active }" @click.prevent="applyPreset( p.name )">{{ p.name }}</button>
            </div>
            <div class="text-clip">
              <span class="icon-visible iconLeft text-primary">{{ countInfo }}</span>
            </div>
          </div>

          <hr />

          <!-- form inputs -->
          <div class="flex-grid flex-grid-md flex-middle">

            <div class="form-input text-nowrap">
              <SelectMenu class="flex-1" :options="marketOptions" v-model="watchOptions.market" @change="formChange"></SelectMenu>
            </div>

             <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.priceType" @change="formChange">
                <option value="change">Price change</option>
                <option value="gain">Price gain</option>
                <option value="loss">Price loss</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.priceChange" @change="formChange" />
              <div class="text-secondary">{{ watchOptions.priceChange | toFixed( 1 ) }}%</div>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.volumeType" @change="formChange">
                <option value="change">Volume change</option>
                <option value="gain">Volume gain</option>
                <option value="loss">Volume loss</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.volumeChange" @change="formChange" />
              <div class="text-secondary">{{ watchOptions.volumeChange | toFixed( 1 ) }}%</div>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.priceCheck" @change="formChange">
                <option value="above">Price above</option>
                <option value="below">Price below</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="text" placeholder="0.00000000" v-model="watchOptions.price" @keyup="numInput" @change="formChange" />
              <div class="text-secondary">{{ watchOptions.market }}</div>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.volumeCheck" @change="formChange">
                <option value="above">Volume above</option>
                <option value="below">Volume below</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="text" placeholder="0000" v-model="watchOptions.volume" @keyup="numInput" @change="formChange" />
              <div class="text-secondary">{{ watchOptions.market }}</div>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.timeCheck" @change="formChange">
                <option value="less">Within last</option>
                <option value="more">Wait past</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="range" min="0" max="60" step="1" v-model="watchOptions.timeLimit" @change="formChange" />
              <div class="text-secondary">{{ watchOptions.timeLimit | toNoun( 'min', 'mins' ) }}</div>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.changeCheck" @change="formChange">
                <option value="above">24h % above</option>
                <option value="below">24h % below</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.change" @change="formChange" />
              <span class="text-secondary">{{ watchOptions.change | toFixed( 1 ) }}%</span>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.volatilityCheck" @change="formChange">
                <option value="above">Volatility above</option>
                <option value="below">Volatility below</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.volatility" @change="formChange" />
              <span class="text-secondary">{{ watchOptions.volatility | toFixed( 1 ) }}%</span>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.dangerCheck" @change="formChange">
                <option value="above">Danger above</option>
                <option value="below">Danger below</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.danger" @change="formChange" />
              <span class="text-secondary">{{ watchOptions.danger | toFixed( 1 ) }}%</span>
            </div>

            <div class="form-input text-nowrap">
              <SelectMenu class="push-right" v-model="watchOptions.filterType" @change="formChange">
                <option value="allow">Only tokens</option>
                <option value="deny">Skip tokens</option>
              </SelectMenu>
              <input class="flex-1 push-right" type="text" placeholder="TOKEN1 TOKEN2 ..." v-model="watchOptions.filterText" @change="formChange"  />
            </div>

            <div>
              <button
                type="button"
                class="form-btn iconLeft"
                :class="{ 'bg-danger-hover icon-stop': active, 'bg-success-hover icon-play': !active }"
                :disabled="!tickerStatus"
                @click.prevent="toggleWatch">
                  {{ active ? 'Watching '+ elapsed +' ...' : 'Start watching ...' }}
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  </div>
</template>

<script>
import watchPresets from '../configs/watchPresets';
import Watcher from '../modules/watcher';
import SelectMenu from './SelectMenu.vue';

// component
export default {

  // sub components
  components: { SelectMenu },

  // component props
  props: {
    header: { type: Object, default() { return {} } },
    options: { type: Object, default() { return {} }, required: true },
    tickerStatus: { type: Number, default: 0, required: true },
    priceData: { type: Array, default() { return [] }, required: true },
    assetsList: { type: Array, default() { return [] }, required: true },
    marketsData: { type: Object, default() { return {} }, required: true },
  },

  // comonent data
  data() {
    return {
      // display
      visible: false,
      overflow: false,
      under: true,
      sto: null,
      // price watch
      watcher:  new Watcher(),
      countInfo: '...',
      active: false,
      start: 0,
      elapsed: '0s',
      // watchform options
      watchPreset: '', // selected name
      watchPresets: watchPresets,
      watchOptions: {
        market: 'BTC', // market pair
        priceType: 'change', // change, gain, loss
        priceChange: '2', // change percent
        priceCheck: 'below', // above, below
        price: '', // custom price limit
        volumeType: 'gain', // change, gain, loss
        volumeChange: '1', // change percent
        volumeCheck: 'above', // above, below
        volume: '', // custom volume limit
        changeCheck: 'above', // above, below
        change: '0', // custom 24h percent change
        volatilityCheck: 'below', // above, below
        volatility: '0', // custom volatility limit
        dangerCheck: 'below', // above, below
        danger: '0', // custom danger limit
        timeCheck: 'less', // more, less
        timeLimit: '10', // limit change by time (mins)
        filterType: 'deny', // deny, allow
        filterText: '', // csv tokens str
      },
    }
  },

  // watch methods
  watch: {

    // check prices when list updates, if enabled
    priceData() {
      this.updateWatchCount();
      this.checkPrices();
    }
  },

  // computed methods
  computed: {

    // build markets select options
    marketOptions() {
      let options = [];
      for ( let key in this.marketsData ) {
        if ( !this.marketsData.hasOwnProperty( key ) ) continue;
        let { token, count } = this.marketsData[ key ];
        options.push( { value: token, text: `${token} Pairs (${count})` } );
      }
      return options;
    },

    // get presets list
    presetsList() {
      return this.watchPresets.map( p => {
        p.active = ( this.watchPreset === p.name ) ? true : false;
        return p;
      });
    },
  },

  // custom methods
  methods: {

    // toggle open/close
    toggle( e ) {
      if ( this.visible ) { this.close( e ); }
      else { this.open( e ); }
    },

    // open from container
    open( e ) {
      if ( !this.$refs.watchform || this.visible ) return;
      // start open animation
      this.visible = true;
      this.overflow = false;
      this.under = false;
      const box = this.$refs.watchform.firstChild.getBoundingClientRect();
      this.$refs.watchform.style.maxHeight = box.height +'px';
      // allow overflowing once it's open
      if ( this.sto ) clearTimeout( this.sto );
      this.sto = setTimeout( () => { this.overflow = true }, 400 );
    },

    // close from container
    close( e ) {
      if ( !this.$refs.watchform || !this.visible ) return;
      // start closing animation
      this.visible = false;
      this.overflow = false;
      this.$refs.watchform.style.maxHeight = '0px';
      // send to back once hidden
      if ( this.sto ) clearTimeout( this.sto );
      this.sto = setTimeout( () => { this.under = true }, 400 );
    },

    // only allow numbers for some form inputs
    numInput( e ) {
      this.watchOptions.price  = String( this.watchOptions.price ).replace( /[^\d\.\-]+/g, '' );
      this.watchOptions.volume = String( this.watchOptions.volume ).replace( /[^\d\.\-]+/g, '' );
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
        this.watchPreset = preset.name;
        this.watchOptions = Object.assign( this.watchOptions, preset.options );
        this.buildSnapshot();
        this.$notify.flush();
      }
    },

    // reset some things when the form is changed while runnig
    formChange( e ) {
      this.watchPreset = '';
      this.buildSnapshot();
      this.$notify.flush();
    },

    // start price watch
    startWatch() {
      if ( this.active || this.tickerStatus !== 2 ) return;
      this.active = true;
      this.elapsed = '0s';
      this.buildSnapshot();
      this.$bus.emit( 'priceWatch', this.active );
      this.$bus.emit( 'showNotice', 'Price watch is now active.', 'success' );
    },

    // stop price watch
    stopWatch() {
      if ( !this.active ) return;
      this.active = false;
      this.$notify.flush();
      this.$bus.emit( 'priceWatch', this.active );
      this.$bus.emit( 'showNotice', 'Price watch has stopped.', 'warning' );
    },

    // toggle price watch
    toggleWatch( e ) {
      e && e.preventDefault();
      if ( this.active ) { this.stopWatch(); }
      else { this.startWatch(); }
    },

    // control watchform component
    toggleWatchform( action ) {
      switch ( action ) {
        case 'open'   :  return this.open();
        case 'close'  :  return this.close();
        case 'toggle' :  return this.toggle();
        case 'start'  :  return this.startWatch();
        case 'stop'   :  return this.stopWatch();
      }
    },

    // make a copy of current prices to start comparing against
    buildSnapshot() {
      this.start = Date.now();
      this.watcher.setOptions( this.watchOptions );
      this.watcher.updateSnapshot( this.priceData );
    },

    // count total pairs for select option
    updateWatchCount() {
      if ( !this.visible ) return;
      let market = String( this.watchOptions.market || '' );
      let count = this.watcher.watchCount( this.priceData );
      this.countInfo = this.$utils.noun( count, market +' pair', market +' pairs' );
      this.elapsed = this.$utils.elapsed( ( Date.now() - this.start ) / 1000 ) || '0s';
    },

    // check current prices against snapshot based on options
    checkPrices() {
      if ( !this.active ) return;
      this.watcher.check( this.priceData, ( p, pc, vc, t ) => {

        let pricePerc = pc.sign + Number( pc.percent ).toFixed( 2 ) + '%';
        let volPerc   = vc.sign + Number( vc.percent ).toFixed( 2 ) + '%';
        let curPrice  = 'Price '+ pc.arrow +' '+ pricePerc +' ('+ Number( p.close ).toFixed( 8 ) +' '+ p.market +')';
        let curVol    = 'Volume '+ vc.arrow +' '+ volPerc +' ('+ this.$utils.money( p.assetVolume, 0 ) +' '+ p.market +')';
        let curVolat  = 'Volatility ● '+ Number( p.volatility ).toFixed( 1 ) +'% 24h';
        let elapsed   = 'Last ● '+ this.$utils.elapsed( t );
        let title     = [ p.name, '('+ p.pair +')', p.sign + Number( p.percent ).toFixed( 2 ) +'%' ].join( ' ' );
        let info      = [ curPrice, curVol, curVolat, elapsed ].join( '\n' );
        let icon      = this.$utils.fullUrl( p.image );

        this.$notify.add( title, info, icon, e => { this.$bus.emit( 'setRoute', p.route ) } );
        this.$messenger.add( title, info, icon );
        this.$history.add( title, info, icon );
      });
    },
  },

  // on component created
  created() {
    this.$bus.on( 'toggleWatchform', this.toggleWatchform );
    window.addEventListener( 'resize', this.close );
  },

  // on component mounted
  mounted() {
    this.buildSnapshot();
  },

  // on component destroyed
  destroyed() {
    window.removeEventListener( 'resize', this.close );
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
      transition: max-height $fxSpeed $fxEase;
      max-height: 0;

      .container {
        padding-top: 1em;
        padding-bottom: 2em;
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

  // allow overflow
  &.overflow {
    .watchform-container { overflow: visible; }
  }

  // hidden state
  &.under {
    pointer-events: none;
    z-index: $zindexUnder;
  }
}
</style>
