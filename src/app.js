/**
 * Main app entry file.
 */
window.DEBUG = false;

// app dependencies
import defOpts from './configs/defaultOptions';
import Options from './modules/options';
import Ajax from './modules/ajax';
import Binance from './modules/binance';
import Coincap from './modules/coincap';
import Alarms from './modules/alarms';
import History from './modules/history';
import Notify from './modules/notify';
import News from './modules/news';
import Messenger from './modules/messenger';
import Router from './modules/router';
import Bus from './modules/bus';
import Sorter from './modules/sorter';
import Scroller from './modules/scroller';
import Tooltip from './modules/tooltip';
import store from './modules/store';
import sentiment from './modules/sentiment';
import utils from './modules/utils';
import App from './components/App.vue';
import Vue from 'vue';

// setup common helper classes
const _options = new Options( defOpts );
const _ajax = new Ajax();
const _binance = new Binance();
const _coincap = new Coincap();
const _alarms = new Alarms();
const _history = new History();
const _notify = new Notify();
const _news = new News();
const _messenger = new Messenger();
const _router = new Router();
const _bus = new Bus();
const _sorter = new Sorter();
const _scroller = new Scroller();
const _tooltip = new Tooltip();

// create custom global vue properties
Object.defineProperties( Vue.prototype, {
  $opts: { get() { return _options; } },
  $ajax: { get() { return _ajax; } },
  $binance: { get() { return _binance; } },
  $coincap: { get() { return _coincap; } },
  $alarms: { get() { return _alarms; } },
  $history: { get() { return _history; } },
  $notify: { get() { return _notify; } },
  $news: { get() { return _news; } },
  $messenger: { get() { return _messenger; } },
  $router: { get() { return _router; } },
  $scroller: { get() { return _scroller; } },
  $bus: { get() { return _bus; } },
  $sorter: { get() { return _sorter; } },
  $store: { get() { return store; } },
  $sentiment: { get() { return sentiment; } },
  $utils: { get() { return utils; } },
});

// single tooltip instance for entire app
Vue.directive( 'tooltip', {
  bind: el => { _tooltip.select( el ); },
  unbind: el => { _tooltip.unselect( el ); },
});

// global filters used to format currency and price change values
Vue.filter( 'toLinks', ( text ) => utils.linkUrl( text ) );
Vue.filter( 'toNoun', ( num, s, p ) => utils.noun( num, s, p ) );
Vue.filter( 'toElapsed', ( time, suffix, short ) => utils.elapsed( ( Date.now() - time ) / 1000, suffix, short ) );
Vue.filter( 'toDate', ( time, full ) => utils.date( time, full ) );
Vue.filter( 'toMoney', ( num, decimals ) => utils.money( num, decimals ) );
Vue.filter( 'toFixed', ( num, asset ) => utils.fixed( num, asset ) );

// init and/or render
window.addEventListener( 'load', e => {
  if ( window.top !== window ) return;
  document.body.setAttribute( 'tabindex', '0' );
  new Vue( { el: '#app', render: h => h( App ) } );
});
