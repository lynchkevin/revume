var express = require('express');
var request = require('request');
var crypto = require('crypto');
var route = express.Router();

// sign an aws request
route.get('/signer',function(req,res){
  if(req.query.to_sign != undefined)
      res.send(crypto
        .createHmac('sha1', process.env.AWS_SECRET_ACCESS_KEY)
        .update(req.query.to_sign)
        .digest('base64')
      );
  else
      res.send('signer no data');

});

module.exports = route;


