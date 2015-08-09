'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/
angular.module('RevuMe')
    .directive('elemSize', ['$window','$timeout',function ($window, $timeout) {
      return {
          restrict : 'A',
          link : function(scope, element, attrs){
            var w = angular.element($window);
            var el = element[0];
            var targetAspect = 1.333333;  //4:3
            var targetWidth = 1.0;   //was 1.0  
            var heightMargin = 60;
            if(attrs.controls != undefined)
                if(attrs.controls == "true" && attrs.host != "true")
                    heightMargin = 0;
                
            
            function reAspect(){
              var width = verge.viewportW();
              var height = verge.viewportH()-heightMargin; //header is 44 pix tall
              var aspectRatio = width/height;
              if(aspectRatio > targetAspect){
                  var targetWidthSetting = Math.trunc(height*targetAspect);
                  console.log('height: ',height,'width: ',width,'targetW: ',targetWidthSetting);
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