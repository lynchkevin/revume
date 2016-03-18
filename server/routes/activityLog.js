var express = require('express');
var activities = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var pnService = require('../lib/pnService');
var moment = require('moment');

// setup the objects
var Activity= schema.Activity;

//set up the call back channel
//initialize the pubnub channel for pub/sub with the client
pnService.init("user_log");
console.log('Main Channel is: ',process.env.MAIN_CHANNEL);
var channel = pnService.newChannel(process.env.MAIN_CHANNEL);
channel.subscribe(logActivity);

function logActivity(m){
    var activity = new Activity;
    activity.date = m.date;
    activity.user = m.user._id;
    activity.device = m.device;
    activity.device.platform = m.device.currentPlatform;
    activity.fromState = m.fromState.name;
    activity.toState = m.toState.name;
    activity.elapsed = m.elapsed;
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
    activity.elapsed = send.elapsed;
    console.log(activity);
    activity.saveAsync().then(function(){
        console.log(activity);
        res.send(activity);
    }).catch(function(err){
        res.send(err);
    });
});
//READ
//get all activities after a certain date - if no date is passed then get all
activities.get('/userLog',function(req,res){
    if(req.query.days != undefined){
        var daysPast = Number(req.query.days);
        var queryDate = moment().subtract(daysPast,'days').toDate();
        if(daysPast == 0){
            queryDate.setHours(0);
            queryDate.setMinutes(0);
            queryDate.setSeconds(0);
            queryDate.setMilliseconds(0);
        }
        console.log('Userlog get all - (days,date): ',daysPast,queryDate);
        Activity.find({'date': { $gte : queryDate}})
        .sort({'date':-1,'user':1})
        .populate('user')
        .execAsync()
        .then(function(activities){
            console.log('sent ',activities.length,' activities');
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    }else {
        console.log('Userlog get all - no date ');  
        Activity.find()
        .sort({'date':-1,'user':1})
        .populate('user')
        .execAsync()
        .then(function(activities){
            console.log('sent ',activities.length,' activities');
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    }
});

//get all activities for a user for the last N days if N is undefined then get all
activities.get('/userLog/:id',function(req,res){
    var userId = req.params.id;
    console.log('UserLog get by id: ',userId);
    if(req.query.days != undefined){
        var daysPast = Number(req.query.days);
        var queryDate = moment().subtract(daysPast,'days').toDate();
        if(daysPast == 0){
            queryDate.setHours(0);
            queryDate.setMinutes(0);
            queryDate.setSeconds(0);
            queryDate.setMilliseconds(0);
        }
        console.log('Userlog get all - (days,date): ',daysPast,queryDate);
        Activity.find({'user':new ObjectId(userId),'date': { $gte : queryDate}})
        .sort({'date':-1})
        .populate('user')
        .execAsync()
        .then(function(activities){
            console.log('sent ',activities.length,' activities');
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    }else {
        console.log('Userlog get all - no date ');  
        Activity.find({'user':new ObjectId(userId)})
        .sort({'date':-1})
        .populate('user')
        .execAsync()
        .then(function(activities){
            console.log('sent ',activities.length,' activities');
            res.send(activities);
        }).catch(function(err){
            res.send(err);
        });
    }
});

//DELETE
//delete a log
activities.delete('/userLog/:id',function(req,res){
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
