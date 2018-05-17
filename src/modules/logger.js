/**
 * Logs colored messaged to the terminal
 */
module.exports = {

  // log message to console with color support
  log() {
    let args  = Array.from( arguments );
    let cname = ( args.length > 1 ) ? args.shift() : 'white';
    let cmap  = { red: '31', green: '32', yellow: '33', blue: '34', white: '37' };
    let code  = cmap[ cname ] || cmap[ 'white' ];
    console.log( '\x1b['+ code +'m%s\x1b[0m', args.join( ' ' ) );
  },

  // log info message
  info() {
    let args = Array.from( arguments );
    this.log( 'blue', 'INFO:', args.join( ' ' ) );
  },

  // log info warning message
  warn() {
    let args = Array.from( arguments );
    this.log( 'yellow', 'WARN:', args.join( ' ' ) );
  },

  // log error message
  error() {
    let args = Array.from( arguments );
    this.log( 'red', 'ERROR:', args.join( ' ' ) );
  },

  // log abort message
  abort() {
    let args = Array.from( arguments );
    this.log( 'red', 'ABORT:', args.join( ' ' ) );
  },
}

