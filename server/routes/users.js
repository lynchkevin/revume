var express = require('express');
var users = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');

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
        if(user == undefined){
            var result = {success:false,reason:'User Not Found'};
            res.send(result);
        } else if(user.password != sent.password && user.password != undefined){
            var result = {success:false,reason:'Incorrect User or Password'};
            res.send(result);
        } else{
            var result = {success:true, user:user};
            res.send(result);
        }
    }).catch(function(err){
        console.log(err);
        res.send(err);
    });
});

module.exports = users;
