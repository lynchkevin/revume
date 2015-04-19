var express = require('express');
var session = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('schema');
var iCalEvent = require('icalevent');
var nodemailer = require('nodemailer');
var volerroSender = 'invitation@volerro.com';
var transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user: volerroSender,
        pass: 'v5nHZ7N4' 
    }
});

var Session = schema.Session;
var defaultBridgeNumber = '(805) 436-7615' //format works for android and iphone  

function addMinutes(date,minutes){
    return new Date(date.getTime() + minutes*60000);
}
    
function getSession(id){
    return new Promise(function(resolve, reject){
    Session.findOne({_id:new ObjectId(id)})
        .populate('organizer decks attendees')
        .exec(function(err,result){
            if(err) {
                console.log("error! ",err);
                reject(err);
            }else{
                resolve(result);
            }
        });
    });
};

function startDate(meeting){
    var fullStart = new Date(meeting.date);
    var startTime = new Date(meeting.time);
    fullStart.setHours(startTime.getHours());
    fullStart.setMinutes(startTime.getMinutes());
    fullStart.setSeconds(0);
    return fullStart;
};

function endDate(meeting){
    var fullEnd = new Date(meeting.date);
    var endTime = addMinutes(new Date(meeting.time),meeting.length);
    fullEnd.setHours(endTime.getHours());
    fullEnd.setMinutes(endTime.getMinutes());
    fullEnd.setSeconds(0);
    return fullEnd;
};

function initInvite(meeting){
    var fullStart = startDate(meeting);
    var fullEnd = endDate(meeting);
    // now build the invite
    var invite = new iCalEvent({
        uid : meeting._id,
        offset: new Date().getTimezoneOffset(),
        method: 'request',
        status: 'confirmed',
        start: fullStart,
        end: fullEnd,
        timezone:meeting.timeZone,
        summary:meeting.name,
        description:meeting.description,
        location:'Revu.Me',
    });
    return invite;
};
    
function composeMessages(meeting,update){
        var fullStart = startDate(meeting);
        var attUrlString = meeting.baseUrl+'/#/app/attsessions/'+meeting._id;
        var orgUrlString = meeting.baseUrl+'/#/app/sessions/'+meeting._id;
        var orgMessage = "";
        var attMessage = "";
        if(!update){
            orgMessage = "You setup a new meeting in Revu.Me \n\r";
            attMessage = "You\'re invited to a new meeting in Revu.Me \n\r";
        } else {
            orgMessage = "You changed your meeting in Revu.Me \n\r";
            attMessage = "There has been a change to your Revu.Me meeting \n\r";
        }    
        var dateStr = fullStart.toString();
        var attString = "";
        meeting.attendees.forEach(function(u){
            attString = attString.concat(u.firstName+" "+u.lastName);
            attString = attString.concat("\n\r");    
        });
        //build the message for the organizer
        orgMessage = orgMessage.concat("Meeting Name: "+meeting.name+"\n");
        orgMessage = orgMessage.concat("Description: "+meeting.description+"\n\n");
        orgMessage = orgMessage.concat("When: "+dateStr+"\n");
        orgMessage = orgMessage.concat("Where: "+orgUrlString+"\n\n");
        if(meeting.bridge){
            orgMessage = orgMessage.concat("Dial in: "+meeting.bridgeNumber+"\n");
            orgMessage = orgMessage.concat("Conf Id: "+meeting.ufId+"\n\n");
        }
        orgMessage = orgMessage.concat("Attendees: \n");
        orgMessage = orgMessage.concat(attString+"\n");
        orgMessage = orgMessage.concat("\n\n");
        //build the message for the attendees
        var oName = meeting.organizer.firstName+" "+meeting.organizer.lastName;
        attMessage = attMessage.concat("Meeting Organizer: "+oName+"\n");
        attMessage = attMessage.concat("Meeting Name: "+meeting.name+"\n");
        attMessage = attMessage.concat("Description: "+meeting.description+"\n\n");
        attMessage = attMessage.concat("When: "+dateStr+"\n");
        attMessage = attMessage.concat("Where: "+attUrlString+"\n\n");
        if(meeting.bridge){
            attMessage = attMessage.concat("Dial in: "+meeting.bridgeNumber+"\n");
            attMessage = attMessage.concat("Conf Id: "+meeting.ufId+"\n\n");
        }
        attMessage = attMessage.concat("Attendees: \n");
        attMessage = attMessage.concat(attString+"\n");
        attMessage = attMessage.concat("\n\n");
        var messages = {organizer:orgMessage,attendee:attMessage};
        return messages;
};

function sendInvites(id, update){
    var invites = {};
    var mail = {};
    var meeting = getSession(id).then(function(meeting){
        var oName = meeting.organizer.firstName+' '+meeting.organizer.lastName;
        var attUrlString = meeting.baseUrl+'/#/app/attsessions/'+meeting._id;
        var orgUrlString = meeting.baseUrl+'/#/app/sessions/'+meeting._id;
        var organizer={name:oName,email:meeting.organizer.email};
        var attendees =[];
        var toString = "";
        meeting.attendees.forEach(function(usr){
            var u = {};
            u.name = usr.firstName+' '+usr.lastName;
            u.email = usr.email;
            attendees.push(u);
            toString = toString.concat(u.email);
            toString = toString.concat(',');
        });
        var orgInvite = initInvite(meeting);
        var attInvite = initInvite(meeting);
        orgInvite.set('url',orgUrlString);
        orgInvite.set('attendees',attendees);
        orgInvite.set('organizer',organizer);
        
        attInvite.set('url',attUrlString);
        attInvite.set('attendees',attendees);
        attInvite.set('organizer',organizer);
        //build an email to send the organizer
        var messages = composeMessages(meeting,update);
        mail.from = volerroSender; //invitation@volerro.com
        mail.to = organizer.email;
        if (!update)
            mail.subject = 'A New Revu.Me Meeting You Organized'
        else
            mail.subject = 'A Change to Your Revu.Me Meeting'        
        mail.text = messages.organizer;
        mail.attachments = [{filename:'invite.ics',
                     content: orgInvite.toFile()
                    }];
       transporter.sendMail(mail);
        //send mail to the attendees;
        mail.from = volerroSender;
        mail.to = toString;
        if (!update)
            mail.subject = 'Invitation from '+oName+' to join a Revu.me Meeting';
        else
            mail.subject = oName+' made a change to your Revu.me Meeting';            
        mail.text=messages.attendee;
        mail.attachments = [{filename:'invite.ics',
                             content: attInvite.toFile()
                            }];
       transporter.sendMail(mail);
    }).catch(function(err){
        console.log('buildInvites error: ',err);
    });
    
};
// build a user friendly meeting id from the session uuid
function userFriendlyId (_id){
    var rawNumbers = _id.match(/\d+/g);
    var numbers ="";
    var ufId = "";
    rawNumbers.forEach(function(group){
        numbers = numbers+group;
    });
    if(numbers.length<9){
        console.log('uuid to friendly id - not enough digits - time to panic');
    }else{
        ufId = numbers.slice(0,3)+"-";
        ufId = ufId + numbers.slice(3,6)+"-";
        ufId = ufId + numbers.slice(6,9);
    }   
    console.log(ufId,_id);
    return ufId;
};

//CREATE
//create a new session
session.post('/sessions',function(req,res){
    var sent = req.body;
    var model = new Session;
    model.name = sent.name;
    model.organizer = sent.organizer;
    model.description = sent.description;
    model.decks=[];
    sent.decks.forEach(function(value){
        model.decks.push(new ObjectId(value));
    });
    model.attendees = sent.attendees;
    model.date = sent.date;
    model.time = sent.time;
    model.timeZone = sent.timeZone;
    model.length = sent.length;
    model.invite = sent.invite;
    model.bridge = sent.bridge;
    model.baseUrl = sent.baseUrl;
    model.saveAsync().then(function(session){
        model.ufId = userFriendlyId(session[0]._id.toString());
        model.bridgeNumber = defaultBridgeNumber;
        return model.saveAsync();
    }).then(function(session){
        console.log('session add new :',session[0]._id.toString());
        sendInvites(session[0]._id.toString(),false);
        res.send('success');
    }).catch(function(err){
        res.send(err);
    });
});

//READ
//get all sessions
session.get('/sessions',function(req,res){
    Session.find()
        .populate('organizer decks attendees')
        .sort({date:-1})
        .exec(function(err,records){
            if(err) res.send(err);
            res.send(records);
        });
});


//get a single session - populate decks and slides
session.get('/sessions/:id',function(req,res){
    Session.find({_id:new ObjectId(req.params.id)})
        .populate('organizer decks attendees')
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results[0]);
            }
        });
});
//get all sessions where I'm the organizer
session.get('/sessions/organizer/:id',function(req,res){
    console.log("session by organizer",req.params.id);   
    Session.find({organizer:new ObjectId(req.params.id)})
        .populate('organizer decks attendees')
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results);
            }
        });
});
//get all sessions where I am an attendee
session.get('/sessions/attendee/:id',function(req,res){
    console.log("session by attendee",req.params.id);   
    Session.find({attendees:new ObjectId(req.params.id)})
        .populate('organizer decks attendees')
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results);
            }
        });
});
//get all sessions and add a ufId field - this is a one time fix up function
//get all sessions
session.get('/sessions/addUfId/now',function(req,res){
    console.log("add ufId!");
    var allPromises=[];
    Session.findAsync().then(function(sessions){
        sessions.forEach(function(session){
            //session.ufId = userFriendlyId(session._id.toString());
            session.bridgeNumber = defaultBridgeNumber;
            console.log(session._id.toString,session.ufId);
            allPromises.push(session.saveAsync());
        });
        allPromises.settle().then(function(){
            res.send('succcess: ',allPromises.length+' records updated');
        })
    }).catch(function(err){
            res.send(err);
    });
});
//UPDATE
//update a session by id
session.put('/sessions/:id',function(req,res){
    console.log("session update by id");
    var sent = req.body;
    Session.findOneAsync({_id:new ObjectId(req.params.id)
        }).then(function(session){
            session.name = sent.name;
            session.organizer = new ObjectId(sent.organizer._id);
            session.description = sent.description;
            session.decks = [];
            if(sent.decks.length>0)
                sent.decks.forEach(function(_id){
                    session.decks.push(new ObjectId(_id));
                });
            session.attendees = [];
            if(sent.attendees.length>0)
                sent.attendees.forEach(function(_id){
                    session.attendees.push(new ObjectId(_id));
            });                    
            session.date = sent.date;
            session.time = sent.time;
            session.timeZone = sent.timeZone;
            session.length = sent.length;
            session.invite = sent.invite;
            session.bridge = sent.bridge;
            session.baseUrl = sent.baseUrl;
            return session.saveAsync();
        }).then(function(session){
            console.log('success! building invite...');
            sendInvites(req.params.id,true);
            console.log('done and sent');
            res.send('success');
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});

//DELETE
//delete a single session by id
session.delete('/sessions/:id',function(req,res){
    console.log("session delete by id");
    Session.find({_id:new ObjectId(req.params.id)})
        .remove()
        .exec(function(err,results){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                res.send(results[0]);
            }
        });
});

module.exports = session;


