var express = require('express');
var session = express.Router();
var Promise = require('bluebird');
var mongoose = Promise.promisifyAll(require('mongoose'));
var ObjectId = require('mongodb').ObjectID;
var schema = require('../models/schema');
var iCalEvent = require('icalevent');
var icalToolkit = require('ical-toolkit');
var nodemailer = require('nodemailer');
var signer = require('../lib/cfSigner');
var volerroSender = 'invitation@revu.me';
var pw = process.env.INVITATION_PW;
var transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user: volerroSender,
        pass: pw
    }
});
var sfdc = require('./salesforce');
var Session = schema.Session;
var defaultBridgeNumber = '(805) 436-7615' //format works for android and iphone  
//set the bucket on the signer
signer.setBucket('revu','volerro.com');

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
    fullStart.setDate(startTime.getDate());
    return fullStart;
};

function endDate(meeting){
    var fullEnd = new Date(meeting.date);
    var endTime = addMinutes(new Date(meeting.time),meeting.length);
    fullEnd.setHours(endTime.getHours());
    fullEnd.setMinutes(endTime.getMinutes());
    fullEnd.setSeconds(0);
    fullEnd.setDate(endTime.getDate());
    return fullEnd;
};

function initTkInvite(meeting,inputUrl,organizer,attendees,descText){
    var invite = icalToolkit.createIcsFileBuilder(); 
    
    invite.spacers = true;
    invite.NEWLINE_CHAR = '\r\n';
    invite.throError = false;
    invite.ignorTZIDMismatch=true;
    
    invite.calname = meeting.name;
    invite.timezone = meeting.timeZone;
    invite.tzid = meeting.timeZone;
    invite.method = 'REQUEST';
    invite.events.push({
        start: startDate(meeting),
        end:endDate(meeting),
        transp: 'OPAQUE',
        summary: meeting.description,
        additionalTags: {
            'confID' : meeting.ufId
        },
        organizer:organizer,
        attendees:attendees,
        uid: meeting.ufId,
        sequence: null,
        location:meeting.bridgeNumber+',,,'+meeting.ufId.replace(/-/g,'')+"#\n\n",
        description:descText,
        method: 'PUBLISH',
        status: 'CONFIRMED',
       // url:inputUrl,
    });
    return invite;
}
/* version prior to 1/5/2016
function initTkInvite(meeting,inputUrl,organizer,attendees){
    var invite = icalToolkit.createIcsFileBuilder(); 
    invite.spacers = true;
    invite.NEWLINE_CHAR = '\r\n';
    invite.throError = false;
    invite.ignorTZIDMismatch=true;
    
    invite.calname = meeting.name;
    invite.timezone = meeting.timeZone;
    invite.tzid = meeting.timeZone;
    invite.method = 'REQUEST';
    invite.events.push({
        start: startDate(meeting),
        end:endDate(meeting),
        transp: 'OPAQUE',
        summary: meeting.description,
        additionalTags: {
            'confID' : meeting.ufId
        },
        organizer:organizer,
        attendees:attendees,
        uid: meeting.ufId,
        sequence: null,
        location:meeting.bridgeNumber+',,,'+meeting.ufId.replace(/-/g,'')+"#\n\n",
        description:meeting.description,
        method: 'PUBLISH',
        status: 'CONFIRMED',
        url:inputUrl,
    });
    return invite;
}
*/  
function composeOrgMessage(meeting,update){
        var fullStart = startDate(meeting);
        var orgUrlString = meeting.baseUrl+'/#/app/sessions/'+meeting._id;
        var orgMessage = "";
        if(!update)
            orgMessage = "You setup a new meeting in Revu.Me \n\r";
        else 
            orgMessage = "You changed your meeting in Revu.Me \n\r";
 //       var dateStr = fullStart.toString();
        var dateStr = meeting.time;
        var attString = "";
        //add the organizer id to the url
        orgUrlString +='?uid='+meeting.organizer._id;    
        meeting.attendees.forEach(function(u){
            attString = attString.concat(u.firstName+" "+u.lastName);
            attString = attString.concat("\n");    
        });
        //build the message for the organizer
        orgMessage = orgMessage.concat("Meeting Name: "+meeting.name+"\n");
        orgMessage = orgMessage.concat("Description: "+meeting.description+"\n\n");
        orgMessage = orgMessage.concat("When: "+dateStr+"\n");
        orgMessage = orgMessage.concat("Where: "+orgUrlString+"\n\n");
        if(meeting.bridge){
            orgMessage = orgMessage.concat("Dial in: "+meeting.bridgeNumber+"\n");
            orgMessage = orgMessage.concat("Conf Id: "+meeting.ufId+"\n");
            orgMessage = orgMessage.concat("Auto Dial: "+meeting.bridgeNumber+',,,'+meeting.ufId.replace(/-/g,'')+"#\n\n");
        }
        orgMessage = orgMessage.concat("Attendees: \n\n");
        orgMessage = orgMessage.concat(attString+"\n");
        orgMessage = orgMessage.concat("\n\n");
        return orgMessage;
};
function composeOrgInvite(meeting){
        var fullStart = startDate(meeting);
        var orgUrlString = meeting.baseUrl+'/#/app/sessions/'+meeting._id;
        var orgMessage = "";
    
        var dateStr = meeting.time;
        var attString = "";
        //add the organizer id to the url
        orgUrlString +='?uid='+meeting.organizer._id;    

        //build the message for the organizer
        orgMessage = orgMessage.concat("Meeting Name: "+meeting.name+"\n");
        orgMessage = orgMessage.concat("When: "+dateStr+"\n");
        orgMessage = orgMessage.concat("Where: "+orgUrlString+"\n\n");
        if(meeting.bridge){
            orgMessage = orgMessage.concat("Dial in: "+meeting.bridgeNumber+"\n");
            orgMessage = orgMessage.concat("Conf Id: "+meeting.ufId+"\n");
            orgMessage = orgMessage.concat("Auto Dial: "+meeting.bridgeNumber+',,,'+meeting.ufId.replace(/-/g,'')+"#\n\n");
        }
        return orgMessage;
};
function composeAttMessage(meeting,update,userId){
        var fullStart = startDate(meeting);
        var attUrlString = meeting.baseUrl+'/#/app/attsessions/'+meeting._id+'?uid='+userId;
        var attMessage = "";
        if(!update)
            attMessage = "You\'re invited to a new meeting in Revu.Me \n\r";
        else
            attMessage = "There has been a change to your Revu.Me meeting \n\r"; 
        //var dateStr = fullStart.toString();
        var dateStr = meeting.time;
        var attString = "";
        meeting.attendees.forEach(function(u){
            attString = attString.concat(u.firstName+" "+u.lastName);
            attString = attString.concat("\n");    
        });
        //build the message 
        var oName = meeting.organizer.firstName+" "+meeting.organizer.lastName;
        attMessage = attMessage.concat("Meeting Organizer: "+oName+"\n");
        attMessage = attMessage.concat("Meeting Name: "+meeting.name+"\n");
        attMessage = attMessage.concat("Description: "+meeting.description+"\n\n");
        attMessage = attMessage.concat("When: "+dateStr+"\n");
        attMessage = attMessage.concat("Where: "+attUrlString+"\n\n");
        if(meeting.bridge){
            attMessage = attMessage.concat("Dial in: "+meeting.bridgeNumber+"\n");
            attMessage = attMessage.concat("Conf Id: "+meeting.ufId+"\n");
            attMessage = attMessage.concat("Auto Dial: "+meeting.bridgeNumber+',,,'+meeting.ufId.replace(/-/g,'')+"#\n\n");
        }
        attMessage = attMessage.concat("Attendees: \n\n");
        attMessage = attMessage.concat(attString+"\n");
        attMessage = attMessage.concat("\n\n");
        return attMessage;
};
function composeAttInvite(meeting,userId){
        var fullStart = startDate(meeting);
        var attUrlString = meeting.baseUrl+'/#/app/attsessions/'+meeting._id+'?uid='+userId;
        var attMessage = "";

        var dateStr = meeting.time;

        //build the message 
        var oName = meeting.organizer.firstName+" "+meeting.organizer.lastName;
        attMessage = attMessage.concat("Meeting Organizer: "+oName+"\n");
        attMessage = attMessage.concat("Meeting Name: "+meeting.name+"\n");
        attMessage = attMessage.concat("When: "+dateStr+"\n");
        attMessage = attMessage.concat("Where: "+attUrlString+"\n\n");
        if(meeting.bridge){
            attMessage = attMessage.concat("Dial in: "+meeting.bridgeNumber+"\n");
            attMessage = attMessage.concat("Conf Id: "+meeting.ufId+"\n");
            attMessage = attMessage.concat("Auto Dial: "+meeting.bridgeNumber+',,,'+meeting.ufId.replace(/-/g,'')+"#\n\n");
        }
        return attMessage;
};
/* depricated code
function sendInvites(id, update){
    var invites = {};
    var mail = {};
    var meeting = getSession(id).then(function(meeting){
        var oName = meeting.organizer.firstName+' '+meeting.organizer.lastName;
        var attUrlString = meeting.baseUrl+'/#/app/attsessions/'+meeting._id;
        var orgUrlString = meeting.baseUrl+'/#/app/sessions/'+meeting._id;
        var organizer={name:oName,email:meeting.organizer.email};
        var attendees =[];
        meeting.attendees.forEach(function(usr){
            var u = {};
            u.name = usr.firstName+' '+usr.lastName;
            u.email = usr.email;
            attendees.push(u);
        });
        var orgInvite = initInvite(meeting);
        var attInvite = initInvite(meeting);
        //add organizer user._id to the url
        orgUrlString += '?uid='+meeting.organizer._id;
        orgInvite.set('url',orgUrlString);
        orgInvite.set('attendees',attendees);
        orgInvite.set('organizer',organizer);
        
        //build an email to send the organizer
        var orgMessage = composeOrgMessage(meeting,update);
        mail.from = volerroSender; //invitation@volerro.com
        mail.to = organizer.email;
        if (!update)
            mail.subject = 'A New Revu.Me Meeting You Organized'
        else
            mail.subject = 'A Change to Your Revu.Me Meeting'        
        mail.text = orgMessage;
        mail.attachments = [{filename:'invite.ics',
                     content: orgInvite.toFile()
                    }];

        transporter.sendMail(mail);
        // build attendee invites
        attInvite.set('attendees',attendees);
        attInvite.set('organizer',organizer);
        //send mail to the attendees;
        mail.from = volerroSender;
        if (!update)
            mail.subject = 'Invitation from '+oName+' to join a Revu.me Meeting';
        else
            mail.subject = oName+' made a change to your Revu.me Meeting';            
        meeting.attendees.forEach(function(usr){
            var url = attUrlString+'?uid='+usr._id;
            var attMessage = composeAttMessage(meeting,update,usr._id);
            attInvite.set('url',url);
            mail.to = usr.email;
            mail.text = attMessage;
            mail.attachments = [{filename:'invite.ics',
                             content: attInvite.toFile()
                            }];
            transporter.sendMail(mail);
        });
    }).catch(function(err){
        console.log('buildInvites error: ',err);
    });
    
};
*/
function sendTkInvites(id, update){
    var invites = {};
    var mail = {};
    var meeting = getSession(id).then(function(meeting){
        var oName = meeting.organizer.firstName+' '+meeting.organizer.lastName;
        var attUrlString = meeting.baseUrl+'/#/app/attsessions/'+meeting._id;
        var orgUrlString = meeting.baseUrl+'/#/app/sessions/'+meeting._id;
        orgUrlString += '?uid='+meeting.organizer._id;
        var organizer={name:oName,email:meeting.organizer.email};
        var attendees =[];
        meeting.attendees.forEach(function(usr){
            var u = {};
            u.name = usr.firstName+' '+usr.lastName;
            u.email = usr.email;
            attendees.push(u);
        });

            
        //send the invitation to the organizer
        //build an email to send the organizer and attendee in email and iCal
        var orgMessage = composeOrgMessage(meeting,update);
        //build invites for organizer and attendee
        var orgInvText = composeOrgInvite(meeting);
        var orgInvite = initTkInvite(meeting,orgUrlString,organizer,attendees,orgInvText);
        mail.from = volerroSender; //invitation@volerro.com
        mail.to = organizer.email;
        if (!update)
            mail.subject = 'A New Revu.Me Meeting You Organized'
        else
            mail.subject = 'A Change to Your Revu.Me Meeting'        
        mail.text = orgMessage;
        mail.attachments = [{filename:'invite.ics',
                     content: orgInvite.toString()
                    }];
        transporter.sendMail(mail);

        //send mail to the attendees;
        mail.from = volerroSender;
        if (!update)
            mail.subject = 'Invitation from '+oName+' to join a Revu.me Meeting';
        else
            mail.subject = oName+' made a change to your Revu.me Meeting';            
        meeting.attendees.forEach(function(usr){
            var url = attUrlString+'?uid='+usr._id;
            var attMessage = composeAttMessage(meeting,update,usr._id);
            var attInvText = composeAttInvite(meeting,usr._id);
            var attInvite = initTkInvite(meeting,attUrlString,organizer,attendees,attInvText);
            mail.to = usr.email;
            mail.text = attMessage;
            mail.attachments = [{filename:'invite.ics',
                             content: attInvite.toString()
                            }];
            transporter.sendMail(mail);
        });
    }).catch(function(err){
        console.log('buildInvites error: ',err);
    });
    
};
/* old version 1/5/16
function sendTkInvites(id, update){
    var invites = {};
    var mail = {};
    var meeting = getSession(id).then(function(meeting){
        var oName = meeting.organizer.firstName+' '+meeting.organizer.lastName;
        var attUrlString = meeting.baseUrl+'/#/app/attsessions/'+meeting._id;
        var orgUrlString = meeting.baseUrl+'/#/app/sessions/'+meeting._id;
        orgUrlString += '?uid='+meeting.organizer._id;
        var organizer={name:oName,email:meeting.organizer.email};
        var attendees =[];
        meeting.attendees.forEach(function(usr){
            var u = {};
            u.name = usr.firstName+' '+usr.lastName;
            u.email = usr.email;
            attendees.push(u);
        });
        //build invites for organizer and attendee
        var orgInvite = initTkInvite(meeting,orgUrlString,organizer,attendees);
        var attInvite = initTkInvite(meeting,attUrlString,organizer,attendees);
        
 
        //build an email to send the organizer
        var orgMessage = composeOrgMessage(meeting,update);
        mail.from = volerroSender; //invitation@volerro.com
        mail.to = organizer.email;
        if (!update)
            mail.subject = 'A New Revu.Me Meeting You Organized'
        else
            mail.subject = 'A Change to Your Revu.Me Meeting'        
        mail.text = orgMessage;
        mail.attachments = [{filename:'invite.ics',
                     content: orgInvite.toString()
                    }];

        transporter.sendMail(mail);

        //send mail to the attendees;
        mail.from = volerroSender;
        if (!update)
            mail.subject = 'Invitation from '+oName+' to join a Revu.me Meeting';
        else
            mail.subject = oName+' made a change to your Revu.me Meeting';            
        meeting.attendees.forEach(function(usr){
            var url = attUrlString+'?uid='+usr._id;
            var attMessage = composeAttMessage(meeting,update,usr._id);
            //each attendee gets a unique url
            attInvite.events[0].url = url;
            mail.to = usr.email;
            mail.text = attMessage;
            mail.attachments = [{filename:'invite.ics',
                             content: attInvite.toString()
                            }];
            transporter.sendMail(mail);
        });
    }).catch(function(err){
        console.log('buildInvites error: ',err);
    });
    
};
*/
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
// build leave behind message for the attendees
function composeLBMessage(meeting,userId){
        var fullStart = startDate(meeting);
        var attUrlString = meeting.baseUrl+'/#/app/revu/'+meeting._id+'?uid='+userId+"\n\n";
        var attMessage = "";
        var oName = meeting.organizer.firstName+" "+meeting.organizer.lastName;

        attMessage = "Thank you for attending "+meeting.name+" on Revu.me. \n\n\n"; 
        attMessage = attMessage.concat("You can review the meeting content using the following link: \n");
        attMessage = attMessage.concat(attUrlString);
        attMessage = attMessage.concat("Please send any follow up items to your meeting organizer: \n\n");
        attMessage = attMessage.concat(oName+"\n");
        attMessage = attMessage.concat(meeting.organizer.email+"\n\n");
        attMessage = attMessage.concat("Thank You!\n\n\n");
        attMessage = attMessage.concat("The Revu.Me Team\n");
        return attMessage;
};
// send follow up email
function sendFollowUp(meeting){
        var mail = {};
    
        mail.from = volerroSender;
        mail.subject = 'Follow up to meeting: '+meeting.name;
         
        meeting.attendees.forEach(function(usr){
            mail.to = usr.email;
            mail.text = composeLBMessage(meeting,usr._id);
            transporter.sendMail(mail);
        }); 
};

function doThumbs(results){
 return new Promise(function(resolve,reject){
    var promises = [];
    var decks = [];
    results.forEach(function(result){
        result.decks.forEach(function(deck){
            decks.push(deck);
            promises.push(signer.thumb(deck.thumb));
        });
    });
    Promise.settle(promises).then(function(pees){
        for(var i=0; i < pees.length; i++)
            decks[i].thumb = pees[i].value(); 
        resolve(pees);
    }).catch(function(err){
        reject(err);
    });
 });
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
    model.archiveStatus = [];
    model.attendees.forEach(function(attendee){
        model.archiveStatus.push({id:attendee,isArchived:false});
    });
    model.archiveStatus.push({id:model.organizer,isArchived:false});
    model.date = sent.date;
    model.time = sent.time;
    model.timeZone = sent.timeZone;
    model.length = sent.length;
    model.invite = sent.invite;
    model.bridge = sent.bridge;
    model.baseUrl = sent.baseUrl;
    model.offset = sent.offset;
    model.saveAsync().then(function(session){
        model.ufId = userFriendlyId(session[0]._id.toString());
        model.bridgeNumber = defaultBridgeNumber;
        return model.saveAsync();
    }).then(function(session){
        console.log('session add new :',session[0]._id.toString());
        sendTkInvites(session[0]._id.toString(),false);
        if(sent.sfIds.length>0){
            sent._id = session[0]._id;
            sfdc.newEvent(sent).then(function(result){
                res.send('success');
            }).catch(function(err){
                res.send(err);
            });
        }
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
    var sessions;
    Session.find({_id:new ObjectId(req.params.id)})
        .populate('organizer decks attendees')
        .execAsync().then(function(results){
            sessions = results;
            return doThumbs(sessions);
        }).then(function(){ 
            res.send(sessions[0]);
        }).catch(function(err){
            res.send(err);
        });
});
//get all sessions where I'm the organizer
session.get('/sessions/organizer/:id',function(req,res){
    var sessions;
    console.log("session by organizer with Archive",req.params.id,req.query.isArchived); 
    Session.find({organizer:new ObjectId(req.params.id),
                  archiveStatus: {$elemMatch:{id:new ObjectId(req.params.id),isArchived:req.query.isArchived}}})
        .populate('organizer decks attendees')
        .sort({date:-1})    
        .execAsync().then(function(results){
            sessions = results;
            return doThumbs(sessions);
        }).then(function(pees){
            res.send(sessions);
        }).catch(function(err){
            console.log('sessions by organizer: ',err);
            res.send(err);
        });
});

//get all sessions where I am an attendee
session.get('/sessions/attendee/:id',function(req,res){
    var sessions;
    console.log("session by Attendee with Archive",req.params.id,req.query.isArchived);   
    Session.find({attendees:new ObjectId(req.params.id),
                 archiveStatus: {$elemMatch:{id:new ObjectId(req.params.id),isArchived:req.query.isArchived}}})
        .populate('organizer decks attendees')
        .sort({date:-1})    
        .execAsync().then(function(results){
            sessions = results;
            return doThumbs(sessions);
        }).then(function(pees){
            res.send(sessions);
        }).catch(function(err){
            res.send(err);
        });
});
//get all sessions and add a ufId field - this is a one time fix up function
//get all sessions
session.get('/sessions/addArchiveStatus/now',function(req,res){
    console.log("add ufId!");
    var allPromises=[];
    Session.findAsync().then(function(sessions){
        console.log('Found ',sessions.length,' sessions')
        sessions.forEach(function(session){
            session.archiveStatus = [];
            session.attendees.forEach(function(attendee){
                session.archiveStatus.push({id:attendee,isArchived:false});
            });
            console.log('Archive Status: ',session.archiveStatus);
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
            session.offset = sent.offset;
            session.archiveStatus = sent.archiveStatus;
            return session.saveAsync();
        }).then(function(session){
            console.log('success! building invite...');
            sendTkInvites(req.params.id,true);
            console.log('done and sent');
            res.send('success');
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
});
//set up leaveBehind
//set the leaveBehind attribute of the session and send email if necessary
session.put('/sessions/setLB/:id',function(req,res){
    console.log("session update by id");
    var sent = req.body;
    Session.findOne({_id:new ObjectId(req.params.id)})
        .populate('organizer attendees')
        .exec(function(err,session){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                session.leaveBehind = sent.leaveBehind;
                session.saveAsync().then(function(session){
                    console.log('success!');
                    if(session[0].leaveBehind){
                        console.log('sending leaveBehind emails');
                        sendFollowUp(session[0]);
                    }else{
                        console.log('no leaveBehind');
                    };
                    res.send('success');
                }).catch(function(err){
                    console.log(err);
                    res.send(err);
                });
            }
        });
});
//set archive
//set the archive attribute of the session 
session.put('/sessions/archive/:id',function(req,res){
    console.log("session archive by id");
    var sent = req.body;
    Session.findOne({_id:new ObjectId(req.params.id)})
        .populate('organizer attendees')
        .exec(function(err,session){
            if(err) {
                console.log("error! ",err);
                res.send(err);
            }else{
                session.archiveStatus = sent.archiveStatus;
                session.saveAsync().then(function(session){
                    console.log('success!');
                    res.send('success');
                }).catch(function(err){
                    console.log(err);
                    res.send(err);
                });
            }
        });
});
//resend invites
//resend the invites for this session 
session.put('/sessions/resend/:id',function(req,res){
    console.log("session resend invites for session_id: ",req.params.id);
    console.log('success! building invite...');
    sendTkInvites(req.params.id,false);
    console.log('done and sent');
    res.send('success');
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


