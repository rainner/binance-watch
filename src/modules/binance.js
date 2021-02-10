/**
 * Binance socket api wrapper class
 */
import Bus from './bus';
import Symbol from './symbol';
import utils from './utils';

export default class Binance extends Bus {

  /**
   * Constructor
   */
  constructor() {
    super();
    this._ajax      = null;
    this._apiurl    = 'https://api.binance.com/api';
    this._wssurl    = 'wss://stream.binance.com:9443';
    this._apikey    = '';    // binance API key
    this._apisecret = '';    // binance API secret
    this._listenkey = '';    // user stream listen key
    this._wait      = 10000; // reconnect wait (mils)
    this._coindata  = {};    // data about each token
    this._symbols   = {};    // unique symbols data cache
    this._markets   = {};    // available markets and total assets
    this._reconnect = {};
    this._timers    = {};
    this._socks     = {};
  }

  /**
   * Set ajax module reference to use for requests
   */
  useAjax( ajax ) {
    this._ajax = ajax;
  }

  /**
   * Set API key
   */
  setApiKey( key = '' ) {
    this._apikey = String( key || '' ).trim();
  }

  /**
   * Set API secret
   */
  setApiSecret( secret = '' ) {
    this._apisecret = String( secret || '' ).trim();
  }

  /**
   * Set coins data fetched from somewhere else
   */
  setCoinData( data = {} ) {
    this._coindata = Object.assign( this._coindata, data );
  }

  /**
   * Set socket reconnect boolean for an id
   */
  setReconnect( id, toggle ) {
    this._reconnect[ id ] = toggle ? true : false;
  }

  /**
   * Check reconnect toggle for an id and call a handler function
   */
  checkReconnect( id, callback ) {
    if ( !this._reconnect[ id ] ) return;
    setTimeout( callback, this._wait );
  }

  /**
   * Get public api endpoint url
   */
  getPublicUrl( endpoint, params ) {
    let qstr = this._ajax.serializeData( Object.assign( {}, params ) );
    return this._apiurl + endpoint + '?' + qstr;
  }

  /**
   * Get user signed api endpoint url
   */
  getSignedUrl( endpoint, params ) {
    let crypto     = window.CryptoJS || null;
    let recvWindow = 100000;
    let timestamp  = Date.now() - ( recvWindow / 2 );
    let qstr       = this._ajax.serializeData( Object.assign( { recvWindow, timestamp }, params ) );
    let signature  = crypto ? crypto.HmacSHA256( qstr, this._apisecret ).toString( crypto.enc.Hex ) : '';
    return this._apiurl + endpoint + '?' + qstr + '&signature=' + signature;
  }

  /**
   * Fetch data about available markets form exchange
   */
  fetchMarketsData() {
    if ( !this._ajax ) return;
    const remote = `${this._apiurl}/v3/exchangeInfo`;
    const local  = `public/json/exchangeInfo.json`;

    // build markets data and emit it out
    const handleResponse = ( res ) => {
      if ( res && Array.isArray( res.symbols ) ) {
        for ( let symb of res.symbols ) {
          let token = symb.quoteAsset; // market
          let count = res.symbols.filter( s => ( s.quoteAsset === token && s.baseAsset !== token && s.status === 'TRADING' ) ).length;
          this._markets[ token ] = { token, count };
        }
        this.emit( 'markets_data', this._markets );
      }
    }
    // try remote, then local if it fails
    this._ajax.get( remote, {
      type: 'json',
      success: ( xhr, status, res ) => handleResponse( res ),
      error: ( xhr, status, err ) => {
        this._ajax.get( local, {
          type: 'json',
          proxy: false,
          success: ( xhr, status, res ) => handleResponse( res ),
        });
      }
    });
  }

  /**
   * Fetch last 24h candle data
   */
  fetchChartData( symbol, cb ) {
     if ( !this._ajax || !symbol ) return;
     const endpoint = `${this._apiurl}/v3/klines?symbol=${symbol}&interval=1h&limit=168`;
     const prices   = [];

    this._ajax.get( endpoint, {
      type: 'json',
      // cache: 600,
      success: ( xhr, status, res ) => {
        if ( res && Array.isArray( res ) ) {
          for ( let i = 0; i < res.length; ++i ) {
            prices.push( parseFloat( res[ i ][ 4 ] ) ); // close price
          }
        }
        if ( typeof cb === 'function' ) cb( prices );
        this.emit( 'chart_data', { symbol, prices } );
      },
      error: ( xhr, status, err ) => {
        if ( typeof cb === 'function' ) cb( prices );
        console.warn( err );
      }
    });
  }

  /**
   * Parse user balances data
   */
  parseUserBalances( data ) {
    let balances = [];
    if ( Array.isArray( data ) ) balances = data; // as-is
    if ( Array.isArray( data.balances ) ) balances = data.balances; // http
    if ( Array.isArray( data.B ) ) balances = data.B; // websocket

    balances = balances.map( t => {
      let asset  = String( t.a || t.asset || '' );
      let pair   = ( asset === 'BTC' ) ? 'USDT' : 'BTC';
      let route  = '/symbol/'+ asset + pair;
      let name   = this._names[ asset ] || asset;
      let free   = parseFloat( t.f || t.free ) || 0;
      let locked = parseFloat( t.l || t.locked ) || 0;
      let total  = ( free + locked );
      return { asset, name, route, free, locked, total };
    });
    return balances.filter( t => ( t.total > 0 ) );
  }

  /**
   * Parse order data from an API/Socket response and combine it with symbol data
   * @param {object}  data  Order data response
   */
  parseOrderData( data ) {
    let now       = Date.now();
    let time      = Number( data.T || data.transactTime || now );      // transaction time
    let id        = String( data.i || data.orderId || '' );            // order id
    let symbol    = String( data.s || data.symbol || '' );             // trade pair symbol
    let side      = String( data.S || data.side || '' );               // book side (BUY, SELL)
    let type      = String( data.o || data.type || '' );               // order type (LIMIT, MARKET, etc)
    let status    = String( data.X || data.status || '' );             // order status (NEW, CANCELED, FILLED, etc)
    let price     = Number( data.p || data.price || 0 );               // order book price
    let quantity  = Number( data.q || data.origQty || 0 );             // original trade quantity
    let filled    = Number( data.z || data.executedQty || 0 );         // filled trade quantity
    let total     = Number( data.Z || data.cummulativeQuoteQty || 0 ); // total trade asset cost
    let feeAsset  = String( data.N || '' );                            // fee asset used for commission (BNB, etc)
    let feeAmount = Number( data.n || 0 );                             // fee commission amount
    let percent   = Number( filled / quantity * 100 );                 // filled percent

    // resolve available amount after token fee has been deducted
    let smb    = this._symbols[ symbol ] || new Symbol( symbol );
    let amount = ( feeAsset === smb.token ) ? ( quantity - feeAmount ) : quantity;
    let unique = utils.unique( symbol +'|'+ Math.floor( amount ) );

    status = ( status === 'NEW' ) ? 'OPEN' : status;
    if ( !price && total ) { price = ( total / quantity ); }
    if ( !total && price ) { total = ( price * quantity ); }

    return smb.getData( { id, unique, side, time, type, status, price, quantity, filled, amount, total, feeAsset, feeAmount, percent } );
  }

  /**
   * Build fake order data
   * @param {string}  symbol    Full trading symbol
   * @param {string}  type      Order type (LIMIT, MARKET)
   * @param {string}  side      Book side (BUY, SELL)
   * @param {number}  price     Book price
   * @param {number}  quantity  Order quantity
   */
  fakeOrderData( symbol, type, side, price, quantity, status ) {
    let time = Date.now();
    let id = utils.randString( 20 );
    let priceStr = Number( price ).toFixed( 8 );
    let quantityStr = Number( quantity ).toFixed( 0 );
    let totalStr = Number( price * quantity ).toFixed( 8 );
    return this.parseOrderData( {
      symbol: symbol,
      orderId: id,
      transactTime: time,
      price: priceStr,
      origQty: quantityStr,
      executedQty: quantityStr,
      cummulativeQuoteQty: totalStr,
      status: status,
      type: type,
      side: side
    });
  }

  /**
   * Simulate an order with fake API request
   * @param {string}  symbol    Full trading symbol
   * @param {string}  type      Order type (LIMIT, MARKET)
   * @param {string}  side      Book side (BUY, SELL)
   * @param {number}  price     Book price
   * @param {number}  quantity  Order quantity
   */
  placeFakeOrder( symbol, type, side, price, quantity ) {
    let secs = Math.floor( 1000 + Math.random() * 4000 ); // 1-5 secs
    let orderOpen = this.fakeOrderData( symbol, type, side, price, quantity, 'OPEN' );
    let orderFilled = this.fakeOrderData( symbol, type, side, price, quantity, 'FILLED' );
    let orderCanceled = this.fakeOrderData( symbol, type, side, price, quantity, 'CANCELED' );
    let orderResult = ( secs < 4900 ) ? orderFilled : orderCanceled;
    setTimeout( () => { this.emit( 'book_create', orderOpen ) }, 300 ); // added to book
    setTimeout( () => { this.emit( 'user_order', orderResult ) }, secs ); // filled or canceled
  }

  /**
   * Place new order in book
   * @param {string}  symbol    Full trading symbol
   * @param {string}  type      Order type (LIMIT, MARKET)
   * @param {string}  side      Book side (BUY, SELL)
   * @param {number}  price     Book price
   * @param {number}  quantity  Order quantity
   * @param {string}  inforce   Time inforce type (GTC, IOC, FOK)
   */
  placeOrder( symbol, type, side, price, quantity, inforce ) {
    if ( !this._apikey || !this._ajax ) return;
    if ( !symbol || !type || !side || !quantity || quantity <= 0 ) return;

    price = Number( price ).toFixed( 8 );
    quantity = Number( quantity ).toFixed( 0 );
    inforce = String( inforce || 'FOK' );

    let params = { symbol, side, type, quantity };
    if ( type === 'LIMIT' ) Object.assign( params, { price, timeInForce: inforce } );
    Object.assign( params, { newOrderRespType: 'RESULT' } );

    this._ajax.post( this.getSignedUrl( '/v3/order', params ), {
      type: 'json',
      headers: { 'X-MBX-APIKEY': this._apikey },

      success: ( xhr, status, response ) => {
        let order = this.parseOrderData( response );
        this.emit( 'book_create', order );
      },
      error: ( xhr, status, error ) => {
        let order = this.fakeOrderData( symbol, type, side, price, quantity, 'REJECTED' );
        this.emit( 'book_fail', order, error );
      }
    });
  }

  /**
   * Cancel order from book
   * @param {string}  symbol    Full trading symbol
   * @param {number}  orderId   Order ID number
   * @param {number}  quantity  Order quantity
   */
  cancelOrder( symbol, orderId, quantity ) {
    if ( !this._apikey || !this._ajax ) return;
    if ( !symbol || !orderId ) return;

    this._ajax.delete( this.getSignedUrl( '/v3/order', { symbol, orderId } ), {
      type: 'json',
      headers: { 'X-MBX-APIKEY': this._apikey },

      success: ( xhr, status, response ) => {
        let order = this.fakeOrderData( symbol, 'MARKET', 'CANCEL', 1, quantity, 'COMPLETE' );
        this.emit( 'book_cancel', order );
      },
      error: ( xhr, status, error ) => {
        let order = this.fakeOrderData( symbol, 'MARKET', 'CANCEL', 1, quantity, 'FAILED' );
        this.emit( 'book_fail', order, error );
      }
    });
  }

  /**
   * Get user account data over ajax
   */
  fetchUserAccount() {
    if ( !this._apikey || !this._ajax ) return;

    this._ajax.get( this.getSignedUrl( '/v3/account' ), {
      type: 'json',
      headers: { 'X-MBX-APIKEY': this._apikey },

      success: ( xhr, status, response ) => {
        let balances = this.parseUserBalances( response );
        this.emit( 'user_balances', balances );
        this.emit( 'user_data', true );
      },
      error: ( xhr, status, error ) => {
        this.emit( 'user_fail', error );
        this.stopUserStream();
      }
    });
  }

  /**
   * Fetch current open orders
   */
  fetchOpenOrders() {
    if ( !this._apikey || !this._ajax ) return;

    this._ajax.get( this.getSignedUrl( '/v3/openOrders' ), {
      type: 'json',
      headers: { 'X-MBX-APIKEY': this._apikey },

      success: ( xhr, status, response ) => {
        response.forEach( o => this.emit( 'user_order', this.parseOrderData( o ) ) );
        this.emit( 'user_data', true );
      },
      error: ( xhr, status, error ) => {
        this.emit( 'user_fail', error );
      }
    });
  }

  /**
   * Attempt to start a new user stream
   */
  initUserStream( reconnect ) {
    if ( !this._apikey || !this._ajax ) return;

    this.emit( 'user_init', Date.now() );
    this.stopUserStream();

    this._ajax.post( this.getPublicUrl( '/v1/userDataStream' ), {
      type: 'json',
      headers: { 'X-MBX-APIKEY': this._apikey },

      success: ( xhr, status, response ) => {
        const time = ( 1000 * 60 * 20 ); // 20 mins
        const func = this.extendStreamKey.bind( this );
        this._listenkey = String( response.listenKey || '' ).trim();
        this.emit( 'user_listenkey', this._listenkey );
        this.startUserStream( this._listenkey, reconnect );
        this.startTimer( 'user', time, func, false );
      },
      error: ( xhr, status, error ) => {
        this.emit( 'user_fail', error );
      }
    });
  }

  /**
   * Extend user stream listen key
   */
  extendStreamKey() {
    if ( !this._apikey || !this._ajax ) return;
    if ( !this._listenkey ) return;

    this._ajax.put( this.getPublicUrl( '/v1/userDataStream', { listenKey: this._listenkey } ), {
      type: 'json',
      headers: { 'X-MBX-APIKEY': this._apikey },

      success: ( xhr, status, response ) => {
        this.emit( 'user_listenkey', this._listenkey );
      },
    });
  }

  /**
   * Connect to a live user account data stream
   */
  startUserStream( listenKey, reconnect ) {
    this.setReconnect( 'user', reconnect || false );
    this.emit( 'user_init', Date.now() );

    const ws = this.sockConnect( 'user', this._wssurl +'/ws/'+ listenKey );
    if ( !ws ) return this.emit( 'user_fail', 'Could not connect to user stream API endpoint.' );

    ws.addEventListener( 'open', e => {
      this.emit( 'user_open', e );
      this.fetchUserAccount();
      this.fetchOpenOrders();
    });

    ws.addEventListener( 'error', e => {
      this.emit( 'user_error', e );
      this.stopTimer( 'user' );
    });

    ws.addEventListener( 'close', e => {
      this.emit( 'user_close', e );
      this.stopTimer( 'user' );
      this.checkReconnect( 'user', () => this.startUserStream( listenKey, reconnect ) );
    });

    ws.addEventListener( 'message', e => {
      this.emit( 'user_data', true );
      let data = JSON.parse( e.data || '{}' ) || {};

      if ( data.e === 'outboundAccountInfo' ) {
        let balances = this.parseUserBalances( data );
        return this.emit( 'user_balances', balances );
      }
      if ( data.e === 'executionReport' ) {
        let order = this.parseOrderData( data );
        return this.emit( 'user_order', order );
      }
    });
  }

  /**
   * Stop user stream
   */
  stopUserStream() {
    this.setReconnect( 'user', false );
    this.stopTimer( 'user' );
    this.sockClose( 'user' );
  }

  /**
   * Connect to live ticker prices socket endpoint
   */
  startTickerStream( reconnect ) {
    this.setReconnect( 'ticker', reconnect || false );
    this.emit( 'ticker_init', Date.now() );

    const ws = this.sockConnect( 'ticker', this._wssurl +'/ws/!ticker@arr' );
    if ( !ws ) return this.emit( 'ticker_fail', 'Could not connect to live ticker stream API endpoint.' );

    ws.addEventListener( 'open', e => {
      this.emit( 'ticker_open', e );
      this.startTickerTimer();
    });

    ws.addEventListener( 'error', e => {
      this.emit( 'ticker_error', e );
      this.stopTimer( 'ticker' );
    });

    ws.addEventListener( 'close', e => {
      this.emit( 'ticker_close', e );
      this.stopTimer( 'ticker' );
      this.checkReconnect( 'ticker', () => this.startTickerStream( reconnect ) );
    });

    ws.addEventListener( 'message', e => {
      this.emit( 'ticker_data', true );
      let list    = JSON.parse( e.data || '[]' ) || [];
      let markets = Object.keys( this._markets );
      let count   = list.length;

      // wait for markets data to be available before creating symbols
      if ( !markets.length || !count ) return;

      while ( count-- ) {
        let ticker   = list[ count ];
        let pair     = ticker.s; // trading pair symbol str
        let symbol   = this._symbols[ pair ] || new Symbol( pair ); // cached

        symbol.splitSymbol( markets ); // split pair symbol into token / market
        symbol.setCoinData( this._coindata[ symbol.token ] ); // data from coincap.io
        symbol.setTickerData( ticker ); // update symbol ticker data
        symbol.resolveImage(); // find an icon for this token
        this._symbols[ pair ] = symbol; // update cache
      }
    });
  }

  /**
   * Start ticker data timer
   */
  startTickerTimer() {
    this.stopTimer( 'ticker' );
    this.startTimer( 'ticker', 1000, () => {
      let keys   = Object.keys( this._symbols );
      let count  = keys.length;
      let prices = [];

      while ( count-- ) prices.push( this._symbols[ keys[ count ] ] );
      this.emit( 'ticker_prices', prices );
    }, true );
  }

  /**
   * Stop price ticker
   */
  stopTickerStream() {
    this.setReconnect( 'ticker', false );
    this.stopTimer( 'ticker' );
    this.sockClose( 'ticker' );
  }

  /**
   * Start custom timer
   * @param {string}    id        Timer id name
   * @param {number}    time      Interval mils
   * @param {function}  callback  Callback function
   * @param {boolean}   init      Init callback
   */
  startTimer( id, time, callback, init ) {
    this.stopTimer( id );
    this._timers[ id ] = setInterval( callback, time );
    if ( init ) callback();
  }

  /**
   * Stop custom timer
   * @param {string}  id  Timer id name
   */
  stopTimer( id ) {
    if ( !id || !this._timers.hasOwnProperty( id ) ) return;
    clearInterval( this._timers[ id ] );
    delete this._timers[ id ];
  }

  /**
   * Create a WebSocket connection
   * @param {string}  id      Ref id name
   * @param {string}  endpoint  Socket endpoint url
   */
  sockConnect( id, endpoint ) {
    if ( !id || !endpoint ) return;
    this.emit( 'sock_init', endpoint );
    this.sockClose( id );

    if ( !( 'WebSocket' in window ) ) {
      this.emit( 'sock_fail', 'This web browser does not have WebSocket support.' );
      return false;
    }
    try {
      let ws = new WebSocket( endpoint );
      this._socks[ id ] = ws;
      return ws;
    }
    catch ( err ) {
      let message = String( err.message || 'WebSocket endpoint connection failed for ('+ endpoint +').' );
      this.emit( 'sock_fail', message );
      return false;
    }
  }

  /**
   * Close socket connection and remove it from the list
   * @param {string}  id  Socket id name
   */
  sockClose( id ) {
    if ( !id || !this._socks.hasOwnProperty( id ) ) return;
    this.emit( 'sock_close', id );
    this._socks[ id ].close();
    delete this._socks[ id ];
  }

  /**
   * Close all active socket connections
   */
  sockCloseAll() {
    Object.keys( this._socks ).forEach( id => this.sockClose( id ) );
  }

}
