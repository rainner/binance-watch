<template>
  <section>

    <div class="flex-row flex-middle flex-space push-bottom">
      <div class="flex-1">
        List of latest crypto news from
        <a href="https://coinlib.io/news" target="_blank" rel="noopener">coinlib.io</a>.
      </div>
      <label class="form-toggle">
        <input type="checkbox" v-model="options.notifyNews" @click="$emit( 'saveOptions' )" />
        <span>Notify</span>
      </label>
    </div>

    <div v-if="!newsList.length" class="icon-close iconLeft text-grey">
      There are no news loaded.
    </div>

    <div class="flex-list">
      <div v-for="e in newsList" :key="e.uniq" class="flex-item">
        <div class="flex-1 text-clip">
          <i class="icon-feedback"></i> &nbsp;
          <a :href="e.link" target="_blank" rel="noopener">{{ e.title }}</a>
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
    news: { type: Object, required: true },
  },

  // computed methods
  computed: {

    // filter events for thos token
    newsList() {
      if ( !this.news.list ) return [];
      let list = this.news.list;
      this.$emit( 'listCount', list.length );
      return list;
    },
  },

}
</script>
