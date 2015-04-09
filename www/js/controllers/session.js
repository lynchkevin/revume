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
            $scope.orgSessions = Sess.orgSessions.get({id:_id});
            $scope.attSessions = Sess.attSessions.get({id:_id});
            $scope.sb = sb;
            $scope.sb.init($scope);
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
                $scope.sb.edit($scope.orgSessions[idx]);
            }
        });
    };
        
    $scope.init();
    //reinialize whem the userID is set
    $scope.$on('userID',function(event,user){
        $scope.init();
    });
}])

.controller('SessionCtrl', ['$scope',
                            '$rootScope',
                            '$stateParams',
                            'Session',
                            'Decks',
                            'presAnalyzer',
                            '$ionicModal',
                            '$state', 
function($scope,$rootScope, $stateParams,Session, Decks,analyzer,$ionicModal,$state) {
    
    $scope.init = function(){
        $scope.session = Session.get({id: $stateParams.id}).$promise.then(function(session){
            if(session._id != undefined){
                $scope.session = session;
                if($scope.session.decks.length>0){
                    var sid = $scope.session._id;
                    $scope.deckIdx = 0;
                    $scope.reportsDisabled = [];
                    for(var i=0; i< $scope.session.decks.length;i++)
                    var did = $scope.session.decks[i]._id;
                    analyzer.get(sid,did).then(function(results){
                        if(results.length>0)
                            $scope.reportsDisabled.push(true);
                        else
                            $scope.reportsDisabled.push(false);
                    }).catch(function(err){console.log(err)});
                }
            }   
        }).catch(function(err){
            var str = "SessionCtrl: error:"+error;
            alert(str);
        });
    };
        
        //create the modal window for results
        $ionicModal.fromTemplateUrl('templates/presAnalytics.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });  
    
        $scope.go = function(id,index){
            if($scope.session.organizer._id == $rootScope.user._id) 
                $state.transitionTo('app.presentation', {id:id,idx:index});
            else
                $state.transitionTo('app.viewer', {id:$scope.session._id,idx:0});
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
            
      $scope.$on('$destroy', function() {
        $scope.modal.remove();
      });

      $scope.init();

    }])