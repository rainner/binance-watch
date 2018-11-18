<template>
  <main class="page-wrap" :class="{ 'collapsed': header.collapsed, 'opaque': header.opaque }">

    <!-- controls section -->
    <section class="page-topbar">
      <div class="container">
        <div class="flex-row flex-middle flex-space">

          <!-- control search -->
          <Search class="light push-right" v-model="searchStr"></Search>

          <!-- control heading -->
          <div class="flex-1 text-clip text-big text-center push-right if-medium">Trading Bot</div>

          <!-- control dropdown menus -->
          <Dropdown>
            <button slot="trigger" class="form-btn bg-primary-hover icon-down-open iconLeft">
              <span v-if="socketStatus === 0">API Offline <i class="icon-close"></i></span>
              <span v-if="socketStatus === 1">API Connecting... <i class="icon-signal"></i></span>
              <span v-if="socketStatus === 2">API Active <i class="icon-check"></i></span>
            </button>
            <div slot="list" class="text-center">
              <div class="form-label pad-h">Account API Connection</div>
              <hr />
              <div class="pad-h push-bottom">
                <span v-if="!canConnect">You will need to provide your API keys in the Options page and enable it to connect <i class="icon-cry"></i></span>
                <span v-else-if="!socketStatus">Currently not connected to your Binance account <i class="icon-cry"></i></span>
                <span v-else-if="socketStatus">Currently connected to your Binance account <i class="icon-check"></i></span>
              </div>
              <div class="pad-h" :class="{ 'disabled': !canConnect }">
                <button v-if="socketStatus === 0" class="form-btn bg-success-hover icon-close iconLeft" @click="initUserStream">Connect</button>
                <button v-if="socketStatus === 1" class="form-btn bg-info-hover icon-close iconLeft">Waiting...</button>
                <button v-if="socketStatus === 2" class="form-btn bg-danger-hover icon-close iconLeft" @click="stopUserStream">Disconnect</button>
              </div>
            </div>
          </Dropdown>

        </div>
      </div>
    </section>

    <!-- account balances section -->
    <section class="push-bottom">
      <div class="container">
        <!-- account balances list -->
        <div class="card tablelist-wrap">
          <!-- list headers -->
          <div class="tablelist-header">
            <div class="flex-row flex-middle flex-stretch">
              <div class="tablelist-20 text-clip push-right">
                <span class="clickable" @click="$sorter.sortOrder( 'balances', 'name', 'asc' )">
                  Token <i class="text-primary" :class="$sorter.getStyles( 'balances', 'name' )"></i>
                </span>
              </div>
              <div class="tablelist-20 text-nowrap push-right">
                <span class="clickable" @click="$sorter.sortOrder( 'balances', 'asset', 'asc' )">
                  Symbol <i class="text-primary" :class="$sorter.getStyles( 'balances', 'asset' )"></i>
                </span>
              </div>
              <div class="tablelist-20 text-nowrap text-right push-right">
                <span class="clickable" @click="$sorter.sortOrder( 'balances', 'total', 'desc' )">
                  Total <i class="text-primary" :class="$sorter.getStyles( 'balances', 'total' )"></i>
                </span>
              </div>
              <div class="tablelist-20 text-nowrap text-right push-right">
                <span class="clickable" @click="$sorter.sortOrder( 'balances', 'free', 'desc' )">
                  Free <i class="text-primary" :class="$sorter.getStyles( 'balances', 'free' )"></i>
                </span>
              </div>
              <div class="tablelist-20 text-nowrap text-right">
                <span class="clickable" @click="$sorter.sortOrder( 'balances', 'locked', 'desc' )">
                  Locked <i class="text-primary" :class="$sorter.getStyles( 'balances', 'locked' )"></i>
                </span>
              </div>
              <div class="tablelist-20 text-nowrap text-right">
                Trade
              </div>
            </div>
          </div>

          <!-- list default greet message -->
          <div class="tablelist-content pad-v text-center text-info pos-rel" v-if="!balancesList.length">
            <div v-if="isDisconnected">
              <div class="icon-info iconLarge"></div>
              <div>Account balances will appear once connected to the API.</div>
              <div v-if="socketError" class="text-danger">{{ socketError }}</div>
              <button class="text-primary-hover icon-config iconLeft" @click="$router.setRoute( '/options' )">Manage Options</button>
            </div>
            <div v-if="isWaiting">
              <div class="icon-signal iconLarge"></div>
              <div class="text-warning fx fx-pulse">Waiting for account balances data to load...</div>
            </div>
            <div v-if="isConnected">
              <div class="icon-help iconLarge"></div>
              <div v-if="searchStr" class="text-danger">Could not find any results for: {{ searchStr }}</div>
              <div v-else>No account balances data available.</div>
            </div>
          </div>

          <!-- list items -->
          <div class="tablelist-content" v-if="balancesList.length">
            <div class="tablelist-row flex-row flex-middle flex-stretch" v-for="t in balancesList" :key="t.asset">
              <div class="tablelist-20 text-clip text-bright push-right if-medium">{{ t.name }}</div>
              <div class="tablelist-20 text-nowrap text-bright push-right">
                <button class="text-primary-hover" title="Info" @click="$bus.emit( 'setRoute', t.route )" v-tooltip>{{ t.asset }}</button>
              </div>
              <div class="tablelist-20 text-nowrap text-primary text-right text-monospace push-right">{{ t.total | toFixed }}</div>
              <div class="tablelist-20 text-nowrap text-bright text-right text-monospace push-right">{{ t.free | toFixed }}</div>
              <div class="tablelist-20 text-nowrap text-danger text-right text-monospace">{{ t.locked | toFixed }}</div>
              <div class="tablelist-20 text-nowrap text-right">
                <button class="icon-chart-line iconLeft text-btn bg-info-hover" :disabled="!checkCanTradeToken( t.asset, t.free )" @click="initTokenTrade( t.asset, t.free )">Trade</button>
              </div>
            </div>
          </div>

          <!-- list bottom info -->
          <div class="tablelist-header">
            <div class="tablelist-row flex-row flex-middle flex-space">
              <div class="push-right">
                <a class="icon-network iconLeft" href="https://www.binance.com/userCenter/balances.html" target="_blank">Manage account on Binance</a>
              </div>
              <div class="text-clip">
                <span class="text-info">Updated</span> &nbsp;
                <span class="text-bright">{{ socketUpdated }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- bot section -->
    <section class="push-bottom">
      <div class="container">

        <div class="card pad-all">

          <div class="flex-row flex-space">
            <div class="text-nowrap text-bright push-right">
              <span class="icon-chart-line iconLeft text-nowrap">Trade Bot</span>
            </div>
            <div class="text-nowrap push-right if-medium">
              <span class="text-info">Bot Balance &nbsp;</span>
              <span class="text-bright">{{ balanceRemain | toFixed( watchOptions.asset ) }} / {{ balanceTotal | toFixed( watchOptions.asset ) }}</span>
              <span class="text-info">{{ watchOptions.asset }}</span>
            </div>
            <div class="text-nowrap push-right if-small">
              <span class="text-info">Active Trades &nbsp;</span>
              <span class="text-bright">{{ pendingTrades }} / {{ totalTrades }}</span>
            </div>
            <div class="text-nowrap">
              <span class="text-info">Session P/L &nbsp;</span>
              <span :class="{ 'text-gain': botProfit > 0, 'text-loss': botProfit < 0 }">{{ botProfit | toFixed( 3 ) }}%</span>
            </div>
          </div>

          <hr />

          <div class="flex-row flex-middle flex-srtetch">
            <div class="push-right">
              <button class="form-btn bg-info-hover" :class="{ 'icon-up-open': formShow, 'icon-down-open': !formShow }" title="Toggle form" @click="toggleForm" v-tooltip></button>
            </div>
            <div class="flex-1 text-clip push-right">
              <span class="text-warning">Bot {{ botActive ? 'is trading' : 'will trade' }} {{ countInfo }} using the options below.</span>
            </div>
            <div class="push-right">
              <Toggle :class="{ 'disabled': botActive }" :text="'Live Mode'" v-model="liveMode"></Toggle>
            </div>
            <div>
              <button v-if="botActive === false" class="form-btn bg-success-hover icon-play iconLeft" :disabled="!canStartBot" @click="startBot">Start the Bot</button>
              <button v-if="botActive === true" class="form-btn bg-danger-hover icon-stop iconLeft" @click="stopBot">Bot running {{ botElapsed }} ...</button>
            </div>
          </div>

          <div class="bot-form pad-top" :class="{ 'visible': formShow }">

            <div class="flex-grid flex-grid-md flex-middle" :class="{ 'disabled': botActive }">

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Currency</span>
                <SelectMenu class="flex-1 push-right" :options="assetOptions" v-model="watchOptions.asset" @change="onBotOptions"></SelectMenu>
                <span class="text-secondary">{{ watchOptions.assetBalance | toFixed( watchOptions.asset ) }}</span>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Only use</span>
                <input class="flex-1 push-right" type="range" min="5" max="100" step="5" v-model="watchOptions.assetPercent" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.assetPercent }}% {{ watchOptions.asset }}</span>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Split trades</span>
                <input class="flex-1 push-right" type="range" min="1" max="10" step="1" v-model="watchOptions.assetSplit" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.assetSplit }}</span>
              </div>

              <div class="form-input text-nowrap">
                <SelectMenu class="push-right" :css="'text-primary-hover'" v-model="watchOptions.filterType" @change="onBotOptions">
                  <option value="allow">Only tokens</option>
                  <option value="deny">Skip tokens</option>
                </SelectMenu>
                <input class="flex-1" type="text" placeholder="TOKEN1 TOKEN2 ..." v-model="watchOptions.filterTokens" @change="onBotOptions"  />
              </div>

              <div class="form-input text-nowrap">
                <SelectMenu class="push-right" :css="'text-primary-hover'" v-model="watchOptions.priceType" @change="onBotOptions">
                  <option value="change">Price change</option>
                  <option value="gain">Price rise</option>
                  <option value="loss">Price drop</option>
                </SelectMenu>
                <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.priceChange" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.priceChange | toFixed( 1 ) }}%</span>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Volume gain</span>
                <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.volumeChange" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.volumeChange | toFixed( 1 ) }}%</span>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Within last</span>
                <input class="flex-1 push-right" type="range" min="0" max="60" step="1" v-model="watchOptions.timeLimit" @change="onBotOptions" />
                <div class="text-secondary">{{ watchOptions.timeLimit | toNoun( 'min', 'mins' ) }}</div>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Sell profit</span>
                <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.priceProfit" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.priceProfit| toFixed( 1 ) }}%</span>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Stop loss</span>
                <input class="flex-1 push-right" type="range" min="0.0" max="10.0" step="0.5" v-model="watchOptions.priceStop" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.priceStop | toFixed( 1 ) }}%</span>
              </div>

              <div class="form-input text-nowrap">
                <SelectMenu class="push-right" :css="'text-primary-hover'" v-model="watchOptions.priceCheck" @change="onBotOptions">
                  <option value="above">Price above</option>
                  <option value="below">Price below</option>
                </SelectMenu>
                <input class="flex-1 push-right" type="text" placeholder="0.00000000" v-model="watchOptions.price" @change="onBotOptions" />
                <div class="text-secondary">{{ watchOptions.asset }}</div>
              </div>

              <div class="form-input text-nowrap">
                <SelectMenu class="push-right" :css="'text-primary-hover'" v-model="watchOptions.volumeCheck" @change="onBotOptions">
                  <option value="above">Volume above</option>
                  <option value="below">Volume below</option>
                </SelectMenu>
                <input class="flex-1 push-right" type="text" placeholder="0000" v-model="watchOptions.volume" @change="onBotOptions" />
                <div class="text-secondary">{{ watchOptions.asset }}</div>
              </div>

              <div class="form-input text-nowrap">
                <SelectMenu class="push-right" :css="'text-primary-hover'" v-model="watchOptions.changeCheck" @change="onBotOptions">
                  <option value="above">24h % above</option>
                  <option value="below">24h % below</option>
                </SelectMenu>
                <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.change" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.change | toFixed( 1 ) }}%</span>
              </div>

              <div class="form-input text-nowrap">
                <SelectMenu class="push-right" :css="'text-primary-hover'" v-model="watchOptions.volatilityCheck" @change="onBotOptions">
                  <option value="above">Volatility above</option>
                  <option value="below">Volatility below</option>
                </SelectMenu>
                <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.volatility" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.volatility | toFixed( 1 ) }}%</span>
              </div>

              <div class="form-input text-nowrap">
                <SelectMenu class="push-right" :css="'text-primary-hover'" v-model="watchOptions.dangerCheck" @change="onBotOptions">
                  <option value="above">Danger above</option>
                  <option value="below">Danger below</option>
                </SelectMenu>
                <input class="flex-1 push-right" type="range" min="0.0" max="100.0" step="0.5" v-model="watchOptions.danger" @change="onBotOptions" />
                <span class="text-secondary">{{ watchOptions.danger | toFixed( 1 ) }}%</span>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Limit</span>
                <SelectMenu class="flex-1" v-model="watchOptions.tradeLimit" @change="onBotOptions">
                  <option value="multiple">Multiple trades per token</option>
                  <option value="active">Single active trade per token</option>
                  <option value="single">Single trade only per token</option>
                </SelectMenu>
              </div>

              <div class="form-input text-nowrap">
                <span class="push-right text-primary">Order type</span>
                <SelectMenu class="flex-1" v-model="watchOptions.orderType" @change="onBotOptions">
                  <option value="LIMIT">LIMIT orders</option>
                  <option value="MARKET">MARKET orders</option>
                </SelectMenu>
              </div>

              <div v-if="watchOptions.orderType === 'LIMIT'" class="form-input text-nowrap">
                <span class="push-right text-primary">Execution</span>
                <SelectMenu class="flex-1" v-model="watchOptions.orderTime" @change="onBotOptions">
                  <option value="GTC">Good until canceled</option>
                  <option value="IOC">Immediate or cancel</option>
                  <option value="FOK">Fill all or cancel</option>
                </SelectMenu>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>

    <!-- history section -->
    <section class="push-bottom">
      <div class="container">

        <div class="card pad-all">

          <!-- trade and order tabs -->
          <Tabs :data="{ totalOrders, totalSessions, pendingTrades, totalTrades }">

            <!-- trades tab section -->
            <section btn-class="icon-chart-line iconLeft" :btn-name="'Bot Trades ('+ pendingTrades +'/'+ totalTrades +')'" active>
              <div class="pad-v text-center text-info" v-if="!tradesList.length">
                <div class="icon-chart-line iconLarge"></div>
                <div>No trades data available.</div>
              </div>
              <div class="flex-list" v-if="tradesList.length">
                <div class="flex-header flex-middle flex-space">
                  <div class="iconWidth text-nowrap push-right if-medium"></div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="clickable" @click="$sorter.sortOrder( 'trades', 'pair', 'asc' )">Pair</span>
                    <span class="text-info text-faded">/</span>
                    <span class="clickable" @click="$sorter.sortOrder( 'trades', 'time', 'desc' )">Time</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'trades', 'active', 'asc' )">Status</span></div>
                  <div class="flex-10 text-nowrap text-info push-right">Buy Price</div>
                  <div class="flex-10 text-nowrap text-info push-right">Cur/Sell Price</div>
                  <div class="flex-10 text-nowrap text-info push-right">P/L</div>
                  <div class="text-nowrap text-right">
                    <Dropdown>
                      <button slot="trigger" class="text-primary-hover icon-config"></button>
                      <ul slot="list">
                        <li class="text-bright-hover icon-check iconLeft clickable" @click="cleanTradesList()">Remove Complete Trades</li>
                        <li class="text-bright-hover icon-close iconLeft clickable" @click="flushTradeEntries()">Delete Trade Entries</li>
                      </ul>
                    </Dropdown>
                  </div>
                </div>
                <div class="flex-item flex-middle flex-stretch" v-for="t of tradesList" :key="t.id">
                  <div class="iconWidth text-nowrap push-right if-medium">
                    <TokenIcon :image="t.image" :alt="t.name"></TokenIcon>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <button class="text-primary-hover" @click="$router.setRoute( t.route )">{{ t.pair }}</button> <br />
                    <span class="text-info">{{ t.time | toElapsed( 'ago', true ) }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span :class="tradeStatus( t.status, 1 )">{{ tradeStatus( t.status, 0 ) }}</span> <br />
                    <span class="text-secondary">{{ t.amount | toMoney( 0 ) }}</span>
                    <span class="text-info">{{ t.token }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">

                    <span class="text-bright">{{ t.buyPrice | toFixed( t.asset ) }}</span> <br />
                    <span class="text-info">{{ t.asset }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-bright">{{ t.sellPrice | toFixed( t.asset ) }}</span> <br />
                    <span class="text-info">{{ t.asset }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span :class="{ 'text-gain': t.profit > 0, 'text-loss': t.profit < 0 }">{{ t.profit | toFixed( 3 ) }}%</span> <br />
                    <span>
                      <span v-if="t.profit > 0" class="text-info">Gain</span>
                      <span v-else-if="t.profit < 0" class="text-info">Loss</span>
                      <span v-else class="text-info">Same</span>
                    </span>
                  </div>
                  <div class="text-nowrap text-right">
                    <Dropdown>
                      <button slot="trigger" class="icon-config"></button>
                      <ul slot="list">
                        <li v-if="t.active" class="text-gain-hover icon-stop iconLeft clickable" :class="{ 'disabled': !isConnected }" @click="sellActiveTrade( t.id )">Sell @ {{ t.sellPrice | toFixed( t.asset ) }}</li>
                        <li class="text-bright-hover icon-visible iconLeft clickable" @click="markBotTradeActive( t.id )">Mark trade as Active</li>
                        <li class="text-bright-hover icon-check iconLeft clickable" @click="markBotTradeSold( t.id )">Mark trade as Sold</li>
                        <li class="text-danger-hover icon-close iconLeft clickable" @click="removeTradeEntry( t.id )">Remove from list</li>
                      </ul>
                    </Dropdown>
                  </div>
                </div>
                <div class="flex-header flex-middle text-info flex-space">
                  <div class="flex-1 push-right">
                    <span class="icon-list iconLeft">{{ tradesListText }}</span>
                  </div>
                  <div>
                    &nbsp;
                  </div>
                </div>
              </div>
            </section>

            <!-- orders tab section -->
            <section btn-class="icon-list iconLeft" :btn-name="'Order Activity ('+ totalOrders +')'">
              <div class="pad-v text-center text-info" v-if="!ordersList.length">
                <div class="icon-list iconLarge"></div>
                <div>No orders data available.</div>
              </div>
              <div class="flex-list" v-if="ordersList.length">
                <div class="flex-header flex-middle flex-space">
                  <div class="iconWidth text-nowrap push-right if-medium">&nbsp;</div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="clickable" @click="$sorter.sortOrder( 'orders', 'pair', 'asc' )">Pair</span>
                    <span class="text-info text-faded">/</span>
                    <span class="clickable" @click="$sorter.sortOrder( 'orders', 'time', 'desc' )">Time</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'orders', 'side', 'asc' )">Order</span></div>
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'orders', 'status', 'asc' )">Status</span></div>
                  <div class="flex-10 text-nowrap text-info push-right">Price</div>
                  <div class="flex-10 text-nowrap text-info push-right if-medium">Fee</div>
                  <div class="flex-10 text-nowrap text-info push-right">Total</div>
                  <div class="text-nowrap text-right">
                    <Dropdown>
                      <button slot="trigger" class="text-primary-hover icon-config"></button>
                      <ul slot="list">
                        <li class="text-bright-hover icon-close iconLeft clickable" @click="cancelOpenOrders()">Cancel Open Orders</li>
                        <li class="text-bright-hover icon-check iconLeft clickable" @click="clearOrdersList()">Remove Complete Orders</li>
                      </ul>
                    </Dropdown>
                  </div>
                </div>
                <div class="flex-item flex-middle flex-space" v-for="o of ordersList" :key="o.id">
                  <div class="iconWidth text-nowrap push-right if-medium">
                    <TokenIcon :image="o.image" :alt="o.token"></TokenIcon>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <button class="text-primary-hover" @click="$router.setRoute( o.route )">{{ o.pair }}</button> <br />
                    <span class="text-info">{{ o.time | toElapsed( 'ago', true ) }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span :class="{ 'text-gain': o.side === 'BUY', 'text-loss': o.side === 'SELL' }">{{ o.type }} {{ o.side }}</span> <br />
                    <span class="text-secondary">{{ o.filled | toMoney( 0 ) }}</span>
                    <span class="text-info">/</span>
                    <span class="text-secondary">{{ o.quantity | toMoney( 0 ) }}</span>
                    <span class="text-info">{{ o.token }}</span>
                  </div>
                  <div class="flex-10 text-warning text-nowrap push-right">
                    <span :class="{ 'text-danger': o.status === 'OPEN', 'text-success': o.status === 'FILLED' }">{{ o.status }}</span> <br />
                    <span class="text-bright">{{ o.percent | toFixed( 2 ) }}%</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-info">{{ o.asset }} Price</span> <br />
                    <span class="text-secondary">{{ o.price | toFixed( o.asset ) }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right if-medium">
                    <span class="text-info">{{ o.feeAsset ? o.feeAsset +' Total' : 'Total' }}</span> <br />
                    <span class="text-bright">{{ o.feeAmount | toFixed( 8 ) }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-info">{{ o.asset }} Total</span> <br />
                    <span class="text-bright">{{ o.total | toFixed( o.asset ) }}</span>
                  </div>
                  <div class="text-nowrap text-right">
                    <Dropdown>
                      <button slot="trigger" class="icon-config"></button>
                      <ul slot="list">
                        <li v-if="o.status === 'OPEN'" class="text-warning-hover icon-stop iconLeft clickable" @click="cancelOrder( o.symbol, o.id, o.quantity )">Cancel this order</li>
                        <li class="text-danger-hover icon-close iconLeft clickable" @click="removeOrder( o.id )">Remove from list</li>
                      </ul>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </section>

            <!-- sessions tab section -->
            <section btn-class="icon-calendar iconLeft" :btn-name="'Bot Sessions ('+ totalSessions +')'">
              <div class="pad-v text-center text-info" v-if="!sessionsList.length">
                <div class="icon-calendar iconLarge"></div>
                <div>No bot sessions data available.</div>
              </div>
              <div class="flex-list" v-if="sessionsList.length">
                <div class="flex-header flex-middle flex-space">
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'sessions', 'pair', 'asc' )">Pair</span></div>
                  <div class="flex-10 text-nowrap push-right if-medium"><span class="clickable" @click="$sorter.sortOrder( 'sessions', 'time', 'desc' )">Time</span></div>
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'sessions', 'balance', 'desc' )">Balance</span></div>
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'sessions', 'complete', 'desc' )">Trades</span></div>
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'sessions', 'profit', 'desc' )">Profit</span></div>
                  <div class="flex-10 text-nowrap text-info push-right">Duration</div>
                  <div class="flex-10 text-nowrap push-right"><span class="clickable" @click="$sorter.sortOrder( 'sessions', 'live', 'desc' )">Live</span></div>
                  <div class="text-nowrap text-right">
                    <button class="text-bright-hover icon-close" title="Flush List" @click="flushSessionData" v-tooltip></button>
                  </div>
                </div>
                <div class="flex-item flex-middle flex-stretch" v-for="s of sessionsList" :key="s.id">
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-primary">{{ s.pair }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-info">{{ s.time | toElapsed( 'ago', true ) }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-bright">{{ s.balance | toFixed( s.asset ) }}</span>
                    <span class="text-info">{{ s.asset }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-bright">{{ s.complete | toMoney }}</span>
                    <span class="text-info">/</span>
                    <span class="text-bright">{{ s.total | toMoney }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span :class="{ 'text-gain': s.profit > 0, 'text-loss': s.profit < 0 }">{{ s.profit | toFixed( 3 ) }}%</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span class="text-bright">{{ s.elapsed }}</span>
                  </div>
                  <div class="flex-10 text-nowrap push-right">
                    <span :class="{ 'text-success': s.live, 'text-warning': !s.live }">{{ s.live ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="text-right">
                    <button class="text-loss-hover icon-close" title="Remove" @click="deleteSessionEntry( s.id )" v-tooltip></button>
                  </div>
                </div>
              </div>
            </section>

          </Tabs>

        </div>

      </div>
    </section>


  </main>
</template>

<script>
// components
import Prompt from '../modules/prompt';
import Watcher from '../modules/watcher';
import Search from './Search.vue';
import Tabs from './Tabs.vue';
import Dropdown from './Dropdown.vue';
import Toggle from './Toggle.vue';
import SelectMenu from './SelectMenu.vue';
import TokenIcon from './TokenIcon.vue';

// trade status constants
const TRADE_WAIT = 0;
const TRADE_SELL = 1;
const TRADE_DONE = 2;

// component
export default {

  // sub components
  components: { Search, Tabs, Dropdown, Toggle, SelectMenu, TokenIcon },

  // component props
  props: {
    header: { type: Object, default() { return {} } },
    options: { type: Object, default() { return {} }, required: true },
    sortData: { type: Object, default() { return {} }, required: true },
    priceData: { type: Array, default() { return [] }, required: true },
    assetsList: { type: Array, default() { return [] }, required: true },
    tickerStatus: { type: Number, default: 0 },
  },

  // component data
  data() {
    return {
      // bot options
      liveMode: false,
      botActive: false,
      botStart: 0,
      botElapsed: '0s',
      botProfit: 0,
      // app data
      balancesData: [],
      ordersData: [],
      tradesData: [],
      sessionsData: [],
      errorCount: 0,
      countInfo: '...',
      // lists and forms
      searchStr: '',
      maxItems: 20,
      tradesVisible: 20,
      formShow: true,
      // socket data
      socketTime: 0,
      socketUpdated: 'Never',
      socketStatus: 0,
      socketError: '',
      // store keys
      keys: {
        options: 'bot_options',
        trades: 'bot_trades',
        orders: 'bot_orders',
        sessions: 'bot_sessions',
      },
      // price watch options
      watcher: new Watcher(),
      watchOptions: {
        // bot trading pair/currency
        token: '',
        asset: 'BTC',
        // bot allocated balance and trades
        assetPercent: 50,
        assetBalance: 0,
        assetSplit: 3,
        // price change/profit trigger and filters
        priceType: 'loss',
        priceChange: '2',
        priceProfit: '5',
        priceStop: 0,
        priceCheck: 'above',
        price: '',
        // volume change trigger and filters
        volumeType: 'gain',
        volumeChange: '1',
        volumeCheck: 'above',
        volume: '',
        // 24h percent change filters
        changeCheck: 'below',
        change: '0',
        // 24h price volitility filters
        volatilityCheck: 'below',
        volatility: '0',
        // recent pump/dump danger filter
        dangerCheck: 'below',
        danger: '0',
        // change timeframe filters
        timeCheck: 'less',
        timeLimit: '30',
        // token back/white list filters
        filterType: 'allow',
        filterTokens: '',
        // order execution options
        orderType: 'LIMIT',
        orderTime: 'GTC',
        // trade limit ( multiple, active, single )
        tradeLimit: 'multiple',
      },
    }
  },

  // watch methods
  watch: {

    // when price data changes
    priceData() {
      this.updateWatchCount();
      this.updateElapsedTimes();
      this.checkTradeBuy();
      this.checkTradeSell();
      this.checkBotErrors();
    },
  },

  // computed methods
  computed: {

    // check if it's possible to make api requests
    canConnect() {
      let { enabled, apikey, apisecret } = this.options.binance;
      return ( enabled && apikey && apisecret ) ? true : false;
    },

    // check if bot can be started
    canStartBot() {
      let asset = String( this.watchOptions.asset || '' );
      let balance = Number( this.watchOptions.assetBalance || 0 );
      if ( this.tickerStatus < 2 || !asset || !balance ) return false;
      return true;
    },

    // check if api connection is offline
    isDisconnected() {
      return ( this.socketStatus === 0 );
    },

    // check if api connection in progress
    isWaiting() {
      return ( this.socketStatus === 1 );
    },

    // check if connected to socket api
    isConnected() {
      return ( this.socketStatus === 2 );
    },

    // number of orders in the list
    totalOrders() {
      return this.ordersData.length;
    },

    // number of sessions in the list
    totalSessions() {
      return this.sessionsData.length;
    },

    // number of trades in the list
    totalTrades() {
      return this.tradesData.length;
    },

    // number of trades in list that are not visible due to paging
    hiddenTrades() {
      let list  = this.tradesData;
      let total = this.tradesVisible;
      return ( list.length > total ) ? ( list.length - total ) : 0;
    },

    // number of active trades
    pendingTrades() {
      return this.tradesData.filter( o => o.active ).length;
    },

    // get max number of trades bot can make
    maxTrades() {
      return Number( this.watchOptions.assetSplit );
    },

    // pagination text about trades visible
    tradesListText() {
      let total  = this.totalTrades;
      let hidden = this.hiddenTrades;
      let noun   = ( hidden === 1 ) ? 'trade' : 'trades';
      return hidden ? `${hidden} more ${noun}...` : `Showing all trades`;
    },

    // total balance allocated for bot
    balanceTotal() {
      return Number( this.watchOptions.assetBalance );
    },

    // calculate balance amount for each trade
    tradeBalance() {
      return Number( this.balanceTotal / this.maxTrades );
    },

    // calculate balance used by the bot
    balanceUsed() {
      return +Number( this.tradeBalance * this.pendingTrades ).toFixed( 8 );
    },

    // calculate remaining balance for bot trades
    balanceRemain() {
      return +Number( this.balanceTotal - this.balanceUsed ).toFixed( 8 );
    },

    // build assets select options
    assetOptions() {
      let assets = this.assetsList.map( a => { return { value: a, text: a } } );
      return this.$utils.sort( assets, 'value', 'asc' );
    },

    // filter account balances
    balancesList() {
      let { column, order } = this.sortData.balances;
      let list = this.balancesData;

      if ( this.searchStr && this.searchStr.length > 1 ) {
        let reg = new RegExp( '^('+ this.searchStr +')', 'i' );
        list = list.filter( t => ( reg.test( t.name ) || reg.test( t.asset ) ) );
      }
      return this.$utils.sort( list, column, order );
    },

    // get list of orders
    ordersList() {
      let { column, order } = this.sortData.orders;
      let list = this.ordersData.slice(); // copy
      list = this.$utils.sort( list, column, order ); // sort
      return list;
    },

    // get list of trades
    tradesList() {
      let { column, order } = this.sortData.trades;
      let list = this.tradesData.slice(); // copy
      list = this.$utils.sort( list, column, order ); // sort
      list = this.$utils.trimRight( list, this.tradesVisible ); // trim
      return list;
    },

    // get list of sessions
    sessionsList() {
      let { column, order } = this.sortData.sessions;
      let list = this.sessionsData.slice(); // copy
      list = this.$utils.sort( list, column, order ); // sort
      return list;
    },
  },

  // custom methods
  methods: {

    // apply options
    saveOptions() {
      this.$opts.saveOptions( this.options );
    },

    // setup user account stream
    setupUserHandlers() {
      // order book events
      this.$binance.on( 'book_create', this.onBookCreate );
      this.$binance.on( 'book_cancel', this.onBookCancel );
      this.$binance.on( 'book_fail', this.onBookFail );
      // user stream events
      this.$binance.on( 'user_init', this.onUserInit );
      this.$binance.on( 'user_fail', this.onUserFail );
      this.$binance.on( 'user_error', this.onUserError );
      this.$binance.on( 'user_close', this.onUserClose );
      this.$binance.on( 'user_open', this.onUserOpen );
      this.$binance.on( 'user_data', this.onUserData );
      this.$binance.on( 'user_balances', this.onUserBalances );
      this.$binance.on( 'user_order', this.onUserOrder );
    },

    // load or save data for an object by ref for a key
    saveData( key, data ) {
      this.$store.setData( key, data );
    },

    // load saved component data
    loadSavedData() {
      let trades = this.$store.getData( this.keys.trades );
      this.tradesData = trades || this.tradesData;

      let sessions = this.$store.getData( this.keys.sessions );
      this.sessionsData = sessions || this.sessionsData;

      let options = this.$store.getData( this.keys.options );
      this.watchOptions = Object.assign( this.watchOptions, options );
    },

    // trade status text
    tradeStatus( status, c ) {
      switch ( status ) {
        case TRADE_WAIT : return c ? 'text-danger'  : 'HODLING';
        case TRADE_SELL : return c ? 'text-warning' : 'SELLING';
        case TRADE_DONE : return c ? 'text-success' : 'SOLD';
      }
    },

    // toggle bot form show/hide
    toggleForm() {
      this.formShow = !this.formShow;
    },

    // add browser notification for a filled order
    notifyOrder( order ) {
      let { id, time, symbol, token, asset, name, image, type, side, status, price, quantity } = order;
      let date     = this.$utils.date( time, true );
      let priceStr = this.$utils.fixed( price, asset );
      let qtyStr   = this.$utils.money( quantity );
      let title    = `${token} ${side} Order ${status}`;
      let info     = `${side} ${qtyStr} ${token} @ ${priceStr} ${asset}. \n${date}.`;
      let icon     = this.$utils.fullUrl( image );

      this.$bus.emit( 'showNotice', info, 'success' );
      this.$notify.add( title, info, icon );
      this.$messenger.add( title, info, icon );
    },

    // get current price for a symbol
    getSymbolPrice( symbol ) {
      let close = 0;
      let count = this.priceData.length;

      while ( count-- ) {
        if ( this.priceData[ count ].symbol === symbol ) {
          close = this.priceData[ count ].close;
          break;
        }
      }
      return close;
    },

    // check if there is enough balance for a token
    hasTokenBalance( token, amount ) {
      let count = this.balancesData.length;

      while ( count-- ) {
        let b = this.balancesData[ count ];
        if ( b.asset === token && b.free >= amount ) return true;
      }
      return false;
    },

    // adds new order to the list
    updateOrdersList( order ) {
      let list = this.ordersData.filter( o => ( o.id !== order.id ) ); // filter
      if ( order.status !== 'CANCELED' && order.quantity ) list.push( order ); // add
      this.ordersData = this.$utils.trimLeft( list, this.maxItems ); // trim
    },

    // remove order from the list
    removeOrder( id ) {
      this.ordersData = this.ordersData.filter( o => ( o.id !== id ) );
    },

    // removed finished orders from the list
    clearOrdersList() {
      this.ordersData = this.ordersData.filter( o => ( o.status === 'OPEN' ) );
    },

    // cancel open orders
    cancelOpenOrders() {
      for ( let i = 0; i < this.ordersData.length; ++i ) {
        let { id, symbol, status, quantity } = this.ordersData[ i ];
        if ( status === 'OPEN' ) this.cancelOrder( symbol, id, quantity );
      }
    },

    // build bot session when bot stops
    buildSessionData() {
      let list     = this.sessionsData;
      let id       = this.$utils.randString( 20 );
      let time     = Date.now();
      let elapsed  = this.botElapsed;
      let live     = this.liveMode;
      let token    = this.watchOptions.token;
      let asset    = this.watchOptions.asset;
      let balance  = this.watchOptions.assetBalance;
      let pair     = token ? token +'/'+ asset : 'ALL/'+ asset;
      let total    = 0;
      let complete = 0;
      let profit   = 0;

      // calculate total profit for completed trades
      this.tradesData.forEach( o => { if ( !o.active ) { profit += o.profit; complete++; } total++; } );
      if ( !total ) return; // no point if empty

      list.push( { id, time, live, token, asset, pair, balance, total, complete, elapsed, profit } ); // add
      this.sessionsData = this.$utils.trimLeft( list, this.maxItems ); // trim
      this.saveData( this.keys.sessions, this.sessionsData ); // save
    },

    // delete entry from session list by id
    deleteSessionEntry( id ) {
      this.sessionsData = this.sessionsData.filter( s => ( s.id !== id ) );
      this.saveData( this.keys.sessions, this.sessionsData );
    },

    // flush session data
    flushSessionData() {
      this.sessionsData = [];
      this.saveData( this.keys.sessions, this.sessionsData );
    },

    // count total pairs for select option
    updateWatchCount() {
      let asset = String( this.watchOptions.asset || '' );
      let count = this.watcher.watchCount( this.priceData );
      this.countInfo = this.$utils.noun( count, asset +' pair', asset +' pairs' );
    },

     // update elapsed times
    updateElapsedTimes() {
      if ( this.socketTime ) {
        let secs = ( Date.now() - this.socketTime ) / 1000;
        this.socketUpdated = this.$utils.elapsed( secs, 'ago', true );
      }
      if ( this.botStart ) {
        let secs = ( Date.now() - this.botStart ) / 1000;
        this.botElapsed = this.$utils.elapsed( secs );
      }
    },

    // get active trade count for a token
    activeTradeCount( token ) {
      return this.tradesData.filter( o => ( o.active && o.token === token ) ).length;
    },

    // get total trade count for a token
    totalTradeCount( token ) {
      return this.tradesData.filter( o => ( o.token === token ) ).length;
    },

    // remove complete orders from the bot trades list
    cleanTradesList() {
      this.tradesData = this.tradesData.filter( o => ( o.active && o.amount ) );
      this.saveData( this.keys.trades, this.tradesData );
    },

    // remove a trade from the list by id
    removeTradeEntry( tradeId ) {
      this.tradesData = this.tradesData.filter( o => ( o.id !== tradeId ) );
      this.saveData( this.keys.trades, this.tradesData );
    },

    // delete all trade data entries
    flushTradeEntries() {
      new Prompt({
        title: `Confirm Delete Trades`,
        confirm: `This will delete any active trades, are you sure?`,
        onAccept: () => {

          this.tradesData = [];
          this.saveData( this.keys.trades, this.tradesData );
        }
      });
    },

    // sell active trade/s at current price
    sellActiveTrade( id ) {
      if ( !this.isConnected ) return;

      this.tradesData.forEach( trade => {
        let { active, symbol, token, asset, amount, sellPrice } = trade;
        if ( trade.id !== id || !amount || !sellPrice ) return;

        new Prompt({
          title: `Confirm Trade Sell`,
          confirm: `Place an order to SELL ${amount} ${token} at current ${asset} trading price?`,
          onAccept: () => {

            trade.status = TRADE_SELL;
            this.placeOrder( 'SELL', symbol, sellPrice, amount );
          }
        });
      });
    },

    // check if a token from the balances list can be traded based on min total limit
    checkCanTradeToken( token, amount, price ) {
      price  = Number( price || 0 );
      amount = Math.floor( Number( amount || 0 ) );

      let asset = this.watchOptions.asset;
      let total = ( price * amount );

      if ( !token || !asset || amount <= 0 ) return false;
      if ( token === asset || token === 'USDT' ) return false;

      if ( price ) {
        if ( total <= 0 ) return false;
        if ( asset === 'BTC' && total < 0.001 ) return false;
        if ( asset === 'ETH' && total < 0.01 ) return false;
        if ( asset === 'BNB' && total < 1 ) return false;
        if ( asset === 'USDT' && total < 10 ) return false;
      }
      return true;
    },

    // convert token balance into active bot trade for sell
    initTokenTrade( token, amount ) {
      let asset    = this.watchOptions.asset;
      let symbol   = token + asset;
      let quantity = Math.floor( amount );
      let qtyStr   = this.$utils.money( quantity );
      let price    = this.getSymbolPrice( symbol );
      let priceStr = this.$utils.fixed( price, asset );

      // check if current market price was founf for this token
      if ( !price || !quantity ) {
        return this.$bus.emit( 'showNotice', `No market for ${symbol} at the moment.`, 'warning' );
      }
      // check if amount is already used by another trade
      if ( this.checkBotTradeExists( symbol, quantity ) ) {
        return this.$bus.emit( 'showNotice', `A trade for this ${token} amount already exists.`, 'warning' );
      }
      // ask for intitial buy price for the token being traded
      new Prompt({
        title: `Original ${symbol} BUY Price`,
        inputText: '0.00000000',
        forceValue: true,
        value: priceStr,
        onAccept: ( buyPrice ) => {

          // check if there's enough to trade with
          if ( !this.checkCanTradeToken( token, quantity, buyPrice ) ) {
            return this.$bus.emit( 'showNotice', `Not enough ${token} balance to trade with.`, 'warning' );
          }
          // confirm new trade entry
          new Prompt({
            title: `Confirm New Trade`,
            confirm: `Start new trade to sell ${qtyStr} ${token} starting at ${buyPrice} ${asset}?`,
            onAccept: () => {

              // insert new trade
              this.handleBotOrder( this.$binance.fakeOrderData( symbol, 'LIMIT', 'BUY', buyPrice, quantity, 'FILLED' ), true );
              this.$bus.emit( 'showNotice', `New trade added for ${qtyStr} ${token} @ ${buyPrice} ${asset}.`, 'success' );
            },
          });
        },
      });
    },

    // handle incoming order for the bot
    handleBotOrder( order, force ) {
      let { id, unique, time, symbol, token, asset, name, pair, route, image, price, quantity, filled, amount } = order;
      let unqdone = order.unique +'_'+ this.$utils.randString( 10 );
      let insert  = this.botActive || force;

      // buy order filled, create new trade entry
      if ( order.status === 'FILLED' && order.side === 'BUY' && insert ) {
        let [ active, status, buyPrice, sellPrice, profit ] = [ true, TRADE_WAIT, price, price, 0 ];
        this.tradesData.push( { id, unique, time, active, status, symbol, token, asset, name, pair, route, image, quantity, filled, amount, buyPrice, sellPrice, profit } );
      }
      // sell order filled, update existing trade entry
      if ( order.status === 'FILLED' && order.side === 'SELL' ) {
        let [ active, status, sellPrice ] = [ false, TRADE_DONE, price ];
        this.tradesData.forEach( o => { if ( o.unique === unique ) Object.assign( o, { active, status, sellPrice, unique: unqdone } ) } );
      }
      // sell order initiated, update existing trade entry
      if ( order.status === 'OPEN' && order.side === 'SELL' ) {
        let [ active, status, sellPrice ] = [ true, TRADE_SELL, price ];
        this.tradesData.forEach( o => { if ( o.unique === unique ) Object.assign( o, { active, status, sellPrice } ) } );
      }
      // order removed, update existing trade entry
      if ( /^(CANCELED|EXPIRED|REJECTED|REPLACED)$/.test( order.status ) ) {
        let [ active, status ] = [ true, TRADE_WAIT ];
        this.tradesData.forEach( o => { if ( o.unique === unique ) Object.assign( o, { active, status } ) } );
      }
      this.saveData( this.keys.trades, this.tradesData );
    },

    // mark a bot trade as active (reset)
    markBotTradeActive( id ) {
      let [ active, status ] = [ true, TRADE_WAIT ];
      this.tradesData.forEach( o => { if ( o.id === id ) Object.assign( o, { active, status } ) } );
      this.saveData( this.keys.trades, this.tradesData );
    },

    // mark a bot trade as sold (complete)
    markBotTradeSold( id ) {
      let [ active, status ] = [ false, TRADE_DONE ];
      this.tradesData.forEach( o => { if ( o.id === id ) Object.assign( o, { active, status } ) } );
      this.saveData( this.keys.trades, this.tradesData );
    },

    // stop the bot if there are request errors
    checkBotErrors() {
      if ( !this.botActive ) return;
      if ( this.errorCount > 2 ) this.stopBot();
    },

    // check if a bot trade exists based on a unique trade id
    checkBotTradeExists( symbol, amount ) {
      let unique = this.$utils.unique( symbol +'|'+ amount );
      return this.tradesData.filter( o => o.unique === unique ).length ? true : false;
    },

    // check price ticker for buy trigger
    checkTradeBuy() {
      if ( !this.botActive ) return;
      this.watcher.check( this.priceData, ( p, pc, vc, t ) => {

        // calculate order amount and total
        let limit    = String( this.watchOptions.tradeLimit );
        let quantity = Math.floor( this.tradeBalance / p.close );

        // check bot trade balance and options
        if ( this.pendingTrades >= this.maxTrades ) return;
        if ( this.balanceUsed >= this.balanceTotal ) return;
        if ( !this.checkCanTradeToken( p.token, quantity, p.close ) ) return;
        if ( this.checkBotTradeExists( p.symbol, quantity ) ) return;

        // check trade limit
        if ( limit === 'active' && this.activeTradeCount( p.token ) ) return;
        if ( limit === 'single' && this.totalTradeCount( p.token ) ) return;

        // place buy order
        this.placeOrder( 'BUY', p.symbol, p.close, quantity );
      });
    },

    // check if a trade needs to be sold due to stop loss or profit
    checkTradeSell() {
      let profit = Number( this.watchOptions.priceProfit );
      let stop   = Math.abs( this.watchOptions.priceStop ) * -1;
      let total  = 0;

      for ( let i = 0; i < this.tradesData.length; ++i ) {
        let { active, status, symbol, token, amount, buyPrice, sellPrice } = this.tradesData[ i ];
        let close   = ( active && status === TRADE_WAIT ) ? this.getSymbolPrice( symbol ) : sellPrice;
        let percent = close ? this.$utils.percent( close, buyPrice, true ) : 0;

        // keep live profit values updated
        this.tradesData[ i ].sellPrice = close;
        this.tradesData[ i ].profit = percent;
        total += percent;

        // check bot status and options
        if ( !this.botActive ) continue;
        if ( !active || !amount || status === TRADE_SELL ) continue;
        if ( !this.checkCanTradeToken( token, amount, close ) ) continue;
        if ( this.liveMode && !this.hasTokenBalance( token, amount ) ) continue;

        // stop loss hit, place sell order
        if ( stop < 0 && percent <= stop ) {
          this.tradesData[ i ].status = TRADE_SELL;
          this.placeOrder( 'SELL', symbol, close, amount );
          continue;
        }
        // profit hit, place sell order
        if ( percent >= profit ) {
          this.tradesData[ i ].status = TRADE_SELL;
          this.placeOrder( 'SELL', symbol, close, amount );
          continue;
        }
      }
      this.botProfit = total;
    },

    // make a copy of current prices to start comparing against
    buildSnapshot() {
      this.watcher.setOptions( this.watchOptions );
      this.watcher.updateSnapshot( this.priceData );
    },

    // when bot form options change
    onBotOptions( e ) {
      let asset   = String( this.watchOptions.asset );
      let percent = String( this.watchOptions.assetPercent );
      let factor  = Number( percent ) / 100;
      let coin    = this.balancesData.filter( b => ( b.asset === asset ) ).shift();
      this.watchOptions.assetBalance = coin ? +Number( coin.free * factor ).toFixed( 8 ) : 0;
      this.buildSnapshot();
    },

    // start new bot session
    startBot() {
      if ( this.botActive ) return;
      if ( this.liveMode && !confirm( 'Starting the bot in LIVE mode, are you sure?' ) ) {
        this.liveMode = false;
        return;
      }
      this.botActive = true;
      this.botStart = Date.now();
      this.botElapsed = '0s';
      this.botProfit = 0;
      this.errorCount = 0;
      this.buildSnapshot();
      this.cleanTradesList();
      this.saveData( this.keys.options, this.watchOptions );
      this.$bus.emit( 'showNotice', 'The trade bot is now active!', 'success' );
    },

    // stop current bot session
    stopBot() {
      if ( !this.botActive ) return;
      this.botActive = false;
      this.buildSessionData();
      this.$bus.emit( 'showNotice', 'The trade bot has stopped running.', 'success' );
    },

    // place real or simulated order based on some option
    placeOrder( side, symbol, price, quantity ) {
      let type    = String( this.watchOptions.orderType );
      let inforce = String( this.watchOptions.orderTime );

      if ( this.liveMode === true ) { this.$binance.placeOrder( symbol, type, side, price, quantity, inforce ); }
      else { this.$binance.placeFakeOrder( symbol, type, side, price, quantity ); } // fake it til you make it.
    },

    // cancel and/or remove order from list
    cancelOrder( symbol, orderId, quantity ) {
      this.$binance.cancelOrder( symbol, orderId, quantity );
    },

    // on order placed in order book
    onBookCreate( order ) {
      let { status, token, asset, type, side, price, quantity } = order;
      let priceStr = this.$utils.fixed( price, asset );
      let qtyStr   = this.$utils.money( quantity, 0 );
      let message  = `${type} ${side} Order ${status} for ${qtyStr} ${token} @ ${priceStr} ${asset}.`;
      this.$bus.emit( 'showNotice', message, 'info' );
      this.errorCount = 0;
    },

    // on order removed from order book
    onBookCancel( order ) {
      let { status, token, type, side } = order;
      let message = `${token} ${type} ${side} Order ${status}.`;
      this.$bus.emit( 'showNotice', message, 'info' );
      this.errorCount = 0;
    },

    // on order placing errors
    onBookFail( order, error ) {
      this.$bus.emit( 'showNotice', error, 'error' );
      this.errorCount += 1;
    },

    // attempt to start a new user stream
    initUserStream() {
      this.$binance.initUserStream( false );
    },

    // disconnect from user stream
    stopUserStream() {
      this.$binance.stopUserStream();
    },

    // on user stream connect
    onUserInit( e ) {
      this.socketStatus = 1;
      this.balancesData = [];
      this.onBotOptions();
    },

    // on user stream connect failed
    onUserFail( error ) {
      this.socketStatus = 0;
      this.socketError = error;
      this.$bus.emit( 'showNotice', error, 'error' );
    },

    // on user stream error
    onUserError( e ) {
      this.socketStatus = 0;
      this.socketError = String( e.message || 'User account API connection failed, check the console for more details.' );
      this.$bus.emit( 'showNotice', this.socketError, 'error' );
    },

    // on user stream close
    onUserClose( e ) {
      this.socketStatus = 0;
      this.balancesData = [];
      this.ordersData = [];
      this.onBotOptions();
      this.stopBot();
    },

    // on user stream open
    onUserOpen( e ) {
      this.socketStatus = 1;
      this.socketError = '';
    },

    // on user stream raw data
    onUserData( e ) {
      this.socketTime = Date.now();
      this.socketStatus = 2;
    },

    // on user account balances data
    onUserBalances( balances ) {
      this.balancesData = balances;
      this.onBotOptions();
    },

    // on user stream order data
    onUserOrder( order ) {
      this.handleBotOrder( order );
      this.updateOrdersList( order );
      this.notifyOrder( order );
    },

    // toggle trade bot state
    toggleTradeBot( action ) {
      switch ( action ) {
        case 'start'  :  return this.startBot();
        case 'stop'   :  return this.stopBot();
      }
    },
  },

  // on component created
  created() {
    this.$bus.on( 'toggleTradeBot', this.toggleTradeBot );
    this.setupUserHandlers();
  },

  // on component mounted
  mounted() {
    this.loadSavedData();
    this.onBotOptions();
  },

  // on component destroyed
  destroyed() {
    this.stopUserStream();
  },

}
</script>

<style lang="scss">
.bot-form {
  display: none;

  &.visible {
    display: block;
  }
}
</style>

