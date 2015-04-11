'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/
angular.module('starter.directives',[]);
angular.module('starter.directives')
    .directive('elemSize', ['$window','$timeout',function ($window, $timeout) {
      return {
          restrict : 'A',
          link : function(scope, element, attrs){
            var w = angular.element($window);
            var el = element[0];
            var targetAspect = 0.85;  //was 75
            var targetWidth = 0.90;   //was 1.0           
            
            function reAspect(){
              var width = verge.viewportW();
              var height = verge.viewportH();
              var aspectRatio = height/width;
              if(aspectRatio < targetAspect){
                  var targetWidthSetting = Math.trunc(height/targetAspect);
                  var styleStr = targetWidthSetting.toString()+"px";
                  el.style.width = styleStr;
              }else{
                  el.style.width = "100%";
              }
            }
          reAspect();
          w.on('orientationchange',reAspect);
          w.bind('resize',function(){
              reAspect();
          });
        }
      }

}]);