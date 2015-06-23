'use strict';

/**
 */
angular.module('starter')
//show all sessions - split into those I organized and those I'm an attendee
.controller('SessionsCtrl',['$scope',
                            '$rootScope',
                            'Sess', 
                            'Decks',
                            '$ionicListDelegate',      
                            '$ionicPopup',
                            'SessionBuilder',
                            '$state',
                            
function($scope, $rootScope, Sess,Decks,$listDel,$ionicPopup,sb,$state) {
    
    $scope.init = function(){
        var _id = $rootScope.user._id;
        if(_id != undefined){
            Sess.orgSessions.get({id:_id})
            .$promise.then(function(os){
                $scope.orgSessions = os;
                return Sess.attSessions.get({id:_id}).$promise;
            }).then(function(as){
                $scope.attSessions = as;
                $scope.sb = sb;
                $scope.sb.init($scope);
                $scope.bridge = {};
            }).catch(function(err){
                console.log(err);
            });
        };
    };
    
    $scope.doRefresh = function(){
        var _id = $rootScope.user._id;
        if(_id != undefined){
            Sess.orgSessions.get({id:_id}).$promise.then(function(os){
                $scope.orgSessions = os;
                return Sess.attSessions.get({id:_id}).$promise;
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
      if($listDel.$getByHandle(which).showDelete())
        $listDel.$getByHandle(which).showDelete(false);
      else
        $listDel.$getByHandle(which).showDelete(true);
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
            }
        });
    };
    
    $scope.editSession = function(idx){
        var _id = $scope.orgSessions[idx].decks[0]._id;
        Decks.get({id:_id}).$promise.then(function(deck){
            if(deck._id!= undefined){
                $scope.orgSessions[idx].decks[0] = deck;
                return $scope.sb.init($scope);
            }
        }).then(function(){
            return $scope.sb.edit($scope.orgSessions[idx]);
        }).then(function(){
            $scope.doRefresh();
        });
    };
    
    $scope.newSession = function(){
        $scope.sb.init($scope).then(function(){
            return $scope.sb.new();
        }).then(function(){
            $scope.doRefresh();
        });
    };
        
    $scope.init();
    //reinialize whem the userID is set
    $scope.$on('userID',function(event,user){
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
                            '$state', 
                            'BridgeService',
                            '$timeout',
function($scope,$rootScope, $stateParams,Sess,session, Decks,
          analyzer,$ionicModal,$state,BridgeService,$timeout) {
    // set the bridge service in the scope so it can be accessed directly
    $scope.bridgeService = BridgeService;
    // session is now resolved in the state transition
    $scope.session = session;
    
    $scope.init = function(){
        if(session._id != undefined){
            $scope.activeMeeting = false;
            $scope.bridgeService.findBridge($scope.session.ufId)
            $scope.session.confId = $scope.session.ufId.replace(/-/g,'');
            $scope.session.leaveBehind = false;
            if($scope.session.decks.length>0){
                var sid = $scope.session._id;
                $scope.deckIdx = 0;
                $scope.reportsEnabled = [];
                for(var i=0; i< $scope.session.decks.length;i++){
                    var did = $scope.session.decks[i]._id;
                    analyzer.get(sid,did).then(function(results){
                        if(results.length>0)
                            $scope.reportsEnabled.push(true);
                        else
                            $scope.reportsEnabled.push(false);
                    }).catch(function(err){console.log(err)});
                }
            }
        }   
    };
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

    $scope.showResults = function(idx){
        if($scope.session.decks.length>0){
            var sid = $scope.session._id;
            var did = $scope.session.decks[idx]._id;
            analyzer.get(sid,did).then(function(results){
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
        if($scope.session.bridge)
            $scope.bridgeService.startBridge(session.ufId);
    };
    $scope.endMeeting = function(){
        $scope.activeMeeting = false;
        if($scope.bridgeService.activeBridge())
            $scope.bridgeService.endBridge($scope.session.ufId);
    };
    $scope.setLeaveBehind = function(){
        console.log($scope.session.leaveBehind);
        Sess.leaveBehind.update({id:$scope.session._id},$scope.session);
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