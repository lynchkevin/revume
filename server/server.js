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
var     presentations = require('./routes/presentations');
var     metrics = require('./routes/metrics');
var     bridges = require('./routes/bridges');
var     revu = require('./routes/revu');
var     sfdc = require('./routes/salesforce');
var     app = express();



//setup the database
mongoose.connect('mongodb://localhost:27017/revume');

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
app.use(express.static('../www'));
app.use(library.url,express.static(__dirname+library.appPath));

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// connect to salesforce
sfdc.connect(port);
//setup the routes
app.use('/api',sessions);
app.use('/api',users);
app.use('/api',presentations);
app.use('/api',uploader);
app.use('/api',library);
app.use('/api',metrics);
app.use('/api',bridges);
app.use('/api',revu);
app.use('/api',sfdc);

app.listen(port, function () {
    console.log('Express server listening on port ' + port);
});

//gracefully handle exit - close the database
process.on('SIGINT',function(){
    console.log('closing mongo connection...');
    mongoose.connection.close();
    process.exit();
});





