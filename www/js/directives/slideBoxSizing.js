'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')

.directive('scrollHeight', ['$window',function ($window) {
      return {
          restrict : 'A',
          $scope:{},
          controller:['$scope','$element','$attrs',function($scope,$element,$attrs){
            $scope.portrait = false;
            $scope.reAspect = function(){
                if($scope.portrait){
                    var w = angular.element($window);
                    var el = $element[0];
                    var percentHeight = $attrs.scrollHeight; 
                    var marginTop = $attrs.marginTop || 0;
                    var marginBottom = $attrs.marginBottom || 0;
                    var availableHeight = verge.viewportH() - marginTop - marginBottom;
                    var height = availableHeight * percentHeight;
                    var heightStr = height.toString()+"px";
                    el.style.height = heightStr;
                }
            
            }
            this.setPortrait = function(portrait){
                $scope.portrait = portrait || false;
                $scope.reAspect();
            }
          }],
          link :function(scope, element, attrs){
            scope.reAspect();
            var w = angular.element($window);
            w.on('orientationchange',scope.reAspect);
            w.bind('resize',function(){
              scope.reAspect();
            });
          }
    }
}])
.directive('imageHeight',[function($window){
    return {
        restrict:'A',
        require:'^scrollHeight',
        link: function(scope, element,attrs,scrollHeightCtlr){
            element.on('load',function(){
                var w = element[0].width;
                var h = element[0].height;
                if(h > w)
                    scrollHeightCtlr.setPortrait(true);
                else
                    scrollHeightCtlr.setPortrait(false);
            });
        }
    };
}]);
                