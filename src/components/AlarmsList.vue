<template>
  <section>

    <div v-if="!pairData.symbol" class="text-grey push-bottom">
      List of active alarms for all symbols ({{ alarmsList.length }})
    </div>

    <form v-if="pairData.symbol" class="flex-row flex-middle flex-stretch push-bottom" action="#" @submit.prevent="saveAlarm">
      <div class="form-input flex-1 push-right">
        <div class="icon-chart-line push-right"></div>
        <input class="push-right" placeholder="0.00000000" name="alarmPrice" v-model="curPrice" />
        <div class="text-grey">{{ pairData.asset }}</div>
      </div>
      <button type="submit" class="form-btn bg-grey-hover icon-alarm iconLeft">Set</button>
    </form>

    <div v-if="!alarmsList.length" class="icon-info iconLeft text-grey">
      <span v-if="pairData.symbol">There are no alarms for {{ pairData.symbol }}.</span>
      <span v-else>There are no alarms.</span>
    </div>

    <div class="flex-list">
      <div v-for="a in alarmsList" :key="a.id" class="flex-item">
        <div class="flex-1 text-clip push-right">
          <span class="text-default icon-alarm iconLeft"></span>
          <span class="text-bright">{{ a.pair }}</span>
          <span class="text-big" :class="[ 'text-'+ a.check ]">&nbsp;{{ a.sign }}&nbsp;</span>
          <span class="text-bright">{{ a.alarmPrice | toSats }}</span>
          <span class="text-default">{{ a.asset }}</span>
        </div>
        <div class="text-clip push-right">
          <span class="text-grey">{{ a.time | toElapsed }} ago</span>
        </div>
        <div class="text-clip">
          <button class="icon-close" @click="deleteAlarm( a.symbol, a.id )"></button>
        </div>
      </div>
    </div>

  </section>
</template>

<script>
// component
export default {

  // component props
  props: {
    alarmsData: { type: Object, default: {}, required: true },
    pairData: { type: Object, default: () => { return {} } },
  },

  // comonent data
  data() {
    return {
      curPrice: '',
    }
  },

  // computed methods
  computed: {

    // filter alarms for this token
    alarmsList() {
      let list   = [];
      let alarms = this.alarmsData;
      let pair   = this.pairData;

      // filter alarms for a specific pair
      if ( pair.symbol ) {
        list = alarms.hasOwnProperty( pair.symbol ) ? alarms[ pair.symbol ] : [];
      }
      // or build list of alarms for all pairs
      else {
        Object.keys( alarms ).forEach( symbol => {
          Array.from( alarms[ symbol ] ).forEach( alarm => { list.push( alarm ) } );
        });
      }
      // sort by pair ascending
      list = list.sort( ( a, b ) => {
        if ( a.symbol < b.symbol ) return -1;
        if ( a.symbol > b.symbol ) return 1;
        return 0;
      });
      // update count outside
      this.$emit( 'listCount', list.length );
      return list;
    },
  },

  // component methods
  methods: {

    // save a new alert for this token
    saveAlarm( e ) {
      let price = parseFloat( e.target.alarmPrice.value ) || 0;
      let pair  = this.pairData;

      if ( !pair.symbol ) {
        return this.$bus.emit( 'showNotice', 'No symbol pair selected.', 'warning' );
      }
      if ( !price || price === pair.close ) {
        let word = ( price === pair.close ) ? 'different' : 'valid';
        return this.$bus.emit( 'showNotice', 'Please enter a '+ word +' '+ pair.asset +' price.', 'warning' );
      }
      let saved = this.$notify.saveAlarm( pair.symbol, pair.close, price );
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the alarms data.', 'warning' );
      this.$bus.emit( 'showNotice', 'New alarm for '+ pair.symbol +' has been saved.', 'success' );
      this.$bus.emit( 'loadCacheData' );
    },

    // remove an alert from the list by id
    deleteAlarm( symbol, id ) {
      let saved = this.$notify.deleteAlarm( symbol, id );
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the alarms data.', 'warning' );
      this.$bus.emit( 'showNotice', 'Alarm for '+ symbol +' has been removed from list.', 'success' );
      this.$bus.emit( 'loadCacheData' );
    },
  },

  // component mounted
  mounted() {
    if ( this.pairData.symbol ) {
      this.curPrice = Number( this.pairData.close ).toFixed( 8 );
    }
  },

}
</script>

