'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # reviewCtl
 * Controller for Revu.me - leave behind viewer
 */
angular.module('starter')
  .service('slideShow',['$rootScope',
                        '$ionicSlideBoxDelegate','$state',
function ($rootScope, sbDelegate,$state) {
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
