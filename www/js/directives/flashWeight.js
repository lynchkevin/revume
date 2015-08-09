'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
.directive('flashWeight', ['$animate','$timeout', function($animate,$timeout) {
    return {
        restrict : 'A',
        link : function(scope, element, attrs) {
            if(attrs.flashWeight != undefined){
                scope.$on(attrs.flashWeight, function(event,args){
                    $timeout(function(){
                        element.html(args);
                        $animate.addClass(element, 'heavy').then(function(){
                            $timeout(function(){
                                $animate.removeClass(element,'heavy');
                            },100);
                        });
                    });
                });
            }else{
                $timeout(function(){
                    $animate.addClass(element, 'heavy').then(function(){
                        $timeout(function(){
                            $animate.removeClass(element,'heavy');
                        },100);
                    });
                });
            }

        }
    }
}]);