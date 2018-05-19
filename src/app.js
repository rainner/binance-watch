/**
 * Main client web app entry file for webpack.
 */
import './modules/polyfills';
import Router from './modules/router';
import Ajax from './modules/ajax';
import Notify from './modules/notify';
import Tooltip from './modules/tooltip';
import store from './modules/store';
import history from './modules/history';
import bus from './modules/bus';
import utils from './modules/utils';
import App from './components/App.vue';
import Vue from 'vue';

// helper class instances
const _router = new Router();
const _ajax = new Ajax();
const _notify = new Notify();
const _tooltip = new Tooltip();

// create custom global vue properties
Object.defineProperties( Vue.prototype, {
  $router: { get: function() { return _router; } },
  $ajax: { get: function() { return _ajax; } },
  $notify: { get: function() { return _notify; } },
  $store: { get: function() { return store; } },
  $history: { get: function() { return history; } },
  $bus: { get: function() { return bus; } },
});

// single tooltip instance for entire app
Vue.directive( 'tooltip', {
  bind: el => { _tooltip.select( el ); },
  unbind: el => { _tooltip.unselect( el ); },
});

// global filters used to format currency and price change values
Vue.filter( 'toElapsed', time => utils.elapsed( ( Date.now() - time ) / 1000 ) );
Vue.filter( 'toDate', time => utils.date( time ) );
Vue.filter( 'toCommas', num => utils.money( num, 0 ) );
Vue.filter( 'toCurrency', num => utils.money( num, 2 ) );
Vue.filter( 'toCents', num => Number( num ).toFixed( 3 ) );
Vue.filter( 'toSats', num => Number( num ).toFixed( 8 ) );
Vue.filter( 'toNumber', num => Number( num ).toFixed( 0 ) );

// init and/or render
new Vue({
  el: '#app',
  render: h => h( App )
});
