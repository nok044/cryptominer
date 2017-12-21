var linebot = require('linebot');
var fetch = require('node-fetch');
var express = require('express');
var jsonfile = require('jsonfile')

var observerList = [];
var trackList = [];

var last_price = 0;

var wallet = [
    {
        userId:'U6feb23bd2bbf0ea1aa013325c1fda8bb',
        address: [
            {
                name:'Main',
                hash:'3FHfwQxiZbQZ5A2xKmtPgw2J9z8M4vs89g'
            },
            {
                name:'Mnok044',
                hash:'3JcMi3S49BmMj3YAeChQ26oCoDPdvGi3Bh'
            },
            {
                name:'Msuchedc',
                hash:'3BUz4uECJ6L95AvDgEYn2QE73QmwnH3weK'
            },
            {
                name:'Mss01',
                hash:'3AJHfthZyhFc1Ca4RmkL4ULtSCiK5i5aph'
            },
            {
                name:'Mss02',
                hash:'3KhovaqHPuXW8nkVS8b6pRyqV7syyMsA9X'
            },
            {
                name:'Mmp01',
                hash:'3Eai7kz7ZKgLoHUDuatdzzFnGsr2gwwwGG'
            },
            {
                name:'Msp01',
                hash:'31szpDMe6veMaFMpWjKQKE8MWz4VDnYrnS'
            },
            {
                name:'HashFlare',
                hash:'3CYW5BoFJsVWFZsspkrkU9hmjtv2AmDSo8'
            },            {
                name:'c57b1fac20fb4a49135dc6ca2dd73e0aaad67459a2f84b8daff096f176a41531',
                hash:'3QaVp49zowjKU4fBH7e5bGoxcUyjeujLua'
            }
        ],
        count: 0,
        balance: 0,
        unconfirmed_balance: 0,
    }
]

jsonfile.readFile('/tmp/observerList', function(err, obj) {
    if(!err) {
        console.log(obj);
        observerList = obj;
    }
});

jsonfile.readFile('/tmp/trackList', function(err, obj) {
    if(!err) {
        console.log(obj);
        trackList = obj;
    }
})


var sendMessage = function(event, message){
    if(event !== undefined) {
        event.reply(message).then(function (data) {
            console.log(data)
        }).catch(function (error) {
            console.log(error)
        });
    }
}

var checkLast = function(event, str){
    var currents = [
        str.substring(0,3),
        str.substring(3,6)
    ]

    fetch('https://bx.in.th/api/')
        .then(function(res) {
            return res.json();
        }).then(function(res) {
        var found = false;
        Object.keys(res).forEach(function(key,index) {
            if((res[key].primary_currency === currents[0] && res[key].secondary_currency === currents[1]) || (res[key].primary_currency === currents[1] && res[key].secondary_currency === currents[0])){
                found = true;
                sendMessage(event, res[key].primary_currency+' to '+res[key].secondary_currency+' '+res[key].last_price+' '+res[key].change+'%')
            }
        });

        if(!found){
            sendMessage(event, 'อะไรๆ เดี๋ย')
        }
    });
}

var addReport = function(event, id){
    var found = false;
    for(var i = 0;i<observerList.length;i++){
        var userId = observerList[i];
        if(userId === id)
            found = true;
    }
    if(!found) {
        sendMessage(event, 'รอแปป')
        observerList.push(id);
    }else{
        sendMessage(event, 'ก็รายงานอยู่นี้ไง ใจเย็นดิ')
    }

    jsonfile.writeFile('/tmp/observerList', observerList, function (err) {
        console.error(err)
    })
}

var removeReport = function(event, id){
    for (var i = 0; i < observerList.length; i++) {
        var userId = observerList[i];
        if (userId === id)
            observerList.splice(i, 1);
    }
    sendMessage(event, 'เครๆ')

    jsonfile.writeFile('/tmp/observerList', observerList, function (err) {
        console.error(err)
    })
}

var addTrack = function(event, id, hash){
    var found = false;
    for(var i = 0;i<trackList.length;i++){
        var obj = trackList[i];
        if(obj.userId === id && obj.hash === hash)
            found = true;
    }
    if(!found) {
        sendMessage(event, 'รอแปป')
        trackList.push({
            userId: id,
            hash: hash
        });
    }else{
        sendMessage(event, 'ก็รายงานอยู่นี้ไง ใจเย็นดิ')
    }

    jsonfile.writeFile('/tmp/trackList', trackList, function (err) {
        console.error(err)
    })
}

var removeTrack = function(event, id, hash){
    for (var i = 0; i < trackList.length; i++) {
        var obj = trackList[i];
        if(obj.userId === id && obj.hash === hash)
            trackList.splice(i, 1);
    }
    sendMessage(event, 'เครๆ')

    jsonfile.writeFile('/tmp/trackList', trackList, function (err) {
        console.error(err)
    })
}

var checkBalance = function(event, id){
    var found = false;
    for(var i = 0;i<wallet.length;i++){
        var obj = wallet[i];
        if(obj.userId === id){
            found = true;
            obj.balance = 0;
            obj.unconfirmed_balance = 0;
            obj.count = 0;
            checkBalance2(obj,id);
        }
    }

    if(!found) {
        sendMessage(event, 'ไม่เจอบัญชีงะ');
    }
}

var checkBalance2 = function(obj, id){
    var currents = [
        'BTC',
        'THB'
    ]
    fetch('https://bx.in.th/api/')
        .then(function(res) {
            return res.json();
        }).then(function(res) {
        Object.keys(res).forEach(function(key,index) {
            if((res[key].primary_currency === currents[0] && res[key].secondary_currency === currents[1]) || (res[key].primary_currency === currents[1] && res[key].secondary_currency === currents[0])){
                last_price = res[key].last_price;
                for(var c = 0;c<obj.address.length;c++){
                    var addr = obj.address[c];

                    checkBalance3(obj,addr,id);
                }
            }
        });
    });
}

var checkBalance3 = function(obj,addr,id){
    fetch('http://api.blockcypher.com/v1/btc/main/addrs/'+addr.hash)
        .then(function(res) {
            return res.json();
        }).then(function(res) {
            if(res.error){
                bot.push(userId,'ดู '+hash+' ไม่ได้นะ เลิก');
                removeTrack(undefined, userId, hash);
            }else{
                var tmp = res.balance+'';
                if(tmp.length > 8){
                    tmp = tmp.substr(0,tmp.length - 8)+'.'+tmp.substr(tmp.length - 8);
                }else{
                    for(var a = 8-tmp.length;a>0;a--){
                        tmp = '0'+tmp;
                    }
                    tmp = '0.'+tmp;
                }

                var balance = parseFloat(tmp);

                tmp = res.unconfirmed_balance+'';
                if(tmp.length > 8){
                    tmp = tmp.substr(0,tmp.length - 8)+'.'+tmp.substr(tmp.length - 8);
                }else{
                    for(var a = 8-tmp.length;a>0;a--){
                        tmp = '0'+tmp;
                    }
                    tmp = '0.'+tmp;
                }

                var unconfirmed_balance = parseFloat(tmp);

                obj.balance += balance;
                obj.unconfirmed_balance += unconfirmed_balance;
                obj.count++;
                bot.push(id,addr.name+': Balance '+balance+' - '+(last_price*balance));
                bot.push(id,addr.name+': Unconfirmed '+unconfirmed_balance+' - '+(last_price*unconfirmed_balance));

                if(obj.count === obj.address.length){
                    setTimeout(function(){
                        bot.push(id,'รวม Balance '+obj.balance+' - '+(last_price*obj.balance));
                        bot.push(id,'รวม Unconfirmed '+obj.unconfirmed_balance+' - '+(last_price*obj.unconfirmed_balance));
                    },1000)
                }
                for(var i = 0;i<res.txrefs.length;i++){
                    var tx = res.txrefs[i];
                    if(tx.confirmations < 6){
                        addTrack(undefined, id, tx.tx_hash);
                    }
                }
            }
        });
}

var masterId = 'U6feb23bd2bbf0ea1aa013325c1fda8bb';
var bot = linebot({
    channelId: 1551062364,
    channelSecret: '63fd859fc1f1c2722a27aed1bd27324d',
    channelAccessToken: 'joq/oPioW80iJY6DJWft1TzgEnxrm7xv3wo7+d/sLmgPrVu/xic1+dtheJF2Tm2fZPs3BHXHl0ELv02ZOEm/TL8pnG24B3UiPPI0xupYvcWXuDN7istzHUQg6IKRkWLPMzYessE5RYkOnYDT9zb7xwdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function (event) {
    var id = event.source.type === 'group' ? event.source.groupId : event.source.userId;
    var message = event.message.text;

    if(message.length === 6){
        checkLast(event, message);
    }else if(message === 'รายงานมาซิ'){
        addReport(event,id);
    }else if(message === 'พอได้แล้ว') {
        removeReport(event,id);
    }else if(message.indexOf('ติดตามอันนี้') === 0){
        var hash = message.substr('ติดตามอันนี้'.length).trim();
        addTrack(event, id, hash);
    }else if(message.indexOf('เลิกดูอันนี้') === 0){
        var hash = message.substr('เลิกดูอันนี้'.length).trim();
        removeTrack(event, id, hash);
    }else if(message.indexOf('ดูบัญชี') === 0){
        checkBalance(event, id);
    }else{
    }
});

var port = process.env.PORT || 3000;
const app = express();
const linebotParser = bot.parser();
app.use(express.urlencoded());
app.post('/linewebhook', linebotParser);
app.post('/say',function (req, res) {
    var userId = req.body.userId;
    var msg = req.body.msg;
    res.send('OK')
    console.log('say',userId,msg);
    bot.push(userId, msg);
});
app.post('/track',function (req, res) {
    var userId = req.body.userId;
    var hash = req.body.hash;
    res.send('OK')
    console.log('track',userId,msg);
    addTrack(undefined, userId, hash);
});
app.post('/ping',function (req, res) {
    res.send('OK')
    console.log('ping');
});
app.listen(port);

bot.push(masterId, 'ตื่นละ');

var lastTrigger = new Date().getTime();
var multiply = 1;
var state;
var latest

setInterval(function(){
    if(observerList.length > 0){
        fetch('https://bx.in.th/api/trade/?pairing=1')
            .then(function(res) {
                return res.json();
            }).then(function(res) {
                var cum = 0;
                var min = Number.MAX_SAFE_INTEGER;
                var max = Number.MIN_SAFE_INTEGER ;
                var currentLatest = parseFloat(res.trades[res.trades.length-1].rate)
                for(var i = 0;i<res.trades.length;i++) {
                    var t = res.trades[i];
                    var rate = parseFloat(t.rate);
                    cum += rate;
                    min = rate < min ? rate : min;
                    max = rate > max ? rate : max;
                }
                var avg = cum/res.trades.length;
                var str = 'BTC Latest: '+currentLatest+' High: '+max+' Low: '+min+' Avg: '+avg;
                var currentState = currentLatest === max ? 'up' : currentLatest === min ? 'down' : state === undefined ? max - avg > avg - min ? 'up' : 'down' : state;
                console.log(state,currentState,str)
                if(state === undefined || state !== currentState){
                    if(latest === undefined)
                        latest = currentLatest;
                    var change = currentLatest - latest;
                    change /= latest;
                    change *= 100;
                    state = currentState;
                    latest = currentLatest;
                    for(var i = 0;i<observerList.length;i++) {
                        var userId = observerList[i];
                        str = (state === 'up' ? '\uDBC0\uDC5C ขึ้นละจ้า' : '\uDBC0\uDC7E ลงแล้วๆ')+' '+change.toFixed(2)+'% BTC Latest: '+currentLatest.toFixed(2)+' High: '+max.toFixed(2)+' Low: '+min.toFixed(2)+' Avg: '+avg.toFixed(2);
                        bot.push(userId, {
                            type: 'text',
                            text: str
                        });
                    }
                    multiply = 1;
                    lastTrigger = new Date().getTime();
                }else if(new Date().getTime() - lastTrigger >= 60000 * multiply){
                    if(latest === undefined)
                        latest = currentLatest;
                    var change = currentLatest - latest;
                    change /= latest;
                    change *= 100;
                    for(var i = 0;i<observerList.length;i++) {
                        var userId = observerList[i];
                        str = (state === 'up' ? '\uDBC0\uDC5C ขึ้นอยู่นะ' : '\uDBC0\uDC7E ยังลงอยู่')+' '+change.toFixed(2)+'% BTC Latest: '+currentLatest.toFixed(2)+' High: '+max.toFixed(2)+' Low: '+min.toFixed(2)+' Avg: '+avg.toFixed(2);
                        bot.push(userId, {
                            type: 'text',
                            text: str
                        });
                    }
                    multiply++;
                    lastTrigger = new Date().getTime();
                }
            });
    }
}, 1000);


setInterval(function(){
    if(trackList.length > 0){
        for (var i = 0; i < trackList.length; i++) {
            var obj = trackList[i];
            tracking(obj);
        }
    }
}, 120000);

var tracking = function(obj){
    fetch('http://api.blockcypher.com/v1/btc/main/txs/'+obj.hash)
        .then(function(res) {
            return res.json();
        }).then(function(res) {
        if(res.error){
            console.log(res.error)
            bot.push(obj.userId,res.error);
            bot.push(obj.userId,'ดู '+obj.hash+' ไม่ได้นะ เลิก');
            removeTrack(undefined, obj.userId, obj.hash);
        }else{
            if(res.confirmations !== obj.confirmations) {
                bot.push(obj.userId, 'คอนเฟิร์ม ' + obj.hash + ' ได้ ' + res.confirmations + ' อะ');
                obj.confirmations = res.confirmations;
            }
        }
    });
}