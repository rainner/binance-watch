/**
 * Push notifications and custom alarms handler class
 */
import store from './store';
import utils from './utils';

export default class Notify {

  // constructor
  constructor( options ) {
    this._alarms   = {};
    this._queue    = [];
    this._notices  = [];
    this._callback = null;
    this._options  = {
      // key used for storege data
      storeKey: 'price_alarms_data',
      // default notification image file
      imageFile: 'public/images/notification.png',
      // toggle notification sound
      soundEnabled: true,
      // audio file to play on with notifications
      soundFile: 'public/audio/audio_3.mp3',
      // volume of notification sound ( 0 - 1 )
      soundVolume: 1,
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

  // could saved alarms for a symbol
  alarmsCount( symbol ) {
    if ( !symbol || !this._alarms.hasOwnProperty( symbol ) ) return 0;
    return this._alarms[ symbol ].length;
  }

  // add price alert data for a symbol
  saveAlarm( pairData, alarmPrice ) {
    if ( !pairData.symbol || pairData.close === alarmPrice ) return false;

    let { symbol, token, asset, pair, image } = pairData;
    let id      = utils.randString( 20 );
    let time    = Date.now();
    let arrow   = ( alarmPrice > pairData.close ) ? '▲' : '▼';
    let sign    = ( alarmPrice > pairData.close ) ? '≥' : '≤';
    let check   = ( alarmPrice > pairData.close ) ? 'gain' : 'loss';
    let alert   = { id, time, arrow, sign, check, symbol, token, asset, pair, image, alarmPrice };

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
    if ( !this.canNotify() || !this.alarmsCount( symbol ) ) return;
    callback = ( typeof callback === 'function' ) ? callback : function() {};

    this._alarms[ symbol ].forEach( a => {
      if ( a.check === 'loss' && curPrice > a.alarmPrice ) return;
      if ( a.check === 'gain' && curPrice < a.alarmPrice ) return;

      let diff = 'equal to';
      if ( curPrice > a.alarmPrice ) diff = 'more than';
      if ( curPrice < a.alarmPrice ) diff = 'less than';

      let title = [ a.symbol, 'price', a.arrow, curPrice, a.asset ].join( ' ' );
      let info  = [ a.symbol, 'is now', diff, 'your alert price of', a.alarmPrice, a.asset +'.' ].join( ' ' );

      this.deleteAlarm( a.symbol, a.id );
      this.add( title, info, a.image );
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

  // play notification sound if enabled
  playSound() {
    if ( this._options.soundEnabled ) {
      utils.playAudio( this._options.soundFile, this._options.soundVolume );
    }
  }

  // limit visible notifications to a fixed number
  _cleanupNotifications() {
    let limit = 3;
    if ( this._notices.length <= limit ) return;
    for ( let i = 0; i < ( this._notices.length - limit ); ++i ) {
      this._notices[ i ].close(); // trigger close event
    }
  }

  // create notifications from the queue on a timer
  _watchQueue() {
    this._cleanupNotifications();
    setTimeout( this._watchQueue.bind( this ), 500 );
    if ( !this.canNotify() || !this._queue.length ) return;

    // create new notification
    let { id, time, title, body, icon, link } = this._queue.shift();
    let a = new Notification( title, { body, icon, tag: id } );
    setTimeout( () => a.close(), 5000 );

    // keep track of visible notifications
    a.addEventListener( 'show', e => {
      if ( !e || !e.target || !e.target.tag ) return;
      this.playSound();
    });
    // remove notification from local array when it closes
    a.addEventListener( 'close', e => {
      if ( !e || !e.target || !e.target.tag ) return;
      this._notices = this._notices.filter( a => a.tag !== e.target.tag );
    });
    // convert url string to clickable link
    if ( link && typeof link === 'string' ) {
      a.addEventListener( 'click', e => { e.preventDefault(); window.open( link, '_blank' ); } );
    }
    // custom click handler
    if ( link && typeof link === 'function' ) {
      a.addEventListener( 'click', link );
    }
    // add to tracker
    this._notices.push( a );
  }

}
