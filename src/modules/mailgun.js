/**
 * Sends out notification email using the Mailgun API
 *
 * @param {object}  ajax     Ajax module object
 * @param {object}  options  Mailgun app options
 * @param {array}   queue    List of message objects to send
 */
export default function( ajax, options, queue ) {
  return new Promise( ( resolve, reject ) => {

    let username  = 'api';
    let password  = String( options.apikey || '' ).trim();
    let recipient = String( options.email || '' ).trim();
    let domain    = String( options.domain || '' ).trim();
    let endpoint  = 'https://api.mailgun.net/v3/'+ domain +'/messages';
    let subject   = 'Binance Watch Alerts ('+ queue.length +')';
    let message   = '';
    let template  = '';

    if ( !ajax || !options || !options.enabled ) return resolve();
    if ( !Array.isArray( queue ) || !queue.length ) return resolve();
    if ( !domain || !recipient || !password ) return resolve();

    queue.forEach( m => {
      let info = String( m.info || '' ).replace( /\n+/g, ' <br />' );
      message += `
      <div style="border-top: 1px dashed rgba( 0,0,0,0.1 ); margin-top: 1em; padding-top: 1em;">
        <table width="100%" border="0">
          <tr>
            <td><img src="${ m.icon }" alt="icon" style="width: 42px; height: auto; margin: 0 5px 0 0;" /></td>
            <td width="100%"><b>${ m.title }</b> <br /> ${ info }</td>
          </tr>
        </table>
      </div>`;
    });

    template = `
    <!DOCTYPE html>
    <html lang="en-US">
      <body style="margin: 0; padding: 0;">
        <div style="font-family: 'Monaco', 'Consolas', 'Courier New', 'monospace'; font-size: 10px; padding: 1em;">
          <h3>${ subject }</h3>
          ${ message }
        </div>
      </body>
    </html>`;

    const formdata = new FormData();
    formdata.append( 'from', 'Binance Watch Alerts <noreply@'+ domain +'>' );
    formdata.append( 'to', 'Alert Recipient <'+ recipient +'>' );
    formdata.append( 'subject', subject );
    formdata.append( 'html', template );

    ajax.post( endpoint, {
      type: 'json',
      data: formdata,
      auth: { username, password },
      done: ( xhr, status, response ) => {
        if ( !response || !response.id ) return reject( 'E-mail notifications could not be sent.' );
        return resolve( 'E-mail notifications sent to ('+ recipient +').' );
      },
    });
  });
}
