<template>
  <section>

    <div v-if="sentimentData" class="push-bottom">
      <span class="text-bright text-clip">Sentiment for {{ pairData.name }} is &nbsp;</span>
      <span class="text-nowrap text-monospace text-small" :class="sentimentData.styles" v-html="sentimentData.sentiment"></span>
    </div>

    <div v-if="!newsList.length" class="icon-info iconLeft text-grey push-bottom">
      <span v-if="pairData.token">There are no news/events data for {{ pairData.name }}.</span>
      <span v-else>There are no news/events loaded.</span>
    </div>

    <div class="flex-list">
      <div v-for="t in newsList" :key="t.id" class="flex-item">
        <div class="flex-1 push-right">
          <a class="icon-twtr iconLeft text-primary" :href="t.link" target="_blank">{{ t.name }}</a> &nbsp;
          <small class="text-grey">@{{ t.handle }}</small> <br />
          <small class="text-bright" v-html="t.text"></small>
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
      let pair = this.pairData;
      let list = this.newsData.list || [];
      if ( pair.token ) list = utils.search( list, 'text', pair.token +'|'+ pair.name );
      return list;
    },

    // analize news data for token
    analizeNewsList() {
      let data = null;
      let list = this.getNewsList();

      if ( list.length && this.pairData.token ) {
        let text = list.reduce( ( a, t ) => a += ' '+ t.text, '' ).trim();
        data = this.$sentiment.analyze( text );
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
