<template>
  <section>

    <div v-if="!pairData.token" class="push-bottom">
      List of aggregated news and upcoming crypto events ({{ newsList.length }})
    </div>

    <div v-if="!newsList.length" class="icon-info iconLeft text-grey">
      <span v-if="pairData.token">There are no news/events for {{ pairData.token }}.</span>
      <span v-else>There are no news/events loaded.</span>
    </div>

    <div class="flex-list">
      <div v-for="n in newsList" :key="n.id" class="flex-item clickable">
        <div class="flex-1 push-right text-clip">
          <a class="icon-feedback iconLeft text-primary" :href="n.link" target="_blank">{{ n.title }}</a>
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
    newsData: { type: Object, default: {}, required: true },
    pairData: { type: Object, default: () => { return {} } },
  },

  // computed methods
  computed: {

    // filter events for thos token
    newsList() {
      let list = this.newsData.list || [];
      let news = this.newsData;
      let pair = this.pairData;

      // filter by token and name
      if ( pair.token ) {
        list = utils.search( list, 'title', pair.token +'|'+ pair.name );
      }
      // update count outside
      this.$emit( 'listCount', list.length );
      return list;
    },
  },
}
</script>
