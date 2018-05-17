<template>
  <section>

    <h2 class="push-bottom">Help The Developer</h2>
    <div class="push-bottom">
      If you find this app useful and would like to show your
      appreciation by making a small donation to help the developer,
      here are the crypto addresses you can use to send your donations to...
    </div>

    <hr />

    <Tabs ref="tabs">
      <section v-for="d in addrlist" :key="d.symbol" :btn-name="[ d.name + ' ('+ d.symbol +')' ]" :active="d.active">
        <div class="qr-wrap text-center">
          <div class="text-center push-bottom">Send only <span class="text-primary">{{ d.symbol }}</span> to this address:</div>
          <img class="qr-image push-bottom" :src="[ 'https://chart.googleapis.com/chart?chs=250x250&cht=qr&choe=UTF-8&chl=' + d.address ]" width="250" height="250" :alt="d.name" />
          <div class="form-input text-center">
            <span class="text-grey push-right">{{ d.symbol }}</span>
            <input class=" push-right text-center text-clip" v-model="d.address" />
            <button class="icon-copy text-primary-hover" @click="copyText( d.address )" title="Copy" v-tooltip></button>
          </div>
        </div>
      </section>
    </Tabs>

  </section>
</template>

<script>
import Tabs from './Tabs.vue';

// component
export default {

  // component list
  components: { Tabs },

  // component data
  data() {
    return {
      addrlist: [
        { name: 'Bitcoin',  symbol: 'BTC', active: true,  address: '15WptmgmALYxsrXDWgsmadL6mA1ELGGy56', },
        { name: 'Etherium', symbol: 'ETH', active: false, address: '0xd069E9F04e8612B494D894A749Ef305854DbfcA0', },
        { name: 'Litecoin', symbol: 'LTC', active: false, address: 'LP4WdbQgPSZAtXwZ7onx6PszPZ7oD3nN1Q', },
      ],
    }
  },

  // component methods
  methods: {

    // copy text to clipboard
    copyText( txt ) {
      txt = String( txt || '' ).trim();
      if ( !txt ) return;

      let input = document.createElement( 'input' );
      document.body.appendChild( input );
      input.value = txt;
      input.select();
      document.execCommand( 'Copy' );
      document.body.removeChild( input );
      this.$bus.emit( 'showNotice', 'Address copied to clipboard.', 'success' );
      input = null;
    },

  }

}
</script>


<style lang="scss">
.qr-wrap {
  display: block;
  position: relative;
  text-align: center;

  .qr-image {
    margin: 0 auto 1em auto;
    border-radius: 50%;
  }
}
</style>

