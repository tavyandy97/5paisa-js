# 5paisajs

Official Javascript client for 5paisa APIs natively written in .NET

## Installation

```
npm install 5paisajs --save
```

## Documentation

Docs are hosted at https://5paisa.github.io/5paisa-js/

## Usage

### Authentication

Get your API keys from https://www.5paisa.com/DeveloperAPI/APIKeys

```js
// Configuration for your app
const conf = {
    "appSource": "",
    "appName": "",
    "userId": "",
    "password": "",
    "userKey": "",
    "encryptionKey": ""
}

const { FivePaisaClient } = require("5paisajs")

var client = new FivePaisaClient(conf)

// This client object can be used to login multiple users.
client.login("random_email@xyz.com", "password", "YYYYMMDD").then((response) => {
    client.init(response).then(() => {
        // Fetch holdings, positions or place orders here.
        // Some things to try out are given below.
    })
}).catch((err) =>{
    // Oh no :/
    console.log(err)
})

```

### Fetch Holdings

```js
client.getHoldings().then((holdings) => {
    console.log(holdings)
}).catch((err) => {
    console.log(err)
});

/*
[
  {
    BseCode: 535755,
    CurrentPrice: 140,
    DPQty: 0,
    Exch: '\x00',
    ExchType: 'C',
    FullName: 'XYZ ABC',
    NseCode: 30108,
    POASigned: 'N',
    PoolQty: 1,
    Quantity: 1,
    ScripMultiplier: 1,
    Symbol: 'XYZ'
  }
]
*/
```

### Fetch Positions

```js
client.getPositions().then((positions) => {
    console.log(positions)
}).catch((err) => {
    console.log(err)
});

```
# Trade Book
```js
client.getTradeBook().then((response) => {
            console.log(response)
        }).catch((err) => {
            console.log(err)
        });
```
### Place  order

```js
         var options = {
            exchangeSegment: "C",
            isStopLossOrder: false,
            stopLossPrice: 0,
            isIOCOrder: false,
            isIntraday: false,
            ahPlaced: "N",
            IOCOrder: false,
            price: 240,
            scripCode:"1660"
        };
        try {
            client.placeOrder("BUY", "1", "N", options).then((response) => {
                console.log(response)
            })
        } catch (err) {
            console.log(err)
        }
//Note : use ScripData to order With Scrip Name
```

### Modify order

```js
   a = {
        "scripCode":"1660"
                };
try {
        client.modifyOrder("Your ExchageOrderID", "1", "241", false, "N", "C",a).then((response) => {
            console.log(response)
        })
    } catch (err) {
        console.log(err)
    }

//Note : use ScripData to order With Scrip Name
```

### Cancel Order

```js
  try {
        client.cancelOrder("Your ExchageOrderID", "N", "C").then((response) => {
            console.log(response)
        })
    } ).catch((err) => {
        console.log(err)
    });
```

### Place BO-CO Order

```js
var a={
           
        }
    client.bocoorder(1660,1,205,0,217,'B','N','C','P',200,a).then((Response)=>{
            console.log(Response)
        }).catch((err)=>{
            console.log(err)
        })
// Note : For Cover order par Order_for='c'

```

### Modified Bo-Co Order
```js
var a={
            "ExchOrderId":"Your ExchageOrderID",
            
        }
    client.bocoorder(1660,1,205,0,217,'B','N','C','M',200,a).then((Response)=>{
            console.log(Response)
        }).catch((err)=>{
            console.log(err)
        })
        
   // Note : We Can not Modify Target And Stoploss legs
```
### Modify legs of Executed Bo-Co Order
```js
var ab={
        "price":215
    }
    
     client.Mod_bo_order('S',1660,1,"N","Your ExchageOrderID",ab).then((Response)=>{
                console.log(Response)
            }).catch((err)=>{
                console.log(err)
            })
    // Note : This is for modify profit order.
    
    var data={
         
        "isStopLossOrder":true,
        "stopLossPrice":205,
        "isIntraday":true,
        "atMarket": true
        
    }
    
     client.Mod_bo_order('S',1660,1,"N","Your ExchageOrderID",data).then((Response)=>{
                console.log(Response)
            }).catch((err)=>{
                console.log(err)
            })
     // Note : this is for modify stoploss order.
```
### MarketFeed 
```js
data=[
    {
    "Exch":"N",
    "ExchType":"D",
    "Symbol":"NIFTY 27 MAY 2021 CE 14500.00",
    "Expiry":"20210527",
    "StrikePrice":"14500",
    "OptionType":"CE"
}]


client.getMarketFeed(data).then((response) => {
            console.log(response)
        }).catch((err) => {
            console.log(err)
        });
```
### MarketDepth

```js
 a=[{"Exchange":"N","ExchangeType":"D","ScripCode":"51440"},{"Exchange":"N","ExchangeType":"C","ScripCode":"1660"}]
     client.getMarketDepth(a).then((response) => {
                    console.log(response)
                }).catch((err) => {
                    console.log(err)
                });
```

### Historical Data
```js
// historicalData(<Exchange>,<Exchange Type>,<Scrip Code>,<Time Frame>,<From Data>,<To Date>)
a=client.historicalData('n', 'c', '1660', '1m','2021-05-31', '2021-06-01')

//Note: Timeframe should be from this list ['1m','5m','10m','15m','30m','60m','1d']
```

### Websocket 
```js
onmessage = function(e) {
       
            console.log("Received: '" + e.data + "'");
     
    }
    req_list=[
        { "Exch":"N","ExchType":"C","ScripCode":1660}
        ]
    client.loginCheck().then(() => {
     var  reqlist= client.requestFeed('mf','s',req_list)
     
     client.websocketStreaming(reqlist);
     client.displayMessage(onmessage);
        
    }).catch((err) => {
        console.log(err)
     });
```

### Access Token 
```js
token="Your Token"
    client.getAccessToken(token).then((Response)=>{
        console.log(Response)
    }).catch((err)=>{
        console.log(err)
    })
```

### Market Status
```js
client.getMarketStatus().then((Response)=>{
    console.log(Response)
}).catch((err)=>{
    console.log(err)
})
```

### Trade History
```js
client.getTradeHistory("Your Exchange Order ID").then((Response)=>{
    console.log(Response)
}).catch((err)=>{
    console.log(err)
})
```

