'use strict';

/**
* A Presentation Controller 
*/

angular.module('RevuMe')

.controller('wizardCtrl', ['$scope',
                           '$rootScope', 
                           '$timeout',
                           '$ionicSlideBoxDelegate',
                           '$ionicScrollDelegate',
                           '$ionicModal',
                           'SalesforceService',
 function ($scope, $rootScope, 
           $timeout,$ionicSlideBoxDelegate,session,$ionicScrollDelegate,$ionicModal,SalesforceService) {
    

    $scope.wizard = {};
    $scope.wizard.name = 'Create a New Meeting';
    $scope.wizard.steps = [];
    $scope.wizard.current = 0;
    $scope.wizard.nextEnabled = true;
    $scope.sfdc = SalesforceService;
     
    $scope.nextStep = function() {
        $scope.setStep(++$scope.wizard.current);
        $ionicSlideBoxDelegate.slide($scope.wizard.current);
        $ionicSlideBoxDelegate.update();
    };
    
    $scope.prevStep = function() {
        $scope.setStep(--$scope.wizard.current);
        $ionicSlideBoxDelegate.slide($scope.wizard.current);
        $ionicSlideBoxDelegate.update();
    };
     
    $scope.setStep = function(stepNumber) {
        if(stepNumber >= $scope.wizard.steps.length-1) {
            $scope.wizard.current = $scope.wizard.steps.length-1;
            $scope.wizard.nextEnabled = false;
            $scope.wizard.prevEnabled = true;
        } else if(stepNumber <= 0) {
            $scope.wizard.current = 0;
            $scope.wizard.prevEnabled = false;
            $scope.wizard.nextEnabled = true;
        } else {   
            $scope.wizard.current = stepNumber;
            $scope.wizard.nextEnabled = true;
            $scope.wizard.prevEnabled = true;
        }
        $ionicSlideBoxDelegate.slide($scope.wizard.current);
    };
    
     var step1 = {form:{}};
     step1.heading = 'Date & Time';
     step1.template = "templates/datetime.html";
     step1.date = new Date();
     step1.time = step1.date;


     step1.datepickerObject = {
          titleLabel: 'Title',  //Optional
          todayLabel: 'Today',  //Optional
          closeLabel: 'Close',  //Optional
          setLabel: 'Set',  //Optional
          setButtonType : 'button-dark',  //Optional
          todayButtonType : 'button-stable',  //Optional
          closeButtonType : 'button-assertive',  //Optional
          inputDate: new Date(),  //Optional
          mondayFirst: true,  //Optional
          templateType: 'popup', //Optional
          showTodayButton: 'true', //Optional
          modalHeaderColor: 'bar-positive', //Optional
          modalFooterColor: 'bar-positive', //Optional
          from: new Date(2012, 8, 2), //Optional
          to: new Date(2018, 8, 25),  //Optional
          callback: function (val) {  //Mandatory
            if(val != undefined){
                step1.datepickerObject.inputDate = val;
                step1.date = val;
            }
          },
          dateFormat: 'dd-MM-yyyy', //Optional
          closeOnSelect: false, //Optional
        };
        step1.timePickerObject = {
          inputEpochTime: ((new Date()).getHours() * 60 * 60),  //Optional
          step: 15,  //Optional
          format: 12,  //Optional
          titleLabel: '12-hour Format',  //Optional
          setLabel: 'Set',  //Optional
          closeLabel: 'Close',  //Optional
          setButtonType: 'button-positive',  //Optional
          closeButtonType: 'button-stable',  //Optional
          callback: function (val) {    //Mandatory
            if(val!=undefined){
                step1.timePickerObject.inputEpochTime = val;
                var hours = Math.trunc(val/3600);
                var minutes = (val-(hours*3600))/60;
                step1.time = step1.date;
                step1.time.setHours(hours);
                step1.time.setMinutes(minutes);
                step1.time.setSeconds(0);
                step1.time.setMilliseconds(0);
            }
          }
        };
          step1.timePickerObject.inputEpochTime = (step1.time.getHours() * 3600);
     $scope.wizard.steps.push(step1);
     var step2 = {form:{}};
     step2.heading = 'Who\'s Invited';
     $scope.wizard.steps.push(step2);
     var step3 = {form:{}};
     step3.heading = 'Shared Content';
     $scope.wizard.steps.push(step3);
     
     
    
}]);
    