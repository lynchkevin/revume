'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # presenceService
 * service to handle presence for the app
 */
angular.module('starter')
  .service('tourService', ['$rootScope',
                           '$state',
                           '$ionicSideMenuDelegate',
                           '$q',
                           '$sce',
function($rootScope,$state,$ionicSideMenuDelegate,$q,$sce) {
    
    var $ = this;
    $.steps = [];
    $.currentStep = 0;
    
    function transitionTo(step){
        var state ;
        if(step.state == '')
            state = 'app.welcome';
        else
            state = step.state;
        
        $state.go(state).then(function(){
            return step.connect();
        }).then(function(){
            step.before();
            step.show();
        });
    }
    $.start = function(){
        if($.steps.length>0)
            var step = $.steps[0];
            transitionTo(step);
    };
    
    $.next = function(){
        $.steps[$.currentStep].hide();
        $.steps[$.currentStep].after();
        if($.currentStep < $.steps.length-1){
            $.currentStep++;
            var step = $.steps[$.currentStep];
            transitionTo(step);
        }
    };
    
    $.previous = function(){
        $.steps[$.currentStep].hide();
        $.steps[$.currentStep].after();
        if($.currentStep > 0){
            $.currentStep--;
            var step = $.steps[$.currentStep];
            transitionTo(step);
        }
    };
    
    $.showAll = function(){
        $.steps.forEach(function(step){
            step.show();
        });
    }
    
    $.hideAll = function(){
        $.steps.forEach(function(step){
            if(step.hide != undefined)
                step.hide();
        });
    }
    
    $.end = function(){
        $.currentStep = 0;
        $.hideAll();
    };
    
    $.newStep = function(state,text,position,before,after){
        var step = {};
        step.state = state;
        step.text = $sce.trustAsHtml(text);
        step.before = before || function(){};
        step.after = after || function(){};
        step.position = position || {};
        step.connect = function(){ 
                            step.defer = $q.defer(); 
                            if(step.show == undefined)
                                return step.defer.promise;
                            else {
                                step.defer.resolve();
                                step.scope.step = step;
                                return step.defer.promise;
                            }
                        };
        return step;
    };
    
    $.subStep = function(parent,text,position,before,after){
        var step = {};
        angular.extend(step,parent);
        step.parent = parent;
        step.text = $sce.trustAsHtml(text);
        step.position = position || {};
        step.before = before || function(){};
        step.after = after || function(){};
        step.connect = function(){
                            step.defer = $q.defer();
                            step.show = step.parent.show;
                            step.hide = step.parent.hide;
                            parent.scope.step = step;
                            step.defer.resolve();
                            return step.defer.promise;
                        };
        return step;
    };
        
    function newPosition(topSmall,top,left){
        var position = {};
        var position = {};
        if($rootScope.smallScreen()){
            position.left = '0px';
            position.top = topSmall;
        }else{
            position.top = top;
            position.left = left;
        }
        return position;
    };
    
    $.configure = function(){
        // Menu Tour
        var position = newPosition('60%','30%','275px');
        var rootStep = $.newStep('',
                              'Let\'s start with the menu. Click the corner to open and close',
                               position,
                              function(){$ionicSideMenuDelegate.toggleLeft(true)});
        $.steps.push(rootStep);
        position = newPosition('15%','7%','275px');
        $.steps.push($.subStep(rootStep,
                              'Settings let you change your password and log out.',
                               position)
                     );
        position = newPosition('160px','102px','275px');
        $.steps.push($.subStep(rootStep,
                              'The Library Stores all your Pitch Decks.',
                               position)
                     );       
    
        position = newPosition('220px','160px','275px');
        $.steps.push($.subStep(rootStep,
                              'Teams Let You Share Pitch Decks and other items',
                               position)
                     );  
        position = newPosition('278px','220px','275px');
        $.steps.push($.subStep(rootStep,
                              'These are all the meetings you organized',
                               position)
                     );  
        position = newPosition('330px','278px','275px');
        $.steps.push($.subStep(rootStep,
                              'Here are Invitations to Meetings you can Attend',
                               position)
                     );  
        position = newPosition('390px','330px','275px');
        $.steps.push($.subStep(rootStep,
                              'The Archive Holds All your Old Pitches and Meetings',
                               position,
                              function(){$ionicSideMenuDelegate.toggleLeft(true)})
                     );  
        
        // Show them the library
        position = newPosition('30%','30%','30px');
        var state;
        if($rootScope.smallScreen())
            state = 'app.mobileLib';
        else
            state = 'app.library';
        var libStep = $.newStep(state,
                               'This is the slide library. Drop files here to upload (Desktop Only)',
                               position,
                              function(){$ionicSideMenuDelegate.toggleLeft(false)});
        $.steps.push(libStep);
        position = newPosition('16%','16%px','120px');
        $.steps.push($.subStep(libStep,
                              'You can categorize your slides for quick re-use. For example: file type, subject, industry etc.',
                               position)
                     );  
        position = newPosition('20%','20%px','50px');
        $.steps.push($.subStep(libStep,
                              'Combine your slides into pitch \'decks\' using \'Pitch Perfect\'. Just add a new deck, name it, and start adding the slides you need. Click on the slide to re-order and then click again where you want the slide to go.',
                               position)
                     );  
        position = newPosition('305px','110px','275px');
        $.steps.push($.subStep(libStep,
                              'On Mobile, slide the item left to reveal options, For Desktops, just click the options drop down. Here you can edit an item, share it with your team or create a new meeting.',
                               position)
                     );  
     }; 
      
     $.find = function(stateName){
         var idx = 0;
         var found = false;
         $.steps.some(function(step){
             if(step.state == stateName)
                 found = true;
             else   
                idx++
             return found;
         });
         if(found)
            return $.steps[idx];
         else
             return {};
     };
      
    
      
    $.configure();
                       
  }]);