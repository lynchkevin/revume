var express = require('express');
var activities = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var pnService = require('../lib/pnService');

// setup the objects
var Activity= schema.Activity;

//set up the call back channel
//initialize the pubnub channel for pub/sub with the client
pnService.init("user_log");
var channel = pnService.newChannel("Revu.Me:User");
channel.subscribe(logActivity);

function logActivity(m){
    var activity = new Activity;
    activity.date = m.date;
    activity.user = m.user._id;
    activity.device = m.device;
    activity.device.platform = m.device.currentPlatform;
    activity.fromState = m.fromState.name;
    activity.toState = m.toState.name;
    activity.elapsed = m.elapsedTime;
    activity.saveAsync().then(function(){
        console.log('Activity from Channel: ',activity);
    }).catch(function(err){
        console.log('Activity from Channel - Error!: ',err);
    });
}
    
//CREATE
//create an Activity
activities.post('/userLog',function(req,res){
    console.log("userLog got post",req.body);
    var activity = new Activity;
    var sent = req.body;
    activity.date = new Date();
    activity.user = new ObjectId(sent.user._id);
    activity.device = sent.device; // not all fields map directly
    activity.device.platform = sent.device.currentPlatform; //that fixes it
    activity.fromState = sent.fromState.name;
    activity.toState = sent.toState.name;
    activity.elapsed = send.elapsedTime;
    activity.saveAsync().then(function(){
        console.log(activity);
        res.send(activity);
    }).catch(function(err){
        res.send(err);
    });
});
//READ
//get all activities for a particular users
activities.get('/userLog',function(req,res){
       console.log('userLog query! - memberId:', req.query.user);
    var userId = req.query.user;
    if(userId != undefined){
        Activity.find({'user':new ObjectId(userId)})
        .populate('user')
        .execAsync()
        .then(function(activities){
            console.log('sent ',activities.length,' activities');
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    } else {
        Activity.find()
        .populate('user')
        .execAsync()
        .then(function(activities){
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    }
});

//get all activities after a certain date
activities.get('/userLog',function(req,res){
       console.log('activities query! - date:', req.query.date);
    var startDate = req.query.date;
    if(startDate != undefined){
        Activity.find({'date': { $gte : startDate}})
        .populate('user')
        .execAsync()
        .then(function(activities){
            console.log('sent ',activities.length,' activities');
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    } else {
        Activity.find()
        .populate('user')
        .execAsync()
        .then(function(activities){
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    }
});


//DELETE
//delete a team
activities.delete('/userLog',function(req,res){
    console.log("activity delete by id");
    Activity.find({_id:new ObjectId(req.params.id)})
        .remove()
        .execAsync()
        .then(function(){
            res.send({success:true});
        }).catch(function(err){
            res.send(err);
        });
});

module.exports = activities;
