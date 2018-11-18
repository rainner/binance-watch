<template>
  <label class="toggle-wrap" @click="onClick">
    <input class="toggle-input" type="checkbox" :checked="value" @change="onChange" />
    <div class="toggle-switch"></div>
    <div class="toggle-text">{{ text }}</div>
  </label>
</template>

<script>
// component
export default {

  // component props
  props: {
    value: { type: Boolean, default: false },
    text: { type: String, default: '...' },
  },

  // custom mounted
  methods: {

    onClick( e ) {
      this.$emit( 'click', e );
    },

    onChange( e ) {
      this.$emit( 'input', !this.value );
      this.$emit( 'change', e );
    }
  },
}
</script>

<style lang="scss">
.toggle-wrap {
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: stretch;
  width: 100%;
  padding: .2em 0;
  cursor: pointer;

  .toggle-input {
    display: inline-block;
    position: absolute;
    visibility: hidden;
    max-width: 0;
    max-height: 0;
    left: -10000px;
  }
  .toggle-switch {
    position: relative;
    margin: 0 .6em 0 0;
    width: 2.8em;
    border-radius: 100px;
    background-color: darken( $colorDocument, 2% );
    box-shadow: $shadowHollow;

    &:before {
      content: '';
      display: block;
      margin: 0 auto;
      width: 1.4em;
      height: 1.4em;
      border-radius: 100%;
      background-color: $colorGrey;
      box-shadow: $shadowPaper;
      transform: translateX( -50% );
    }
  }
  .toggle-text {
    @include textNoSelect;
    @include textClip;
    margin: 0 0 .15em 0;
  }
  .toggle-input:checked ~ .toggle-switch:before {
    background-color: $colorSuccess;
    transform: translateX( 50% );
  }
}
</style>
