/**
 * Push notifications and custom alarms handler class
 */
import store from './store';
import symbolData from './symbol';
import utils from './utils';

export default class Notify {

  // constructor
  constructor( options ) {
    this._alarms   = {};
    this._queue    = [];
    this._audio    = new Audio();
    this._callback = null;
    this._options  = {
      // key used for storege data
      storeKey: 'price_alarms_data',
      // default notification image file
      imageFile: 'public/images/notification.png',
      // audio file to play on with notifications`
      soundFile: 'public/audio/notification.mp3',
      // toggle notification sound
      soundEnabled: true,
    };
    this.setOptions( options );
    this._watchQueue();
  }

  // add a notification message to the queue
  add( title, body, icon, link ) {
    if ( !title || !body ) return;
    let id = utils.randString( 20 );
    let time = Date.now();
    icon = String( icon || this._options.imageFile );
    this._queue = this._queue.filter( n => n.title !== title );
    this._queue.push( { id, time, title, body, icon, link } );
  }

  // flush the queue
  flush() {
    this._queue = [];
  }

  // merge new options
  setOptions( options ) {
    this._options = Object.assign( {}, this._options, options );
    this._audio.src = this._options.soundFile;
  }

  // load saved alarms data from local store
  loadAlarms() {
    let alarms = store.getData( this._options.storeKey );
    this._alarms = Object.assign( {}, alarms );
  }

  // get current alarms data
  getAlarms() {
    return Object.assign( {}, this._alarms );
  }

  // set handler for alarms data change
  onChange( callback ) {
    this._callback = callback;
  }

  // check and call custom alarms data handler
  callHandler() {
    if ( typeof this._callback === 'function' ) {
      let alarms = this.getAlarms();
      this._callback( alarms );
    }
  }

  // add price alert data for a symbol
  saveAlarm( symbol, curPrice, alarmPrice ) {
    symbol     = String( symbol || '' ).replace( /[^\w]+/g, '' ).toUpperCase();
    curPrice   = parseFloat( curPrice );
    alarmPrice = parseFloat( alarmPrice );

    if ( !symbol || !curPrice || !alarmPrice || curPrice === alarmPrice ) return false;

    let alert = symbolData( symbol, {
      id         : utils.randString( 20 ),
      time       : Date.now(),
      curPrice   : curPrice,
      alarmPrice : alarmPrice,
      arrow      : ( alarmPrice > curPrice ) ? '🔺' : '🔻',
      sign       : ( alarmPrice > curPrice ) ? '≥' : '≤',
      check      : ( alarmPrice > curPrice ) ? 'gain' : 'loss',
      action     : '', // todo: add custom actions
      active     : true,
    });
    if ( !this._alarms.hasOwnProperty( symbol ) ) this._alarms[ symbol ] = [];
    this._alarms[ symbol ] = this._alarms[ symbol ].filter( a => { return ( a.alarmPrice !== alert.alarmPrice ) } );
    this._alarms[ symbol ].push( alert );
    this.callHandler();
    return store.setData( this._options.storeKey, this._alarms );
  }

  // delete price alert data for a symbol
  deleteAlarm( symbol, id ) {
    if ( !symbol || !id ) return false;
    if ( !this._alarms.hasOwnProperty( symbol ) ) return true;
    this._alarms[ symbol ] = this._alarms[ symbol ].filter( a => a.id !== id );
    if ( !this._alarms[ symbol ].length ) delete this._alarms[ symbol ];
    this.callHandler();
    return store.setData( this._options.storeKey, this._alarms );
  }

  // check if alert is triggered for a symbol object
  checkAlarm( symbol, curPrice, callback ) {
    if ( !this.canNotify() ) return;
    if ( !symbol || !this._alarms.hasOwnProperty( symbol ) ) return;

    callback = ( typeof callback === 'function' ) ? callback : function() {};

    this._alarms[ symbol ].forEach( a => {
      if ( a.check === 'loss' && curPrice > a.alarmPrice ) return;
      if ( a.check === 'gain' && curPrice < a.alarmPrice ) return;

      let diff = 'equal to';
      if ( curPrice > a.alarmPrice ) diff = 'more than';
      if ( curPrice < a.alarmPrice ) diff = 'less than';

      let title = [ '🔔', a.symbol, 'price', a.arrow, curPrice, a.asset ].join( ' ' );
      let info  = a.symbol +' is now '+ diff +' your alert price of '+ a.alarmPrice +' '+ a.asset +'.';

      this.deleteAlarm( a.symbol, a.id );
      this.add( title, info, a.icon );
      callback( title, info, a );
    });
  }

  // check if notification is supported
  hasSupport() {
    return ( window && ( 'Notification' in window ) );
  }

  // check if Notification is possible
  canNotify() {
    if ( !this.hasSupport() ) return false;
    if ( Notification.permission !== 'granted' ) return false;
    return true;
  }

  // ask for browser notifications permission
  permission( callback ) {
    if ( !this.hasSupport() ) return;
    Notification.requestPermission().then( response => {
      if ( typeof callback === 'function' ) callback( response );
    });
  }

  // create notifications from the queue on a timer
  _watchQueue() {
    setTimeout( this._watchQueue.bind( this ), 1000 );
    if ( !this.canNotify() || !this._queue.length ) return;

    let { id, time, title, body, icon, link } = this._queue.shift();
    let a = new Notification( title, { body, icon } );

    if ( link && typeof link === 'string' ) {
      a.addEventListener( 'click', e => { e.preventDefault(); window.open( link, '_blank' ); } );
    }
    if ( link && typeof link === 'function' ) {
      a.addEventListener( 'click', link );
    }
    if ( this._options.soundEnabled ) {
      this._audio.play();
    }
  }

}
