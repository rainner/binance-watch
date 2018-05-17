<template>
  <section class="history-page">

    <div class="flex-row flex-top flex-stretch">
      <div class="flex-1 push-right">
        Your custom alarms and price watch alerts will be added to this list in case you miss any.
        Use the flush button to delete all entries.
      </div>
      <button class="form-btn bg-danger-hover icon-reset iconLeft"
        :disabled="!history.length"
        @click="flushHistory()">
          Flush
      </button>
    </div>

    <hr />

    <div v-if="!history.length" class="icon-close iconLeft text-grey">
      There's nothing here right now.
    </div>

    <div class="flex-list">
      <div v-for="e in history" :key="e.id" class="flex-item">
        <div class="flex-1 text-clip push-right">
          <span class="text-bright">{{ e.title }}</span> <br />
          <small class="text-default">{{ e.info }}</small>
        </div>
        <div class="text-clip push-right">
          <span class="text-grey">{{ e.time | toElapsed }} ago</span>
        </div>
        <div class="text-clip">
          <button class="icon-close text-loss-hover" @click="deleteHistory( e.id )"></button>
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
    history: { type: Array, default: [], required: true },
    data: { type: Object, default() { return {} } }, // modal data
  },

  // component data
  data() {
    return {
      // ...
    }
  },

  // computed methods
  computed: {

  },

  // custom methods
  methods: {

    // delete item from history
    deleteHistory( id ) {
      let saved = this.$history.delete( id );
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the history data.', 'warning' );
      this.$bus.emit( 'showNotice', 'History data has been updated.', 'success' );
      this.$bus.emit( 'loadHistory' );
    },

    // flush history list
    flushHistory() {
      let saved = this.$history.flush();
      if ( !saved ) return this.$bus.emit( 'showNotice', 'There was a problem updating the history data.', 'warning' );
      this.$bus.emit( 'showNotice', 'History data has been flushed.', 'success' );
      this.$bus.emit( 'loadHistory' );
    },
  },

  // component mounted
  mounted() {

  },

  // component destroyed
  destroyed() {

  }

}
</script>

