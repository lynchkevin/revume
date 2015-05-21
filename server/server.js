var     express = require('express');
var     mongoose = require('mongoose');
var     bodyParser     = require('body-parser');
var     methodOverride = require('method-override');
var     session = require('express-session');
var     MongoStore = require('connect-mongo')(session);
var     port = process.env.PORT || 5000;
var     sessions = require('./routes/sessions');
var     users = require('./routes/users');
var     uploader = require('./routes/upload');
var     library = require('./routes/library');
var     metrics = require('./routes/metrics');
var     bridges = require('./routes/bridges');
var     revu = require('./routes/revu');
var     sfdc = require('./routes/salesforce');
var     teams = require('./routes/teams');
var     app = express();



//setup the database
try {
    mongoose.connect('mongodb://localhost:27017/revume');
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
app.use(library.url,express.static(__dirname+library.appPath));

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
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

app.listen(port, function () {
    console.log('Express server listening on port ' + port);
}).on('error',function(err){
    console.log('process.on handler');
    console.log(err);
});      

//catch uncaught exceptions and log
process.on('uncaughtException', function(err) {
    console.log('process.on handler');
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





