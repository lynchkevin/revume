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
            var top = Number(attrs.top);
            for(var i=0; i<30;i++){
                var p = current.parentElement;
                if(p.className.indexOf('ParentMarker')>=0){
                    referenceHeight = p.clientHeight;
                    foundParent = p;
                    break;
                }
                current = p;
            }
            function setHeight(){
                if(referenceHeight != undefined){
                    if(percent == '')
                        if(!isNaN(top)){
                            var h = referenceHeight - top;
                            el.style.height = h.toString()+'px';
                        } else {
                            el.style.height = referenceHeight.toString() +'px';
                        }
                    else{
                        var h = referenceHeight * percent;
                        if(top != ''){
                            h = h - top;
                            el.style.height = h.toString()+'px';
                        } else {
                            el.style.height = h.toString()+'px';
                        }   
                    }
                }
            }
            setHeight();
             w.bind('resize',function(){
                 if(foundParent != undefined){
                    referenceHeight = foundParent.clientHeight;
                    setHeight();
                 }
            });
        }
    }
}]);