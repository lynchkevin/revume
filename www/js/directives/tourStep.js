'use strict';

/**
* v-lead directive to lead a video for followers   
*/
angular.module('RevuMe')
    .directive('tourStep',['$state','tourService','$parse',function ($state,tourService,$parse) {
      return {
        restrict : 'AE',
        templateUrl : 'templates/tour-template.html',
        scope : { ext : '&' },
        link: function(scope, element, attrs) 
        {
            
            scope.step = tourService.find($state.current.name);
            scope.step.scope = scope;
            scope.tourService = tourService;   
            
            scope.step.hide = function(){
                element.css('display','none');
            };
            
            scope.step.show = function(position){
                element.css('position','absolute');
                if(scope.step.position.top != undefined)
                    element.css('top',scope.step.position.top);
                if(scope.step.position.left != undefined)
                    element.css('left',scope.step.position.left);
                if(scope.step.position.right != undefined)
                    element.css('right',scope.step.position.right);
                if(scope.step.position.bottom != undefined)
                    element.css('bottom',scope.step.position.bottom);
                element.css('display','inherit');
            };
            
            scope.step.hide();
            if(scope.step.defer != undefined){
                scope.step.defer.resolve();
            }
            if(scope.ext != undefined)
                scope.step.ext = scope.ext;
            /*
            if(attrs.autoPlay != undefined){
                var model = $parse(attrs.autoPlay);
                scope.$watch(model,function(value){
                    var showing = value;
                    if(showing)
                        scope.myPlayer.play();
                });
            }
            */


        }
      }
}]);