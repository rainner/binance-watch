<template>
  <section>

    <div class="flex-list">

      <div v-if="sentimentData" class="flex-header">
        <div class="flex-1">
          <span class="icon-chart-line">&nbsp;</span>
          <span class="text-info text-clip">Sentiment for {{ pairData.name }} based on {{ newsList.length | toNoun( 'tweet', 'tweets' ) }} is&nbsp;</span>
          <span class="text-nowrap" :class="sentimentData.styles" v-html="sentimentData.sentiment"></span>
        </div>
      </div>

      <div v-if="!newsList.length" class="flex-item">
        <div class="flex-1 text-info text-faded">
          <span class="icon-info">&nbsp;</span>
          <span v-if="pairData.token">There are no news/events data for {{ pairData.name }}.</span>
          <span v-else>There are no news/events loaded.</span>
        </div>
      </div>

      <div v-for="t in newsList" :key="t.id" class="flex-item">
        <div class="flex-1 push-right">
          <a class="icon-twtr iconLeft text-primary" :href="t.link" target="_blank">{{ t.name }}</a> &nbsp;
          <small class="text-default">@{{ t.handle }}</small> <br />
          <small class="text-bright" v-html="t.text"></small>
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
    pairData: { type: Object, default() { return {} } },
    newsEntries: { type: Array, default() { return [] } },
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
      return this.getNewsList();
    },
  },

  // component methods
  methods: {

    // get news list for a token, or all items
    getNewsList() {
      let pair = this.pairData;
      let list = this.newsEntries;

      if ( pair.token ) {
        let search = pair.token +'|'+ pair.name;
        list = this.$utils.search( list, 'text', search, true );
      }
      this.$emit( 'listCount', list.length );
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
