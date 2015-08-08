'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('starter')
.directive('fullScreen', [function($animate,$timeout) {
    return {
        restrict : 'A',
        scope : {
            goFull : '='
        },
        link : function(scope, element, attrs) {
            
            function launchFullScreen() {
                if (element[0].requestFullscreen)
                { element[0].requestFullscreen(); }
                else if (element[0].mozRequestFullScreen)
                { element[0].mozRequestFullScreen(); }
                else if (element[0].webkitRequestFullscreen)
                { element[0].webkitRequestFullscreen(); }
                else if (element[0].msRequestFullscreen)
                { element[0].msRequestFullscreen(); }
            };
            
            function cancelFullScreen() {
                if ($document.exitFullscreen) {
                document.exitFullscreen();
                } else if ($document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
                } else if ($document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
                } else if ($document.msExitFullscreen) {
                document.msExitFullscreen();}
            };
                
           scope.$watch('goFull', function() {
                if(scope.goFull == true)
                    launchFullScreen();
                else
                    cancellFullScreen();
            }, true);
        }
    }
}]);