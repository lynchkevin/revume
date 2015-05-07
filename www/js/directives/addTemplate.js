'use strict';

/**
* v-lead directive to lead a video for followers   
*/
angular.module('starter')
    .directive('addTemplate',[function () {
      return {
        restrict : 'AE',
        templateUrl : function(tElement,tAttrs){
            return tAttrs.templateUrl;
      }
    }
}]);