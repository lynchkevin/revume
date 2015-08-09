'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
.directive('appearUp', ['$animate','$timeout', function($animate,$timeout) {
    return {
        restrict : 'A',
        link : function(scope, element, attrs) {
            scope.$on(attrs.appearUp, function(event,args){
                    $timeout(function(){
                    element.html(args);
                    $animate.addClass(element, 'show').then(function(){
                        $timeout(function(){
                            $animate.removeClass(element,'show');
                        },1500);
                    });
                });
            });
        }
    }
}]);