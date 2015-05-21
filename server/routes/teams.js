var express = require('express');
var teams = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');

var Team = schema.Team;
//CREATE
//create a team
teams.post('/teams',function(req,res){
    console.log("team got post",req.body);
    var team = new Team;
    var sent = req.body;
    team.members = [];
    sent.members.forEach(function(_id){
        team.members.push(_id);
    });
    team.name = sent.name;
    team.saveAsync().then(function(){
        console.log(team);
        res.send(team);
    }).catch(function(err){
        res.send(err);
    });
});
//READ
//get all teams
teams.get('/teams',function(req,res){
       console.log('teams query!');
    Team.find()
    .populate('members')
    .execAsync()
    .then(function(teams){
        res.send(teams);
    }).catch(function(err){
        res.send(err);
    });
});
//READ
//get all teams that a user is a member of
teams.get('/teams',function(req,res){
       console.log('teams query!');
    var userId = req.query.user;
    Team.find({members:new ObjectId(userId)})
    .populate('members')
    .execAsync()
    .then(function(teams){
        res.send(teams);
    }).catch(function(err){
        res.send(err);
    });
});
//READ
//get a single team by id
teams.get('/teams/:id',function(req,res){
    Team.find({_id:new ObjectId(req.params.id)})
    .populate('members')
    .execAsync()
    .then(function(user){
        res.send(user[0]);
    }).catch(function(err){
        res.send(err);
    });
});
//UPDATE
//update a team by id
teams.put('/teams/:id',function(req,res){
    console.log("team update by id");
    var sent = req.body;
    Team.findOneAsync({_id:new ObjectId(req.params.id)
        }).then(function(team){
            team.name = sent.name;
            team.members = [];
            sent.members.forEach(function(_id){
                team.members.push(_id);
            });
            return team.saveAsync();
        }).then(function(team){
            console.log('team updated...');
            res.send('success');
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});
//DELETE
//delete a team
teams.delete('/teams/:id',function(req,res){
    console.log("team delete by id");
    Team.find({_id:new ObjectId(req.params.id)})
        .remove()
        .execAsync()
        .then(function(){
            res.send('success');
        }).catch(function(err){
            res.send(err);
        });
});

module.exports = teams;
