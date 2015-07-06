var express = require('express');
var confirm = express.Router();
var sender = require('../lib/confirmEmail.js');



//send a confirmation email with a link
confirm.post('/confirm/email',function(req,res){
    var user = req.body;
    console.log("confirm email with user: ",user);
    sender.send(user);
    res.send('success');
});


module.exports = confirm;


