'use strict';

/**
* A Wizard service to build a new session
*/

angular.module('RevuMe')

.controller('datetimeCtrl',['$scope','wizardService',
function($scope,wizardService){
    $scope.step = {};
    // handy shorthand
    var $ = $scope.step;
    $.date = new Date();
    $.time = $.date;
    $.idx = wizardService.findStep("templates/datetime.html");

    $.datepickerObject = {
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
                $.datepickerObject.inputDate = val;
                $.date = val;
                wizardService.session.date = $.date;
            }
        },
        dateFormat: 'dd-MM-yyyy', //Optional
        closeOnSelect: false, //Optional
    };

   $.timePickerObject = {
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
                $.timePickerObject.inputEpochTime = val;
                var hours = Math.trunc(val/3600);
                var minutes = (val-(hours*3600))/60;
                $.time = $.date;
                $.time.setHours(hours);
                $.time.setMinutes(minutes);
                $.time.setSeconds(0);
                $.time.setMilliseconds(0);
                wizardService.session.time = $.time;
            }
        }
    };
    $.timePickerObject.inputEpochTime = ($.time.getHours() * 3600);
}]) 
//controller for step2 set attendees
.controller('attendeesCtrl',['$rootScope','$scope','wizardService','SalesforceService','TeamService','ionicToast',
function($rootScope,$scope,wizardService,SalesforceService,TeamService,ionicToast){
    //get the teams from the team service
    TeamService.getAll($rootScope.user._id).then(function(teams){
        $scope.teams = teams;
    });
    //get the salesforce service
    $scope.sfdc = SalesforceService;
    //the step is the primary object
    $scope.step = {};
    var $ = $scope.step;
    $.idx = wizardService.findStep('templates/attendees.html');
    //helper function to build event names
    function eventName(event){
        var evt = 'step'+$.idx.toString()+'.'+event;
        return evt;
    }
    
    $.attendees = [];
    $.showDelete = false;
    $.showAdd=false;
    $.views=[];
    //invitees view
    var view = new Object();
    view.name = 'Invitees';
    $.views.push(view);
    //Team View
    view = new Object();
    view.name = 'Teams';
    $.views.push(view);
    //Salesforce view
    view = new Object();
    $.showSalesforce = function(){
        $scope.sfdc.query("Select name from Account where owner.firstname='Kevin' AND Owner.lastname='Lynch'")
        .then(function(items){
            $.sfdcItems= items.records;
        });
    }
    view.name = 'Salesforce';
    view.cb = $.showSalesforce;
    $.views.push(view);
    $.setView = function(viewIdx){
        $.currentView = viewIdx;
        $.showAdd=false;
        var cb = $.views[$.currentView].cb || function(){};
        cb();
    }
    $.setView(0);
    $.teamChange = function(index){
        var team = $scope.teams[index];
        //add a team to attendees
        if(team.included == true){
            team.members.forEach(function(member){
                member.teamIdx = index;
                $.attendees.push(member);
            });
            var msg = team.members.length.toString()+' Members Added';
            ionicToast.show(msg,'top',false,2000);
        } else {//remove the team
            var copy = []
            var idx =0;
            $.attendees.forEach(function(attendee){
                if(attendee.teamIdx == undefined || attendee.teamIdx != index)
                    copy.push(attendee);
            });
            $.attendees = copy.slice(0);
            var msg = team.members.length.toString()+' Members Removed';
            ionicToast.show(msg,'top',false,2000);
        }    
    }
    $.delUser = function(idx){
        $.attendees.splice(idx,1);
    }
    $.addUser = function(){
        var user = {};
        user.firstName = this.firstName;
        user.lastName = this.lastName;
        user.email = this.email;
        $.attendees.push(user);
        var msg = $.firstName+' '+$.lastName+' has been added';
        ionicToast.show(msg,'top',false,2000);
        $.firstName = $.lastName = $.email = '';
    }
    $.toggleShowDelete=function(){
        $.showDelete = !$.showDelete;
    }
    $.toggleShowAdd = function(){
        $.showAdd = !$.showAdd;
    }

    $scope.enter = wizardService.$on(eventName('enter'),function(){
        $.showAdd=$.showDelete=false;
        $.setView(0);
    });
    $scope.start = wizardService.$on('start',function(){
        $scope.teams.forEach(function(team){
            team.included = false;
        });
        $.attendees = [];
    });
    $scope.$on('$destroy',function(){
        wizardService.$off($scope.enter);
        wizardService.$off($scope.start);
    });
}])
.controller('sharedContentCtrl',['$rootScope','$scope','wizardService','SessionBuilder','Library',
function($rootScope,$scope,wizardService,SessionBuilder,Library){
    $scope.step = {};
    var $ = $scope.step;
    $.idx = wizardService.findStep('templates/sharedContent.html');
    $scope.sb = SessionBuilder;
    $scope.library = Library;
    
    function eventName(event){
        var evt = 'step'+$.idx.toString()+'.'+event;
        return evt;
    }
    $scope.enter = wizardService.$on(eventName('enter'),function(){
         // load decks on entry if not already loaded
         if($.decks == undefined)
             $scope.sb.loadDecks().then(function(decks){
                 if(decks != undefined)
                     $.decks = decks
                 $rootScope.hideLoading();
             });
         else{ //decks are loaded just connect to the upload event
            $scope.sb.decks = $.decks;
            $scope.sb.connect();
         }
     });
     $scope.exit = wizardService.$on(eventName('exit'), function(){
        $scope.sb.disconnect(); //we're disappearing so stop listening for uploads
    });
    $scope.$on('$destroy',function(){
        wizardService.$off($scope.enter);
        wizardService.$off($scope.exit);
    });
}])
//salesforce popup controller
.controller('sfdcCtrl',['$rootScope','$scope','wizardService','SalesforceService','TeamService','ionicToast',
function($rootScope,$scope,wizardService,SalesforceService,TeamService,ionicToast){
}])
//controller for the wizard modal view (template)      
.controller('wizardCtrl',['$rootScope','$scope','wizardService',
function($rootScope,$scope, wizardService){
    
    $scope.wizard = wizardService;
    $scope.wizard.name = 'Create a New Meeting';

}])
.service('wizardService', ['$rootScope',
                           '$ionicSlideBoxDelegate',
                           '$ionicScrollDelegate',
                           '$ionicModal',
                           '$q',
                           'onEvent',
 function ( $rootScope,
            $ionicSlideBoxDelegate,
            $ionicScrollDelegate,
            $ionicModal,
            $q,
            onEvent) {
     var $ = this;
    
    // the wizard has a group of steps it displays
    // each step has a template and a controller
    $.steps = [];
    $.current = 0;
    
    // enable events for this service
    onEvent.attach($);
    // initialize the wizard with the calling scope
    $.init = function($scope){
        $.current = 0;
        $.scope = $scope;
        $.buildSteps();
    }
    // run the wizard against the current scope - must init before this call is made
    $.run = function(session){
        $.deferred = $q.defer();
        $.session = session;
        $ionicModal.fromTemplateUrl('templates/wizard.html',{
            scope: $.scope,
            animation:'slide-in-up'
        }).then(function(modal){
            $.wizardModal = modal;
            return $.wizardModal.show()
        }).then(function(){
            $rootScope.hideLoading();
        });
        return $.deferred.promise;
    }
    // navigation controls
    $.complete = function(){
        $.wizardModel.hide();
        $.$fire('end');
        if($.wizardModal != undefined)
           $.wizardModal.remove();
        if($.deferred != undefined)
            $.deferred.resolve({success:true});
    }
    $.cancel = function(){
        $.wizardModal.hide();
        $.$fire('end');
        if($.wizardModal != undefined)
           $.wizardModal.remove();
        if($.deferred != undefined)
            $.deferred.resolve({success:false});
    }
    $.nextStep = function() {
        var c = $.current;
        $.setStep(++c);
        $ionicSlideBoxDelegate.slide($.current);
        $ionicSlideBoxDelegate.update();
    }
    
    $.prevStep = function() {
        var c = $.current;
        $.setStep(--c);
        $ionicSlideBoxDelegate.slide($.current);
        $ionicSlideBoxDelegate.update();
    };

    function eventName(stepNumber, event){
        return 'step'+stepNumber.toString()+'.'+event;
    }
    $.setStep = function(stepNumber) {
        if(stepNumber >= $.steps.length-1) 
            stepNumber = $.steps.length-1;
        else if(stepNumber <= 0) 
            stepNumber = 0;
        //fire onExit for current step
        var c = $.current;
        var n = stepNumber;
        // fire onExit for current step
        $.$fire(eventName(c,'exit'));
        // fire onEnter for next Step
        $.$fire(eventName(n,'enter'));
        $.current = stepNumber;
        $.nextEnabled = true;
        $.prevEnabled = true;
        $ionicSlideBoxDelegate.slide($.current);
    };
    //biuld the wizard steps
    $.buildSteps = function(){
        if($.steps.length>0)
            $.$fire('start');
        else {
            $.steps = [];
            // Step 1 is Meeting Name and Time
            var step = {};
            step.heading = 'Date & Time';
            step.template = "templates/datetime.html";
            $.steps.push(step);

            //Step2 - Add attendees
            step = {};
            step.heading = 'Who\'s Invited';
            step.template = 'templates/attendees.html';
            $.steps.push(step);

            //Step3 - Add Shared Content for the Meeting
             step = {};
             step.heading = 'Shared Content';
             step.template = 'templates/sharedContent.html';
             $.steps.push(step);
        }
    } 
    $.findStep = function(template){
        var idx = -1;
        for(var i=0;i<$.steps.length;i++){
            if($.steps[i].template == template){
                idx = i;
                break
            }
        }
        return idx;
    }
                
}]);
    