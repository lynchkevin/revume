'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # reviewCtl
 * Controller for Revu.me - leave behind viewer
 */
angular.module('RevuMe')
  .service('introContent',['$rootScope','Session','Users','UploadedFiles','Decks','Teams','baseUrl','$q',
function ($rootScope, Session, Users, Ufiles, Decks, Teams,baseUrl,$q) {
    var $ = this;
    
    function fixTime(session){
        console.log('offset before fix: ',session.time.getTimezoneOffset());
        session.time.setDate(session.date.getDate());
        session.time.setMonth(session.date.getMonth());
        session.time.setFullYear(session.date.getFullYear());
        session.offset = new Date().getTimezoneOffset();
        console.log('offset after fix: ',session.time.getTimezoneOffset());
    };
    
    $.addFile = function(userId,superUser){
        var defer = $q.defer();
        var newFile = new Ufiles;
        var introFile = {};
        //get example File - Make Copy Set User and Save
        Ufiles.query({user:superUser._id, name:'Getting Started.pptx'}).$promise.then(function(items){
        //Ufiles.get({id:'55b14fa197445708d20edb6f'}).$promise.then(function(refFile){
            var refFile = items[0];
            introFile = refFile;
            newFile.name = refFile.name;
            newFile.user = {_id:userId};
            newFile.isArchived = false;
            newFile.slides =[];
            newFile.thumb = refFile.thumb;
            return newFile.$save();
        }).then(function(result){
            newFile._id = result._id;
            introFile.slides.forEach(function(slide){
                newFile.slides.push(slide);
            });
            return Ufiles.update({id:newFile._id},newFile).$promise;
        }).then(function(updated){
            defer.resolve(updated);
        });
        return defer.promise;
    };
        
    $.addDeck = function(userId,superUser){
        var defer = $q.defer();
        var newDeck = new Decks;
        var introDeck = {};
        //get example File - Make Copy Set User and Save
        //get example File - Make Copy Set User and Save
        Ufiles.query({user:superUser._id, name:'Getting Started.pptx'}).$promise.then(function(items){
        //Ufiles.get({id:'55b14fa197445708d20edb6f'}).$promise.then(function(file){
        var file = items[0];
        introDeck = file;
        newDeck.name = introDeck.name;
        newDeck.user = {_id:userId};
        newDeck.isArchived = false;
        newDeck.slides =[];
        newDeck.thumb = introDeck.thumb;
        return newDeck.$save();
        }).then(function(result){
            newDeck._id = result._id;
            introDeck.slides.forEach(function(slide){
                newDeck.slides.push(slide);
            });
            return Decks.update({id:newDeck._id},newDeck).$promise;
        }).then(function(updated){
            defer.resolve(updated);
        });
        return defer.promise;
    };
          
    $.addMeeting = function(userId,deckId){
        var defer = $q.defer();
        var tz = jstz.determine();
        var session = new Session;
        session.decks=[];
        session.decks.push(deckId);
        session.timeZone = tz.name();   
        session.baseUrl = baseUrl.endpoint;  
        session.date = new Date();
        session.time = session.date;
        session.time.setMilliseconds(0);
        session.time.setSeconds(0);
        session.bridge = true;
        session.invite = false;
        session.offset = new Date().getTimezoneOffset();
        session.showTeams = false;
        session.length = 30;
        session.name = 'Example Meeting'
        session.description = 'Show Meeting Features';
        session.attendees = [];
        session.attendees.push(userId);
        session.organizer = userId;
        fixTime(session);
        session.$save().then(function(){
            defer.resolve();
        }).catch(function(err){
            defer.reject(err);
            console.log(err);
        });
        return defer.promise;
    };
                 
    $.addTeam = function(userId,deckId){
        var defer = $q.defer();
        var newTeam = new Teams;
        var m = {};
        newTeam.name = 'Example Team';
        // push the new user as the team admin
        newTeam.members = [];
        newTeam.members.push({user:userId,role:'Admin'});
        // push fictitious members
        m.firstName = 'Jane';
        m.lastName = 'Doe';
        m.email = 'jdoe@volerro.com';
        m.role = 'Viewer';
        Users.byEmail.get({email:m.email}).$promise.then(function(user){
            newTeam.members.push({user:user._id,role:'Viewer'});
            var member = {};
            member.firstName = 'Fred';
            member.lastName = 'Smith';
            member.email = 'fsmith@volerro.com';
            member.role = 'Viewer';
            return Users.byEmail.get({email:member.email}).$promise;
        }).then(function(user){
            newTeam.members.push({user:user._id,role:'Viewer'});
            return newTeam.$save();
        }).then(function(){
            defer.resolve();
        });
        return defer.promise;
    };
    
    $.addIntroContent = function(userId){
        var defer = $q.defer();
        var superUser = {};
        
        Users.byEmail.get({email:'klynch@volerro.com'}).$promise.then(function(user){
            superUser = user;
        //add new file
            return $.addFile(userId,superUser);
        }).then(function(file){
            //Make a new deck from the file - Set User and Save
            return $.addDeck(userId,superUser);
        }).then(function(deck){
            //Make a new meeting from the deck
            return $.addMeeting(userId,deck._id);
        }).then(function(){
            //add a team
            return $.addTeam(userId);
        }).then(function(){
            defer.resolve();
        }).catch(function(err){
            console.log('addIntroContent: error: ',err);
        });
            
        return defer.promise;
    }
    
  }]);
