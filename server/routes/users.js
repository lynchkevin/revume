var express = require('express');
var users = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var mailer = require('../lib/confirmEmail.js');

var User = schema.User;

//get all users
/*
users.get('/users',function(req,res){
       console.log('users query!');
    User.findAsync().then(function(users){
        res.send(users);
    }).catch(function(err){
        res.send(err);
    });
});
*/

//get a single user by id
users.get('/users/:id',function(req,res){
    User.findAsync({_id:new ObjectId(req.params.id)}).then(function(user){
        res.send(user[0]);
    }).catch(function(err){
        res.send(err);
    });
});
//get a single user by email
users.get('/users/email/:email',function(req,res){
    User.findAsync({email:req.params.email}).then(function(user){
        res.send(user[0]);
    }).catch(function(err){
        res.send(err);
    });
});

//query users
users.get('/users',function(req,res){
    console.log('users query with param');
    var first = req.query.first;
    var last = req.query.last;
    var email = req.query.email;
    var re={};
    console.log(req.query);
    if(first != undefined){
        console.log('searching by firstName');
        re = new RegExp(first,'i');
        User.findAsync({firstName: {$regex:re}}).then(function(users){
            res.send(users);
        }).catch(function(err){
            res.send(err);
        });
    } else if(email !=undefined){
        console.log('searching by email');
        re = new RegExp(email,'i');
        User.findAsync({email: {$regex:re}}).then(function(users){
            res.send(users);
        }).catch(function(err){
            res.send(err);
        });
    } else {
        console.log('find with no params');
        User.findAsync().then(function(users){
            res.send(users);
        }).catch(function(err){
            res.send(err);
        });
    };
        
});

//save a user
users.post('/users',function(req,res){
    console.log("user got post",req.body);
    var usr = new User;
    var sent = req.body;
    usr.firstName = sent.firstName;
    usr.lastName = sent.lastName;
    usr.email = sent.email;
    usr.password = sent.password;
    if(sent.service != undefined)
        usr.signInService = sent.service;
    usr.saveAsync().then(function(){
        console.log(usr);
        res.send(usr);
    }).catch(function(err){
        res.send(err);
    });
});
//update a user
//UPDATE
users.put('/users/email/:email',function(req,res){
    console.log("users update by email");
    var sent = req.body;
    console.log(sent);
    User.findOneAsync({email:req.params.email}).then(function(user){
        if(user.password != sent.oldPassword && user.password != undefined){
            var result = {success:false,reason:'Old Password Does Not Match'};
            res.send(result);
        } else{
            user.password = sent.password;
            user.saveAsync().then(function(){
                var result = {success:true};
                res.send(result);
            });
        }
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});
//add an authentication route for the user
users.put('/users/auth/:email',function(req,res){
    console.log('authenticate user');
    var sent = req.body;
    console.log(sent);
    User.findOneAsync({email:req.params.email}).then(function(user){
        //user not found in the database
        if(user == undefined){
            var result = {success:false,reason:'User Not Found'};
            console.log(result);
            res.send(result);
        }
        // user has no password or temp password - authorized on the client (via box or dropbox etc)
        else if(user.password == undefined && user.tempPassword == undefined){
            var result = {success:true, user:user};
            console.log(result);
            res.send(result);
        }
        // check if we're using a temp password via a send me a new password event
        else if(user.tempPassword == sent.password){
            //if a correct temp password is used - reset password to temp password
            user.password = user.tempPassword;
            user.tempPassword = undefined;
            user.saveAsync().then(function(){
                var result = {success:true, user:user};
                console.log(result);
                res.send(result);        
            });   
        }
        // check for normal valid password
        else{   
            if(user.password != sent.password){
                var result = {success:false,reason:'Incorrect User or Password'};
                console.log(result);
                console.log('user pass= ',user.password,'sent pass=',sent.password);
                console.log(user.password == sent.password);
                res.send(result);
            }else{
                var result = {success:true, user:user};
                console.log(result);
                res.send(result);
            }
        }
    }).catch(function(err){
        console.log(err);
        res.send(err);
    });
});

//add an email confirmation route for the user
users.put('/users/confirm/:id',function(req,res){
    console.log('email is now confirmed');

    User.findOneAsync({_id:new ObjectId(req.params.id)}).then(function(user){
        if(user == undefined){
            var result = {success:false,reason:'User Not Found'};
            console.log(result);
            res.send(result);
        } else {
            user.confirmed = true;
            user.saveAsync().then(function(){
                var result = {success:true};
                res.send(result);
            });            
        }
    }).catch(function(err){
        console.log(err);
        res.send(err);
    });
});

//reset users password
//update a user
//UPDATE
users.put('/users/password/reset/:email',function(req,res){
    console.log("Reset Users Password");
    var sent = req.body;
    var email = sent.email;
    console.log(sent);
    User.findOneAsync({email:email}).then(function(user){
            var newPassword = sent.pw;
            user.tempPassword = sent.authData;
            user.saveAsync().spread(function(user){
                // temp password is set - send the email to the user
                console.log(user);
                mailer.resetPassword(user,newPassword);
                var result = {success:true};
                res.send(result);
            });
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});
module.exports = users;
