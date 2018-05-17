<template>
  <section>

    <div v-if="!data.symbol" class="push-bottom">
      List of active alarms for all symbols ({{ alarmsList.length }})
    </div>

    <form v-if="data.symbol" class="flex-row flex-middle flex-stretch push-bottom" action="#" @submit.prevent="saveAlarm">
      <div class="form-input flex-1 push-right">
        <div class="icon-chart-line push-right"></div>
        <input class="push-right" placeholder="0.00000000" name="alarmPrice" v-model="curPrice" />
        <div class="text-grey">{{ data.asset }}</div>
      </div>
      <button type="submit" class="form-btn bg-grey-hover icon-alarm iconLeft">Set</button>
    </form>

    <div v-if="!alarmsList.length" class="icon-close iconLeft text-grey">
      <span v-if="data.symbol">There are no alarms for {{ data.symbol }}.</span>
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
          <button class="icon-close text-loss-hover" @click="deleteAlarm( a.symbol, a.id )"></button>
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
    alarms: { type: Object, default: {}, required: true },
    data: { type: Object, default: () => { return {} } }, // symbol data
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
      let list = [];

      if ( this.data.symbol ) {
        list = this.alarms.hasOwnProperty( this.data.symbol ) ? this.alarms[ this.data.symbol ] : [];
      }
      else {
        Object.keys( this.alarms ).forEach( symbol => {
          Array.from( this.alarms[ symbol ] ).forEach( alert => { list.push( alert ) } );
        });
      }
      list = list.sort( ( a, b ) => {
        if ( a.symbol < b.symbol ) return -1;
        if ( a.symbol > b.symbol ) return 1;
        return 0;
      });
      this.$emit( 'listCount', list.length );
      return list;
    },
  },

  // component methods
  methods: {

    // save a new alert for this token
    saveAlarm( e ) {
      const alarmPrice = parseFloat( e.target.alarmPrice.value ) || 0;

      if ( !alarmPrice ) {
        return this.$bus.emit( 'showNotice', 'Please enter a valid '+ this.data.asset +' price.', 'warning' );
      }
      if ( alarmPrice === this.data.close ) {
        return this.$bus.emit( 'showNotice', 'Please enter a different '+ this.data.asset +' price.', 'warning' );
      }
      let saved = this.$notify.saveAlarm( this.data.symbol, this.data.close, alarmPrice );
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the alarms data.', 'warning' );
      this.$bus.emit( 'showNotice', 'New alarm for '+ this.data.symbol +' has been saved.', 'success' );
      this.$bus.emit( 'loadAlarms' );
    },

    // remove an alert from the list by id
    deleteAlarm( symbol, id ) {
      let saved = this.$notify.deleteAlarm( symbol, id );
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the alarms data.', 'warning' );
      this.$bus.emit( 'showNotice', 'Alarm for '+ symbol +' has been removed from list.', 'success' );
      this.$bus.emit( 'loadAlarms' );
    },
  },

  // component mounted
  mounted() {
    if ( this.data.symbol ) {
      this.curPrice = Number( this.data.close ).toFixed( 8 );
    }
  },

}
</script>

