var linebot = require('linebot');
var fetch = require('node-fetch');

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
    }else{
        sendMessage(event, 'อ๋อเหรอคะ')
    }
});

var port = process.env.PORT || 3000;
console.log('Listening on ' + port);
bot.listen('/linewebhook', port);