<template>
  <section>

    <div v-if="sentimentData" class="push-bottom">
      <span class="text-bright text-clip">Sentiment for {{ pairData.name }} is &nbsp;</span>
      <span class="text-gain icon-like iconLeft" v-if="sentimentData.score > 0">Positive (+{{ sentimentData.score }})</span>
      <span class="text-loss icon-dislike iconLeft" v-else-if="sentimentData.score < 0">Negative ({{ sentimentData.score }})</span>
      <span class="text-info icon-info iconLeft" v-else>Neutral ({{ sentimentData.score }})</span>
    </div>

    <div v-if="!newsList.length" class="icon-info iconLeft text-grey push-bottom">
      <span v-if="pairData.token">There are no news/events data for {{ pairData.name }}.</span>
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
import sentiment from '../modules/sentiment';
import utils from '../modules/utils';

// component
export default {

  // component props
  props: {
    newsData: { type: Object, default: {}, required: true },
    pairData: { type: Object, default: () => { return {} } },
  },

  // component data
  data() {
    return {
      sentimentData: null,
    }
  },

  // computed methods
  computed: {

    // get filtered list and emit list length
    newsList() {
      let list = this.getNewsList();
      this.$emit( 'listCount', list.length );
      return list;
    },
  },

  // component methods
  methods: {

    // get news list for a token, or all items
    getNewsList() {
      let list = this.newsData.list || [];
      let pair = this.pairData;
      if ( pair.token ) list = utils.search( list, 'title', pair.token +'|'+ pair.name );
      return list;
    },

    // analize news data for token
    analizeNewsList() {
      let data = null;
      let list = this.getNewsList();

      if ( list.length && this.pairData.token ) {
        let text = list.reduce( ( a, n ) => a += ' '+ n.title, '' );
        data = sentiment.analyze( text );
      }
      this.sentimentData = data;
    },
  },

  // on mounted
  mounted() {
    this.analizeNewsList();
  },
}
</script>
