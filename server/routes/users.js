var express = require('express');
var users = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');

var User = schema.User;

//get all users
users.get('/users',function(req,res){
       console.log('users query!');
    User.findAsync().then(function(users){
        res.send(users);
    }).catch(function(err){
        res.send(err);
    });
});

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

//save a user
users.post('/users',function(req,res){
    console.log("user got post",req.body);
    var usr = new User;
    var sent = req.body;
    usr.firstName = sent.firstName;
    usr.lastName = sent.lastName;
    usr.email = sent.email;
    usr.saveAsync().then(function(){
        console.log(usr);
        res.send(usr);
    }).catch(function(err){
        res.send(err);
    });
});


module.exports = users;
