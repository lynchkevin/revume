var Promise = require('bluebird');
var volerroSender = 'volerro@volerro.com';
var nodemailer = require('nodemailer');
var emailEndpoint = process.env.BASE_URL+'/#/app/confirmEmail';
var signInEndpoint = process.env.BASE_URL+'/#/app/signin';
var transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user: volerroSender,
        pass: 'x2NhP1DC' 
    }
});

var confirmEmail = function(){
    var  confirmEmail = this;
    
    confirmEmail.send = function(user){
            var mail = {};
            mail.from = volerroSender; //invitation@volerro.com
            mail.to = user.email;
            mail.subject = 'Email Confirmation' 
            mail.text = 'Hello '+user.firstName+'\n\r';
            mail.text = mail.text.concat('Welcome to Revu.Me! \n\r');
            mail.text = mail.text.concat('Please Click this Link to Confirm Your Email: '+emailEndpoint+'/'+user._id+'\n\r');
            mail.text = mail.text.concat('\n\r');
            mail.text = mail.text.concat('Best, \n\r The Revu.Me team');
            transporter.sendMail(mail);
    };
    
    confirmEmail.resetPassword = function(user,randomPassword){
            console.log('pwResetMailer: user: ',user,' pw: ',randomPassword);
            var mail = {};
            mail.from = volerroSender; //invitation@volerro.com
            mail.to = user.email;
            mail.subject = 'Reset RevuMe Password' 
            mail.text = 'Hello '+user.firstName+'\n\r';
            mail.text = mail.text.concat('You requested we reset your password \n\r\n\r');
            mail.text = mail.text.concat('Your Temporary Password is: '+randomPassword+' \n\r');
            mail.text = mail.text.concat('Please Click this link to sign in: '+signInEndpoint+'\n\r');
            mail.text = mail.text.concat('\n\r');
            mail.text = mail.text.concat('Remember to reset your password!\n\r\n\r');        
            mail.text = mail.text.concat('Best, \n\r The Revu.Me team');
            console.log(mail.text);
            transporter.sendMail(mail);
    };
    
   
    return confirmEmail;
}
    

module.exports = confirmEmail();
