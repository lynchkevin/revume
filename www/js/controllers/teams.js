'use strict';

/**
 */
angular.module('starter')
//show all sessions - split into those I organized and those I'm an attendee
.controller('teamsCtrl',['$scope',
                            '$rootScope',
                            'TeamService', 
                            'userService',
                            '$ionicListDelegate',      
                            '$ionicPopup',
                            '$ionicModal',
                            '$ionicPopover',
                            '$state',
function($scope, $rootScope, teamService,userService,$listDel,$ionicPopup,$ionicModal,$ionicPopover,$state) {
    
    //set edit team name if passed in
    switch($state.current.name){
            case 'app.team' :
                $scope.teamName = $state.params.name;
                break;
            case 'app.team.new':
                $scope.teamName = 'New Team';
                break;
    }
    //initialize the controller
    $scope.init = function(){
        var _id = $rootScope.user._id;
        $scope.forms = {};
                
        if(_id != undefined){
            teamService.init($scope);
            teamService.getAll(_id).then(function(teams){
                $scope.teams = teams;
                switch($state.current.name){
                        case 'app.team' : 
                            {
                                var idx = parseInt($state.params.id);
                                setTimeout(function(){
                                    teamService.editTeam($scope,idx);
                                    $scope.addTeam.name = $scope.teams[idx].name;
                                },0);
                                $scope.modalCallback = $scope.updateTeam;
                            }
                            break;
                        case 'app.team.new' :
                            {      
                                teamService.newTeam($scope);
                                $scope.modalCallback = $scope.saveTeam;
                            }
                            break;
                }
            });
            //set the input type to manual
            $scope.commaDelimited = false;
            $ionicPopover.fromTemplateUrl('templates/autocomplete.html', {
                scope: $scope,
            }).then(function(popover) {
                $scope.popover = popover;
            });
        };  
    };
    //upll to refresh the list of teams
    $scope.doRefresh = function(){
        teamService.refreshTeams($scope);
    };
    //create a new team - show the modal dialog
    $scope.newTeam = function(){
        teamService.newTeam($scope);
        $scope.modalTitle='New Team';
        //set the callback so that the modal saves a new team
        $scope.modalCallback = $scope.saveTeam;
        $state.transitionTo('app.team.new');
    }

    //ng-change doesn't send the element so we need to catch it with focus
    $scope.klugeElement = function($event){
        $scope.el = $event.target;
    }
    //auto complete emails from the database
    $scope.emailChange=function(){
        var eStr = $scope.addTeam.emailString;
        $scope.addTeam._id = undefined;
        if(eStr != undefined)
            if(eStr.indexOf('@')>0){
                var query={email:eStr};
                userService.find(query).then(function(results){
                    $scope.autoComplete.entries = results;
                    if(results.length>0)
                        $scope.popover.show($scope.el);
                    else
                        $scope.popover.hide();
                });
            }
    }
    //autocomplete names from the database
    $scope.nameChange=function(){
        var nStr = $scope.addTeam.nameString;
        $scope.addTeam._id = undefined;
        if(nStr != undefined)
            if(nStr.length>0){
                var query={first:nStr};
                userService.find(query).then(function(results){
                    $scope.autoComplete.entries = results;
                    if(results.length>0)
                        $scope.popover.show($scope.el);
                    else
                        $scope.popover.hide();
                });
            } else {
                $scope.popover.hide();
            }
    }
    //finish the autocompleate based on user selection    
    $scope.finishComplete = function($index){
        var selected = $scope.autoComplete.entries[$index];
        $scope.popover.hide();
        $scope.addTeam.emailString = selected.email;
        $scope.addTeam.nameString = selected.firstName+' '+selected.lastName;
        $scope.addTeam._id = selected._id;
    }
    //add a member to the team
    $scope.addMember = function(){
        teamService.addMember($scope);
    }
    //delete a member from the team
    $scope.delMember = function($index){
        teamService.delMember($scope,$index);
    }

    //validate comma delimted input
    function validateMembers(){
        teamService.validateMembers($scope);
    };

    // save the team to the database
    $scope.saveTeam = function(){
        console.log('save team: ',$scope.addTeam.name);
        //if comma delimited input then validate the text block
        if($scope.commaDelimited)
            validateMembers();
        //read the input from the user into a team object
        var team = teamService.teamFromInput($scope);
        teamService.save(team).then(function(){
            return teamService.refreshTeams($scope);
        }).then(function(){
            return
        }).catch(function(err){
            console.log(err);
        });
    };    
    //show the delete icons
    $scope.toggleListDelete = function(which){
      if($listDel.$getByHandle(which).showDelete())
        $listDel.$getByHandle(which).showDelete(false);
      else
        $listDel.$getByHandle(which).showDelete(true);
    } 
    // A confirm delete dialog
    function showConfirm(teamName) {
        var confirmPopup = $ionicPopup.confirm({
        title: 'Delete '+teamName,
        template: 'Are you sure to delete this?'
        });
        
        return confirmPopup;
    }
    //delete a team from the list
    $scope.delTeam = function(idx,$event){
        var teamName = $scope.teams[idx].name;
        $event.stopPropagation();
        showConfirm(teamName).then(function(res){
            if(res){
                var _id = $scope.teams[idx]._id;
                teamService.delete(_id).then(function(){
                    $scope.teams.splice(idx,1);
                }).catch(function(err){
                    console.log(err);
                });
            }
        });
    }
    //edit a team
    $scope.editTeam = function(idx){
        teamService.editTeam($scope,idx);
        $scope.modalTitle='Edit Team';
        $scope.modalCallback=$scope.updateTeam;
        var teamName = $scope.teams[idx].name;
        $state.transitionTo('app.team', {id:idx,name:teamName});
    }
    //update the team in the database
    // save the team to the database
    $scope.updateTeam = function(){
        //if comma delimited input then validate the text block
        if($scope.commaDelimited)
            validateMembers();
        //read the input from the user into a team object
        var team = teamService.teamFromInput($scope);
        teamService.update(team).then(function(){
            return teamService.refreshTeams($scope);
        }).then(function(){
            return
        }).catch(function(err){
            console.log(err);
        });
    };  

    $scope.init();
    //reinialize whem the userID is set
    $scope.$on('userID',function(event,user){
        $scope.init();
    });
    //ask to save work before navigating away
    $scope.showNavConfirm = function(){
        var confirmPopup = $ionicPopup.confirm({
        title: 'Unsaved Work',
        template: 'Should We Save It?'
        });
        
        return confirmPopup;
    }
    $scope.$on('$stateChangeStart', function(event,toState,toParams,fromState,fromParams){
        switch(fromState.name){
            case 'app.team' :
            case 'app.team.new':
                //check if form is dirty then ask if they want to save
                if(!$scope.forms.teamForm.$pristine)
                    $scope.showNavConfirm().then(function(res){
                        if(res){
                            $scope.modalCallback();
                        }
                    });
                break;
        }
    });

    $scope.$on('$ionicView.enter', function(){
        if($rootScope.user._id != undefined)
            if($state.current.name == 'app.teams')
                setTimeout(function(){
                    teamService.refreshTeams($scope);
                },0);                
    });
    
    $scope.$on('$destroy', function() {
        $scope.popover.remove();
    });
    
}])
