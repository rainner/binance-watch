<template>
  <section class="history-page">

    <div class="text-grey">
      Your custom alarms and price watch alerts will be added to this list in case you miss any. &nbsp;
      <a class="icon-reset iconLeft text-danger-hover text-nowrap" href="#" :disabled="!history.length" @click.prevent="flushHistory()">Delete all entries</a>
    </div>

    <hr />

    <div v-if="!history.length" class="icon-close iconLeft text-grey">
      There's nothing here right now.
    </div>

    <div class="flex-list">
      <div v-for="e in history" :key="e.id" class="flex-item">
        <div class="flex-1 text-clip push-right">
          <small class="text-bright">{{ e.title }}</small> <br />
          <small class="text-default">{{ e.info }}</small>
        </div>
        <div class="text-clip push-right if-medium">
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

