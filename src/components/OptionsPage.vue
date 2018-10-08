<template>
  <section>

    <div class="push-bottom">
      <div class="form-label push-bottom">
        Browser Notifications <i class="icon-down-open"></i>
      </div>

      <div class="push-bottom">
        <Toggle :text="'Grant permission to receive browser notifications'" v-model="canNotify" @click="askNotifyPermission"></Toggle>
        <Toggle :text="'Play a notification sound effect'" v-model="options.audio.enabled" @change="applyOptions"></Toggle>
      </div>

      <div class="flex-row flex-middle flex-stretch">
        <div class="form-input push-right">
          <div class="text-grey text-nowrap">Sound:&nbsp;<i class="icon-down-open">&nbsp;</i></div>
          <select class="flex-1 push-right" v-model="options.audio.file" @change="applyOptions( true )">
            <option v-for="a of audioList" :key="a.name" :value="a.file">{{ a.name }}</option>
          </select>
          <button class="text-bright icon-play" @click="playSound()"></button>
        </div>
        <div class="form-input">
          <span class="text-grey push-right">Volume:</span>
          <input type="range" min="0.1" max="1.0" step="0.1" v-model="options.audio.volume" @change="applyOptions( true )" />
          <span class="push-left">{{ options.audio.volume }}</span>
        </div>
      </div>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">
        Outgoing Requests &amp; Notifications (Advanced) <i class="icon-down-open"></i>
      </div>
      <Tabs class="push-bottom">

        <!-- proxy -->
        <section btn-class="icon-network" btn-name="CORS Proxy" active>
          <form class="cors-form flex-row flex-middle flex-stretch push-bottom" action="#" @submit="corsFormSubmit" :disabled="testing">
            <div class="form-input flex-1 push-right">
              <span class="text-nowrap text-grey push-right">Proxy:</span>
              <input type="text" name="proxyurl" placeholder="https://..." v-model="corsProxy" @blur="applyOptions" />
              <span class="push-left" :class="{ 'icon-check text-gain': urlSuccess, 'icon-close text-loss': !urlSuccess, 'icon-clock text-warning': testing }"></span>
            </div>
            <button class="form-btn bg-info-hover push-right push-small" type="submit">
              <i class="icon-reload" :class="{ 'iconSpin': testing }"></i> Test
            </button>
            <button class="form-btn bg-success-hover" type="button" @click="addProxy( corsProxy )">
              <i class="icon-check"></i> Save
            </button>
          </form>
          <div class="flex-list push-bottom">
            <div v-for="p of proxyList" :key="p.url" class="flex-item flex-row flex-middle flex-stretch">
              <div class="flex-1 icon-network iconLeft clickable text-clip push-right" :class="{ 'text-success': p.selected }" @click="setProxy( p.url )">{{ p.url }}</div>
              <button class="icon-close text-danger-hover" type="button" @click="removeProxy( p.url )"></button>
            </div>
          </div>
          <div class="text-small text-grey">
            <p>
              External proxy server used to route outgoing HTTP requests from this app to get around the browser's built-in
              <a class="text-nowrap" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" target="_blank">Cross-Origin Resource Sharing</a>
              (CORS) protection. You can run your own proxy server by installing
              <a class="text-nowrap" href="https://github.com/Rob--W/cors-anywhere" target="_blank">CORS-Anywhere</a>.
            </p>
          </div>
        </section>

        <!-- mailgun -->
        <section btn-class="icon-at" btn-name="Mailgun API">
          <Toggle class="push-bottom"
            :text="'Enable notifications using Mailgun API'"
            v-model="options.mailgun.enabled"
            @change="applyOptions">
          </Toggle>
          <div class="form-input push-bottom">
            <span class="text-nowrap text-grey push-right">Mailgun Domain:</span>
            <input class="flex-1" type="text" placeholder="mysite.com" v-model="options.mailgun.domain" @blur="applyOptions" />
          </div>
          <div class="form-input push-bottom">
            <span class="text-nowrap text-grey push-right">Mailgun API Key:</span>
            <input class="flex-1" type="text" placeholder="key-..." v-model="options.mailgun.apikey" @blur="applyOptions" />
          </div>
          <div class="form-input push-bottom">
            <span class="text-nowrap text-grey push-right">Recipient E-mail:</span>
            <input class="flex-1" type="text" placeholder="me@site.com" v-model="options.mailgun.email" @blur="applyOptions" />
          </div>
          <div class="text-small text-grey">
            <p>
              This app can connect to the <a class="text-nowrap" href="https://www.mailgun.com/" target="_blank">Mailgun API</a>
              for sending outgoing e-mail notifications using a Mailgun account. You will need to add your Mailgun account details above.
            </p>
          </div>
        </section>

        <!-- telegram -->
        <section btn-class="icon-submit" btn-name="Telegram API">
          <Toggle class="push-bottom"
            :text="'Enable notifications using Telegram Bot API'"
            v-model="options.telegram.enabled"
            @change="applyOptions">
          </Toggle>
          <div class="form-input push-bottom">
            <span class="text-nowrap text-grey push-right">Telegram Bot Key:</span>
            <input class="flex-1" type="text" placeholder="00000:xxxxx..." v-model="options.telegram.botkey" @blur="applyOptions" />
          </div>
          <div class="form-input push-bottom">
            <span class="text-nowrap text-grey push-right">Telegram User ID:</span>
            <input class="flex-1" type="text" placeholder="0000000..." v-model="options.telegram.userid" @blur="applyOptions" />
          </div>
          <div class="text-small text-grey">
            <p>
              This app can connect to the <a class="text-nowrap" href="https://core.telegram.org/bots#creating-a-new-bot" target="_blank">Telegram Bot API</a>
              for sending outgoing notifications using the Telegram app on desktop or mobile.
              You will need to provide a Bot API Token and the User chat ID above.
              You can use a bot such as <a href="https://t.me/@JsonDumpBot" target="_blank">@JsonDumpBot</a> to find out what your user chat_id is.
            </p>
          </div>
        </section>
      </Tabs>
    </div>

  </section>
</template>

<script>
// sub components
import Tabs from './Tabs.vue';
import Toggle from './Toggle.vue';
import utils from '../modules/utils';

export default {

  // component list
  components: { Tabs, Toggle },

  // component props
  props: {
    options: { type: Object, required: true },
  },

  // component data
  data() {
    return {
      corsProxy: '',
      canNotify: false,
      urlSuccess: true,
      testing: false,
      // notification choices
      audioFiles: [
        { name: 'Audio 1', file: 'public/audio/audio_1.mp3' },
        { name: 'Audio 2', file: 'public/audio/audio_2.mp3' },
        { name: 'Audio 3', file: 'public/audio/audio_3.mp3' },
        { name: 'Audio 4', file: 'public/audio/audio_4.mp3' },
        { name: 'Audio 5', file: 'public/audio/audio_5.mp3' },
      ]
    }
  },

  // computed methods
  computed: {

    // build dropdown audio list
    audioList() {
      return this.audioFiles.map( a => {
        a.selected = ( a.file === this.options.audio.file ) ? true : false;
        return a;
      });
    },

    // list of saved proxies
    proxyList() {
      return this.options.proxylist.map( url => {
        let selected = ( url === this.options.proxy ) ? true : false;
        return { url, selected };
      });
    },
  },

  // custom methods
  methods: {

    // play selected notification sound
    playSound() {
      let { file, volume } = this.options.audio;
      utils.playAudio( file, volume );
    },

    // apply options
    applyOptions( audio ) {
      let options = Object.assign( {}, this.options, { proxy: this.corsProxy } );
      this.$bus.emit( 'setOptions', options );
      if ( audio ) this.playSound();
    },

    // add proxy to options list
    addProxy( url ) {
      if ( !url ) return;
      this.options.proxylist = this.options.proxylist.filter( p => p !== url );
      this.options.proxylist.push( url );
      this.$bus.emit( 'showNotice', 'Proxy URL added to list.', 'success' );
      this.applyOptions();
    },

    // remove proxy from options list
    removeProxy( url ) {
      if ( !url ) return;
      this.options.proxylist = this.options.proxylist.filter( p => p !== url );
      this.$bus.emit( 'showNotice', 'Proxy URL removed from list.', 'success' );
      this.applyOptions();
    },

    // set active proxy from list
    setProxy( url ) {
      this.corsProxy = url;
      this.options.proxy = url;
      this.applyOptions();
    },

    // test cors proxy url
    testProxy( url ) {
      this.testing = true;

      this.$ajax.get( url, {
        type: 'text',
        proxy: false, // don't proxy the proxy

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
      this.testProxy( url );
    },

    // ask user for notification permission
    askNotifyPermission( e ) {
      e.preventDefault();
      this.canNotify = false;
      this.$notify.permission( status => {
        this.canNotify = ( status === 'granted' ) ? true : false;
      });
    },
  },

  // test cors url when component mounts
  mounted() {
    this.corsProxy = this.options.proxy;
    this.canNotify = this.$notify.canNotify();
  },
}
</script>
