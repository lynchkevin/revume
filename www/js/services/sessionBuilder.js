'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
.factory('Session', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/sessions/:id';
    return $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}}
        });
}])
.factory('Sess', ['$resource','baseUrl','$rootScope',function ($resource, baseUrl,$rootScope) {
    var oTarget = baseUrl.endpoint+'/api/sessions/organizer/:id';
    var aTarget = baseUrl.endpoint+'/api/sessions/attendee/:id';
    var target = baseUrl.endpoint+'/api/sessions/:id';
    var lbTarget = baseUrl.endpoint+'/api/sessions/setLB/:id';
    var archiveTarget = baseUrl.endpoint+'/api/sessions/archive/:id';
    var inviteTarget = baseUrl.endpoint+'/api/sessions/resend/:id'
    return {
        orgSessions: $resource(oTarget,
        {id:'@id',isArchived:'@isArchived'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}},
            get:{method:'GET',  params:{id:'@id',isArchived:'@isArchived'}, isArray:true}
        }),
        attSessions: $resource(aTarget,
        {id:'@id',isArchived:'@isArchived'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}},
            get:{method:'GET',  params:{id:'@id',isArchived:'@isArchived'}, isArray:true}
        }),
        sessions: $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}},
            get:{method:'GET',  params:{id:'@id'}, isArray:true}
        }),
        leaveBehind: $resource(lbTarget,
        {id:'@id'},
        {   update: {method:'PUT', params:{id:'@id'}}
        }),
        archive: $resource(archiveTarget,
        {id:'@id'},
        {   update: {method:'PUT', params:{id:'@id'}}
        }),
        invite: $resource(inviteTarget,
        {id:'@id'},
        {   update: {method:'PUT', params:{id:'@id'}}
        })
    };
}])

/* Session builder has a modal dialog:
    builderModal - allow the user to edit/build a session
    all functions that use these modals return a promise that resolves when the modal closes
    and rejects when the modal cancels
*/
    
.service('SessionBuilder', ['$rootScope',
                              'Session',
                              'Decks',
                              'UploadedFiles',
                              'userService',
                              '$ionicModal',
                              '$ionicPopup',
                              '$q', 
                              '$timeout',
                              'baseUrl',
                              'TeamService',
                              'shareMediator',
                              'Library',
function ($rootScope,Session,Decks,UploadedFiles,userService,$ionicModal,
           $ionicPopup,$q,$timeout,baseUrl,TeamService,shareMediator,Library) {
    var $ = this;
    var $user = userService.user;
    var lengthOptions = [30,60,90,120];
    var tz = jstz.determine();
    Decks.modelName = 'decks';
    UploadedFiles.modelName = 'files';
    
    function initSession(){
        var deferred = $q.defer();
        $.session.decks=[];
        $.session.name = '';
        $.session.description = '';
        $.session.date=new Date;
        $.session.attendees=[];
        $.session.attIds=[];
        $.session.length = 60;
        $.session.lengthOptions = lengthOptions;
        $.session.time= $.session.date;
        $.session.time.setMilliseconds(0);
        $.session.time.setSeconds(0);
        $.session.bridge=true;
        $.session.invite=true;
        $.session.timeZone = tz.name();
        $.session.baseUrl = baseUrl.endpoint;
        $.session.offset = new Date().getTimezoneOffset();
        $.session.showTeams = false;
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $.session.teamList = teams;
            if($.session.teamList.length >0)
                $.session.team = $.session.teamList[0];
            deferred.resolve();
        });
        return deferred.promise;
    };
    
    $.setScope = function($scope){
        $.scope = $scope;
    };
    
    $.Library = Library;
    $.init=function($scope){
        var deferred = $q.defer();
        var oldScope = $.scope;
        $.session = {}
        $.scope=$scope;
        // add the library to the scope
        // New on Dec 27 2015
        if($.scope.library == undefined){
            $.scope.library = Library;
            Library.init($.scope);
        } else {
            Library.scope = $scope;
        }
        //end new
        $.showTeams = false;
        $.session.baseUrl = baseUrl.endpoint;
        $.builderCallback = function(){};
        $.deckCallback = function(){};
        $.defer = [];
        initSession().then(function(){
            $ionicModal.fromTemplateUrl('templates/addDeckTemplate.html',{
                scope: $.scope,
                animation:'slide-in-up'
            }).then(function(modal){
                $.deckModal = modal;
                deferred.resolve();
            });  
        });
        return deferred.promise;
    };
    
    // A general purpose alert dialog
    function showAlert(msg) {
        var alertPopup = $ionicPopup.alert({
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

    $.processUpload = function(){
        shareMediator.getItems(UploadedFiles).then(function(files){
            if(files.length > 0){
                var file = files[0];
                Library.newDeckFromFile(file).then(function(deck){
                    var d = deck;
                    $timeout(function(deck){
                        $.decks.unshift(d);
                    },0);
                });
            }
        });
    };
    
    $.loadDecks = function(){
        var deferred = $q.defer();
        $rootScope.showLoading();
        shareMediator.getItems(Decks).then(function(decks){
            $rootScope.hideLoading();
            if(decks.length>0){
                $.decks = decks;
                $.decks.forEach(function(deck){
                    deck.added = false;
                });
                deferred.resolve($.decks);
            }else{
                showAlert('No Decks Built Yet - Please Build one First'); 
                deferred.resolve(undefined);
            };
        });
        return deferred.promise;
    }
    $.connect = function(){
        if($.ucEvent == undefined)
            $.ucEvent = Library.$on('uploadComplete',$.processUpload);
        return Library;
    }
    $.disconnect = function(){
        if($.ucEvent!=undefined)
            $.ucEvent = Library.$off($.ucEvent);
    }
    //create a new session from scratch
    
     $.new = function(){
        //we need to populate the decks so the user can select one or more
        var defer = $q.defer();
        $.decks=[];
        $.session.decks=[];
        $.session.timeZone = tz.name();   
        $.session.baseUrl = baseUrl.endpoint;
        return $.session;
    };
   
    $.build=function(navItem){
        $.session.decks[0] = navItem;
        $.session.timeZone = tz.name();   
        $.session.baseUrl = baseUrl.endpoint;
        return $.session;
    };
        
    // edit
    $.edit=function(session){
        var defer = $q.defer();
        //add the team list - new 1/2/2016
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $.session.teamList = teams;
            if($.session.teamList.length >0)
                $.session.team = $.session.teamList[0];
            defer.resolve();
        });
        //fix time and date
        var t = session.time;
        var d = session.date;
        session.time = new Date(t);
        session.date = new Date(d);
        session.timeZone = tz.name();
        session.baseUrl = baseUrl.endpoint;
        $.session = angular.copy(session);
        $.session.attIds=[];
        $.session.lengthOptions = lengthOptions;
        $.session.attendees.forEach(function(a){
            $.session.attIds.push(a._id);
        });
        return defer.promise;
    }
    //sub edit decks within edit window
    $.subEdit = function($scope){
    //we need to populate the decks so the user can select one or more
        var deferred = $q.defer();
        $rootScope.showLoading();
        $.decks=[];
        shareMediator.getItems(Decks).then(function(decks){
            if(decks.length==0){
                showAlert('No Decks Built Yet - Please Build or Upload One First'); 
            } else {
                $.decks = decks;
                $.decks.forEach(function(deck){
                    deck.added = false;
                });
                //if deckmodal was shown it will be behind the builder modal
                //so we have to remove it.
                return $.deckModal.remove();
            }
        }).then(function(){
            return $ionicModal.fromTemplateUrl('templates/addDeckTemplate.html',{
                scope: $scope,
                animation:'slide-in-up'
            });
        }).then(function(modal){
                $.deckModal = modal;  
                // attach to the library upload complete event - in case the user uploads a file
                $.connect();
                $rootScope.hideLoading();
                return $.show($.deckModal);
        }).then(function(){
            console.log('subEdit', $.defer);
            // disconnect from the upload event
            $.deckModal.hide();
            deferred.resolve();
        }).catch(function(){
            $rootScope.hideLoading();
            console.log('subEdit reject',$.defer);
            $.deckModal.hide();
            deferred.reject();
        });
        return deferred.promise;
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
    $.addAttendee = function(a){
        var deferred = $q.defer();
        var attendee = new Object();
        var _id = -1;
        attendee = a;
        $user.byEmail.get({email:attendee.email}).$promise.then(function(user){
            if(user._id == undefined){
                var usr = new $user.byId;
                angular.extend(usr,attendee);
                usr.$save().then(function(usr){
                    _id = usr._id;
                    $.session.attendees.push(attendee);
                    $.session.attIds.push(_id);
                    $.session.formname='';
                    $.session.formemail='';
                    deferred.resolve();
                }).catch(function(err){
                    deferred.reject();
                    console.log(err)
                });
            }else{
                _id = user._id;
                $.session.attendees.push(attendee);
                $.session.attIds.push(_id);
                $.session.formname='';
                $.session.formemail='';
                deferred.resolve();
            }
        }).catch(function(err){
            deferred.reject();
            console.log(err)
        });     
        return deferred.promise;
    };
    //remove an attendee from the session
    $.delAttendee = function($index){
        $.session.attendees.splice($index,1);
        $.session.attIds.splice($index,1);
    };
    $.addTeam = function($index){
        if($index == undefined){
            var team = $.session.team;
            team.members.forEach(function(member){
                $.session.attendees.push(member);
                $.session.attIds.push(member._id);
            });
        }else if($index < $.session.teamList.length){
            var team = $.session.teamList[$index];
            team.members.forEach(function(member){
                $.session.attendees.push(member);
                $.session.attIds.push(member._id);
            });
        }
    }
    function find(member){
        var foundIdx = -1;
        var idx = 0;
        $.session.attendees.forEach(function(a){
            if(a._id == member._id)
                foundIdx = idx
        });
        return foundIdx;
    }
    $.removeTeam = function($index){
        if($index < $.session.teamList.length){
            var team = $.session.teamList[$index]
            team.members.forEach(function(member){
                var idx = find(member);
                if(idx>=0)
                    $.delAttendee(idx)
            })
        }
    }
    //fix the time
    function fixTime(session){
        console.log('offset before fix: ',session.time.getTimezoneOffset());
        session.time.setDate(session.date.getDate());
        session.time.setMonth(session.date.getMonth());
        session.time.setFullYear(session.date.getFullYear());
        session.offset = new Date().getTimezoneOffset();
        console.log('offset after fix: ',session.time.getTimezoneOffset());
    }
    //update the session in the database
    $.updateSession = function(){
        var defer = $q.defer();
        var updateSession = {};
        angular.extend(updateSession,$.session);
        fixTime(updateSession);
        console.log('Update Session');
        //make sure we are sending only _ids
        updateSession.decks=[];
        $.session.decks.forEach(function(deck){
            updateSession.decks.push(deck._id);
        });
        updateSession.attendees = $.session.attIds;
        Session.update({id:$.session._id},updateSession).$promise.then(function(){
            defer.resolve($.session);
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
        fixTime(saveSession);
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
        $.builderModal.remove();
        $.deckModal.remove();
    };
  }]);