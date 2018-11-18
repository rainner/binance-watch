/**
 * Push notifications and custom alarms handler class
 */
import utils from './utils';

export default class Notify {

  // constructor
  constructor( options ) {
    this._queue   = [];
    this._notices = [];
    this._options = {
      // toggle notifications
      enabled: true,
      // notifications duration (secs)
      duration: 10,
      // toggle notification sound
      sound: true,
      // volume of notification sound ( 0 - 1 )
      volume: 1,
      // audio file to play on with notifications
      audio: 'public/audio/audio_3.mp3',
      // default notification image file
      image: 'public/images/notification.png',
    };
    this.setOptions( options );
    this._watchQueue();
  }

  // merge new options
  setOptions( options ) {
    Object.assign( this._options, options );
  }

  // add a notification message to the queue
  add( title, body, icon, link ) {
    if ( !title || !body ) return;
    let id = utils.randString( 20 );
    let time = Date.now();
    icon = String( icon || this._options.image );
    this._queue = this._queue.filter( n => n.title !== title );
    this._queue.push( { id, time, title, body, icon, link } );
  }

  // flush the queue
  flush() {
    this._queue = [];
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
    if ( this._options.sound ) {
      utils.playAudio( this._options.audio, this._options.volume );
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
    if ( !this._options.enabled || !this._queue.length ) return;
    if ( !this.canNotify() ) return;

    // create new notification
    let { id, time, title, body, icon, link } = this._queue.shift();
    let a = new Notification( title, { body, icon, tag: id } );

    // auto-close on optional duration
    let ttl = parseInt( this._options.duration );
    if ( ttl ) setTimeout( () => a.close(), 1000 * ttl );

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
