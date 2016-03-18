'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # presenceService
 * service to handle presence for the app
 */
angular.module('RevuMe')
  .service('tourService', ['$rootScope',
                           '$state',
                           '$ionicSideMenuDelegate',
                           '$q',
                           '$sce',
                           '$controller',
function($rootScope,$state,$ionicSideMenuDelegate,$q,$sce,$controller) {
    
    var $ = this;
    $.steps = [];
    $.currentStep = 0;
    
    var calloutStyles = {
        none    : 'tour-tip-container',
        top     : 'tour-tip-container top',
        left    : 'tour-tip-container left',
        topLeft : 'tour-tip-container topLeft',
        topRight: 'tour-tip-container topRight',
    };
    
    function transitionTo(step){
        var state ;
        if(step.state == '')
            state = 'app.welcome';
        else
            state = step.state;
        //don't go to the same state....
        if($state.current.name != state){
            //force a new connect as we transition state and dom may be reconstructed
            $state.go(state).then(function(){
                return step.connect();
            }).then(function(){
                step.before();
                step.show();
            });
        } else {
            step.connect().then(function(){
                step.before();
                step.show();
            });
        }
    }
    
    $.start = function(){
        $.currentStep = 0;
        if($.steps.length>0)
            var step = $.steps[0];
            transitionTo(step);
    };
    
    $.next = function(){
        $.steps[$.currentStep].hide();
        if($.steps[$.currentStep].after == 'ext')
            $.steps[$.currentStep].ext();
        else
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
                            else if(step.scope != undefined){
                                if(step.scope.$$destroyed == true)
                                    return step.defer.promise;
                                else {
                                    step.defer.resolve();
                                    step.scope.step = step;
                                    return step.defer.promise;
                                }
                            } else {
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
                            step.ext = step.parent.ext;
                            parent.scope.step = step;
                            step.defer.resolve();
                            return step.defer.promise;
                        };
        return step;
    };
        
    function newPosition(topSmall,top,left,smallClass,Class){
        var position = {};
        var position = {};
        if($rootScope.smallScreen()){
            position.left = '20px';
            position.top = topSmall;
            position.class= smallClass || 'tour-tip-container';
        }else{
            position.top = top;
            position.left = left;
            position.class = Class || 'tour-tip-container';
        }
        return position;
    };
    
    function next(pos){
        pos.small += 60;
        pos.smallText = pos.small+'px';
        pos.large += 60;
        pos.largeText = pos.large+'px';
        return pos;
    }
    
    $.configure = function(){
        // Menu Tour
        var cas = calloutStyles;
        var pos = {small:50,large:-18};
        var position = newPosition('60%','30%','275px',cas.none,cas.left);
        var rootStep = $.newStep('',
                              'Let\'s start with the menu. Click the corner to open and close',
                               position,
                              function(){$ionicSideMenuDelegate.toggleLeft(true)});
        $.steps.push(rootStep);
        pos = next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        $.steps.push($.subStep(rootStep,
                              'Settings let you change your password and log out.',
                               position)
                     );
        pos=next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        $.steps.push($.subStep(rootStep,
                              'Dashboard gives you engagement and other statistics at a glance.',
                               position)
                     );     
        pos=next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        $.steps.push($.subStep(rootStep,
                              'Schedule or Start a New Meeting with One Click.',
                               position)
                     );     
        pos=next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        $.steps.push($.subStep(rootStep,
                              'The Library Stores all your Pitch Decks. Build a new deck just like making a playlist',
                               position)
                     );       
        pos=next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        $.steps.push($.subStep(rootStep,
                              'Teams Let You Share Pitch Decks and other items',
                               position)
                     );  
        pos=next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        $.steps.push($.subStep(rootStep,
                              'These are all the meetings you\'ve organized',
                               position)
                     );  
        pos=next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        $.steps.push($.subStep(rootStep,
                              'Here are Invitations to Meetings you can Attend',
                               position)
                     );  
        pos=next(pos);
        position = newPosition(pos.smallText,pos.largeText,'275px',cas.topLeft,cas.left);
        if(!$rootScope.isMobile || $rootScope.showArchive)
        $.steps.push($.subStep(rootStep,
                              'The Archive Holds All your Old Pitches and Meetings',
                               position,
                              function(){$ionicSideMenuDelegate.toggleLeft(true)})
                     );  
        
        // Show them the library
        position = newPosition('44%','330px','30px',cas.top,cas.top);
        var state;
        if($rootScope.smallScreen())
            state = 'app.mobileLib';
        else
            state = 'app.library';
        var libStep = $.newStep(state,
                               'This is the slide library. Drop files here to upload (Desktop Only).<br> You can also import files from your Dropbox or Box account',
                               position,
                              function(){$ionicSideMenuDelegate.toggleLeft(false)});
        $.steps.push(libStep);
        position = newPosition('16%','106px','30px',cas.top,cas.top);
        $.steps.push($.subStep(libStep,
                              'You can categorize your slides for quick re-use. For example: file type, subject, industry, funnel-stage etc.',
                               position)
                     );  
        position = newPosition('16%','106px','50px',cas.topRight,cas.topRight);
        $.steps.push($.subStep(libStep,
                              'Combine your slides into pitch \'decks\' using \'Pitch Perfect\'. Just add a new deck, name it, and start adding the slides you need. Click (or Tap) on the slide to re-order and then Tap again on another slide. The slide will be placed in front of the slide you tap (or click).',
                               position)
                     );  
        position = newPosition('425px','110px','275px');
        $.steps.push($.subStep(libStep,
                              'On a Mobile device, slide the item left to reveal options. For Desktops, just click the options drop down. Here you can edit an item, share it with your team or create a new meeting.',
                               position)
                     );  
        position = newPosition('40%','300px','400px');
        $.steps.push($.subStep(libStep,
                              'Our \'Getting Started Guide\' is a great way to get up to speed.',
                               position,
                               null,
                               'ext'
                               )
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