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
    this.success = undefined;
    this.body = undefined;
    this.error = undefined;
}
RestResponse.prototype.success=function(body){
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
                res.send(RestResponse().fail(0,'invalid JSON'));
            }
            if(items[0] == undefined || items[0].errorCode == undefined){
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
                res.send(RestResponse().fail(0,'invalid JSON'));
            }
            if(items[0] == undefined || items[0].errorCode == undefined){
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
            
salesforce.get('/sfdc/account/:id',function(req,res){
    var path = '/sobjects/Account/'+req.params.id;
    get(path,res);
});

salesforce.get('/sfdc/contact/:id',function(req,res){
    var path = '/sobjects/Contact/'+req.params.id;
    get(path,res);
});

salesforce.get('/sfdc/lead/:id',function(req,res){
    var path = '/sobjects/Lead/'+req.params.id;
    get(path,res);
});

salesforce.get('/sfdc/opportunity:/id',function(req,res){
    var path = '/sobjects/Opportunity/'+req.params.id;
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
    var sql = "Select name from Account where owner.firstname='Kevin' AND Owner.lastname='Lynch'";
    query(encode(sql),res);
});
    

module.exports = salesforce;


