const date = new Date();
const today = date.getTime();
date.setDate(date.getDate() + 1);
const followingDay = date.getTime();

const GENERIC_PAYLOAD = {
  head: {
    key: ""
  },
  body: {
    ClientCode: ""
  }
};
const MARKET_PAYLOAD = {
  head: {
    key: ""
  },
  body: {
    Count: "",
    MarketFeedData: [],
    ClientLoginType:0,
    LastRequestTime:`/Date(${today})/`,
    RefreshRate:"H"
  }
};

const LOGIN_PAYLOAD = {
  head: {
    appName: "",
    appVer: "1.0",
    key: "",
    osName: "WEB",
    requestCode: "5PLoginV2",
    userId: "",
    password: ""
  },
  body: {
    Email_id: "",
    Password: "",
    LocalIP: "192.168.1.1",
    PublicIP: "192.168.1.1",
    HDSerailNumber: "",
    MACAddress: "",
    MachineID: "039377",
    VersionNo: "1.7",
    RequestNo: "1",
    My2PIN: "",
    ConnectionType: "1"
  }
};


const ORDER_PLACEMENT_PAYLOAD = {
  head: {
    key: ""
  },
  body: {
    ClientCode: "1234567",
    Exchange: "B",
    ExchangeType: "C",
    Price: 0.0,
    OrderID: 0,
    OrderType: "BUY",
    Qty: 0,
    UniqueOrderID: "1",
    DisQty: 0,
    IsStopLossOrder: false,
    StopLossPrice: 0,
    IsIOCOrder: false,
    IsIntraday: false,
    IsAHOrder: "N",
    ValidTillDate: `/Date(${followingDay})/`,
    AppSource: 0
  }
};

LOGIN_CHECK_PAYLOAD={
  head : {
      requestCode:"5PLoginCheck",
      key:"",
      appVer:"1.0",
      appName:"",
      osName:"WEB",
      LoginId:""
      },
  body:{
      RegistrationID:""
      }
  }

  WS_PAYLOAD={"Method":"",
            "Operation":"",
            "ClientCode":"",
            "MarketFeedData":""}

  OCP_KEY="c89fab8d895a426d9e00db380b433027"

  BASKET_ORDER_PAYLOAD={
      head: {
        key: ""
    },
    body: {
        ClientCode: "",
        Exchange: "",
        ExchangeType: "",
        Price: "",
        OrderType: "",
        Qty: "",
        ScripCode: "",
        AtMarket: false,
        StopLossPrice: "0",
        IsStopLossOrder: false,
        IOCOrder: false,
        DelvIntra: "",
        AppSource: "",
        IsIntraday: false,
        ValidTillDate: "/Date(1613129870000)/",
        AHPlaced: "N",
        PublicIP: "0.0.0.0",
        DisQty: "0",
        iOrderValidity: 0,
        BasketIDs: []
    

  }}
 TOKEN_HEADERS={
    'Ocp-Apim-Subscription-Key': 'c89fab8d895a426d9e00db380b433027',
    
    }
/**
 * Enum for Order validity.
 * @readonly
 * @enum {number}
 */
const OrderValidityEnum = {
  Day: 0,
  GTD: 1,
  GTC: 2,
  IOC: 3,
  EOS: 4,
  FOK: 6
};

module.exports = {
  genericPayload: GENERIC_PAYLOAD,
  loginPayload: LOGIN_PAYLOAD,
  orderPayload: ORDER_PLACEMENT_PAYLOAD,
  marketpayload : MARKET_PAYLOAD,
  OrderValidityEnum: OrderValidityEnum,
  logincheck: LOGIN_CHECK_PAYLOAD,
  wspayload: WS_PAYLOAD,
  basketOrderPayload : BASKET_ORDER_PAYLOAD,
  tokenHeader:TOKEN_HEADERS,
  ocpKey:OCP_KEY
};
