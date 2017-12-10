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
        var found = false;
        for(var i = 0;i<observerList.length;i++){
            var userId = observerList[i];
            if(userId === event.source.userId)
                found = true;
        }
        if(!found)
            observerList.push(event.source.userId);
    }else if(message === 'พอได้แล้ว'){
        for(var i = 0;i<observerList.length;i++){
            var userId = observerList[i];
            if(userId === event.source.userId)
                observerList.splice(i, 1);
        }
    }else{
        sendMessage(event, 'อ๋อเหรอคะ')
    }
});

var port = process.env.PORT || 3000;
console.log('Listening on ' + port);
bot.listen('/linewebhook', port);

var state;

setInterval(function(){
    if(observerList.length > 0){
        fetch('https://bx.in.th/api/trade/?pairing=1')
            .then(function(res) {
                return res.json();
            }).then(function(res) {
                var cum = 0;
                var min = Number.MAX_SAFE_INTEGER;
                var max = Number.MIN_SAFE_INTEGER ;
                var latest = parseFloat(res.trades[res.trades.length-1].rate)
                for(var i = 0;i<res.trades.length;i++) {
                    var t = res.trades[i];
                    var rate = parseFloat(t.rate);
                    cum += rate;
                    min = rate < min ? rate : min;
                    max = rate > min ? rate : max;
                }
                var avg = cum/res.trades.length;
                var str = 'BTC Latest: '+latest+' High: '+max+' Low:'+min+' Avg: '+avg;
                var currentState = latest === max ? 'up' : latest === min ? 'down' : '';
                console.log(state,currentState,str)
                if(state !== currentState){
                    state = currentState;
                    for(var i = 0;i<observerList.length;i++) {
                        var userId = observerList[i];
                        str = (state === 'up' ? 'ขึ้นละจ้า' : 'ลงแล้วๆ')+' '+str;
                        bot.push(userId, str);
                    }
                }
            });
    }
}, 1000);