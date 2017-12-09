var linebot = require('linebot');
var fetch = require('node-fetch');

var message = function(event, message){
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
                res.map(function(e){
                    found = true;
                    if((e.primary_currency === currents[0] && e.secondary_currency === currents[1]) || (e.primary_currency === currents[1] && e.secondary_currency === currents[0]){
                        message(event, e.primary_currency+' to '+e.secondary_currency+' '+body["1"].last_price+' '+body["1"].change+'%Z')
                    }
                });

                if(!found){
                    message(event, 'BTC to BTH '+res["1"].last_price+' '+res["1"].change+'%Z')
                }
            });
    }else{
        message(event, 'อ๋อเหรอคะ')
    }
});

var port = process.env.PORT || 3000;
console.log('Listening on ' + port);
bot.listen('/linewebhook', port);