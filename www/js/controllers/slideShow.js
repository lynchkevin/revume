'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('slideShowCtrl', ['$scope',
                            '$rootScope',
                            '$state',
                            '$ionicSlideBoxDelegate',
                            '$ionicScrollDelegate',
                            '$timeout',
                            'slideShow',
                            'Fullscreen',
function ($scope,$rootScope,$state,sbDelegate,$ionicScrollDelegate,$timeout,slideShow,Fullscreen) {
        var previous = 0;
        var current = 1;
        var next = 2;
        //connect to the library
        slideShow.connect($scope);
    
        $scope.current = 0;
        $scope.nextEnabled = true;
        $scope.prevEnabled = false;
        $scope.boxLength = 5;
        $scope.boxCurrent = 0;
        $scope.expectEcho = false;
        $scope.slideBoxes = [];
        $scope.slideBoxIdx = 0;
        $scope.loadingMessage = '';
        $scope.zoomFactor = 1.0;
        $scope.fullScreen = true;
        function makeHandle(idx){
            return 'slide-box-'+idx;
        }
    
        function loadSlideBoxes(){
            var slides = $scope.presentation.slides;
            var boxIdx = 0;
            var slideBoxIdx = 0;
            var sbName = makeHandle(slideBoxIdx);
            var sb = sbDelegate
            var slideBox = {idx:slideBoxIdx,
                            slides:new Array(),
                            handle:sbName,
                            delegate:sb,
                            show:true};
            $scope.slideBoxes.push(slideBox);
            for(var i=0; i<slides.length; i++){
                if(boxIdx < $scope.boxLength){
                    slideBox.slides.push(slides[i]);
                    boxIdx++;
                }else{
                    slideBoxIdx++;
                    sbName = makeHandle(slideBoxIdx);
                    sb = sbDelegate
                    slideBox = {idx:slideBoxIdx,
                                slides:new Array(),
                                handle:sbName,
                                delegate:sb,
                                show:false};
                    $scope.slideBoxes.push(slideBox);
                    boxIdx = 1; //set for next loop - could set to zero and then increment but...
                    slideBox.slides.push(slides[i]);
                }
            }
        }
                    
        function enableNextPrevious(){
            if($scope.current < $scope.presentation.slides.length-1)
                $scope.nextEnabled = true;
            else
                $scope.nextEnabled = false;
            if($scope.current > 0)
                $scope.prevEnabled = true;
            else
                $scope.prevEnabled = false;
        }
    
        $scope.loadNext = function(){
            if($scope.boxCurrent+1 > $scope.boxLength-1){
                $scope.loadingMessage = 'Loading Slides...';
                $scope.slideBoxes[$scope.slideBoxIdx].show = false;
                $scope.slideBoxIdx++;
                $scope.boxCurrent = 0;
                $scope.current++;
                return true;
            } else {
                return false;
            }
        };
        
        $scope.slidesDone = function(){
            $timeout(function(){
                $scope.loadingMessage='';
            },300);
        }
        
        $scope.loadPrevious = function(){
            if($scope.boxCurrent-1 < 0){
                $scope.loadingMessage = 'Loading Slides...';
                $scope.slideBoxIdx--;
                $scope.boxCurrent = $scope.boxLength-1;
                $scope.current--;
                return true;
            } else {
                return false;
            }
        };
    
        loadSlideBoxes();
        
        $scope.nextClicked = function(){
            if($scope.zoomFactor == 1.0){
                if($scope.current < $scope.presentation.slides.length - 1){
                    if(!$scope.loadNext()){
                        $scope.current++;
                        $scope.boxCurrent++;
                        $scope.expectEcho=true;
                        $scope.slideBoxes[$scope.slideBoxIdx].delegate.slide($scope.boxCurrent);
                    }
                    enableNextPrevious();
                }
            }
        };
    
        $scope.previousClicked = function(){
            if($scope.zoomFactor == 1.0){
                if($scope.current > 0){
                    if(!$scope.loadPrevious()){
                        $scope.current--;
                        $scope.boxCurrent--
                        $scope.expectEcho = true;
                        $scope.slideBoxes[$scope.slideBoxIdx].delegate.slide($scope.boxCurrent);
                    }
                    enableNextPrevious();
                }
            }
        };
    
        $scope.onSlideChange = function(toSlide){
            if($scope.expectEcho)
                $scope.expectEcho = false;
            else {
                if(toSlide > $scope.boxCurrent){
                    if(!$scope.loadNext()){
                        $scope.current++;
                        $scope.boxCurrent++;
                    }
                } else if(toSlide < $scope.boxCurrent){
                    if(!$scope.loadPrevious()){
                        $scope.current--;
                        $scope.boxCurrent--;
                    }
                }
                enableNextPrevious();
            }
        };
    
        $scope.updateSlideStatus = function(slide) {
          $scope.zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).getScrollPosition().zoom;
          if ($scope.zoomFactor == 1.0) {
            sbDelegate.enableSlide(true);
            console.log('slide enabled');
          } else {
             sbDelegate.enableSlide(false);
            console.log('slide disabled');
          }
        };
                 



  }]);
