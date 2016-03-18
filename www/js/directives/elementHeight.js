'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
.directive('elemHeight', ['$window','$timeout',function ($window, $timeout) {
      return {
          restrict : 'A',
          link : function(scope, element, attrs){
            var w = angular.element($window);
            var el = element[0];
            var targetHeight = attrs.elemHeight; 
            function reAspect(){
                var height = verge.viewportH() * targetHeight;
                var heightStr = height.toString()+"px";
                el.style.height = heightStr;
            }
            reAspect();
            w.on('orientationchange',reAspect);
            w.bind('resize',function(){
              reAspect();
            });
        }
    }
}]);