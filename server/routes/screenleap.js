var express = require('express');
var screenleap = express.Router();
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));

var slAccount = {
    _id:process.env.SCREENLEAP_ID,
    authToken:process.env.SCREENLEAP_TOKEN,
    baseUrl:'https://api.screenleap.com/v2/screen-shares',
};
var headers = {
    "content-type":"application/json",
    "authtoken":slAccount.authToken,
    "accountid":slAccount._id
};
// start a screenleap session
screenleap.get('/screenleap/start',function(req,res){
    console.log(req.query.clientIP);
    console.log(req.query.rectangle);
    var rectangle = JSON.parse(req.query.rectangle);
    console.log('rectangle.xPos = ',rectangle.rectangleXPos);
    request.postAsync({
                    url:slAccount.baseUrl,
                    headers:headers,
                    form:{presenterIpAddress:req.query.clientIP,
                          isSecure:true,
                          enableWebRTC:true,
                          rectangleXPos:rectangle.rectangleXPos,
                          rectangleYPos:rectangle.rectangleYPos,
                          rectangleWidth:rectangle.rectangleWidth,
                          rectangleHeight:rectangle.rectangleHeight
                         }
                })
    .then(function(response){
        res.send(response);
    }).catch(function(err){
        console.log('Screenleap - start - error!: ',err);
        res.send(err);
    });

});

screenleap.post('/screenleap/stop',function(req,res){
    var sharingSession = req.body.sharingSession;
    var url = slAccount.baseUrl+'/'+sharingSession.screenShareCode+'/stop';
    request.postAsync({
                    url:url,
                    headers:headers,
    }).then(function(){
        res.send({success:true});
    }).catch(function(err){
        res.send({success:false,error:err});
    });
});
    
module.exports = screenleap;


