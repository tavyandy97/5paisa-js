"use strict";
const axios = require("axios");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;
const tough = require("tough-cookie");
var request = require("request");
const pd = require("node-pandas");

const WebSocket = require("ws");

const {
  genericPayload,
  loginPayload,
  orderPayload,
  marketpayload,
  OrderValidityEnum,
  logincheck,
  wspayload,
  basketOrderPayload,
  ocpKey
} = require("./const");
const { AES128Encrypt, AES256Encrypt } = require("./utils");

axiosCookieJarSupport(axios);

const cookieJar = new tough.CookieJar();
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

/**
 * Initializes a new client object with the app keys.
 * This client object can be further used to login multiple clients.
 * @class
 * @param {Object} conf - The conf object containing the app's API keys.
 * @example <caption>Initialize FivePaisaClient object</caption>
 * const FivePaisaClient = require("5paisajs")
 * const conf = {
   "appSource": "",
   "appName": "",
   "userId": "",
   "password": "",
   "userKey": "",
   "encryptionKey": ""
 * var client  = FivePaisaClient(conf)

 */
function FivePaisaClient(conf) {
  // Routes
  const BASE_URL = "https://Openapi.5paisa.com/VendorsAPI/Service1.svc";
  const LOGIN_ROUTE = `${BASE_URL}/V4/LoginRequestMobileNewbyEmail`;
  const MARGIN_ROUTE = `${BASE_URL}/V3/Margin`;
  const ORDER_BOOK_ROUTE = `${BASE_URL}/V2/OrderBook`;
  const HOLDINGS_ROUTE = `${BASE_URL}/V2/Holding`;
  const POSITIONS_ROUTE = `${BASE_URL}/V1/NetPositionNetWise`;
  const ORDER_PLACEMENT_ROUTE = `${BASE_URL}/V1/PlaceOrderRequest`;
  const ORDER_MODIFY_ROUTE = `${BASE_URL}/V1/ModifyOrderRequest`;
  const ORDER_CANCEL_ROUTE = `${BASE_URL}/V1/CancelOrderRequest`;
  const ORDER_STATUS_ROUTE = `${BASE_URL}/OrderStatus`;
  const TRADE_INFO_ROUTE = `${BASE_URL}/TradeInformation`;
  const BO_CO_ROUTE = `${BASE_URL}/SMOOrderRequest`;
  const BO_MOD_ROUTE = `${BASE_URL}/ModifySMOOrder`;
  const LOGINCHECK_ROUTE = `https://openfeed.5paisa.com/Feeds/api/UserActivity/LoginCheck`;
  const Market_ROUTE = `${BASE_URL}/MarketFeed`;
  const MARKET_DEPTH_ROUTE = `${BASE_URL}/MarketDepth`;
  const MARKET_DEPTH_BY_SYMBOL_ROUTE = `${BASE_URL}/V1/MarketDepth`;
  const IDEAS_ROUTE = `${BASE_URL}/TraderIDEAs`;
  const TRADEBOOK_ROUTE = `${BASE_URL}/V1/TradeBook`;
  const MARKET_STATUS_ROUTE = `${BASE_URL}/MarketStatus`;
  const ACCESS_TOKEN_ROUTE = `${BASE_URL}/GetAccessToken`;
  const TRADE_HISTORY_ROUTE = `${BASE_URL}/TradeHistory`;
  // Request types
  const LOGIN_REQUEST_CODE = `5PLoginV4`;
  const GET_BASKET_ROUTE = `${BASE_URL}/GetBaskets`;
  const CREATE_BASKET_ROUTE = `${BASE_URL}/CreateBasket`;
  const RENAME_BASKET_ROUTE = `${BASE_URL}/EditBasketName`;
  const DELETE_BASKET_ROUTE = `${BASE_URL}/DeleteBasket`;
  const CLONE_BASKET_ROUTE = `${BASE_URL}/CloneBasket`;
  const EXECUTE_BASKET_ROUTE = `${BASE_URL}/ExecuteBasket`;
  const GET_ORDERIN_BASKET_ROUTE = `${BASE_URL}/GetOrderInBasket`;
  const ADD_BASKET_ROUTE = `${BASE_URL}/AddOrderToBasket`;
  const POSITION_CONVERSION_ROUTE = `${BASE_URL}/PositionConversion`;
  const GET_EXPIRY_ROUTE = `${BASE_URL}/V2/GetExpiryForSymbolOptions`;
  const GET_OPTION_CHAIN_ROUTE = `${BASE_URL}/GetOptionsForSymbol`;
  const CANCEL_BULK_ORDER_ROUTE = `${BASE_URL}/CancelOrderBulk`;
  const SQUARE_OFF_ALL_ROUTE = `${BASE_URL}/SquareOffAll`;
  const MARKET_DEPTH_TOKEN_ROUTE =
    "https://openapi.5paisa.com/marketfeed-token/token";
  var CLIENT_CODE = "";
  this.loginPayload = loginPayload;
  this.loginPayload.head.appName = conf.appName;
  this.loginPayload.head.key = conf.userKey;
  this.loginPayload.head.userId = conf.userId;
  this.loginPayload.head.password = conf.password;
  this.genericPayload = genericPayload;
  this.genericPayload.head.key = conf.userKey;
  this.orderPayload = orderPayload;
  this.orderPayload.head.key = conf.userKey;
  this.orderPayload.body.AppSource = conf.appSource;
  this.marketpayload = marketpayload;
  this.marketpayload.head.key = conf.userKey;
  this.logincheck = logincheck;
  this.logincheck.head.appName = conf.appName;
  this.logincheck.head.key = conf.userKey;
  this.wspayload = wspayload;
  this.basketOrderPayload = basketOrderPayload;
  this.basketOrderPayload.head.key = conf.userKey;
  let accessToken = "";
  let aspxauth = "";
  let jwttoken = "";
  let websocketConnection = null;
  let marketDepth_accessToken = "";

  const defaultOrderParams = {
    exchangeSegment: "C",
    isStopLossOrder: false,
    stopLossPrice: 0,
    isIOCOrder: false,
    isIntraday: false,
    ahPlaced: "N",
    IOCOrder: false,
    price: 0,
    scripCode: "",
    scripData: ""
  };
  const defaultbocoParams = {
    TrailingSL: 0,
    StopLoss: 0,
    LocalOrderIDNormal: 0,
    LocalOrderIDSL: 0,
    LocalOrderIDLimit: 0,
    public_ip: "192.168.1.1",
    traded_qty: 0,
    order_for: "S",
    DisQty: 0,
    ExchOrderId: "0",
    AtMarket: false,
    UniqueOrderIDNormal: "",
    UniqueOrderIDSL: "",
    UniqueOrderIDLimit: ""
  };

  const basketOrderParams = {
    AtMarket: false,
    StopLossPrice: "0",
    IsStopLossOrder: false,
    IOCOrder: false,
    IsIntraday: false,
    ValidTillDate: "/Date(1613129870000)/",
    AHPlaced: "N",
    PublicIP: "0.0.0.0",
    DisQty: "0",
    iOrderValidity: 0
  };
  // Request instance to be used throughout, with cookie support.
  const request_instance = axios.create({
    baseURL: BASE_URL,
    jar: cookieJar,
    withCredentials: true
  });
  request_instance.defaults.headers.common["Content-Type"] = "application/json";
  request_instance.defaults.headers.common["Authorization"] =
    "Bearer " + accessToken;

  /**
   * Handles the response from the login method and returns a promise.
   * @method init
   * @memberOf FivePaisaClient
   * @param {Object} response
   */
  this.init = function(response) {
    try {
      var promise = new Promise(function(resolve, reject) {
        if (response.data.body.Message == "") {
          console.log(GREEN, `Logged in`);
          CLIENT_CODE = response.data.body.ClientCode;
          resolve();
        } else {
          console.log(RED, response.data.body.Message);
          reject(response.data.body.Message);
        }
      });
      jwttoken = response.data.body.JWTToken;
      accessToken = jwttoken;
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Logs in the client.
   * @method login
   * @memberOf FivePaisaClient
   * @param {string} email - Client's email
   * @param {string} password - Client's password
   * @param {string} DOB - Client's DOB in YYYYMMDD format
   * @example <caption> Logging in a user </caption>
   * const conf = {
   * "appSource": "",
   * "appName": "",
   * "userId": "",
   * "password": "",
   * "userKey": "",
   * "encryptionKey": ""
   * }

   * const { FivePaisaClient} = require("5paisajs")
   *
   * var client = new FivePaisaClient(conf)
   *
   * // This client object can be used to login multiple users.
   * client.login("random_email@xyz.com", "password", "YYYYMMDD").then((response) => {
   *     client.init(response).then(() => {
   *         // Fetch holdings, positions or place orders here.
   *         // See following examples.
   *     })
   * }).catch((err) =>{
   *     // Oh no :/
   *     console.log(err)
   * })

   */
  this.login = function(email, password, DOB) {
    try {
      const encryptionKey = conf.encryptionKey;
      let encrypt = AES256Encrypt;

      this.loginPayload.head.requestCode = LOGIN_REQUEST_CODE;
      this.loginPayload.body.Email_id = encrypt(encryptionKey, email);
      this.loginPayload.body.Password = encrypt(encryptionKey, password);
      this.loginPayload.body.My2PIN = encrypt(encryptionKey, DOB);

      var req = request_instance.post(LOGIN_ROUTE, loginPayload);

      return req;
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Fetches holdings for the client.
   * @method getHoldings
   * @memberOf FivePaisaClient
   * @returns {Array} Array containing holdings
   * @example <caption>Fetching holdings</caption>
   * client.getHoldings().then((holdings) => {
   *    console.log(holdings)
   *  }).catch((err) => {
   *    console.log(err)
   *  });
   */

  this.getHoldings = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(HOLDINGS_ROUTE, payload).then(response => {
          if (response.data.body.Data.length === 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body.Data);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Fetches orders for the client.
   * @method getOrderBook
   * @memberOf FivePaisaClient
   * @returns {Array} Array containing orders
   * @example <caption>Fetching orders</caption>
   * client.getOrderBook().then((orders) => {
   *    console.log(orders)
   *  }).catch((err) => {
   *    console.log(err)
   *  });
   */
  this.getOrderBook = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(ORDER_BOOK_ROUTE, payload).then(response => {
          if (response.data.body.OrderBookDetail.length === 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body.OrderBookDetail);
          }
        });
      });

      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Fetches margin details for the client.
   * @method getMargin
   * @memberOf FivePaisaClient
   * @returns {Array} Array containing margin details
   * @example <caption>Fetching margin details</caption>
   * client.getMargin().then((marginDetails) => {
   *    console.log(marginDetails)
   *  }).catch((err) => {
   *    console.log(err)
   *  });
   */
  this.getMargin = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(MARGIN_ROUTE, payload).then(response => {
          if (response.data.body.EquityMargin.length === 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body.EquityMargin);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Fetches position details for the client.
   * @method getPositions
   * @memberOf FivePaisaClient
   * @returns {Array} Array containing position details
   * @example <caption>Fetching margins</caption>
   * client.getPositions().then((positionDetails) => {
   *    console.log(positionDetails)
   *  }).catch((err) => {
   *    console.log(err)
   *  });
   */
  this.getPositions = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(POSITIONS_ROUTE, payload).then(response => {
          if (response.data.body.NetPositionDetail.length === 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body.NetPositionDetail);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this._order_request = function(orderType) {
    try {
      var requrl = "";
      var payload;
      if (orderType === "P") {
        requrl = ORDER_PLACEMENT_ROUTE;
        this.orderPayload.body.ClientCode = CLIENT_CODE;
        payload = this.orderPayload;
      } else if (orderType === "M") {
        requrl = ORDER_MODIFY_ROUTE;
        this.orderPayload.body.ClientCode = CLIENT_CODE;
        payload = this.orderPayload;
      } else if (orderType === "C") {
        requrl = ORDER_CANCEL_ROUTE;
        this.genericPayload.body.ClientCode = CLIENT_CODE;
        payload = this.genericPayload;
      } else {
        throw new Error("No Such orderType specified");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwttoken}`
      };

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(requrl, payload, {
            headers: headers
          })
          .then(response => {
            resolve(response.data.body);
          })
          .catch(err => {
            reject(err);
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Parameter object containing options to place complex orders.
   * @typedef {Object} OrderRequestParams
   * @property {float} [price=0] - Rate at which you want to Buy / Sell the stock. (price=0 for at market order)
   * @property {string} [exchangeSegment=C] - Exchange Segment. "C"- Cash, "D"- Derivative, "U" - Currency
   * @property {boolean} [atMarket=true] - true - For market order, false - For limit order
   * @property {boolean} [isStopLossOrder=false] - true - For stoploss order, false - For regular order
   * @property {float} [stopLossPrice=0] - This will be the trigger price. This will be set when user want to place stop loss order. (For Buy Stop loss, Trigger price should not be greater than Limit Price.
   *                                 And for Sell Stop Loss Order Trigger Price should not be less than Limit Price)
   * @property {boolean} [isVTD=false] -
   * @property {boolean} [isIOCOrder=false] - Send true in case order is IOC.
   * @property {boolean} [isIntraday=false] - true - For intraday order, false - for delivery order.
   * @property {boolean} [ahPlaced=N] - "Y -in case order placed after market closed. N-Normal Market time Order
   * @property {boolean} [DisQty] - Quantity exposed in the exchange. Disclosed quantity is never larger than order quantity.
   * @property {boolean} [IOCOrder=false] - true - For IOC order, false - For regular order.
   * @property {OrderValidityEnum} [iOrderValidity] - true - Order validity.
   *
   */

  /**
   * @typedef {Object} OrderResponse
   * @property {number} BrokerOrderID - Order ID
   * @property {string} ClientCode - ClientCode
   * @property {string} Exch - Exchange. "B" - BSE, "N" - NSE.
   * @property {string} ExchOrderID - Order ID generated by the exchange.
   * @property {string} ExchType - Exchange Segment. "C"- Cash, "D"- Derivative, "U" - Currency
   * @property {number} LocalOrderID - 0
   * @property {string} Message -
   * @property {number} RMSResponseCode -
   * @property {number} ScripCode -
   * @property {number} Status -
   * @property {string} Time - /Date(1599417000000+0530)/
   *
   */

  /**
   * Places a fresh order
   * @method placeOrder
   * @memberOf FivePaisaClient
   * @returns {OrderResponse}
   * @param {string} orderType - "BUY" - Buy, "SELL" - Sell
   * @param {number} qty - Quantity of the scrip to be traded.
   * @param {string} exchange - Exchange name. "N" - NSE, "B" - BSE
   * @param {OrderRequestParams} [params] - Parameters for placing complex orders
   */
  this.placeOrder = function(orderType, qty, exchange, params) {
    try {
      if (orderType === undefined) {
        throw new Error(
          `No orderType specified, valid order types are "BUY" and "SELL"`
        );
      }

      if (qty === undefined) {
        throw new Error("No quantity specified");
      }
      if (exchange == undefined) {
        throw new Error(
          `No exchange specified, valid exchange types are "NSE" and "BSE"`
        );
      }
      params = params || defaultOrderParams;
      if (params.IsGTCOrder !== undefined) {
        this.orderPayload.body.IsGTCOrder = params.IsGTCOrder;
      }
      if (params.IsEOSOrder !== undefined) {
        this.orderPayload.body.IsEOSOrder = params.IsEOSOrder;
      }
      this.orderPayload.body.OrderType = orderType;
      this.orderPayload.body.Qty = qty;
      if (params.scripCode === undefined) {
        this.orderPayload.body.ScripData = params.scripData;
      } else {
        this.orderPayload.body.ScripCode = params.scripCode;
      }
      this.orderPayload.body.Price = params.price || defaultOrderParams.price;
      this.orderPayload.body.Exchange = exchange || defaultOrderParams.exchange;
      this.orderPayload.body.ExchangeType =
        params.exchangeSegment || defaultOrderParams.exchangeSegment;
      this.orderPayload.body.DisQty = qty;
      this.orderPayload.body.IsStopLossOrder =
        params.isStopLossOrder || defaultOrderParams.isStopLossOrder;
      this.orderPayload.body.StopLossPrice =
        params.stopLossPrice || defaultOrderParams.stopLossPrice;
      this.orderPayload.body.IsIOCOrder =
        params.isIOCOrder || defaultOrderParams.isIOCOrder;
      this.orderPayload.body.IsIntraday =
        params.isIntraday || defaultOrderParams.isIntraday;
      this.orderPayload.body.IsAHOrder =
        params.ahPlaced || defaultOrderParams.ahPlaced;
      this.orderPayload.body.DisQty = params.DisQty || qty;
      this.orderPayload.body.RemoteOrderID = params.RemoteOrderID || "1";
      return this._order_request("P");
    } catch (err) {
      console.log(err);
    }
  };
  this.bocoorder = function(
    scrip_code,
    Qty,
    LimitPriceInitialOrder,
    TriggerPriceInitialOrder,
    LimitPriceProfitOrder,
    BuySell,
    Exch,
    ExchType,
    RequestType,
    TriggerPriceForSL,
    params
  ) {
    try {
      params = params || defaultbocoParams;
      this.genericPayload.body.ScripCode = scrip_code;
      this.genericPayload.body.Qty = Qty;
      this.genericPayload.body.LimitPriceInitialOrder = LimitPriceInitialOrder;
      this.genericPayload.body.TriggerPriceInitialOrder = TriggerPriceInitialOrder;
      this.genericPayload.body.LimitPriceProfitOrder = LimitPriceProfitOrder;
      this.genericPayload.body.BuySell = BuySell;
      this.genericPayload.body.Exch = Exch;
      this.genericPayload.body.ExchType = ExchType;
      this.genericPayload.body.RequestType = RequestType;
      this.genericPayload.body.TriggerPriceForSL = TriggerPriceForSL;
      this.genericPayload.body.TrailingSL =
        params.TrailingSL || defaultbocoParams.TrailingSL;
      this.genericPayload.body.StopLoss =
        params.StopLoss || defaultbocoParams.StopLoss;
      this.genericPayload.body.LocalOrderIDNormal =
        params.LocalOrderIDNormal || defaultbocoParams.LocalOrderIDNormal;
      this.genericPayload.body.LocalOrderIDSL =
        params.LocalOrderIDSL || defaultbocoParams.LocalOrderIDSL;
      this.genericPayload.body.LocalOrderIDLimit =
        params.LocalOrderIDLimit || defaultbocoParams.LocalOrderIDLimit;
      this.genericPayload.body.PublicIp =
        params.public_ip || defaultbocoParams.public_ip;
      this.genericPayload.body.TradedQty =
        params.traded_qty || defaultbocoParams.traded_qty;
      if (LimitPriceProfitOrder === 0) {
        this.genericPayload.body.OrderFor = "C";
      } else {
        this.genericPayload.body.OrderFor =
          params.order_for || defaultbocoParams.order_for;
      }

      this.genericPayload.body.DisQty =
        params.DisQty || defaultbocoParams.DisQty;
      this.genericPayload.body.ExchOrderId =
        params.ExchOrderId || defaultbocoParams.ExchOrderId;
      this.genericPayload.body.AtMarket =
        params.AtMarket || defaultbocoParams.AtMarket;
      this.genericPayload.body.UniqueOrderIDNormal =
        params.UniqueOrderIDNormal || defaultbocoParams.UniqueOrderIDNormal;
      this.genericPayload.body.UniqueOrderIDSL =
        params.UniqueOrderIDSL || defaultbocoParams.UniqueOrderIDSL;
      this.genericPayload.body.UniqueOrderIDLimit =
        params.UniqueOrderIDLimit || defaultbocoParams.UniqueOrderIDLimit;
      this.genericPayload.body.AppSource = conf.appSource;
      this.genericPayload.body.OrderRequesterCode = CLIENT_CODE;

      this.genericPayload.body.ClientCode = CLIENT_CODE;

      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(BO_CO_ROUTE, payload)
          .then(response => {
            resolve(response.data.body);
          })
          .catch(err => {
            reject(err);
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.Mod_bo_order = function(
    orderType,
    scripCode,
    qty,
    exchange,
    exchangeOrderID,
    params
  ) {
    try {
      params = params || defaultOrderParams;
      this.orderPayload.body.ExchOrderID = exchangeOrderID;
      this.orderPayload.body.OrderType = orderType;
      this.orderPayload.body.Qty = qty;
      this.orderPayload.body.ScripCode = scripCode;
      this.orderPayload.body.Price = params.price || defaultOrderParams.price;
      this.orderPayload.body.Exchange = exchange || defaultOrderParams.exchange;
      this.orderPayload.body.ExchangeType =
        params.exchangeSegment || defaultOrderParams.exchangeSegment;
      this.orderPayload.body.DisQty = qty;
      this.orderPayload.body.IsStopLossOrder =
        params.isStopLossOrder || defaultOrderParams.isStopLossOrder;
      this.orderPayload.body.TriggerPriceForSL =
        params.stopLossPrice || defaultOrderParams.stopLossPrice;
      this.orderPayload.body.IsVTD = params.isVTD || defaultOrderParams.isVTD;
      this.orderPayload.body.IOCOrder =
        params.isIOCOrder || defaultOrderParams.isIOCOrder;
      this.orderPayload.body.IsIntraday =
        params.isIntraday || defaultOrderParams.isIntraday;
      this.orderPayload.body.AHPlaced =
        params.ahPlaced || defaultOrderParams.ahPlaced;
      if (this.orderPayload.body.AHPlaced === "Y") {
        this.orderPayload.body.AtMarket = false;
      } else {
        this.orderPayload.body.AtMarket =
          params.atMarket || defaultOrderParams.atMarket;
      }
      this.orderPayload.body.TradedQty = 0;
      this.orderPayload.body.LegType = 0;
      this.orderPayload.body.TMOPartnerOrderID = 0;
      this.orderPayload.body.DisQty = params.DisQty || qty;
      this.orderPayload.body.IOCOrder =
        params.IOCOrder || defaultOrderParams.IOCOrder;
      this.orderPayload.iOrderValidity =
        params.orderValidity || defaultOrderParams.orderValidity;
      this.orderPayload.body.ClientCode = CLIENT_CODE;
      this.orderPayload.body.OrderRequesterCode = CLIENT_CODE;
      this.orderPayload.body.OrderFor = "M";

      var payload = this.orderPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(BO_MOD_ROUTE, payload)
          .then(response => {
            resolve(response.data.body);
          })
          .catch(err => {
            reject(err);
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };
  /**
   * Modifies an order
   * @method modifyOrder
   * @memberOf FivePaisaClient
   * @returns {Object}
   * @param {string} exchangeOrderID - Exchange order ID received from exchange.
   * @param {number} Qty - Qty that you want to buy.
   * @param {boolean} is_intraday- true if you want to do intraday else false.
   * @param {string} exchange - Exchange
   * @param {string} exchange_type - exchange type you want to trade.
   * @param {object} [params] - Parameters for placing complex orders
   */
  // this.modifyOrder = function (exchangeOrderID, tradedQty, scripCode) {
  //   this.orderPayload.body.ExchOrderID = exchangeOrderID;
  //   this.orderPayload.body.TradedQty = tradedQty;
  //   this.orderPayload.body.ScripCode = scripCode;
  //   return this._order_request("M");
  // };
  this.modifyOrder = function(
    exchangeOrderID,
    Qty,
    Price,
    is_intraday,
    exchange,
    exchange_type,
    params
  ) {
    try {
      this.orderPayload.body.ExchOrderID = exchangeOrderID;
      this.orderPayload.body.Qty = Qty;
      this.orderPayload.body.Price = Price;
      if (params.scripCode === undefined) {
        this.orderPayload.body.ScripData = params.scripData;
      } else {
        this.orderPayload.body.ScripCode = params.scripCode;
      }
      this.orderPayload.body.IsIntraday = is_intraday;
      this.orderPayload.body.Exchange = exchange;
      this.orderPayload.body.ExchangeType = exchange_type;

      return this._order_request("M");
    } catch (err) {
      console.log(err);
    }
  };
  /**
   * Cancels an order
   * @method cancelOrder
   * @memberOf FivePaisaClient
   * @returns {Object}
   * @param {string} exchangeOrderID - Exchange order ID received from exchange.
   * @param {string} exchange - Exchange
   * @param {string} exchange_type - exchange type you want to trade.
   */
  this.cancelOrder = function(exchangeOrderID, exchange, exchange_type) {
    try {
      this.genericPayload.body.ExchOrderID = exchangeOrderID;
      this.genericPayload.body.Exchange = exchange;
      this.genericPayload.body.ExchangeType = exchange_type;
      this.genericPayload.body.AppSource = conf.appSource;

      return this._order_request("C");
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Gets the order status of the orders provided
   * @method getOrderStatus
   * @memberOf FivePaisaClient
   * @returns {Object}
   * @param {Array} orderList - Array containing order details.
   * [
   *  {
   *      "Exch":"N",
   *      "ExchType":"C",
   *      "ScripCode":11111,
   *      "RemoteOrderID":"5712977609111312242"
   *  }
   * ]
   */
  this.getOrderStatus = function(orderList) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.OrdStatusReqList = orderList;
      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance.post(ORDER_STATUS_ROUTE, payload).then(response => {
          if (response.data.body.OrdStatusResLst === 0) {
            reject({ err: "No info found" });
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };
  this.getMarketDepth = function(DepthList) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.Count = "1";
      this.genericPayload.body.Data = DepthList;
      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance.post(MARKET_DEPTH_ROUTE, payload).then(response => {
          if (response.data.body.Data.length === 0) {
            reject({ err: "No info found" });
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };
  this.getMarketDepthBySymbol = function(DepthList) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.Count = "1";
      this.genericPayload.body.Data = DepthList;
      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(MARKET_DEPTH_BY_SYMBOL_ROUTE, payload)
          .then(response => {
            if (response.data.body.Data.length === 0) {
              reject({ err: "No info found" });
            } else {
              resolve(response.data.body);
            }
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };
  /**
   * Gets the trade information for a set of trades provided
   * @method getTradeInfo
   * @memberOf FivePaisaClient
   * @returns {Object}
   * @param {Array} tradeDetailList - Array containing trades
   * [
   *  {
   *      "Exch":"N",
   *      "ExchType":"C",
   *      "ScripCode":11111,
   *      "RemoteOrderID":"1111111"
   *  }
   * ]
   */
  this.getTradeInfo = function(tradeDetailList) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.TradeDetailList = tradeDetailList;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(TRADE_INFO_ROUTE, payload).then(response => {
          if (response.data.body.TradeDetail.length === 0) {
            reject({ err: "No info found" });
          } else {
            resolve(response.data.body.TradeDetail);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.getMarketFeed = function(reqlist) {
    try {
      this.marketpayload.body.Count = CLIENT_CODE;
      this.marketpayload.body.MarketFeedData = reqlist;
      var payload = this.marketpayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance.post(Market_ROUTE, payload).then(response => {
          if (response.data.body.Data.length === 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body.Data);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.historicalData = function(Exch, Exchtype, scrip, timeframe, from, to) {
    try {
      var timeList = ["1m", "5m", "10m", "15m", "30m", "60m", "1d"];
      var res = timeList.includes(timeframe);
      if (res === true) {
        var req_data = {
          ClientCode: CLIENT_CODE,
          JWTToken: jwttoken
        };

        request_instance
          .post(
            "https://Openapi.5paisa.com/VendorsAPI/Service1.svc/ValidateClientToken",
            req_data
          )
          .then(response => {
            if (response.data.Message === "Success") {
              var setHeader = {
                "Ocp-Apim-Subscription-Key": ocpKey,
                "x-clientcode": CLIENT_CODE,
                "x-auth-token": jwttoken
              };

              var url = `https://openapi.5paisa.com/historical/${Exch}/${Exchtype}/${scrip}/${timeframe}?from=${from}&end=${to}`;

              var headers = setHeader;

              request.get(
                { headers: headers, url: url, method: "GET" },
                function(e, r, body) {
                  var bodyValues = JSON.parse(body);
                  var candleList = bodyValues.data.candles;
                  var columns = [
                    "Datetime",
                    "Open",
                    "High",
                    "Low",
                    "Close",
                    "Volume"
                  ];
                  var df = pd.DataFrame(candleList, columns);

                  return df.show;
                }
              );
            } else {
              return response.data;
            }
          });
      } else {
        return "Time frame is invalid.";
      }
    } catch (err) {
      console.log(err);
    }
  };

  this.ideasBuy = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(IDEAS_ROUTE, payload).then(response => {
          if (response.data.body.Data.length === 0) {
            reject(response.data.body.Message);
          } else {
            var bodyValues = JSON.parse(response.data.body.Data[0].payload);
            var df = pd.DataFrame(bodyValues);
            resolve(df);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.ideasTrade = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(IDEAS_ROUTE, payload).then(response => {
          if (response.data.body.Data.length === 0) {
            reject(response.data.body.Message);
          } else {
            var bodyValues = JSON.parse(response.data.body.Data[1].payload);
            var df = pd.DataFrame(bodyValues);
            resolve(df);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.getTradeBook = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(TRADEBOOK_ROUTE, payload).then(response => {
          if (response.data.body.TradeBookDetail.length === 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body.TradeBookDetail);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.loginCheck = function() {
    try {
      this.logincheck.body.RegistrationID = jwttoken;
      this.logincheck.head.LoginId = CLIENT_CODE;
      var payload = this.logincheck;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(LOGINCHECK_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            aspxauth = response.headers["set-cookie"][1].split(";");
            resolve(aspxauth[0]);
          }
        });
      });

      return promise;
    } catch (err) {
      console.log(err);
    }
  };
  this.requestFeed = function(Method, Operation, req_list) {
    try {
      const Method_dict = { mf: "MarketFeedV3", md: "MarketDepthService" };
      const Operation_dict = { s: "Subscribe", u: "Unsubscribe" };

      this.wspayload.Method = Method_dict[Method];
      this.wspayload.Operation = Operation_dict[Operation];
      this.wspayload.ClientCode = CLIENT_CODE;
      this.wspayload.MarketFeedData = req_list;

      return this.wspayload;
    } catch (err) {
      console.log(err);
    }
  };

  this.websocketStreaming = function(data) {
    try {
      var weburl = `wss://openfeed.5paisa.com/Feeds/api/chat?Value1=${jwttoken}|${CLIENT_CODE}`;

      websocketConnection = new WebSocket(weburl, {
        headers: {
          Cookie: aspxauth[0]
        }
      });

      websocketConnection.onerror = function() {
        try {
          console.log("Connection Error");
        } catch (err) {
          console.log(err);
        }
      };

      websocketConnection.onopen = function() {
        try {
          console.log("WebSocket Client Connected");

          function SendData() {
            if (websocketConnection.readyState === websocketConnection.OPEN) {
              websocketConnection.send(JSON.stringify(data));
            }
          }
          SendData();
        } catch (err) {
          console.log(err);
        }
      };
    } catch (err) {
      console.log(err);
    }
  };

  this.displayMessage = function(onmessagedisplay) {
    try {
      websocketConnection.onmessage = onmessagedisplay;
    } catch (err) {
      console.log(err);
    }
  };

  this.closeConnection = function() {
    try {
      websocketConnection.close();
    } catch (err) {
      console.log(err);
    }
  };

  this.getMarketStatus = function() {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `bearer ${accessToken}`
      };
      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(MARKET_STATUS_ROUTE, payload, {
            headers: headers
          })
          .then(response => {
            if (response.data.body.Data.length === 0) {
              reject(response.data.body);
            } else {
              resolve(response.data.body.Data);
            }
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.getAccessToken = function(reqToken) {
    try {
      this.genericPayload.head.Key = conf.userKey;
      this.genericPayload.body.RequestToken = reqToken;
      this.genericPayload.body.EncryKey = conf.encryptionKey;
      this.genericPayload.body.UserId = conf.userId;
      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance.post(ACCESS_TOKEN_ROUTE, payload).then(response => {
          if (response.data.body.Message != "Success") {
            reject(response.data.body.Message);
          } else {
            accessToken = response.data.body.AccessToken;
            request_instance.defaults.headers.common[
              "Authorization"
            ] = `bearer ${accessToken}`;
            CLIENT_CODE = response.data.body.ClientCode;
            resolve(accessToken);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.getTradeHistory = function(exchangeId) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.ExchOrderID = exchangeId;

      var payload = this.genericPayload;
      if (this.genericPayload.body.ClientCode != null) {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `bearer ${accessToken}`
        };
        var promise = new Promise(function(resolve, reject) {
          request_instance
            .post(TRADE_HISTORY_ROUTE, payload, {
              headers: headers
            })
            .then(response => {
              if (response.data.body.length === 0) {
                reject(response.data.body);
              } else {
                resolve(response.data.body);
              }
            });
        });
        return promise;
      }
    } catch (err) {
      console.log(err);
    }
  };

  this.getBaskets = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      // const headers = {
      //   'Content-Type': 'application/json',
      //   'Authorization': `bearer ${accessToken}`
      // }
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(GET_BASKET_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };
  this.createBasket = function(basketName) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.BasketName = basketName;
      var payload = this.genericPayload;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `bearer ${accessToken}`
      };
      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(CREATE_BASKET_ROUTE, payload, {
            headers: headers
          })
          .then(response => {
            if (response.data.body.Status != 0) {
              reject(response.data.body.Message);
            } else {
              resolve(response);
            }
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.renameBasketName = function(basketID, basketName) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.BasketID = basketID;
      this.genericPayload.body.NewBasketName = basketName;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(RENAME_BASKET_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.deleteBasket = function(basketID) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.BasketIDs = basketID;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(DELETE_BASKET_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.cloneBasket = function(basketID) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.BasketID = basketID;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(CLONE_BASKET_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.executeBasket = function(basketID) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.BasketID = basketID;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(EXECUTE_BASKET_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.getOrderInBasket = function(basketID) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.BasketID = basketID;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(GET_ORDERIN_BASKET_ROUTE, payload)
          .then(response => {
            if (response.data.body.Status != 0) {
              reject(response.data.body.Message);
            } else {
              resolve(response.data.body);
            }
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.addOrderInBasket = function(
    exch,
    exchtype,
    price,
    orderType,
    qty,
    scripCode,
    delvIntra,
    basketIDs,
    params
  ) {
    try {
      params = params || basketOrderParams;
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.Exchange = exch;
      this.genericPayload.body.ExchangeType = exchtype;
      this.genericPayload.body.Price = price;
      this.genericPayload.body.OrderType = orderType;
      this.genericPayload.body.Qty = qty;
      this.genericPayload.body.ScripCode = scripCode;
      this.genericPayload.body.AtMarket =
        params.AtMarket || basketOrderParams.AtMarket;
      this.genericPayload.body.StopLossPrice =
        params.StopLossPrice || basketOrderParams.StopLossPrice;
      this.genericPayload.body.IsStopLossOrder =
        params.IsStopLossOrder || basketOrderParams.IsStopLossOrder;
      this.genericPayload.body.IOCOrder =
        params.IOCOrder || basketOrderParams.IOCOrder;
      this.genericPayload.body.DelvIntra = delvIntra;
      this.genericPayload.body.AppSource = conf.appSource;
      if (delvIntra === "D") {
        this.genericPayload.body.IsIntraday = false;
      } else {
        this.genericPayload.body.IsIntraday = true;
      }
      this.genericPayload.body.ValidTillDate =
        params.ValidTillDate || basketOrderParams.ValidTillDate;
      this.genericPayload.body.AHPlaced =
        params.AHPlaced || basketOrderParams.AHPlaced;
      this.genericPayload.body.PublicIP =
        params.PublicIP || basketOrderParams.PublicIP;
      this.genericPayload.body.DisQty =
        params.DisQty || basketOrderParams.DisQty;
      this.genericPayload.body.iOrderValidity =
        params.iOrderValidity || basketOrderParams.iOrderValidity;
      this.genericPayload.body.BasketIDs = basketIDs;

      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance.post(ADD_BASKET_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.positionConversion = function(
    exch,
    exchtype,
    tradeType,
    scripData,
    convertQty,
    convertFrom,
    convertTo
  ) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.Exchange = exch;
      this.genericPayload.body.ExchangeType = exchtype;
      this.genericPayload.body.ScripCode = scripData;
      this.genericPayload.body.TradeType = tradeType;
      this.genericPayload.body.ConvertQty = convertQty;
      this.genericPayload.body.ConvertFrom = convertFrom;
      this.genericPayload.body.ConvertTo = convertTo;

      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(POSITION_CONVERSION_ROUTE, payload)
          .then(response => {
            if (response.data.body.Status != 0) {
              reject(response.data.body.Message);
            } else {
              resolve(response.data.body);
            }
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.getExpire = function(exch, symbol) {
    try {
      this.genericPayload.body.Exchange = exch;
      this.genericPayload.body.Symbol = symbol;

      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(GET_EXPIRY_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.getOptionChian = function(exch, symbol, expiryDate) {
    try {
      this.genericPayload.body.Exchange = exch;
      this.genericPayload.body.Symbol = symbol;
      this.genericPayload.body.ExpiryDate = `/Date(${expiryDate})/`;
      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(GET_OPTION_CHAIN_ROUTE, payload)
          .then(response => {
            if (response.data.body.Status != 0) {
              reject(response.data.body.Message);
            } else {
              resolve(response.data.body);
            }
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.canceBulkOrder = function(exchOrderIDs) {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      this.genericPayload.body.ExchOrderIDs = exchOrderIDs;
      var payload = this.genericPayload;

      var promise = new Promise(function(resolve, reject) {
        request_instance
          .post(CANCEL_BULK_ORDER_ROUTE, payload)
          .then(response => {
            if (response.data.body.Status != 0) {
              reject(response.data.body.Message);
            } else {
              resolve(response.data.body);
            }
          });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.SquareOffAll = function() {
    try {
      this.genericPayload.body.ClientCode = CLIENT_CODE;
      var payload = this.genericPayload;
      var promise = new Promise(function(resolve, reject) {
        request_instance.post(SQUARE_OFF_ALL_ROUTE, payload).then(response => {
          if (response.data.body.Status != 0) {
            reject(response.data.body.Message);
          } else {
            resolve(response.data.body);
          }
        });
      });
      return promise;
    } catch (err) {
      console.log(err);
    }
  };

  this.marketDepthToken = function(data, onmessagedisplay) {
    try {
      const headers = {
        "Ocp-Apim-Subscription-Key": ocpKey
      };
      request.post(
        { headers: headers, url: MARKET_DEPTH_TOKEN_ROUTE, method: "POST" },
        function(e, r, body) {
          let generate_token = JSON.parse(body);
          marketDepth_accessToken = generate_token.access_token;
          var weburl = `wss://openapi.5paisa.com/ws?subscription-key=${ocpKey}&access_token=${marketDepth_accessToken}`;

          websocketConnection = new WebSocket(weburl);

          websocketConnection.onerror = function() {
            try {
              console.log("Connection Error");
            } catch (err) {
              console.log(err);
            }
          };

          websocketConnection.onopen = function() {
            try {
              console.log("WebSocket Client Connected");

              function SendData() {
                if (
                  websocketConnection.readyState === websocketConnection.OPEN
                ) {
                  websocketConnection.send(JSON.stringify(data));
                }
              }
              SendData();
            } catch (err) {
              console.log(err);
            }
          };

          websocketConnection.onmessage = onmessagedisplay;
        }
      );
    } catch (err) {
      console.log(err);
    }
  };
}
module.exports = {
  FivePaisaClient: FivePaisaClient,
  OrderValidityEnum: OrderValidityEnum
};
