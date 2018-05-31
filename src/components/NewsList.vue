<template>
  <section>

    <div v-if="!data.token" class="push-bottom">
      List of aggregated news and upcoming crypto events ({{ newsList.length }})
    </div>

    <div v-if="!newsList.length" class="icon-close iconLeft text-grey">
      <span v-if="data.token">There are no news/events for {{ data.token }}.</span>
      <span v-else>There are no news/events loaded.</span>
    </div>

    <div class="flex-list">
      <div v-for="n in newsList" :key="n.id" class="flex-item clickable">
        <div class="flex-1 push-right text-clip">
          <a class="icon-feedback iconLeft text-primary" :href="n.link" target="_blank">{{ n.title }}</a>
        </div>
        <div class="text-clip">
          <a class="text-pill icon-link iconLeft" :href="n.link" target="_blank" rel="noopener">Source</a>
        </div>
      </div>
    </div>

  </section>
</template>

<script>
import utils from '../modules/utils';

// component
export default {

  // component props
  props: {
    news: { type: Object, default: {}, required: true },
    data: { type: Object, default: () => { return {} } }, // symbol data
  },

  // computed methods
  computed: {

    // filter events for thos token
    newsList() {
      if ( !this.news.list ) return [];
      let list = this.news.list;

      if ( this.data.token ) {
        list = utils.search( list, 'title', this.data.token +'|'+ this.data.name );
      }
      this.$emit( 'listCount', list.length );
      return list;
    },
  },

}
</script>
