'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
    .directive('slideRight', ['$window','$timeout',function ($window, $timeout) {
      return {
          restrict : 'A',
          link : function(scope, element, attrs){
            var w = angular.element($window);
            var el = element[0];
            var right = verge.viewportW()+10+"px";
            var slideOver = attrs.slideRight;
            var noSlide = "!"+slideOver;
            scope.$on(slideOver, function(event,args){
                    $timeout(function(){
                        el.style.right = right;
                    },0);
            });
            scope.$on(noSlide, function(event,args){
                    $timeout(function(){
                        el.style.right = "0px";
                    },0);
            });              
              
        }
    }
}]); 