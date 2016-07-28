var express = require('express');
var revu = express.Router();
var moment = require('moment');
var nodemailer = require('nodemailer');
var volerroSender = 'activity@revu.me';
var transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user: volerroSender,
        pass: '1wL6AmFBpPom' 
    }
});


//send an email when the user starts a revu session
revu.post('/revu/start',function(req,res){
    console.log("revu: got start!");
    var session = req.body;
    var mail = {};
    var user = session.who;
    var msg = "";
    console.log(session);
    var dStr = moment(session.date);
    var tStr = moment(session.time);
    
    mail.to = session.organizer.email;
    mail.from = volerroSender;
    mail.subject = user.name+' is reviewing your meeting';
    
    msg += 'Meeting: '+session.name+'\n\n';
    msg += 'Date: '+dStr.format("MM-DD-YYYY")+'\n';
    msg += 'Time: '+tStr.format("hh:mm a")+'\n\n';
    msg += 'Attendees : \n';
    session.attendees.forEach(function(att){
        msg += att.firstName+' '+att.lastName+'\n';
    });
    
    msg += '\n';
    msg += user.name+' is online and reviewing your meeting now\n\n';
    
    mail.text = msg;
    console.log('/revu/start sending email',mail);
    transporter.sendMail(mail);
    res.send('success');
});

//send an email when the user starts a revu session
revu.post('/revu/end',function(req,res){
    console.log("revu: got end!");
    var session = req.body;
    var mail = {};
    var user = session.who;
    var msg = "";
    var dStr = moment(session.date);
    var tStr = moment(session.time);
    
    mail.to = session.organizer.email;
    mail.from = volerroSender;
    mail.subject = user.name+' has stopped reviewing your meeting';
    
    msg += 'Meeting: '+session.name+'\n';
    msg += 'Date: '+dStr.format("MM-DD-YYYY")+'\n';
    msg += 'Time: '+tStr.format("hh:mm a")+'\n\n';
    msg += 'Attendees : \n';
    session.attendees.forEach(function(att){
        msg += att.firstName+' '+att.lastName+'\n';
    });
    
    msg += '\n';
    msg += user.name+' is no longer online\n\n';
    msg +='You can see a report of '+user.name+'\'s visit here:\n'
    msg += session.baseUrl+'/#/app/sessions/'+session._id+'?uid='+session.organizer._id+'\n';
    msg += '...click on the \'report\' button.'
    
    mail.text = msg;
    transporter.sendMail(mail);
    res.send('success');
});

module.exports = revu;


