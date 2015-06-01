var express = require('express');
var share = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');

var Share = schema.Share;
var models = [{name:'files',model:schema.UploadedFile},
              {name:'categories',model:schema.Category},
              {name:'decks',model:schema.Deck}];
var Team = schema.Team;

function modelLookup(modelName){
    for(var i=0;i<models.length; i++){
        if(modelName == models[i].name){
            return i;
        }
    }
}

function populateShare(share){
           console.log(records);
            var promises = [];
            records.forEach(function(share){
                var model = models[modelLookup(share.model)].model;
                retVal.model = share.model;
                var p = {}
                p = model.findOne({_id:share.item}).populate('user slides').execAsync();
                promises.push(p);
                p.then(function(item){
                    console.log('item is: ',item);
                    retVal.item = item;
                }).catch(function(err){
                    console.log('Share-get item query fails: ',err);
                });
                var t = {};
                t = Team.find({_id:{$in:share.teams}})
                    .populate('members.user')
                    .execAsync();
                promises.push(t);
                t.then(function(teams){
                    console.log('teams are: ',teams);
                    retVal.teams = teams;
                }).catch(function(err){
                    console.log('Share-get: teams query fails: ',err);
                })
                Promise.all(promises).then(function(){
                    console.log(retVal);
                    res.send(retVal);
                }).catch(function(err){
                    res.send(err);
                });
            }); 
}
//save a sharing object
share.post('/share',function(req,res){
    console.log("share: got put (save)!");
    console.log(req.body)
    var sent = req.body;
    var share = new Share;
    share.model = sent.model;
    share.user = sent.user;
    share.item = sent.item;
    share.teams = []
    sent.teams.forEach(function(_id){
        share.teams.push(_id);
    });
    share.saveAsync().then(function(){
        res.send(share._id);
    }).catch(function(err){
        res.send(err);
    });
});

//get all sharing objects
share.get('/share',function(req,res){
    var item = req.query.item;
    if(item != undefined){
        console.log('Share query by itemId! ',item);
        Share.find({item:new ObjectId(item)})
        .sort({'eventDate':-1})
        .populate('teams user')
        .execAsync().then(function(records){
            res.send(records);
        }).catch(function(err){
            console.log('Share-get: find query fails: ',err);
            res.send(err);
        });
    } else {
        console.log('Share query - all!');
        Share.find()
        .sort({'eventDate':-1})
        .populate('teams user')
        .execAsync().then(function(records){
            res.send(records);
        }).catch(function(err){
            console.log('Share-get: find query fails: ',err);
            res.send(err);
        })   
    }
});

//get a single sharing object
share.get('/share/:id',function(req,res){
    console.log("Share get by id:",req.params.id);   
    Share.findOne({_id:new ObjectId(req.params.id)})
    .populate('teams user')
    .execAsync().then(function(result){
        console.log(result);
        res.send(result);
    }).catch(function(err){
        res.send(err);
    })
});

share.put('/share/:id',function(req,res){
    console.log("share update by id");
    var sent = req.body;
    console.log(sent);
    console.log(req.params.id);
    Share.findOneAsync({_id:new ObjectId(req.params.id)
        }).then(function(share){
            if(share == undefined)
                share = new Share;
            else
                console.log('found! now updating');
            share.model = sent.model
            share.user = sent.user;
            share.item = sent.item;
            share.teams= [];
            sent.teams.forEach(function(_id){  
                share.teams.push(_id);
            });
            return share.saveAsync();
        }).then(function(share){
            console.log('share updated...');
            res.send('success');
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});
//delete a team
share.delete('/share/:id',function(req,res){
    console.log("share delete by id");
    Share.find({_id:new ObjectId(req.params.id)})
        .remove()
        .execAsync()
        .then(function(){
            res.send('success');
        }).catch(function(err){
            res.send(err);
        });
});
module.exports = share;


