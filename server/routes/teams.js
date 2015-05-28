var express = require('express');
var teams = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');

var Team = schema.Team;
var User = schema.User;
//CREATE
//create a team
teams.post('/teams',function(req,res){
    console.log("team got post",req.body);
    var team = new Team;
    var sent = req.body;
    team.members = [];
    sent.members.forEach(function(member){
        var m={};
        m.user = member.user;
        m.role = member.role;
        team.members.push(m);
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
//get all teams that a user is a member of - all if member is null
teams.get('/teams',function(req,res){
       console.log('teams query! - memberId:', req.query.user);
    var userId = req.query.user;
    if(userId != undefined){
        Team.find({'members.user':new ObjectId(userId)})
        .populate('members.user')
        .execAsync()
        .then(function(teams){
            res.send(teams);
        }).catch(function(err){
            res.send(err);
        });
    } else {
        Team.find()
        .populate('members.user')
        .execAsync()
        .then(function(teams){
            res.send(teams);
        }).catch(function(err){
            res.send(err);
        });
    }
});
//READ
//get all users for all teams that a user is a member of
teams.get('/teams/justUsers',function(req,res){
       console.log('team - justUsers! - memberId:', req.query.user);
    var userId = req.query.user;
    var first = req.query.first;
    var last = req.query.last;
    var email = req.query.email;
    if(first != undefined){
        console.log('teams.justUsers: searching by firstName - ',first);
        Team.find({'members.user':new ObjectId(userId)})
        .execAsync()
        .then(function(teams){
            var ids = []
            teams.forEach(function(team){
                team.members.forEach(function(member){
                    ids.push(member.user);
                })
            });
            var re = new RegExp(first,'i');
            return User.findAsync({$and:[{_id:{$in:ids}},{firstName: {$regex:re}}]});
        }).then(function(users){
            res.send(users);
        }).catch(function(err){
            res.send(err);
        });
    } else if(email !=undefined){
        console.log('teams.justUsers: searching by email');
        Team.find({'members.user':new ObjectId(userId)})
        .execAsync()
        .then(function(teams){
            var ids = []
            teams.forEach(function(team){
                team.members.forEach(function(member){
                    ids.push(member.user);
                })
            });
            console.log('ids:',ids);
            var re = new RegExp(email,'i');
            return User.findAsync({$and:[{_id:{$in:ids}},{email: {$regex:re}}]});
        }).then(function(users){
            res.send(users);
        }).catch(function(err){
            res.send(err);
        });
    }
});
//READ
//get a single team by id
teams.get('/teams/:id',function(req,res){
    console.log('Teams get - id: ',req.params.id);
    Team.find({_id:new ObjectId(req.params.id)})
    .populate('members.user')
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
            sent.members.forEach(function(member){
                var m = {};
                m.user = member.user;
                m.role = member.role;
                team.members.push(m);
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
