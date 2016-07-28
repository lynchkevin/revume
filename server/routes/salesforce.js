var express = require('express');
var salesforce = express.Router();
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var org;
var oauth;
var port = process.env.PORT;
var sfdc = undefined;

// we're authenticating on the client so we don't need these three functions
// use the nforce package to create a connection to salesforce.com
/*
salesforce.connect = function(localport){
    org = nforce.createConnection({  
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: 'http://localhost:' + port + '/api/oauth/_callback',
      apiVersion: 'v32.0',  // optional, defaults to v24.0
      environment: 'production',  // optional, sandbox or production, production default
      mode:'multi',
      autoRefresh: true
    });
    // authenticate using username-password oauth flow
    org.authenticate({  username: username, 
                        password: password})
                        //securityToken: securityToken })
    .then(function(resp){  
        console.log('Access Token: ' + resp.access_token);
        oauth = resp;
    }).catch(function(err){
        console.log(err);
    });
};

// oath callback
salesforce.get('/oauth/_callback',function(req,res){
    console.log('got oath callback code: ',req.query.code);
    org.authenticate({code:req.query.code})
    .then(function(resp){
        console.log('Access Token: ' + resp.access_token);
        oauth = resp;
        res.send('authenticated!');
    }).catch(function(err){
        res.send(err);
    });
});

//redirect to salesforce authentication
salesforce.get('/auth/sfdc',function(req,res){
    res.redirect(org.getAuthUri());
});
*/
function RestResponse(){
    this.success = false;
    this.body = undefined;
    this.error = undefined;
    this.isSalesForce = true;
}
RestResponse.prototype.succeed=function(body){
    var b = body || {};
    this.success = true;
    this.body = b;
    return this;
}
RestResponse.prototype.fail=function(code,message){
    var c = code || 0;
    var m = message || 'no message provided';
    this.success = false;
    this.error = {message:m,code:c}
    return this;
}
    
// set authentication data and return the user information
salesforce.post('/sfdc/authData',function(req,res){
    var sent = req.body;
    console.log('/sfdc/authData got : ',sent);
    //if params are sent then create the box api interface
    sfdc = {authData:sent,
            userUrl:sent.id,
            instanceUrl:sent.instance_url,
            baseUrl:sent.instance_url+'/services/data/v32.0',
            versionUrl:sent.instance_url+'/services/data',
            authHeaders:{'auth':{'bearer':sent.access_token}},
           }
    //log the version to the console
    request.getAsync(sfdc.versionUrl,sfdc.authHeaders)
    .spread(function(response){
        var r = response;
        var versions = JSON.parse(r.body);
        var mostRecent = versions[versions.length-3];
 //       sfdc.baseUrl = sent.instance_url+'/'+mostRecent.version;
        console.log('baseUrl: ',sfdc.baseUrl);
    });
    //get the user information
    request.getAsync(sfdc.userUrl,sfdc.authHeaders)
    .spread(function(response){
        var message = response.statusMessage;
        var code = response.statusCode;
        if(message == 'OK'){
            console.log(response.body);
            res.send(response.body);
        } else {
            throw({error:{statusCode:code,statusMessage:message}});
        }
    }).catch(function(error){
        res.send(new RestResponse().fail(error.statusCode,error.statusMessage));
    });
});

function get(path,res){
    if(sfdc != undefined){
        var resourceUrl = sfdc.baseUrl+path;
        request.getAsync(resourceUrl,sfdc.authHeaders).spread(function(response){
            try{
            var items = JSON.parse(response.body);
            }
            catch(e){
                console.log('invalid JSON:',response.body);
                res.send(new RestResponse().fail(0,'invalid JSON'));
            }
            if(items && (items[0] == undefined || items[0].errorCode == undefined)){
                res.send(items);
            } else {
                var code = items[0].errorCode;
                var message = items[0].message;
                var text = '/sfdc'+path+' - error: ';
                console.log(text,items.message);
                res.send(new RestResponse().fail(code,message));
            }
        });
    } else {
        res.send(new RestResponse().fail(0,'not authorized - user sfdc/auth first'));
    }
}

function query(sql,res){
    if(sfdc != undefined){
        var queryUrl = sfdc.baseUrl+'/query?q='+sql;
        request.getAsync(queryUrl,sfdc.authHeaders).spread(function(response){
            try{
            var items = JSON.parse(response.body);
            }
            catch(e){
                console.log('invalid JSON:',response.body);
                res.send(new RestResponse().fail(0,'invalid JSON'));
            }
            if(items && (items[0] == undefined || items[0].errorCode == undefined)){
                res.send(items);
            } else {
                var code = items[0].errorCode;
                var message = items[0].message;
                var text = '/sfdc/query?'+sql+' - error: ';
                console.log(text,items.message);
                res.send(new RestResponse().fail(code,message));
            }
        });
    } else {
        res.send(new RestResponse().fail(0,'not authorized - user sfdc/auth first'));
    }
}
salesforce.get('/sfdc/objects',function(req,res){
    get('/sobjects',res);
});
            

salesforce.get('/sfdc/account',function(req,res){
    var path = '/sobjects/Account/describe/';
    get(path,res);
});
salesforce.get('/sfdc/contact/:id',function(req,res){
    var path = '/sobjects/Contact/'+req.params.id;
    get(path,res);
});
salesforce.get('/sfdc/contact',function(req,res){
    var path = '/sobjects/Contact/describe/';
    get(path,res);
});
salesforce.get('/sfdc/lead/:id',function(req,res){
    var path = '/sobjects/Lead/'+req.params.id;
    get(path,res);
});
salesforce.get('/sfdc/lead',function(req,res){
    var path = '/sobjects/Lead/describe/';
    get(path,res);
});
salesforce.get('/sfdc/opportunity:/id',function(req,res){
    var path = '/sobjects/Opportunity/'+req.params.id;
    get(path,res);
});
salesforce.get('/sfdc/opportunity',function(req,res){
    var path = '/sobjects/Opportunity/describe/';
    get(path,res);
});
function encode(rawSql){
    var items = rawSql.split(" ");
    var encodedSql = items.join('+');
    return encodedSql;
}
    
salesforce.get('/sfdc/query',function(req,res){
    var sql = req.query.sql;
    query(sql,res);
});

salesforce.get('/sfdc/test',function(req,res){
    var sql = "Select name,email,Id from Contact where owner.Name='Kevin Lynch'";
    query(encode(sql),res);
});

salesforce.get('/sfdc/invite',function(req,res){
    var timBarrId = '0031a0000033kvWAAQ';
    var path = '/sobjects/EventRelation/';
    var eventRelation = {
        isInvitee:true,
        EventId:sfdc.eventId,
        RelationId:timBarrId
    };
    put(path,eventRelation,res);
});

salesforce.get('/sfdc/task',function(req,res){
    var path = '/sobjects/Event/';
    var event = {
      // accountId:accountId,
     //   type:'Meeting',
        Subject: 'A New Revu.Me Meeting',
        Location:'www.revu.me',
        ActivityDateTime:new Date(),
        DurationInMinutes:30,
    };
        
    console.log('Event is : ',event);
    put(path,event,res);
    //res.send('Ok');
    //query(encode(sql),res);
});
salesforce.post('/sfdc/newMeeting',function(req,res){
    var session = req.body;
    var event = {
        Subject: session.name,
        Description: session.description,
        ActivityDateTime: session.time,
        DurationInMinutes:session.length,
        Location: session.link,
        Phone: session
    }
});
    
function create(path,object,res){
    var payload = object || {};
    //return a promise while we create the object
    return new Promise(function(resolve, reject){
        if(sfdc != undefined && sfdc.authHeaders != undefined){
            var authString = 'OAuth '+sfdc.authHeaders.auth.bearer;
            var resourceUrl = sfdc.baseUrl+path;
            var options = {
                headers: {'Authorization':authString,
                         'Content-Type':'application/json'},
                url: resourceUrl,
                method: 'POST',
                json: payload
            }
            request.postAsync(options).spread(function(response){
                if(response.statusCode != 201){//error
                    var code = response.body[0].errorCode;
                    var message = response.body[0].message;
                    var text = '/sfdc'+path+' - error: ';
                    console.log(text,message);
                    reject(new RestResponse().fail(code,message));
                }else {
                    var newObject = response.body;
                    resolve(new RestResponse().succeed(newObject));
                }
            });
        } else {
            var r = new RestResponse().fail(0,'Salesforce OAUTH required - SaleForce Insert Failed');
            reject(r);
        }
    });
}

salesforce.newEvent = function(session){
    //return a promise while we create the object
    return new Promise(function(resolve, reject){
        var event = {
            Subject: session.name,
            Description: session.description,
            ActivityDateTime: session.utcDate,
            DurationInMinutes:session.length,
            Location: session.baseUrl+'/#/app/sessions/'+session._id,
        };
        create('/sobjects/Event/',event)
        .then(function(restResponse){
            if(restResponse.success){
                var event = restResponse.body;
                var promises = [];
                session.sfIds.forEach(function(attendee){
                    var path = '/sobjects/EventRelation/';
                    var eventRelation = {
                        isInvitee:true,
                        EventId:event.id,
                        Status:'Accepted',
                        RelationId:attendee
                    };
                    promises.push(create('/sobjects/EventRelation/',eventRelation));
                });
                Promise.all(promises).then(function(responses){
                    event.invites = [];
                    responses.forEach(function(response){
                        event.invites.push(response.body);
                    });
                    resolve(event);
                }).catch(function(response){
                    reject(response);
                });
            }else{
                reject(restResponse);
            }
        }).catch(function(err){
            reject(err);
        });
    });
}
module.exports = salesforce;


