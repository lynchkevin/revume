'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
.factory('Session', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/sessions/:id';
    return $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}}
        });
}])
.factory('Sess', ['$resource','baseUrl',function ($resource, baseUrl) {
    var oTarget = baseUrl.endpoint+'/api/sessions/organizer/:id';
    var aTarget = baseUrl.endpoint+'/api/sessions/attendee/:id';
    var target = baseUrl.endpoint+'/api/sessions/:id';
    return {
        orgSessions: $resource(oTarget,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}},
            get:{method:'GET',  params:{id:'@id'}, isArray:true}
        }),
        attSessions: $resource(aTarget,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}},
            get:{method:'GET',  params:{id:'@id'}, isArray:true}
        }),
        sessions: $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}},
            get:{method:'GET',  params:{id:'@id'}, isArray:true}
        })
    };
}])

/* Session builder has two modal dialogs:
    deckModal - allows the user to pick decks to add to a session
    builderModal - allow the user to edit/build a session
    all functions that use these modals return a promise that resolves when the modal closes
    and rejects when the modal cancels
*/
    
.service('SessionBuilder', ['$rootScope',
                              'Session',
                              'Decks',
                              'userService',
                              '$ionicModal',
                              '$ionicPopup',
                              '$q', 
                              '$timeout',
                              'baseUrl',
function ($rootScope,Session,Decks,userService,$ionicModal,$ionicPopup,$q,$timeout,baseUrl) {
    var $ = this;
    var $user = userService.user;
    var lengthOptions = [30,60,90,120];
    var tz = jstz.determine();

    function initSession(session){
        session.decks=[];
        session.name = '';
        session.description = '';
        $.session.date=new Date;
        session.attendees=[];
        session.attIds=[];
        session.length = 60;
        session.lengthOptions = lengthOptions;
        session.time= '';
        session.bridge=false;
        session.invite=true;
        session.timeZone = tz.name();
        session.baseUrl = baseUrl.endpoint;
    };
    
    $.init=function($scope){
        $.session = {}
        $.session.scope=$scope;
        $.session.baseUrl = baseUrl.endpoint;
        $.builderCallback = function(){};
        $.deckCallback = function(){};
        $.defer = [];
        initSession($.session);
        //modal for selecting decks to add to session
        $ionicModal.fromTemplateUrl('templates/addDeckTemplate.html',{
            scope: $scope,
            animation:'slide-in-up'
        }).then(function(modal){
            $.deckModal = modal;
        //Modal for editing the session
            $ionicModal.fromTemplateUrl('templates/buildSession.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $.builderModal = modal;
        });  
        });
    };
    
    // A general purpose alert dialog
    function showAlert(msg) {
        var confirmPopup = $ionicPopup.alert({
        title: 'Build New Session',
        template: msg
        });
        
        return alertPopup;
    };
    //add a promise around a modal dialog
    $.show =function(modal){
        var p = $q.defer();
        $.defer.push(p);
        modal.show();
        return p.promise
    };

    //create a new session from scratch
    $.new = function(){
        //we need to populate the decks so the user can select one or more
        var defer = $q.defer();
        var decks = Decks.query();
        $.decks=[];
        $.session.decks=[];
        session.timeZone = tz.name();   
        session.baseUrl = baseUrl.endpoint;
        decks.$promise.then(function(decks){
            if(decks.length>0){
                $.decks = decks;
                $.decks.forEach(function(deck){
                    deck.added = false;
                });
                return $.show($.deckModal);
            }else{
                showAlert('No Decks Built Yet - Please Build one First');  
            };
        }).then(function(){
            $.deckModal.hide();
            $.session.date = new Date();
            $.session.lengthOptions = lengthOptions;
            return $.show($.builderModal);
        }).then(function(){
            return $.saveSession();
        }).then(function(){
            $.builderModal.hide();
            defer.resolve();
        }).catch(function(err){
            $.builderModal.hide();
            $.deckModal.hide();
            defer.reject(err);
            console.log(err);
        });    
        return defer.promise;   
    };
    
    //build a new session from a deck  
    $.build=function($index){
        var defer = $q.defer();
        initSession($.session);
        $.session.decks[0] = $.session.scope.navItems[$index];
        $.show($.builderModal).then(function(){
            return $.saveSession();
        }).then(function(){
            $.builderModal.hide();
            defer.resolve();
        }).catch(function(err){
            $.builderModal.hide();
            defer.reject(err);
        });
        return defer.promise;
    };
        
    //edit an existing session
    $.edit=function(session){
        var defer = $q.defer();
        //fix time and date
        var t = session.time;
        var d = session.date;
        session.time = new Date(t);
        session.date = new Date(d);
        session.timeZone = tz.name();
        session.baseUrl = baseUrl.endpoint;
        session.scope = $.session.scope;
        $.session = session;
        $.session.attIds=[];
        $.session.lengthOptions = lengthOptions;
        $.session.attendees.forEach(function(a){
            $.session.attIds.push(a._id);
            });
        $.show($.builderModal).then(function(){
            console.log('edit',$.defer);
            return $.updateSession();
        }).then(function(){
            $.builderModal.hide();
            defer.resolve();
        }).catch(function(err){
            console.log('edit cancel',$.defer);
            $.builderModal.hide();
            defer.reject(err);
        });
        return defer.promise;
    }; 
    
    //sub edit decks within edit window
    $.subEdit = function(){
    //we need to populate the decks so the user can select one or more
        var decks = Decks.query();
        $.decks=[];
        decks.$promise.then(function(decks){
            if(decks.length>0){
                $.decks = decks;
                $.decks.forEach(function(deck){
                    deck.added = false;
                });
                return $.show($.deckModal);
            }else{
                showAlert('No Decks Built Yet - Please Build one First');  
            };
        }).then(function(){
            console.log('subEdit', $.defer);
            $.deckModal.hide();
        }).catch(function(){
            console.log('subEdit reject',$.defer);
            $.deckModal.hide();
        });
    };
    //add a deck._id to the list of decks in the session
    $.addDeck = function($index){
        $.session.decks.push($.decks[$index]);
        try{
        $.decks[$index].added=true;
        }catch(e){};
    };
    //remove a deck._id from the list of decks in the session
    $.delDeck = function($index){
        $.session.decks.splice($index,1);
        try{//stop errors when nesting windows
        $.decks[$index].added=false;
        }catch(e){};
    };

    //add an attendee to the session    
    $.addAttendee = function(){
        var attendee = new Object();
        var _id = -1;
        var names = $.session.formname.split(' ');
        attendee.firstName = names[0];
        attendee.lastName = names[1];
        attendee.email = $.session.formemail;
        $user.byEmail.get({email:attendee.email}).$promise.then(function(user){
            if(user._id == undefined){
                var usr = new $user.collection;
                angular.extend(usr,attendee);
                usr.$save().then(function(id){
                    _id = id;
                    $.session.attendees.push(attendee);
                    $.session.attIds.push(_id);
                    $.session.formname='';
                    $.session.formemail='';
                }).catch(function(err){console.log(err)});
            }
            _id = user._id;
            $.session.attendees.push(attendee);
            $.session.attIds.push(_id);
            $.session.formname='';
            $.session.formemail='';
        }).catch(function(err){console.log(err)});     

    };
    //remove an attendee from the session
    $.delAttendee = function($index){
        $.session.attendees.splice($index,1);
        $.session.attIds.splice($index,1);
    };
    //update the session in the database
    $.updateSession = function(){
        var defer = $q.defer();
        var updateSession = {};
        angular.extend(updateSession,$.session);
        console.log('Update Session');
        //make sure we are sending only _ids
        updateSession.decks=[];
        $.session.decks.forEach(function(deck){
            updateSession.decks.push(deck._id);
        });
        updateSession.attendees = $.session.attIds;
        Session.update({id:$.session._id},updateSession).$promise.then(function(){
            defer.resolve();
        }).catch(function(err){
            defer.reject(err);
        });
        return defer.promise;
    };
    //save the session to the database
    $.saveSession=function(){
        var defer = $q.defer();
        var saveSession = new Session;
        angular.extend(saveSession,$.session);
        saveSession.decks = [];
        $.session.decks.forEach(function(deck){
            saveSession.decks.push(deck._id);
        });
        saveSession.attendees = $.session.attIds;
        saveSession.organizer = $rootScope.user._id;
        
        saveSession.$save().then(function(){
            defer.resolve();
        }).catch(function(err){
            defer.reject(err);
            console.log(err);
        });
        return defer.promise;
    };
    //remove a session from the database
    $.deleteSession = function(session){
        Sess.session.delete({id:session._id});
    };
        

    //should be called from the owning scope to clean up
    $.destroy = function(){
        $.popover.remove();
        $.builderModal.remove();
    };
  }]);