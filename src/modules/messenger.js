/**
 * Binance socket api wrapper class
 */
import Bus from './bus';

export default class Messenger extends Bus {

  // constructor
  constructor( options ) {
    super();
    this._ajax = null;
    this._sto = null;
    this._queue = [];
    this._options = Object.assign( {
      // how often to check the queue
      seconds: 60,
      // API options for mailgun
      mailgun: { enabled: false, apikey: '', email: '', domain: '' },
      // API options for telegram
      telegram: { enabled: false, botkey: '', userid: '' },
      // ...
    }, options );
  }

  /**
   * Merge options
   * @param {object}  options  Options object
   */
  setOptions( options ) {
    Object.assign( this._options, options );
  }

  /**
   * Set ajax module reference to use for requests
   * @param {object}  ajax  Ajax class instance
   */
  useAjax( ajax ) {
    this._ajax = ajax;
  }

  /**
   * Push message data to queue
   * @param {string}  title     Message title
   * @param {string}  message   Message text
   * @param {string}  image     Message image/icon
   * @param {*}       data      Optional data
   */
  add( title, message, image, data ) {
    title   = String( title || '' );
    message = String( message || '' );
    image   = String( image || '' );
    if ( !title || !message ) return;
    this._queue.push( { title, message, image, data } );
  }

  /**
   * Flush queue data
   */
  flush() {
    this._queue = [];
  }

  /**
   * Start the timer
   */
  start() {
    this.stop();
    this._checkQueue();
  }

  /**
   * Stop the timer
   */
  stop() {
    if ( this._sto ) clearTimeout( this._sto );
  }

  /**
   * Queue checker
   */
  _checkQueue() {
    const secs = parseInt( this._options.seconds ) || 0;
    this._sto  = setTimeout( this._checkQueue.bind( this ), 1000 * secs );
    if ( !secs || !this._queue.length ) return;
    this.emit( 'queue', this._queue );
    this._mailgunSend();
    this._telegramSend();
    this._queue = [];
  }

  /**
   * Send queue messages using Mailgun API
   */
  _mailgunSend() {
    let { enabled, apikey, email, domain } = this._options.mailgun;
    if ( !enabled || !apikey || !email || !domain || !this._ajax ) return;
    let content = '';

    this._queue.forEach( q => {
      let { title, message, image } = q;
      message = String( message ).replace( /\n+/g, ' <br />' );
      content += `
      <div style="border-top: 1px dashed rgba( 0,0,0,0.1 ); margin: 0 0 1em 0;">
        <table width="100%" border="0">
          <tr>
            <td><img src="${ image }" alt="image" style="width: 42px; height: auto; margin: 0 .5em 0 0;" /></td>
            <td width="100%"><b>${ title }</b> <br /> ${ message }</td>
          </tr>
        </table>
      </div>`;
    });

    const html = `
    <!DOCTYPE html>
    <html lang="en-US">
      <body style="margin: 0; padding: 0;">
        <div style="font-family: monospace; font-size: 10px; padding: 1em;">
          ${ content }
        </div>
      </body>
    </html>`;

    const fdata = new FormData();
    fdata.append( 'from', 'Binance Watch App <noreply@'+ domain +'>' );
    fdata.append( 'to', 'E-mail Recipient <'+ email +'>' );
    fdata.append( 'subject', 'Binance Watch E-mail Notifications ('+ this._queue.length +')' );
    fdata.append( 'html', String( html ).trim() );

    this._ajax.post( 'https://api.mailgun.net/v3/'+ domain +'/messages', {
      type: 'json',
      data: fdata,
      auth: { username: 'api', password: apikey },
      done: ( xhr, status, response ) => {
        if ( !response || !response.id ) return console.warn( 'Mailgun-API', status, response );
        this.emit( 'sent', 'E-mail notifications sent to ('+ email +').' );
      },
    });
  }

  /**
   * Send queue messages using Telegram API
   */
  _telegramSend() {
    let { enabled, botkey, userid } = this._options.telegram;
    if ( !enabled || !botkey || !userid || !this._ajax ) return;
    let content = '';

    this._queue.forEach( q => {
      let { title, message } = q;
      content += `<b>${ title }</b> \n`;
      content += `${ message } \n`;
      content += `\n`;
    });

    const fdata = new FormData();
    fdata.append( 'chat_id', userid );
    fdata.append( 'text', String( content ).trim() );
    fdata.append( 'parse_mode', 'html' );

    this._ajax.post( 'https://api.telegram.org/bot'+ botkey +'/sendMessage', {
      type: 'json',
      data: fdata,
      done: ( xhr, status, response ) => {
        if ( !response || !response.ok ) return console.warn( 'Telegram-API', status, response );
        this.emit( 'sent', 'Telegram notifications sent to ('+ userid +').' );
      },
    });

  }

}
