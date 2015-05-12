var express = require('express');
var metrics = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');

var SI = schema.SessionInteraction;


//save a session interaction
metrics.post('/metrics',function(req,res){
    console.log("Metrics: got put (save)!");
    console.log(req.body)
    var sent = req.body;
    var model = new SI;
    model.session = sent.session;
    model.eventDate = sent.eventDate;
    model.deck = sent.deck;
    model.slideViews=[];
    sent.slideViews.forEach(function(sv){
        model.slideViews.push(sv);
    });
    model.viewers=[];
    sent.viewers.forEach(function(v){
        model.viewers.push(v);
    });
    model.saveAsync().then(function(){
        res.send(model._id);
    }).catch(function(err){
        res.send(err);
    });
});

//get all session interactions
metrics.get('/metrics',function(req,res){
       console.log('Metrics query!');
    SI.find()
        .sort({'eventDate':-1})
        .exec(function(err,records){
            if(err) res.send(err);
            res.send(records);
            console.log(records);
        });
});

//get a single session interaction
metrics.get('/metrics/:id',function(req,res){
    console.log("metrics get by id:",req.params.id);   
    SI.find({_id:new ObjectId(req.params.id)})
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results[0]);
            }
        });
});

metrics.get('/metrics/:sid/:did',function(req,res){
    console.log("metrics get by sid/did:",req.params.sid,req.params.did);  
    var sid = req.params.sid;
    var did = req.params.did;
    
    SI.find({session:new ObjectId(sid)})
        .where({deck: new ObjectId(did)})
        .sort({'eventDate':-1})
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results);
            }
        });
});
module.exports = metrics;


