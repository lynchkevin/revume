'use strict';

/**
 */
angular.module('RevuMe')
//show all sessions - split into those I organized and those I'm an attendee
.controller('SessionsCtrl',['$scope',
                            '$rootScope',
                            'Sess', 
                            'Decks',
                            '$ionicListDelegate',  
                            '$ionicNavBarDelegate',
                            '$ionicPopup',
                            'wizardService',
                            '$state',
                            '$timeout',
                            'ionicToast',
                            
function($scope, $rootScope,Sess,Decks,$ionicListDelegate,$ionicNavBarDelegate,
          $ionicPopup,wizardService,$state,$timeout,ionicToast) {

    $scope.titles = {};
       
    $scope.init = function(){
        //make sure back button is enabled
        $ionicNavBarDelegate.showBackButton(true);
        var _id = $rootScope.user._id;
        $scope.setTitles();
        $scope.action = {selected:$scope.actions[0]};
        if(_id != undefined){
            Sess.orgSessions.get({id:_id,isArchived:$rootScope.archiveOn()})
            .$promise.then(function(os){
                $scope.orgSessions = os;
                return Sess.attSessions.get({id:_id,isArchived:$rootScope.archiveOn()}).$promise;
            }).then(function(as){
                $scope.attSessions = as;
                $scope.bridge = {};
            }).catch(function(err){
                console.log(err);
            });
        };

    };

    $scope.doRefresh = function(){
        var _id = $rootScope.user._id;
        $scope.checkArchive();
        if(_id != undefined){
            Sess.orgSessions.get({id:_id,isArchived:$rootScope.archiveOn()}).$promise.then(function(os){
                $scope.orgSessions = os;
                return Sess.attSessions.get({id:_id,isArchived:$rootScope.archiveOn()}).$promise;
            }).then(function(as){
                $scope.attSessions = as;
                $scope.$broadcast('scroll.refreshComplete');
            });
            
        };
    };
       
    $scope.go = function(id){
        $state.transitionTo('app.session', {id:id});
    }
    
    $scope.toggleListDelete = function(which){
      if($ionicListDelegate.$getByHandle(which).showDelete())
        $ionicListDelegate.$getByHandle(which).showDelete(false);
      else
        $ionicListDelegate.$getByHandle(which).showDelete(true);
    };
        
    // A confirm delete dialog
    function showConfirm(filename) {
        var confirmPopup = $ionicPopup.confirm({
        title: 'Delete '+filename,
        template: 'Are you sure to delete this?'
        });
        
        return confirmPopup;
    };
    
    $scope.delOrgSession = function(idx){
        var filename = $scope.orgSessions[idx].name;
        showConfirm(filename).then(function(res){
            if(res){
                var _id = $scope.orgSessions[idx]._id;
                Sess.sessions.delete({id:_id});
                $scope.orgSessions.splice(idx,1);
                ionicToast.show('Meeting has been deleted','top',false,2000);
            }
        });
    };
    $scope.delAttSession = function(idx){
        var filename = $scope.attSessions[idx].name;
        showConfirm(filename).then(function(res){
            if(res){
                var _id = $scope.attSessions[idx]._id;
                Sess.sessions.delete({id:_id});
                $scope.attSessions.splice(idx,1);
                ionicToast.show('Meeting has been deleted','top',false,2000);
            }
        });
    };
    
    $scope.editSession = function(idx){
        var _id = $scope.orgSessions[idx].decks[0]._id;
        Decks.get({id:_id}).$promise.then(function(deck){
            if(deck._id!= undefined){
                $scope.orgSessions[idx].decks[0] = deck;
            }
            return wizardService.edit($scope,$scope.orgSessions[idx]);
        }).then(function(){
            $scope.doRefresh();
        }).catch(function(){
            console.log('Edit Canceled');
        })
    };
    
    $scope.newSession = function(){
        wizardService.new($scope).then(function(){
            $scope.doRefresh();
        }).catch(function(){
            console.log('New Cancelled')
        });
    };
    
    $scope.markArchive = function(idx){
        //if this gets called normally - it will set archive true
        //if this is called when archive view is active this will set to false;
        var user = $rootScope.user;
        var _id = $scope.orgSessions[idx]._id;
        $scope.orgSessions[idx].archiveStatus.forEach(function(stat){
            if(stat.id == user._id)
                stat.isArchived = !$rootScope.archiveOn();
        });
        Sess.archive.update({id:_id},$scope.orgSessions[idx]).$promise.then(function(){
            $scope.doRefresh();
            var archiveText = $rootScope.archiveOn() ? 'unarchived' : 'archived';
            var text = 'Your Meeting has been '+archiveText;
            ionicToast.show(text,'top',false,2000);
        });
    };
    
    $scope.markAttArchive = function(idx){
        var user = $rootScope.user;
        var _id = $scope.attSessions[idx]._id;
        $scope.attSessions[idx].archiveStatus.forEach(function(stat){
            if(stat.id == user._id)
                stat.isArchived = !$rootScope.archiveOn();
        });
        Sess.archive.update({id:_id},$scope.attSessions[idx]).$promise.then(function(){
            $scope.doRefresh();
            var archiveText = $rootScope.archiveOn() ? 'unarchived' : 'archived';
            var text = 'Your Meeting has been '+archiveText;
            ionicToast.show(text,'top',false,2000);
        });
    }
        
    $scope.actions = [{name:'Options',callback:{}},
                      {name:'Edit',callback:$scope.editSession},
                      {name:'Archive',callback:$scope.markArchive}
                     ];
     $scope.doAction = function(idx){
         var action = $scope.action.selected;
         console.log('Session doAction: ',action);
         action.callback(idx);
         
         $scope.action.selected = $scope.actions[0];
    }
    $scope.checkArchive = function(){
        if($rootScope.archiveOn())
            $scope.actions[2].name = 'UnArchive';
        else
            $scope.actions[2].name = 'Archive';
    }
    $scope.setTitles = function(){
        if($rootScope.archiveOn()){
           $scope.titles.organizer = 'Your ARCHIVED Meetings';
           $scope.titles.attendee = 'Your ARCHIVED Invitations';
        } else {
            $scope.titles.organizer ='Your Meetings';
            $scope.titles.attendee = 'Your Invitations';
        }
    };
    $scope.init();
    //reinialize whem the userID is set
    $scope.$on('userID',function(event,user){
        $scope.init();
    });
    //only listen if we are the new meeting controller
    if($state.current.name == 'app.newMeeting'){
        $scope.$on('$stateChangeSuccess',
            function(event,toState,toParams,fromState,fromParams){
                if(toState.name == 'app.newMeeting' && $rootScope.user._id != undefined)
                    $timeout(function(){
                        $scope.newSession();
                    },50);
            }
        );
    }
    //catch when we have hit new meeting from the main menu but only do it from the new meeting state
 
    if($state.current.name == 'app.newMeeting'){
        $scope.$on('Revu.Me:NewMeeting',function(){
            $scope.newSession();
        });
    }
    $scope.$on('Revu.Me:Archive',function(event){
        //close the delete button
        if($ionicListDelegate.$getByHandle('att').showDelete())
            $ionicListDelegate.$getByHandle('att').showDelete(false);
                //close the delete button
        if($ionicListDelegate.$getByHandle('org').showDelete())
            $ionicListDelegate.$getByHandle('org').showDelete(false);
        $scope.checkArchive();
        $scope.init();
    });
    // refresh when transitioning into the state
    $rootScope.$on('$stateChangeStart', function(event,toState,toParams,fromState,fromParams){
        if(toState.name == 'app.session' || toState.name != 'app.attendeeSessions'){
            $scope.doRefresh();
        };
    });
}])

.controller('SessionCtrl', ['$scope',
                            '$rootScope',
                            '$stateParams',
                            'Sess',
                            'session',
                            'Decks',
                            'presAnalyzer',
                            '$ionicModal',
                            '$ionicPopup',
                            '$state', 
                            'BridgeService',
                            '$timeout',
                            'wizardService',
                            'ionicToast',
                            'baseUrl',
function($scope,$rootScope, $stateParams,Sess,session, Decks,
          presAnalyzer,$ionicModal,$ionicPopup,$state,BridgeService,$timeout,wizardService,ionicToast,baseUrl) {
    // set the bridge service in the scope so it can be accessed directly
    $scope.bridgeService = BridgeService;
    // session is now resolved in the state transition
    $scope.session = session;
    $scope.baseUrl = baseUrl;
    $scope.meetingUrl = $scope.baseUrl.endpoint+'/#/app/session/'+session._id;
    
    $scope.init = function(){
        if(session._id != undefined){
            // next 2 lines are new
            $scope.activeMeeting = false;
            $scope.bridgeService.findBridge($scope.session.ufId)
            $scope.session.confId = $scope.session.ufId.replace(/-/g,'');
            $scope.loadReports();
        }   
    };
    
    $scope.loadReports = function(){
        if($scope.session.decks.length>0){
            var sid = $scope.session._id;
            $scope.deckIdx = 0;
            $scope.reportsEnabled = [];
            for(var i=0; i< $scope.session.decks.length;i++){
                var did = $scope.session.decks[i]._id;
                presAnalyzer.get(sid,did).then(function(results){
                    if(results.length>0)
                        $scope.reportsEnabled.push(true);
                    else
                        $scope.reportsEnabled.push(false);
                }).catch(function(err){console.log(err)});
            }
        }
    }
        
    $scope.editSession = function(){
        wizardService.edit($scope,$scope.session)
        .then(function(updated){
            $scope.session = updated;
        }).catch(function(){
            console.log('Edit Canceled');
        });
    }
    //create a handy dialer for mobile users
    $scope.handyDial = function(){
        var confId = $scope.session.ufId.replace(/-/g,'');
        var dialStr = $scope.session.bridgeNumber+',,,'+confId+'#';
        return dialStr;
    };
    //create the modal window for results
    $ionicModal.fromTemplateUrl('templates/presAnalytics.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });  

    $scope.go = function(id,index){
        if($scope.session.organizer._id == $rootScope.user._id){
            $scope.activeMeeting = true;
            if($scope.session.bridge && !$scope.bridgeService.activeBridge()){
                $scope.bridgeService.startBridge($scope.session.ufId).then(function(){  
                    $state.transitionTo('app.presentation', {id:id,idx:index});
                });
            }else{
                $state.transitionTo('app.presentation', {id:id,idx:index}); 
            }
        }else{
            if($scope.session.bridge){
                $scope.bridgeService.startBridge($scope.session.ufId).then(function(){   
                    $state.transitionTo('app.viewer', {id:$scope.session._id,idx:0});
                });
            }else{
                $state.transitionTo('app.viewer', {id:$scope.session._id,idx:0});
            }
        }
    }
    // A general purpose alert dialog
    $scope.showAlert = function(title,msg) {
        var alertPopup = $ionicPopup.alert({
        title: title,
        template: msg
        });
        
        return alertPopup;
    };
    
    $scope.showResults = function(idx){
        if($scope.session.decks.length>0){
            var sid = $scope.session._id;
            var did = $scope.session.decks[idx]._id;
            presAnalyzer.get(sid,did).then(function(results){
                if(results.length>0){
                    Decks.get({id:did}).$promise.then(function(deck){
                    if(deck._id != undefined){
                        $scope.session
                        $scope.session.decks[idx].metrics=results;
                        $scope.session.decks[idx].slides = deck.slides;
                        $scope.deckIdx = idx;
                        $scope.modal.show();
                        }
                    });
                };
            }).catch(function(err){console.log(err)});
        };
    };

    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    $scope.startMeeting = function(){
        $scope.activeMeeting = true;
        if($scope.session.bridge){
            $scope.bridgeService.startBridge(session.ufId)
            .then(function(){
                if($scope.session.decks.length == 1)
                    $scope.go($scope.session._id,0);
                else
                    $scope.showAlert('Meeting Started','Please Select your Deck <br> by Clicking Click \'Show\'');
            });
        }else{
            if($scope.session.decks.length == 1)
                $scope.go($scope.session._id,0);  
            else
                $scope.showAlert('Meeting Started','Please Select your Deck <br> by Clicking \'Show\'');   
        }
    };
    $scope.endMeeting = function(){
        $scope.activeMeeting = false;
        $scope.bridgeService.endMeeting();
        $scope.loadReports();
        if($scope.bridgeService.activeBridge())
            $scope.bridgeService.endBridge($scope.session.ufId);
    };
    $scope.setLeaveBehind = function(){
        console.log($scope.session.leaveBehind);
        Sess.leaveBehind.update({id:$scope.session._id},$scope.session);
        if($scope.session.leaveBehind == true)
            ionicToast.show('Your Attendees Can View Your Presentation','top',false,2000);
        else
            ionicToast.show('You\'ve Revoked Viewing Rights for Attendees','top',false,2000);
    };
    $scope.resendInvites = function(){
        Sess.invite.update({id:$scope.session._id});
        ionicToast.show('Invitations have been re-sent','top',false,2000);
        
    };
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
        if($rootScope.deepLink)
            $scope.welcomeModal.remove();
    });
    
    //end the meeting if the presenter leaves the session and forgets to close
    $rootScope.$on('$stateChangeStart', function(event,toState,toParams,fromState,fromParams){
            if(fromState.name == 'app.session' && toState.name != 'app.presentation'){
                if($scope.activeMeeting)
                    $scope.endMeeting();
            };
    });
        
    if($rootScope.deepLink){
        $ionicModal.fromTemplateUrl('templates/welcomeTemplate.html',{scope:$scope})
        .then(function(modal){
            $scope.welcomeModal = modal;
            $scope.welcomeModal.show();
            //show for 5 seconds then hide
            $timeout(function(){
                $scope.welcomeModal.hide();
            },3500);   
        });
    }

    $scope.init();

    }]);