<template>
  <section class="history-page">

    <div class="flex-row flex-middle flex-stretch push-bottom">
      <div class="text-grey push-right">
        Your custom alarms and price watch alerts will be added to this list in case you missed any.
        Use the Flush button to delete all entries.
      </div>
      <button class="form-btn bg-danger-hover icon-reset iconLeft" :disabled="!historyData.length" @click.prevent="flushHistory()">
        Flush
      </button>
    </div>

    <div v-if="!historyData.length" class="icon-info iconLeft text-grey">
      There's nothing here right now.
    </div>

    <div class="flex-list flex-middle flex-stretch">
      <div v-for="e in historyData" :key="e.id" class="flex-item">
        <div class="push-right">
          <TokenIcon :pairData="{ icon: e.icon, token: 'N/A' }"></TokenIcon>
        </div>
        <div class="flex-1 push-right">
          <span class="text-bright">{{ e.title }}</span> <br />
          <small>{{ formatInfo( e.info ) }}</small>
        </div>
        <div class="text-clip text-right">
          <button class="icon-close" @click="deleteHistory( e.id )"></button> <br />
          <small class="text-grey">{{ e.time | toElapsed }} ago</small>
        </div>
      </div>
    </div>

  </section>
</template>

<script>
// components
import TokenIcon from './TokenIcon.vue';

// component
export default {

  // component list
  components: { TokenIcon },

  // component props
  props: {
    modalData: { type: Object, default() { return {} } },
    historyData: { type: Array, default: [], required: true },
  },

  // custom methods
  methods: {

    // delete item from history
    deleteHistory( id ) {
      let saved = this.$history.delete( id );
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the history data.', 'warning' );
      this.$bus.emit( 'showNotice', 'History data has been updated.', 'success' );
      this.$bus.emit( 'loadCacheData' );
    },

    // flush history list
    flushHistory() {
      let saved = this.$history.flush();
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the history data.', 'warning' );
      this.$bus.emit( 'showNotice', 'History data has been flushed.', 'success' );
      this.$bus.emit( 'loadCacheData' );
    },

    // format info string
    formatInfo( info ) {
      return String( info || '' ).replace( /\n+/g, ' | ' );
    }
  },
}
</script>

