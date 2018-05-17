/**
 * Handles sending out e-mails
 */
const mailgun = require( 'mailgun-js' );

module.exports = {

  // mailgun config options
  _config: { apiKey: '', domain: '' },

  // set mailgun options
  config( options ) {
    this._config = Object.assign( {}, this._config, options );
  },

  // send e-mail notification using mailgun api
  send( to, subject, html, callback ) {
    const from = 'noreply@' + this._config.domain;
    return mailgun( this._config ).messages().send( { from, to, subject, html }, callback );
  },

  // helper for building html template from a queue of alert priceData objects
  buildAlertHtml( subject, queue ) {
    let html = '';

    queue.forEach( ( p, i ) => {
      html += `
      <p style="margin-top: 1em; padding-top: 1em; border-top: 1px solid rgba(0,0,0,0.1);">
        <big><font color="${ p.color }"><b>${ p.pair } ${ p.arrow } ${ p.percentStr } last ${ p.elapsed }</b></font></big> <br />
        <b>Change.:</b> ${ p.current } ${ p.changeStr } <br />
        <b>Time...:</b> ${ p.date } <br />
        <b>Volume.:</b> ${ p.volume } <br />
      </p>`;
    });

    html = `
    <div style="font-family: 'Monaco', 'Consolas', 'Courier New', 'monospace';">
      <h3>${ subject }</h3>
      ${ html }
    </div>`;

    return html;
  },

}
