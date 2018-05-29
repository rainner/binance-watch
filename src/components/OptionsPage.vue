<template>
  <section>

    <div class="push-bottom">
      <div class="form-label push-bottom">
        CORS Proxy URL <i class="icon-down-open"></i>
      </div>

      <div class="text-grey push-bottom">
        <p>
          External proxy server used to route outgoing HTTP requests from this app to get around the browser's built-in
          <a class="text-nowrap" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" target="_blank">Cross-Origin Resource Sharing</a>
          (CORS) protection.
        </p>
      </div>

      <form class="cors-form flex-row flex-middle flex-stretch" action="#" @submit="corsFormSubmit" :disabled="testing">
        <div class="form-input flex-1 push-right">
          <span class="push-right" :class="{ 'icon-check text-gain': urlSuccess, 'icon-close text-loss': !urlSuccess, 'icon-clock text-warning': testing }"></span>
          <input type="text" name="proxyurl" placeholder="https://..." v-model="corsProxyUrl" :class="{ 'text-success': urlSuccess, 'text-danger': !urlSuccess, 'text-grey': testing }" />
        </div>
        <button class="form-btn bg-grey-hover" type="submit">
          <i class="icon-reload" :class="{ 'iconSpin': testing }"></i> Test
        </button>
      </form>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">
        Browser Notifications <i class="icon-down-open"></i>
      </div>

      <Toggle class="push-bottom"
        :text="'Grant permission to receive browser notifications'"
        v-model="canNotify"
        @click="askNotifyPermission">
      </Toggle>

      <Toggle class="push-bottom"
        :text="'Play a notification sound'"
        v-model="options.playSound"
        @change="applyOptions">
      </Toggle>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">
        E-mail Notifications with Mailgun API <i class="icon-down-open"></i>
      </div>

      <div class="text-grey push-bottom">
        <p>
          This app runs on the browser, so you will need to use an external service, such as Mailgun to handle outgoing e-mails.
          Provide your <a class="text-nowrap" href="https://www.mailgun.com/" target="_blank">Mailgun API</a> info here.
        </p>
      </div>

      <Toggle class="push-bottom"
        :text="'Enable e-mail notifications using Mailgun API'"
        v-model="options.mailgunOn">
      </Toggle>

      <div class="form-input push-bottom">
        <span class="text-nowrap text-grey push-right">Mailgun Domain:</span>
        <input class="flex-1" type="text" placeholder="mysite.com" v-model="options.mailgunDomain" />
      </div>

      <div class="form-input push-bottom">
        <span class="text-nowrap text-grey push-right">Mailgun API Key:</span>
        <input class="flex-1" type="text" placeholder="key-..." v-model="options.mailgunKey" />
      </div>

      <div class="form-input push-bottom">
        <span class="text-nowrap text-grey push-right">Recipient E-mail:</span>
        <input class="flex-1" type="text" placeholder="me@site.com" v-model="options.mailgunEmail" />
      </div>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">
        Latest News &amp; Events <i class="icon-down-open"></i>
      </div>

      <Toggle class="push-bottom"
        :text="'Auto re-fetch latest news data on a timer'"
        v-model="options.autoRefetch"
        @change="applyOptions">
      </Toggle>

      <Toggle class="push-bottom"
        :text="'Notify when latest news data is available'"
        v-model="options.notifyNews"
        @change="applyOptions">
      </Toggle>
    </div>

  </section>
</template>

<script>
// sub components
import Toggle from './Toggle.vue';

export default {

   // component list
  components: { Toggle },

  // component props
  props: {
    options: { type: Object, required: true },
  },

  // component data
  data() {
    return {
      corsProxyUrl: '',
      canNotify: false,
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

    // ask user for notification permission
    askNotifyPermission( e ) {
      e.preventDefault();
      this.canNotify = false;
      this.$notify.permission( status => {
        this.canNotify = ( status === 'granted' ) ? true : false;
      });
    },

    // apply options
    applyOptions() {
      this.$emit( 'saveOptions', { corsProxyUrl: this.corsProxyUrl } );
    },

  },

  // test cors url when component mounts
  mounted() {
    this.corsProxyUrl = this.options.corsProxyUrl;
    this.canNotify = this.$notify.canNotify();
    // this.corsTest( this.corsProxyUrl );
  },

  // save options when component closes
  beforeDestroy() {
    this.applyOptions();
  },
}
</script>
