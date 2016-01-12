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

/* Session builder has two modal dialogs:
    deckModal - allows the user to pick decks to add to a session
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
                              'wizardService',
function ($rootScope,Session,Decks,UploadedFiles,userService,$ionicModal,
           $ionicPopup,$q,$timeout,baseUrl,TeamService,shareMediator,Library,wizardService) {
    var $ = this;
    var $user = userService.user;
    var lengthOptions = [30,60,90,120];
    var tz = jstz.determine();
    Decks.modelName = 'decks';
    UploadedFiles.modelName = 'files';
    
    function initSession(){
        if($.sessionForm != undefined)
            $.sessionForm.$setPristine();
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
        $.session.bridge=false;
        $.session.invite=true;
        $.session.timeZone = tz.name();
        $.session.baseUrl = baseUrl.endpoint;
        $.session.offset = new Date().getTimezoneOffset();
        $.session.showTeams = false;
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $.session.teamList = teams;
            if($.session.teamList.length >0)
                $.session.team = $.session.teamList[0];
        });
    };
    
    $.setScope = function($scope){
        $.scope = $scope;
    };
    
    $.init=function($scope){
        var deferred = $q.defer();
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
        $.ucEvent = undefined;
        initSession();
        //modal for selecting decks to add to session
        $ionicModal.fromTemplateUrl('templates/addDeckTemplate.html',{
            scope: $.scope,
            animation:'slide-in-up'
        }).then(function(modal){
            $.deckModal = modal;
        //Modal for editing the session
            return $ionicModal.fromTemplateUrl('templates/buildSession.html', 
                                               {scope: $.scope, animation: 'slide-in-up'});
        }).then(function(modal) {
            $.builderModal = modal;
            deferred.resolve();
        });         
        $.scope.datepickerObject = {
          titleLabel: 'Title',  //Optional
          todayLabel: 'Today',  //Optional
          closeLabel: 'Close',  //Optional
          setLabel: 'Set',  //Optional
          setButtonType : 'button-dark',  //Optional
          todayButtonType : 'button-stable',  //Optional
          closeButtonType : 'button-assertive',  //Optional
          inputDate: new Date(),  //Optional
          mondayFirst: true,  //Optional
          templateType: 'popup', //Optional
          showTodayButton: 'true', //Optional
          modalHeaderColor: 'bar-positive', //Optional
          modalFooterColor: 'bar-positive', //Optional
          from: new Date(2012, 8, 2), //Optional
          to: new Date(2018, 8, 25),  //Optional
          callback: function (val) {  //Mandatory
            if(val != undefined){
                $.scope.datepickerObject.inputDate = val;
                $.session.date = val;
                $.sessionForm.$setDirty();
            }
          },
          dateFormat: 'dd-MM-yyyy', //Optional
          closeOnSelect: false, //Optional
        };
        $.scope.timePickerObject = {
          inputEpochTime: ((new Date()).getHours() * 60 * 60),  //Optional
          step: 15,  //Optional
          format: 12,  //Optional
          titleLabel: '12-hour Format',  //Optional
          setLabel: 'Set',  //Optional
          closeLabel: 'Close',  //Optional
          setButtonType: 'button-positive',  //Optional
          closeButtonType: 'button-stable',  //Optional
          callback: function (val) {    //Mandatory
            if(val!=undefined){
                $.scope.timePickerObject.inputEpochTime = val;
                var hours = Math.trunc(val/3600);
                var minutes = (val-(hours*3600))/60;
                $.session.time = $.session.date;
                $.session.time.setHours(hours);
                $.session.time.setMinutes(minutes);
                $.session.time.setSeconds(0);
                $.session.time.setMilliseconds(0);
                $.sessionForm.$setDirty();
            }
          }
        };
        wizardService.init($.scope);
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
                // attach to the library upload complete event - in case the user uploads a file
                $.connect();
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
        
        //start the wizard
        wizardService.run($.session)
        .then(function(result){
            if(result.success){
                $.saveSession().then(function(){
                    defer.resolve();
                });   
            }else{
                defer.resolve();
            }
        }).catch(function(err){
            defer.reject(err);
            console.log(err);
        });    
        return defer.promise;   
    };
    /*
     $.new = function(){
        //we need to populate the decks so the user can select one or more
        var defer = $q.defer();
        $.decks=[];
        $.session.decks=[];
        $.session.timeZone = tz.name();   
        $.session.baseUrl = baseUrl.endpoint;
        shareMediator.getItems(Decks).then(function(decks){
            $rootScope.hideLoading();
            if(decks.length>0){
                $.decks = decks;
                $.decks.forEach(function(deck){
                    deck.added = false;
                });
                // attach to the library upload complete event - in case the user uploads a file
                if($.ucEvent == undefined)
                    $.ucEvent = Library.$on('uploadComplete',$.processUpload);
                return $.show($.deckModal);
            }else{
                showAlert('No Decks Built Yet - Please Build one First');  
            };
        }).then(function(){
            $.deckModal.hide();
            // disconnect from the upload event
            if($.ucEvent!=undefined)
                $.ucEvent = Library.$off($.ucEvent);
            $.session.date = new Date();
            $.session.time = $.session.date;
            $.scope.timePickerObject.inputEpochTime = ($.session.time.getHours() * 3600);
            $.session.lengthOptions = lengthOptions;
            return $.show($.builderModal);
        }).then(function(){
            return $.saveSession();
        }).then(function(){
            $.builderModal.hide();
            defer.resolve();
        }).catch(function(err){
            $rootScope.hideLoading();
            $.builderModal.hide();
            $.deckModal.hide();
            if($.ucEvent != undefined)
                $.ucEvent = Library.$off($.ucEvent);
            defer.reject(err);
            console.log(err);
        });    
        return defer.promise;   
    };
    */
    //build a new session from a deck  
    $.build=function(navItem){
        var defer = $q.defer();
        $.session.decks[0] = navItem;
        $.scope.timePickerObject.inputEpochTime = ((new Date()).getHours() * 3600);
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
        //add the team list - new 1/2/2016
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $.session.teamList = teams;
            if($.session.teamList.length >0)
                $.session.team = $.session.teamList[0];
        });
        //fix time and date
        var t = session.time;
        var d = session.date;
        session.time = new Date(t);
        session.date = new Date(d);
        session.timeZone = tz.name();
        session.baseUrl = baseUrl.endpoint;
        $.session = angular.copy(session);
        $.scope.datepickerObject.inputDate = session.date;
        $.scope.timePickerObject.inputEpochTime = ($.session.time.getHours() * 3600)+($.session.time.getMinutes()*60);
        $.session.attIds=[];
        $.session.lengthOptions = lengthOptions;
        $.session.attendees.forEach(function(a){
            $.session.attIds.push(a._id);
            });
        $.show($.builderModal).then(function(){
            console.log('edit',$.defer);
            return $.updateSession();
        }).then(function(updated){
            $.builderModal.hide();
            defer.resolve(updated);
        }).catch(function(err){
            if($.sessionForm.$dirty || ($.session.attendees.length != session.attendees.length)){
                var confirm = $ionicPopup.confirm({
                    title:'Unsaved Changes',
                    template:'Do you want to save your changes?'
                });
                confirm.then(function(res){
                    if(res){
                        $.updateSession().then(function(updated){
                            console.log('Changes saved after cancel');
                            $.builderModal.hide();
                            defer.resolve(updated);
                        });
                    } else {
                        console.log('Changes were denied');
                        $.builderModal.hide();
                        defer.reject();
                    }
                });
            }else{
                console.log('edit cancel',$.defer);
                $.builderModal.hide();
                defer.reject(err);
            }
        });
        return defer.promise;
    }; 
    
    //sub edit decks within edit window
    $.subEdit = function(){
    //we need to populate the decks so the user can select one or more
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
                scope: $.scope,
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
            $.disconnect();
            $.deckModal.hide();
        }).catch(function(){
            $rootScope.hideLoading();
            console.log('subEdit reject',$.defer);
            $.disconnect();
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
    $.addAttendee = function(a){
        var attendee = new Object();
        var _id = -1;
        if(a == undefined){
            var names = $.session.formname.split(' ');
            attendee.firstName = names[0];
            attendee.lastName = names[1];
            attendee.email = $.session.formemail;
        }else
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
                }).catch(function(err){console.log(err)});
            }else{
            _id = user._id;
            $.session.attendees.push(attendee);
            $.session.attIds.push(_id);
            $.session.formname='';
            $.session.formemail='';
            }
        }).catch(function(err){console.log(err)});     

    };
    //remove an attendee from the session
    $.delAttendee = function($index){
        $.session.attendees.splice($index,1);
        $.session.attIds.splice($index,1);
    };
    $.addTeam = function(){
        $.session.team.members.forEach(function(member){
            $.session.attendees.push(member);
            $.session.attIds.push(member._id);
        });
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