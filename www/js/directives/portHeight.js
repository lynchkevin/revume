'use strict';

/**
* set the height of an element for portrait and maintain for landscape   
*/

angular.module('RevuMe')
    .directive('portHeight', ['$window','$timeout',function ($window, $timeout) {
      return {
          restrict : 'A',
          link : function(scope, element, attrs){
            var w = angular.element($window);
            var el = element[0];
            function reAspect(){
                var targetHeight = attrs.portHeight;
                if(verge.viewportH()<verge.viewportW())
                    targetHeight = targetHeight*1.30
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