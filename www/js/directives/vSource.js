'use strict';

/**
* v-lead directive to lead a video for followers   
*/
angular.module('starter')
    .directive('vSource',['$parse',function ($parse) {
      return {
        restrict : 'A',
        link: function(scope, element, attrs) 
        {
            
            scope.myPlayer = element[0];
            scope.myPlayer.setAttribute('src',attrs.vSource);
            
            if(attrs.autoPlay != undefined){
                var model = $parse(attrs.autoPlay);
                scope.$watch(model,function(value){
                    var showing = value;
                    if(showing)
                        scope.myPlayer.play();
                });
            }


        }
      };     
}]);