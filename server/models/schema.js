var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;

//define the app Schema
//slides
var SlideSchema = new mongoose.Schema({
    name:String,
    link:String,
    originalOrder:Number,
    location:String,
    type:String,
    src:String,
    identifier:String,
    poster:String
});

//containers (Deck,UploadFile, Category)
var Container = new mongoose.Schema({
    name:String,
    createdDate: {type: Date, default: Date.now},
    lastUpdate: {type: Date, default: Date.now},
    thumb : String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    slides: [{type: mongoose.Schema.Types.ObjectId, ref: 'Slide'}]
});

//users and teams
var UserSchema = new mongoose.Schema({
    firstName:String,
    lastName:String,
    email:String
});

    
var TeamSchema = new mongoose.Schema({
    name:String,
    members: [{
        user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        role:String
    }]
});

//sessions
var SessionSchema = new mongoose.Schema({
    name:String,
    ufId:String,
    organizer:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    description:String,
    decks:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Deck'}],
    attendees:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    date:{type: Date, default: Date.now},
    time:{type: Date, defailt: Date.now},
    timeZone:String,
    length:Number,
    invite:Boolean,
    bridge:Boolean,
    leaveBehind:Boolean,
    bridgeNumber:String,
    baseUrl:String,
});

//engagement analytics
var SessionInteractionSchema = new mongoose.Schema({
    session: {type: mongoose.Schema.Types.ObjectId, ref: 'Session'},
    eventDate: {type: Date, default: Date.now},
    duration: Number,
    deck:mongoose.Schema.Types.ObjectId,
    slideViews:[{slideIndex:Number, duration:Number, views:[{userName:String,viewed:Number}]}],
    viewers:[String],
});
    
    
var Team = mongoose.model('Team',TeamSchema);
var User = mongoose.model('User',UserSchema);
var Slide = mongoose.model('Slide',SlideSchema);
var UploadedFile = mongoose.model('UploadedFile', Container);
var Deck = mongoose.model('Deck', Container);
var Category = mongoose.model('Category', Container);
var Session = mongoose.model('Session',SessionSchema);
var SessionInteraction = mongoose.model('SessionInteraction',SessionInteractionSchema);

var entries = [
{firstName:"Kevin", lastName:"Lynch", email:"klynch@volerro.com"},
{firstName:"Kathy", lastName:"Lynch", email:"kevkathboys@yahoo.com"},    
{firstName:"Tom", lastName:"Vettel", email:"tvettel@acpartners.us"},
{firstName:"Jason", lastName:"Sundby", email:"jsundnby@acpartners.us"}
];

function loadUsers(){
    for(var i=0; i<4; i++){
        var usr = new User;
        usr.firstName = entries[i].firstName;
        usr.lastName = entries[i].lastName;
        usr.email = entries[i].email;
        usr.save();
    }
    console.log(i,' Users Loaded');
};
        
module.exports.loadUsers = loadUsers;

module.exports.Team = Team;
module.exports.User = User;
module.exports.Slide = Slide;
module.exports.UploadedFile = UploadedFile;
module.exports.Deck = Deck;
module.exports.Category = Category;
module.exports.Session = Session;
module.exports.SessionInteraction = SessionInteraction;
