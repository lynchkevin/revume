var express = require('express');
var session = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('schema');

var Session = schema.Session;

//CREATE
//create an uploaded file
session.post('/sessions',function(req,res){
    var sent = req.body;
    var model = new Session;
    model.name = sent.name;
    model.organizer = sent.organizer;
    model.description = sent.description;
    model.decks=[];
    sent.decks.forEach(function(value){
        model.decks.push(new ObjectId(value));
    });
    model.attendees = sent.attendees;
    model.date = sent.date;
    model.time = sent.time;
    model.invite = sent.invite;
    model.bridge = sent.bridge;
    model.saveAsync().then(function(){
        res.send('success');
    }).catch(function(err){
        res.send(err);
    });
});

//READ
//get all sessions
session.get('/sessions',function(req,res){
    Session.find()
        .populate('organizer decks attendees')
        .sort({date:-1})
        .exec(function(err,records){
            if(err) res.send(err);
            res.send(records);
        });
});


//get a single session - populate decks and slides
session.get('/sessions/:id',function(req,res){
    Session.find({_id:new ObjectId(req.params.id)})
        .populate('organizer decks attendees')
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results[0]);
            }
        });
});
//get all sessions where I'm the organizer
session.get('/sessions/organizer/:id',function(req,res){
    console.log("session by organizer",req.params.id);   
    Session.find({organizer:new ObjectId(req.params.id)})
        .populate('organizer decks attendees')
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results);
            }
        });
});
//get all sessions where I am an attendee
session.get('/sessions/attendee/:id',function(req,res){
    console.log("session by attemdee",req.params.id);   
    Session.find({attendees:new ObjectId(req.params.id)})
        .populate('organizer decks attendees')
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results);
            }
        });
});
//UPDATE
//update a session by id
session.put('/sessions/:id',function(req,res){
    console.log("session update by id");
    var sent = req.body;
    Session.findOneAsync({_id:new ObjectId(req.params.id)
        }).then(function(session){
            session.name = sent.name;
            session.organizer = new ObjectId(sent.organizer._id);
            session.description = sent.description;
            session.decks = [];
            if(sent.decks.length>0)
                sent.decks.forEach(function(_id){
                    session.decks.push(new ObjectId(_id));
                });
            session.attendees = [];
            if(sent.attendees.length>0)
                sent.attendees.forEach(function(_id){
                    session.attendees.push(new ObjectId(_id));
            });                    
            session.date = sent.date;
            session.time = sent.time;
            session.invite = sent.invite;
            session.bridge = sent.bridge;
            return session.saveAsync();
        }).then(function(){
            console.log('success');
            res.send('success');
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});

//DELETE
//delete a single session by id
session.delete('/sessions/:id',function(req,res){
    console.log("session delete by id");
    Session.find({_id:new ObjectId(req.params.id)})
        .remove()
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results[0]);
            }
        });
});

module.exports = session;


