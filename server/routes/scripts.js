var express = require('express');
var scripts = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var share = require('./share');

var Script = schema.Script;
var User = schema.User;
//CREATE
//create a subscription
scripts.post('/scripts',function(req,res){
    console.log("script got post",req.body);
    var script = new Script;
    var sent = req.body;
    script.members = [];
    sent.members.forEach(function(member){
        var m={};
        m.user = member.user;
        m.role = member.role;
        script.members.push(m);
    });
    script.type = sent.type;
    script.totalSeats = sent.totalSeats;
    script.availableSeats = sent.availableSeats;
    script.startDate = sent.startDate;
    script.expirationDate = sent.expirationDate;
    script.saveAsync().then(function(){
        console.log(script);
        res.send(script);
    }).catch(function(err){
        res.send(err);
    });
});
//READ
//get all scripts that a user is a member of - all if member is null
scripts.get('/scripts',function(req,res){
       console.log('scripts query! - memberId:', req.query.user);
    var userId = req.query.user;
    if(userId != undefined){
        Script.find({'members.user':new ObjectId(userId)})
        .populate('members.user')
        .execAsync()
        .then(function(scripts){
            res.send(scripts);
        }).catch(function(err){
            res.send(err);
        });
    } else {
        Script.find()
        .populate('members.user')
        .execAsync()
        .then(function(scripts){
            res.send(scripts);
        }).catch(function(err){
            res.send(err);
        });
    }
});
//READ
//get all users for all scripts that a user is a member of
scripts.get('/scripts/justUsers',function(req,res){
       console.log('script - justUsers! - memberId:', req.query.user);
    var userId = req.query.user;
    var first = req.query.first;
    var last = req.query.last;
    var email = req.query.email;
    if(first != undefined){
        console.log('scripts.justUsers: searching by firstName - ',first);
        Script.find({'members.user':new ObjectId(userId)})
        .execAsync()
        .then(function(scripts){
            var ids = []
            scripts.forEach(function(script){
                script.members.forEach(function(member){
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
        console.log('scripts.justUsers: searching by email');
        Script.find({'members.user':new ObjectId(userId)})
        .execAsync()
        .then(function(scripts){
            var ids = []
            scripts.forEach(function(script){
                script.members.forEach(function(member){
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
//get a single script by id
scripts.get('/scripts/:id',function(req,res){
    console.log('Scripts get - id: ',req.params.id);
    Script.find({_id:new ObjectId(req.params.id)})
    .populate('members.user')
    .execAsync()
    .then(function(user){
        res.send(user[0]);
    }).catch(function(err){
        res.send(err);
    });
});
//UPDATE
//update a script by id
scripts.put('/scripts/:id',function(req,res){
    console.log("script update by id");
    var sent = req.body;
    Script.findOneAsync({_id:new ObjectId(req.params.id)
        }).then(function(script){
            script.type = sent.type;    
            script.totalSeats = sent.totalSeats;
            script.availableSeats = sent.availableSeats;
            script.startDate = sent.startDate;
            script.expirationDate = sent.expirationDate;
            script.members = [];
            sent.members.forEach(function(member){
                var m = {};
                m.user = member.user;
                m.role = member.role;
                script.members.push(m);
            });
            return script.saveAsync();
        }).then(function(script){
            console.log('script updated...');
            res.send('success');
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});
//DELETE
//delete a script
scripts.delete('/scripts/:id',function(req,res){
    console.log("script delete by id");
    Script.find({_id:new ObjectId(req.params.id)})
        .remove()
        .execAsync()
        .then(function(){
            return share.cleanUpTeam(req.params.id);
        }).then(function(result){
            console.log('cleanupTeam returns: ',result);
            res.send({success:true});
        }).catch(function(err){
            res.send(err);
        });
});

module.exports = scripts;
