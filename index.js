var linebot = require('linebot');
var fetch = require('node-fetch');

var observerList = [];

var sendMessage = function(event, message){
    event.reply(message).then(function (data) {
        console.log(data)
    }).catch(function (error) {
        console.log(error)
    });
}

var bot = linebot({
    channelId: 1551062364,
    channelSecret: '63fd859fc1f1c2722a27aed1bd27324d',
    channelAccessToken: 'joq/oPioW80iJY6DJWft1TzgEnxrm7xv3wo7+d/sLmgPrVu/xic1+dtheJF2Tm2fZPs3BHXHl0ELv02ZOEm/TL8pnG24B3UiPPI0xupYvcWXuDN7istzHUQg6IKRkWLPMzYessE5RYkOnYDT9zb7xwdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function (event) {
    var message = event.message.text;


    if(message.length === 6){
        var currents = [
            message.substring(0,3),
            message.substring(3,6)
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
                    sendMessage(event, 'BTC to BTH '+res["1"].last_price+' '+res["1"].change+'%')
                }
            });
    }else if(message === 'รายงานมาซิ'){
        console.log(event,event.source.type,event.source.type === 'group')
        var id = event.source.type === 'group' ? event.source.groupId : event.source.userId;
        var found = false;
        for(var i = 0;i<observerList.length;i++){
            var userId = observerList[i];
            if(userId === id)
                found = true;
        }
        if(!found) {
            sendMessage(event, 'รอแปป')
            observerList.push(event.source.userId);
        }else{
            sendMessage(event, 'ก็รายงานอยู่นี้ไง ใจเย็นดิ')
        }
    }else if(message === 'พอได้แล้ว'){
        var id = event.source.type === 'group' ? event.source.groupId : event.source.userId;
        for(var i = 0;i<observerList.length;i++){
            var userId = observerList[i];
            if(userId === id)
                observerList.splice(i, 1);
        }
        sendMessage(event, 'เครๆ')
    }else{
    }
});

var port = process.env.PORT || 3000;
console.log('Listening on ' + port);
bot.listen('/linewebhook', port);

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