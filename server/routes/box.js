var express = require('express');
var request = require('request');
var Box = require('node-box-api');
var route = express.Router();
var credentials = { client_id: process.env.BOX_CLIENT_ID,
                    client_secret: process.env.BOX_CLIENT_SECRET
                  };
var box = undefined;

console.log('box credentials are : ',credentials);

route.post('/box/authData',function(req,res){
    var sent = req.body;
    console.log('/box/authData got : ',sent);
    //if params are sent then create the box api interface
    if(sent && sent.access_token && sent.refresh_token){
        box = new Box({
            client_id:credentials.client_id,
            client_secret:credentials.client_secret,
            access_token:sent.access_token,
            refresh_token:sent.refresh_token
        });
    }
    res.send({success:true,
              data:box});
});

route.get('/box/thumbnail',function(req,res){
    if(box && req.query && req.query._id){
        var file_id = req.query._id;
        var params = {	min_height: 128,
                        min_width: 128,
                        extension: 'png'
                     };
        box.files.thumbnail(file_id,params,function(err,response){
            if(err){
                console.log('/box/file error: ',err);
                response.success = false;
            }else{
                console.log(response.text);
                var base64 = new Buffer(response.text).toString('base64');
                console.log(base64);
                res.send(base64);
            }
        });
    }else{
        res.send({success:false});
    }
});

route.get('/box/file',function(req,res){
    if(box && req.query && req.query._id){
        console.log('box/file/');
        var file_id = req.query._id;
        box.files.download(file_id, function(err, link) {
            if(err){
                console.log('/box/file error: ',err);
                res.send({success:false,error:err})
            }else{
                console.log(link);
                res.send({success:true,link:link});
            }
        });
    }else{
        res.send({success:false,error:'Server Error'});
    }
});

route.get('/box',function(req,res){
    res.send({success:true,
              message:'box api is alive'
             });
});
module.exports = route;


