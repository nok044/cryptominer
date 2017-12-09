var linebot = require('linebot');
var fetch = require('node-fetch');

var bot = linebot({
    channelId: 1551062364,
    channelSecret: '63fd859fc1f1c2722a27aed1bd27324d',
    channelAccessToken: 'joq/oPioW80iJY6DJWft1TzgEnxrm7xv3wo7+d/sLmgPrVu/xic1+dtheJF2Tm2fZPs3BHXHl0ELv02ZOEm/TL8pnG24B3UiPPI0xupYvcWXuDN7istzHUQg6IKRkWLPMzYessE5RYkOnYDT9zb7xwdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function (event) {
    fetch('https://bx.in.th/api/')
        .then(function(res) {
            return res.json();
        }).then(function(body) {

            event.reply(body["1"].last_price+' '+body["1"].change).then(function (data) {
                console.log(data)
            }).catch(function (error) {
                console.log(error)
            });
        });



});

var port = process.env.PORT || 3000;
console.log('Listening on ' + port);
bot.listen('/linewebhook', port);