<template>
  <section>

    <div class="push-bottom">
      <div class="form-label push-bottom">CORS Proxy URL</div>
      <div class="text-small push-bottom">
        External proxy server used to route XHR requests from this app to get around the browser's
        <a class="text-nowrap" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" target="_blank">Cross-Origin Resource Sharing</a>
        protection.
      </div>
      <form class="cors-form form-input" action="#" @submit="corsFormSubmit" :disabled="testing">
        <span class="push-right" :class="{ 'icon-check text-gain': urlSuccess, 'icon-close text-loss': !urlSuccess, 'icon-clock text-warning': testing }"></span>
        <input type="text" name="proxyurl" placeholder="https://..." v-model="corsProxyUrl" :class="{ 'text-success': urlSuccess, 'text-danger': !urlSuccess, 'text-grey': testing }" />
        <button class="text-primary-hover push-left" type="submit">
          <i class="icon-reload" :class="{ 'iconSpin': testing }"></i> Test
        </button>
      </form>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">Notification Sound</div>

      <label class="form-toggle push-bottom">
        <input type="checkbox" v-model="options.playSound" />
        <span>Play a notification sound</span>
      </label>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">Events &amp; News</div>

      <label class="form-toggle push-bottom">
        <input type="checkbox" v-model="options.autoRefetch" />
        <span>Auto re-fetch latest news data on a timer</span>
      </label>

      <label class="form-toggle push-bottom">
        <input type="checkbox" v-model="options.notifyNews" />
        <span>Notify when latest news data is available</span>
      </label>
    </div>

    <!--
    <hr />
    <div class="push-bottom">
      <div class="form-label push-bottom">Twitter Handle</div>
      <div class="text-small push-bottom">If you want to receive notifications as tweets, enter your Twitter handle here.</div>
      <div class="form-input">
        <span class="icon-twtr push-right"></span>
        <input type="text" placeholder="@YourName" v-model="options.twitterName" @blur="$emit( 'saveOptions' )" />
      </div>
    </div>
    -->

  </section>
</template>

<script>
export default {

  // component props
  props: {
    options: { type: Object, required: true },
  },

  // component data
  data() {
    return {
      corsProxyUrl: '',
      urlSuccess: true,
      testing: false,
    }
  },

  // custom methods
  methods: {

    // test cors proxy url
    corsTest( url ) {
      this.testing = true;

      this.$ajax.get( url, {
        type: 'text',

        error: ( xhr, status, error ) => {
          this.testing = false;
          this.urlSuccess = false;
          this.$bus.emit( 'showNotice', error, 'warning' );
        },

        success: ( xhr, status, response ) => {
          let pass = ( status && status > 199 && status < 400 );
          let clss = pass ? 'success' : 'warning';

          this.testing = false;
          this.urlSuccess = pass;
          this.$bus.emit( 'showNotice', 'Proxy URL responded with status code ('+ status +').', clss );
        }
      });
    },

    // cors proxy form submit handler
    corsFormSubmit( e ) {
      e.preventDefault();
      let url = e.target.proxyurl.value || '';
      this.corsTest( url );
    },
  },

  // test cors url when component mounts
  mounted() {
    this.corsProxyUrl = this.options.corsProxyUrl;
    // this.corsTest( this.corsProxyUrl );
  },

  // save options when component closes
  beforeDestroy() {
    this.$emit( 'saveOptions', { corsProxyUrl: this.corsProxyUrl } );
  },
}
</script>
