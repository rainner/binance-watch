<template>
  <div class="search-wrap form-input">
    <span class="search-icon icon-search iconLeft"></span>
    <input class="search-input flex-1 push-right" type="text" placeholder="Search..." v-model="searchStr" @click="onClick" @change="onChange" @keyup="onInput" />
    <button class="icon-close text-info-hover" @click="onReset" v-if="searchStr"></button>
  </div>
</template>

<script>
// component
export default {

  // component props
  props: {
    value: { type: String, default: '' },
  },

  // component data
  data() {
    return {
      searchStr: '',
    }
  },

  // watch methods
  watch: {
    value() {
      this.searchStr = this.value;
    },
  },

  // custom mounted
  methods: {

    onClick( e ) {
      this.$emit( 'click', e );
    },
    onChange( e ) {
      this.$emit( 'change', e );
    },
    onInput( e ) {
      this.$emit( 'input', this.searchStr );
    },
    onReset( e ) {
      this.searchStr = '';
      this.$emit( 'input', '' );
    }
  },
}
</script>
