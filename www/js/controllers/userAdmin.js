'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('userAdminCtrl', ['$scope', 
                             '$rootScope',
                             'ScriptService',
                             'Users',
                             function ($scope,
                                        $rootScope,
                                        ScriptService,
                                        Users
                                        ){
    $scope.revume = {};
    $scope.revume.scriptTypes = ScriptService.scriptTypes;
    // start by getting all users 
    Users.byId.query().$promise.then(function(users){
        $scope.revume.allUsers = users;
        $scope.revume.allUsers.forEach(function(user){
            ScriptService.userScript(user._id).then(function(script){
                if(script != undefined)
                    user.script = script;
                else{
                    var members = [{user:user._id,role:'Admin'}];
                    var type = $scope.revume.scriptTypes[0]; //trial
                    user.script = ScriptService.newScript(type,members);
                    ScriptService.save(user.script).then(function(script){
                        user.script._id = script._id;
                        console.log('User: ',user.firstName+' '+user.lastName,' new subscription created');
                    });
                }
            });
        });     
    });
    
    $scope.updateScript = function($index){
        var user = $scope.revume.allUsers[$index];
        ScriptService.update(user.script._id,user.script).then(function(){
            console.log('user subscription updated');
        });
    }
  }]);
