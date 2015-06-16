var     express = require('express');
var     mongoose = require('mongoose');
var     bodyParser     = require('body-parser');
var     methodOverride = require('method-override');
var     session = require('express-session');
var     MongoStore = require('connect-mongo')(session);
var     port = process.env.PORT || 5000;
var     mongo = process.env.MONGO || 'localhost:27017'
var     sessions = require('./routes/sessions');
var     users = require('./routes/users');
var     uploader = require('./routes/upload');
var     library = require('./routes/library');
var     metrics = require('./routes/metrics');
var     bridges = require('./routes/bridges');
var     revu = require('./routes/revu');
var     sfdc = require('./routes/salesforce');
var     teams = require('./routes/teams');
var     share = require('./routes/share');
var     app = express();
var     connectString = 'mongodb://'+mongo+'/revume';
var     crypto = require('crypto');

console.log('connectString :',connectString);
//setup the database
try {
    mongoose.connect(connectString);
}catch(e){
    console.log('Error connecting to mongo: ',e);
}

app.use(bodyParser());          // pull information from html in POST
app.use(methodOverride());      // simulate DELETE and PUT
app.use(session({               // persist sessions in mongo
    secret: 'supersecretsecret',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
            mongooseConnection:mongoose.connection,
            collection:'expSessions'
                          }),
}));
app.use(express.static('./www'));


// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

// connect to salesforce
//sfdc.connect(port);
//setup the routes
app.use('/api',sessions);
app.use('/api',users);
app.use('/api',uploader);
app.use('/api',library);
app.use('/api',metrics);
app.use('/api',bridges);
app.use('/api',revu);
app.use('/api',sfdc);
app.use('/api',teams);
app.use('/api',share);
// stuff for evaporate uploader
// console logger
app.use(require('morgan')('dev'));
//sign data for aws
app.use('/api/signer',function(req,res){
  if(req.query.to_sign != undefined)
      res.send(crypto
        .createHmac('sha1', process.env.AWS_SECRET_ACCESS_KEY)
        .update(req.query.to_sign)
        .digest('base64')
      );
  else
      res.send('signer no data');

});

app.listen(port, function () {
    console.log('Express server listening on port ' + port);
}).on('error',function(err){
    console.log('process.on error handler');
    console.log(err);
});      

//catch uncaught exceptions and log
process.on('uncaughtException', function(err) {
    console.log('process.on uncaughtException handler');
    console.log(err);
});

//gracefully handle exit - close the database
process.on('SIGINT',function(){
    console.log('closing mongo connection...');
    mongoose.connection.close();
    process.exit();
});

//show the time since start...
var minutes = 0;
setInterval(function(){
    minutes += 0.5;
    console.log('Minutes: ',minutes);
},30*1000);





