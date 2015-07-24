var express = require('express');
var share = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var signer = require('../lib/cfSigner');

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
function signItems(items){
    return new Promise(function(resolve, reject){
        var promises = [];
        items.forEach(function(item){
            promises.push(signer.thumb(item.thumb));
            promises.push(signer.slides(item.slides));
        });
        Promise.settle(promises).then(function(pees){
            for(var i=0,j=0; i < pees.length; i+=2,j++)
                items[j].thumb = pees[i].value();
            resolve(items);
        })
    })
}

function assembleResults(items,results){
    var r = [];
    var promises = [];
    items.forEach(function(item){
        console.log('item._id = ',item._id);
        for(var i=0; i<results.length;i++){
            if(results[i].item.equals(item._id)){
                var x = {};
                x.item = item;
                x.share = {}
                x.share.user = results[i].user;
                x.share.model = results[i].model;
                x.share.teams = results[i].teams;
                console.log('found!');
                r.push(x);
            }
        }
    });
    return r;
} 

function getSharedItems(userId,model){
    //get all the teams for which I'm a member
    return new Promise(function(resolve, reject){
        var shareItems = [];
        //find all teams where I'm a member
        Team.find({'members.user':new ObjectId(userId)})
        .execAsync()
        .then(function(teams){
            var ids = [];
            teams.forEach(function(team){
                ids.push(team._id)
            })
            // now find all shares for those teams
            return Share.find({teams:{$in:ids},model:model,user:{$ne:userId}})
                    .populate('teams')
                    .execAsync();
        }).then(function(shares){
            shareItems = shares;
            // now eliminate the other users 
            var items = []
            shares.forEach(function(share){
                items.push(share.item);
                share.teams.forEach(function(team){
                    var userInfo = [];
                    team.members.forEach(function(member){
                    if(member.user == userId){
                        userInfo.push(member)
                    }
                    })
                    team.members = userInfo;
                })
            });
            var modelIdx = modelLookup(model);
            if(modelIdx == undefined)
                reject('getSharedItems: model not found!');
            //now populate the items
            var Model = models[modelIdx].model;
            return Model.find({_id:{$in:items}})
            .populate('user slides')
            .execAsync();
        }).then(function(items){
            return signItems(items);
        }).then(function(items){
            var r = assembleResults(items,shareItems);
            resolve(r);
        }).catch(function(err){
            console.log('getSharedItems - error: ',err);
            reject(err);
        });
    })
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
    var user = req.query.user;
    var model = req.query.model;
    var team = req.query.team;
    if(item != undefined){ //get the share by the item being shared
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
    } else if(user!=undefined){ //get all the shared items for a user
        getSharedItems(user,model).then(function(shares){
            res.send(shares);
        }).catch(function(err){
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

//get a single sharing object by id
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
share.get('/share/model/:model/:user',function(req,res){
    console.log("Share get by /:model/:user",req.params.model,req.params.user);  
    var user = req.params.user;
    var model = req.params.model;
    getSharedItems(user,model).then(function(items){
        console.log(items);
        res.send(items);
    }).catch(function(err){
        res.send(err);
    });
});
//get a single sharing object by item and user
share.get('/share/item',function(req,res){
    var item = req.query.item;
    var user = req.query.user;
    console.log("Share get by /item/user",item,user);   
    Share.findOne({item:new ObjectId(req.params.item),user:new ObjectId(req.params.user)})
    .populate('teams user')
    .execAsync().then(function(result){
        console.log(result);
        res.send(result);
    }).catch(function(err){
        res.send(err);
    })
});
//get sharing object by team and user
share.get('/share/team/:team/:user',function(req,res){
    console.log("Share get by /:team/:user",req.params.team,req.params.user);   
    Share.find({teams:new ObjectId(req.params.team),user:new ObjectId(req.params.user)})
    .populate('teams user')
    .execAsync().then(function(result){
        console.log(result);
        res.send(result);
    }).catch(function(err){
        res.send(err);
    })
});
//update a share
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
//delete a share
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
//delete all shares for a given team
share.cleanUpTeam = function(teamId){ 
    console.log('clean up team');
    return new Promise(function(resolve, reject){
        Share.find({teams:new ObjectId(teamId)})
        .remove()
        .execAsync()
        .then(function(){
            resolve({success:true});
        }).catch(function(err){
            reject(err);
        });
    });
};
module.exports = share;


