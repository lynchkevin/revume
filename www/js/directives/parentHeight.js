'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
    .directive('parentHeight', ['$window','$timeout',function ($window,$timeout) {
      return {
          restrict : 'A',
          link : function(scope, element, attrs){
            var w = angular.element($window);
            var el = element[0];
            var current = el;
            var referenceHeight = undefined;
            var foundParent = undefined;
            var percent = attrs.parentHeight;
            for(var i=0; i<30;i++){
                var p = current.parentElement;
                if(p.className.indexOf('ParentMarker')>=0){
                    referenceHeight = p.clientHeight;
                    foundParent = p;
                    break;
                }
                current = p;
            }
            if(referenceHeight != undefined){
                if(percent == '')
                    el.style.height = referenceHeight.toString()+'px';
                else{
                    var h = referenceHeight * percent;
                    el.style.height = h.toString()+'px';
                }
            }
             w.bind('resize',function(){
                 if(foundParent != undefined)
                     el.style.height = foundParent.clientHeight.toString()+'px';
            });
        }
    }
}]);