'use strict';

/**
* autocomplete username and email   
*/
angular.module('starter')
    .directive('userComplete',['$rootScope','userService','$parse','$state',
    function ($rootScope,userService,$parse,$state) {
      return {
        restrict : 'A',
        require: 'ngModel',
        link: function(scope, element, attrs,ngModelController) {
            var el = element[0];
            //save the model so we can auto-fill it later
            var fieldType = attrs.fieldType;
            var model = $parse(attrs.ngModel);
            var autoFilled = false;

            scope.instanceName = attrs.instanceName;
            scope.state = $state.current.name;
            
            //the user service will call this callback on doAutoComplete for all instances with same name
            scope.doFinish = function($index){
                var user = userService.getResults($index);
                switch(fieldType){
                        case 'name' : 
                                var name = user.firstName+' '+user.lastName;
                                autoFilled = true;
                                model.assign(scope,name);
                                userService.hidePopover(scope);
                                break;
                        case 'email' :
                                autoFilled = true;
                                ngModelController.$setDirty();
                                model.assign(scope,user.email);
                                userService.hidePopover(scope);
                                break;
                }
            };
            //create a new popover
            userService.createPopover();
            //connect the callback
            userService.onAutoComplete(scope);
            
            scope.$watch(model, function (str) {
                if(!autoFilled){
                switch(fieldType){
                        case 'name' : 
                                    if(str!=undefined)
                                        if(str.length>0){
                                            var query={first:str};
                                            userService.usersIKnow(query).then(function(results){
                                                userService.setResults(results);
                                                if(results.length>0)
                                                    userService.showPopover(scope,el);
                                                else
                                                    userService.hidePopover(scope);
                                            });
                                        } else {
                                                userService.hidePopover(scope);
                                        }   
                                        break;
                        case 'email' :
                                    if(str != undefined)
                                        if(str.indexOf('@')>0){
                                            var query={email:str};
                                            userService.usersIKnow(query).then(function(results){
                                                 userService.setResults(results);
                                                if(results.length>0)
                                                    userService.showPopover(scope,el);
                                                else
                                                    userService.hidePopover(scope);
                                            });
                                        } 
                                        break;
                }
                } else {
                    autoFilled = false;
                }
            });
         scope.$on('$stateChangeStart',function(){
             userService.removePopover(scope);
         });
                
        } 
    };
}]);