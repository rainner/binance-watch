<template>
  <section>

    <div class="push-bottom">
      <div class="form-label push-bottom">
        Binance Price Watch Web App <i class="icon-down-open"></i>
      </div>
      <p>
        This application connects to the <a class="text-primary-hover" @click="goBinance" href="#">Binance.com</a>
        public <a href="https://github.com/binance-exchange/binance-official-api-docs" target="_blank">API</a>
        to get live 24h price change data for all crypto trading pairs on their platform and allows you to set
        custom alerts or watch for price change in real time and get desktop notifications when something triggers
        your alerts or price watch settings.
      </p>
      <p>
        This app runs entirely on the browser and only makes external requests to fetch data from various
        API endpoints related to cryptocurrency. Any persisting data is stored in the browser's
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Storage" target="_blank">localStorage</a> database.
        In order to get desktop notifications, you must
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API" target="_blank">Grant Notification Permission</a>
        in your browser.
      </p>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">
        Author  Links &amp; Donation <i class="icon-down-open"></i>
      </div>
      <div class="push-bottom">
        <a class="icon-globe iconLeft" href="https://rainnerlins.com/" target="_blank">Rainner Lins</a> &nbsp;
        <a class="icon-ghub iconLeft" href="https://hithub.com/raintek" target="_blank">Github Profile</a> &nbsp;
      </div>
      <div class="push-bottom">
        This app is frequently maintained by the developer to help improve it at no cost to anyone but the developer.
        If you find this app useful, consider sending a few coins to one of the addresses below.
      </div>
    </div>

    <div class="pad-top push-bottom">
      <Spinner ref="jsonSpinner"></Spinner>
      <Tabs v-if="addrlist.length">
        <section v-for="d in addrlist" :key="d.token" :btn-name="d.name" :active="d.active">
          <div class="flex-row flex-middle flex-stretch">
            <div class="push-right">
              <img class="fx fx-zoom-in" :src="[ 'https://chart.googleapis.com/chart?chs=80x80&cht=qr&choe=UTF-8&chl=' + d.address ]" width="80" height="80" :alt="d.name" />
            </div>
            <div class="flex-1">
              <div class="form-input push-bottom">
                <span class="text-grey push-right">{{ d.token }}</span>
                <input class=" push-right text-clip" v-model="d.address" />
                <button class="icon-copy text-primary-hover" @click="copyAddress( d.token, d.address )" title="Copy" v-tooltip></button>
              </div>
              <div class="pad-left">
                <span class="text-danger icon-alert">&nbsp;</span>
                Send only <span class="text-bright">{{ d.name }} ({{ d.token }})</span> to this address!
              </div>
            </div>
          </div>
        </section>
      </Tabs>
    </div>

    <hr />

    <div class="push-bottom">
      <div class="form-label push-bottom">
        API Endpoints &amp; Assets <i class="icon-down-open"></i>
      </div>
      <ul>
        <li>
          <a href="https://github.com/binance-exchange/binance-official-api-docs" target="_blank">Binance API</a> &nbsp;
          <span>Socket connection for live 24h price change data.</span>
        </li>
        <li>
          <a href="https://github.com/CoinCapDev/CoinCap.io" target="_blank">Coincap API</a> &nbsp;
          <span>Aggregated global data for specific tokens.</span>
        </li>
        <li>
          <a href="https://www.mailgun.com/" target="_blank">Mailgun API</a> &nbsp;
          <span>Mailgun API for outgoing notifications via e-mail.</span>
        </li>
        <li>
          <a href="https://core.telegram.org/bots#creating-a-new-bot" target="_blank">Telegram Bot API</a> &nbsp;
          <span>Telegram Bot API for outgoing notifications via the app.</span>
        </li>
        <li>
          <a href="https://github.com/cjdowner/cryptocurrency-icons" target="_blank">Crypto Icons</a> &nbsp;
          <span>Nice looking crypto icons.</span>
        </li>
      </ul>
    </div>

  </section>
</template>

<script>
import Spinner from './Spinner.vue';
import Tabs from './Tabs.vue';

// component
export default {

  // component list
  components: { Spinner, Tabs },

  // component data
  data() {
    return {
      addrlist: [],
    }
  },

  // component methods
  methods: {

    // lick to binance site with ref id added
    goBinance( e ) {
      e.preventDefault();
      this.$bus.emit( 'handleClick', 'binance', '/', '_blank' );
    },

    // copy crypto address to clipboard
    copyAddress( token, address ) {
      let copied = this.$utils.copyText( address );
      if ( !copied ) return this.$bus.emit( 'showNotice', 'Oops, looks like this web browser doesn\'t support that.', 'warning' );
      this.$bus.emit( 'showNotice', token +' address copied successfully.', 'success' );
    },

    // fetch crypto addresses from json file
    fetchJson() {
      this.addrlist = [];
      this.$refs.jsonSpinner.show( 'Fetching addresses' );
      this.$ajax.get( 'public/json/donate.json', {
        type  : 'json',
        proxy : false,
        done  : ( xhr, status, response ) => {
          // check data
          if ( !response || !Array.isArray( response.addresses ) ) {
            return this.$refs.jsonSpinner.error( 'Error fetching donation addresses' );
          }
          this.$refs.jsonSpinner.hide();
          this.addrlist = response.addresses;
        }
      });
    },
  },

  // component mounted
  mounted() {
    setTimeout( this.fetchJson, 100 );
  }

}
</script>

