'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # reviewCtl
 * Controller for Revu.me - leave behind viewer
 */
angular.module('RevuMe')
  .service('slideShow',['$rootScope', '$state',
function ($rootScope, $state) {
    var $ = this;
    $.presentation = {};
    
    $.connect = function($scope){
        $.scope = $scope;    
        $scope.presentation = $.presentation;
    };
    
    $.startSlideShow = function(presentation){
        angular.extend($.presentation,presentation);
        $.lastState = $state.current.name;
        $state.go('app.slideShow');
    };
        

    
  }]);
