/**
 * Sends out notification using the Telegram Bot API
 *
 * @param {object}  ajax     Ajax module object
 * @param {object}  options  Telegram app options
 * @param {array}   queue    List of message objects to send
 */
export default function( ajax, options, queue ) {
  return new Promise( ( resolve, reject ) => {

    let botkey   = String( options.botkey || '' ).trim();
    let userid   = String( options.userid || '' ).trim();
    let endpoint = 'https://api.telegram.org/bot'+ botkey +'/sendMessage';
    let message  = '';

    if ( !ajax || !options || !options.enabled ) return resolve();
    if ( !Array.isArray( queue ) || !queue.length ) return resolve();
    if ( !botkey || !userid ) return resolve();

    queue.forEach( m => {
      message += `<b>${ m.title }</b> \n`;
      message += `${ m.info } \n`;
      message += `\n`;
    });

    const formdata = new FormData();
    formdata.append( 'chat_id', userid );
    formdata.append( 'text', message );
    formdata.append( 'parse_mode', 'html' );

    ajax.post( endpoint, {
      type: 'json',
      data: formdata,
      done: ( xhr, status, response ) => {
        if ( !response || !response.ok ) return reject( 'Telegram notifications could not be sent.' );
        return resolve( 'Telegram notifications sent to user ('+ userid +').' );
      },
    });
  });
}
