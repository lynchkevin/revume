var     express = require('express');
var     salesforce = express.Router();
var     nforce = require('nforce');
var     clientId = '3MVG9sG9Z3Q1RlbdEH3x71mLE7rVL3IC9m79cM1uHudxEU6AoBtcQieypG.x7fj20dawZZ29LEudyxayDkMCj';
var     clientSecret = '4548776246547347402';
var     securityToken = 'yGi5TE8svyjFtlK9k6LY6CL6d';
var     username = 'lynch.kevin.c@gmail.com';
var     password ='hinault4777';
var     org;
var     oauth;
// use the nforce package to create a connection to salesforce.com

salesforce.connect = function(localport){
    org = nforce.createConnection({  
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: 'http://localhost:' + localport + '/api/oauth/_callback',
      apiVersion: 'v32.0',  // optional, defaults to v24.0
      environment: 'production',  // optional, sandbox or production, production default
      mode:'multi',
      autoRefresh: true
    });
    // authenticate using username-password oauth flow
    org.authenticate({  username: username, 
                        password: password, 
                        securityToken: securityToken })
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

// display a list of 10 accounts
salesforce.get('/accounts', function(req, res) {
  var q = 'select id, name from account limit 10';
  org.query({ query: q, oauth:oauth }, function(err, resp){
      if(err){
          console.log(err);
      }else{
      res.send(resp);
      console.log(resp);
      }
    //res.send("accounts", { title: 'Accounts', data: resp.records } );
  });
});

// display a list of 10 files
salesforce.get('/files', function(req, res) {
  var q = 'select id, title, filetype from contentdocument limit 10';
  org.query({ query: q, oauth:oauth }, function(err, resp){
      if(err){
          console.log(err);
      }else{
      res.send(resp);
      console.log(resp);
      }
    //res.send("accounts", { title: 'Accounts', data: resp.records } );
  });
});

module.exports = salesforce;


