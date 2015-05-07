'use strict';

/**
* v-lead directive to lead a video for followers   
*/
angular.module('starter')
    .directive('vSource',[function () {
      return {
        restrict : 'A',
        link: function(scope, element, attrs) 
        {
            
            scope.myPlayer = element[0];
            scope.myPlayer.setAttribute('src',attrs.vSource);

        }
      }; 
    }
]);