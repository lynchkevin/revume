var express = require('express');
var bridges = express.Router();
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));

var uName = 'mbradley@volerro.com';
var pw = 'tXY5LAtS';
var partnerId = 'turbobridge';
var conferenceID = '48137941533';
var pin = '5297';
var accountID='854375566';

var authAccount ={email:uName,password:pw,partnerID:partnerId,accountID:accountID};
var authAccountBridge = {email:uName,password:pw,partnerID:partnerId,accountID:accountID,conferenceID:conferenceID,pin:pin}

var turboBridge = {request:{authAccount:authAccount,requestList:[]}};
var turboBridgeUrl = 'https://api.turbobridge.com/Bridge';
var callbackUrl = 'http://173.23.248.190:5000/api/bridges/callback';
var authToken = '';

//find a bridge by id return a promise
function findBridge(id){
    return new Promise(function(resolve,reject){
        var found = -1;
        var bridge = turboBridge;
        var requestList = {getBridges:{}};

        bridge.request.requestList = [];
        bridge.request.requestList[0] = requestList; 

        request.postAsync({
                            url:turboBridgeUrl,
                            json:true,
                            headers:{
                                "content-type":"application/json",
                                    },
                            body:bridge
                        })
        .then(function(response){
            var body = response[0].body;
            var result= body.responseList.requestItem[0].result;
            if(result.error == undefined){
                var bridgeCount = result.totalResults;
                //search for matching Id
                var bridge = result.bridge;
                for(var i=0; i< bridgeCount; i++){
                    console.log(id,bridge[i].conferenceID);
                    if(id == bridge[i].conferenceID)
                        found = i;
                }
                if(found>=0){
                    console.log('Found!');
                    resolve(result.bridge[found]);
                }
                else{
                    resolve({});
                }
            }else{
                console.log(result.error.code,result.error.message);
               reject(result.error);
            }
        }).catch(function(err){
            reject(err);
        });
    });
};

//create a bridge
bridges.post('/bridges',function(req,res){
    console.log("Bridges: got create!");
    console.log(req.body)
    var confId = req.body.confId;
    var bridge = turboBridge;
    
    //check if it exists first
    findBridge(confId).then(function(foundBridge){
        if(foundBridge.conferenceID == undefined) { //doesn't exist yet
            // create the new conference  
            var requestList = {setBridge:{
                            conferenceID:confId,
                            confMode:"conversation",
                            name:"RevuMe",
                            maxPendingTime:"900",
                            maxRunningTime:"7200",
                            confEventsUrl:callbackUrl
                                     }};
            bridge.request.requestList = [];
            bridge.request.requestList[0] = requestList;

            request.postAsync({
                                url:turboBridgeUrl,
                                json:true,
                                headers:{
                                    "content-type":"application/json",
                                        },
                                body:bridge
                            })
            .then(function(response){
                console.log('success');
                var body = response[0].body;
                var result= body.responseList.requestItem[0].result;
                if(result.error == undefined){
                    console.log(result.bridge);
                    res.send(result.bridge);

                }else{
                    console.log(result.error.code,result.error.message);
                    res.send(result.error);
                }
            }).catch(function(err){
                console.log('error',err);
                res.send(err);
            });
        }else{
            res.send(foundBridge);
        };
    })
});

bridges.get('/bridges/callback',function(req,res){
    console.log('Bridges got calledback from turbobridge!');
    res.send('success!');

});

// read all bridges
bridges.get('/bridges',function(req,res){
    console.log('Bridges get!');
    var bridge = turboBridge;
    var requestList = {getBridges:{}};
    
    bridge.request.requestList = [];
    bridge.request.requestList[0] = requestList; 

    
    request.postAsync({
                        url:turboBridgeUrl,
                        json:true,
                        headers:{
                            "content-type":"application/json",
                                },
                        body:bridge
                    })
    .then(function(response){
        console.log('success');
        var body = response[0].body;
        var result= body.responseList.requestItem[0].result;
        if(result.error == undefined){
            var bridges = result.totalResults;
            console.log('totalBridges',bridges);        
            res.send(result);
        }else{
            console.log(result.error.code,result.error.message);
            res.send(result.error);
        }
    }).catch(function(err){
        console.log('error',err);
    });
});
// find a single bridge if it exists
bridges.get('/bridges/:id',function(req,res){
    console.log('Bridges find one');
    var searchId = req.params.id;
    findBridge(searchId).then(function(bridge){
        res.send(bridge);
    }).catch(function(err){
        res.send(err);
    });
});

//delete a single session by id
bridges.delete('/bridges/:id',function(req,res){
    console.log("bridges delete by id");
    console.log(req.params.id);
    var confId = req.params.id;
    var bridge = turboBridge;

    var requestList = {deleteBridge:{
                    conferenceID:confId,
                             }};
    bridge.request.requestList = [];
    
    bridge.request.requestList[0] = requestList;
    request.postAsync({
                        url:turboBridgeUrl,
                        json:true,
                        headers:{
                            "content-type":"application/json",
                                },
                        body:bridge
                    })
    .then(function(response){
        console.log('success');
        var body = response[0].body;
        var result= body.responseList.requestItem[0].result;
        if(result.error == undefined){
            console.log(result);
            res.send(result)
        
        }else{
            console.log(result.error.code,result.error.message);
            res.send(result.error);
        }
    }).catch(function(err){
        console.log('error',err);
        res.send(err);
    });
    
});

module.exports = bridges;


