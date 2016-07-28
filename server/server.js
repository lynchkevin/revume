var     express = require('express');
var     mongoose = require('mongoose');
var     bodyParser     = require('body-parser');
var     methodOverride = require('method-override');
var     session = require('express-session');
var     MongoStore = require('connect-mongo')(session);
var     port = process.env.PORT || 9000;
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
var     confirm = require('./routes/confirmEmail');
var     scripts = require('./routes/scripts');
var     braintree = require('./routes/braintree');
var     box = require('./routes/box');
var     signer = require('./routes/signer');
var     screenleap = require('./routes/screenleap');
var     activityLog = require('./routes/activityLog');
var     dashboard = require('./routes/dashboard');
var     app = express();
var     connectString = 'mongodb://'+mongo+'/revume';
var     crypto = require('crypto');

//write some important constants to console for validation
console.log('connectString :',connectString);
console.log('BASE_URL : ',process.env.BASE_URL);
console.log('PORT : ',process.env.PORT);

//setup the database
try {
    mongoose.connect(connectString);
}catch(e){
    console.log('Error connecting to mongo: ',e);
}
//attach lister to connected event
mongoose.connection.once('connected', function() {
	console.log("Connected to database")
});

// http to https redirect for production
 var forceSSL = function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
 };
// only forceSSL if production
if(process.env.NODE_ENV == 'production'){
    console.log('using forceSSL...');
    app.use(forceSSL);
}

// Middleware for convenience
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
// serve static from www
app.use(express.static('./www'));


// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});
// stuff for evaporate uploader
// console logger
app.use(require('morgan')('dev'));
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
app.use('/api',confirm);
app.use('/api',scripts);
app.use('/api',braintree);
app.use('/api',box);
app.use('/api',signer);
app.use('/api',screenleap);
app.use('/api',activityLog);
app.use('/api',dashboard);



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
/*
var sfdc = require('./routes/salesforce');
var session = {
    _id:'558dd6caccd628db0dd45d45',
    name:'Deep Dive',
    description:'A demonstration meeting',
    baseUrl:"http://10.1.10.216:5000",
    bridge:true,
    invite:true,
    length:30,
    time:new Date(),
    date:new Date(),
    bridgeNumber: '(805) 436-7615',
    ufId:'558-662-804',
    attendees:[{Name:'Rose Gonzalez',Email:'rose@edge.com',Id:'0031a0000033kvRAAQ',isSalesForce:true},
               {Name:'Sean Forbes',Email:'sean@edge.com',Id:'0031a0000033kvSAAQ',isSalesForce:true}],
}

    
    if(minutes == 1.0){
        sfdc.newEvent(session).then(function(result){
            console.log('result: ',result);
        }).catch(function(err){
            console.log('error: ',err);
        });
    }

*/
