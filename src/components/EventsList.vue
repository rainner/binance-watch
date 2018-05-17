<template>
  <section>

    <div v-if="!data.token" class="flex-row flex-middle flex-space push-bottom">
      <div class="flex-1">
        List of hot upcoming crypto events from
        <a href="https://coinmarketcal.com/" target="_blank" rel="noopener">coinmarketcal.com</a>.
      </div>
      <label class="form-toggle">
        <input type="checkbox" v-model="options.notifyEvents" @click="$emit( 'saveOptions' )" />
        <span>Notify</span>
      </label>
    </div>

    <div v-if="!eventsList.length" class="icon-close iconLeft text-grey">
      <span v-if="data.token">There are no events for {{ data.token }}.</span>
      <span v-else>There are no events loaded.</span>
    </div>

    <div class="flex-list">
      <div v-for="e in eventsList" :key="e.uniq" class="flex-item clickable" @click="openLink( e.link )">
        <div class="flex-1 push-right text-clip">
          <i class="icon-calendar"></i> &nbsp;
          <span class="text-primary">{{ e.coin }}</span> -
          <span class="text-bright">{{ e.info }}</span>
        </div>
        <div class="text-clip">
          <span class="text-grey">{{ e.date }}</span> &nbsp;
          <i class="icon-link text-gain"></i>
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
    options: { type: Object, default() { return {} } },
    data: { type: Object, default() { return {} } }, // symbol data
    events: { type: Object, required: true },
  },

  // computed methods
  computed: {

    // filter events for thos token
    eventsList() {
      if ( !this.events.list ) return [];
      let list = this.events.list;

      if ( this.data.token ) {
        const reg = new RegExp( '\\('+ this.data.token +'\\)', 'g' ); // ..(TOKEN)..
        list = list.filter( e => reg.test( e.coin || e.info ) );
      }
      this.$emit( 'listCount', list.length );
      return list;
    },
  },

  // component methods
  methods: {

    // open external event link
    openLink( link ) {
      window.open( link, '_blank' );
    }
  }

}
</script>
