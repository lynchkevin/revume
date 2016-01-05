'use strict';

/**
* A Wizard service to build a new session
*/

angular.module('RevuMe')

.service('wizardService', ['$rootScope',
                           '$ionicSlideBoxDelegate',
                           '$ionicScrollDelegate',
                           '$ionicModal',
                           'SessionBuilder',
                           'shareMediator',
                           'TeamService',
                           'SalesforceService',
                           'ionicToast',
                           '$q',
 function ( $rootScope,
            $ionicSlideBoxDelegate,
            $ionicScrollDelegate,
            $ionicModal,
            SessionBuilder,
            shareMediator,
            TeamService,
            SalesforceService,
            ionicToast,
            $q) {
     var $ = this;
    

    $.wizard = {};
    $.wizard.name = 'Create a New Meeting';
    $.wizard.steps = [];
    $.wizard.current = 0;
    $.sfdc = SalesforceService;
    $.sb = SessionBuilder;

     

    $rootScope.$on('$destroy',function(){
        if($.wizardModal != undefined)
            $.wizardModal.remove();
    });
    $rootScope.$on('Revu.Me:Ready',function(){
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $.wizard.teams = teams;
        });
    });

    // initialize the wizard with the calling scope
    $.init = function(){
        $.wizard.current = 0;
        //clean up old Modals if they exist
        if($.wizardModal != undefined)
           $.wizardModal.remove();
        //create a new modal for the calling scope
        $.scope = $.sb.scope;
        // attach the wizard to the scope
        $.scope.wizard = $.wizard;
        $ionicModal.fromTemplateUrl('templates/wizard.html',{
            scope: $.scope,
            animation:'slide-in-up'
        }).then(function(modal){
            $.wizardModal = modal;
        });
        $.buildSteps();
    }
    // run the wizard against the current scope - must init before this call is made
    $.run = function(session){
        $.deferred = $q.defer();
        $.wizardModal.show().then(function(){
            $rootScope.hideLoading();
        });
        return $.deferred.promise;
    }
    // navigation controls
    $.wizard.complete = function(){
        $.wizardModel.hide();
        $.exitAll();
        $.wizardModal.remove();
        if($.deferred != undefined)
            $.deferred.resolve({success:true});
    }
    $.wizard.cancel = function(){
        $.wizardModal.hide();
        $.exitAll();
        $.wizardModal.remove();
        if($.deferred != undefined)
            $.deferred.resolve({success:false});
    }
    $.wizard.nextStep = function() {
        var c = $.wizard.current;
        $.wizard.setStep(++c);
        $ionicSlideBoxDelegate.slide($.wizard.current);
        $ionicSlideBoxDelegate.update();
    }
    
    $.wizard.prevStep = function() {
        var c = $.wizard.current;
        $.wizard.setStep(--c);
        $ionicSlideBoxDelegate.slide($.wizard.current);
        $ionicSlideBoxDelegate.update();
    };
     
    $.wizard.setStep = function(stepNumber) {
        if(stepNumber >= $.wizard.steps.length-1) 
            stepNumber = $.wizard.steps.length-1;
        else if(stepNumber <= 0) 
            stepNumber = 0;
        //call on onExit for current step
        var c = $.wizard.current;
        var n = stepNumber;
        if($.wizard.steps[c].onExit != undefined)
            $.wizard.steps[c].onExit();
        //call onEnter for next step
        if($.wizard.steps[n].onEnter != undefined)
            $.wizard.steps[n].onEnter();
        $.wizard.current = stepNumber;
        $.wizard.nextEnabled = true;
        $.wizard.prevEnabled = true;
        $ionicSlideBoxDelegate.slide($.wizard.current);
    };
    //biuld the wizard steps
    $.buildSteps = function(){
        if($.wizard.steps.length>0){
            $.wizard.steps[1].attendees = []
            $.wizard.teams.forEach(function(team){
                team.included = false;
            });
        } else {
            $.wizard.steps = [];
            // Step 1 is Meeting Name and Time
            var step1 = {};
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
                        this.time = step1.date;
                        this.time.setHours(hours);
                        this.time.setMinutes(minutes);
                        this.time.setSeconds(0);
                        this.time.setMilliseconds(0);
                    }
                }
            };
            step1.timePickerObject.inputEpochTime = (step1.time.getHours() * 3600);
            $.wizard.steps.push(step1);

            //Step2 - Add attendees
            var step2 = {};
            step2.heading = 'Who\'s Invited';
            step2.template = 'templates/attendees.html';
            step2.attendees = [];
            step2.showDelete = false;
            step2.showAdd=false;
            step2.views=[];
            var view = new Object();
            view.name = 'Invitees';
            step2.views.push(view);
            view = new Object();
            view.name = 'Teams';
            step2.views.push(view);
            view = new Object();
            view.name = 'Salesforce';
            step2.views.push(view);
            step2.setView = function(viewIdx){
                this.currentView = viewIdx;
                this.showAdd=false;
                if(this.views[this.currentView].name == 'Salesforce'){
                    $.sfdc.query("Select name from Account where owner.firstname='Kevin' AND Owner.lastname='Lynch'")
                    .then(function(items){
                        step2.sfdcItems= items.records;
                    });
                }
            }
            step2.setView(0);
            step2.teamChange = function(index){
                var team = $.wizard.teams[index];
                //add a team to attendees
                if(team.included == true){
                    team.members.forEach(function(member){
                        member.teamIdx = index;
                        step2.attendees.push(member);
                    });
                    var msg = team.members.length.toString()+' Members Added';
                    ionicToast.show(msg,'top',false,2000);
                } else {//remove the team
                    var copy = []
                    var idx =0;
                    this.attendees.forEach(function(attendee){
                        if(attendee.teamIdx == undefined || attendee.teamIdx != index)
                            copy.push(attendee);
                    });
                    this.attendees = copy.slice(0);
                    var msg = team.members.length.toString()+' Members Removed';
                    ionicToast.show(msg,'top',false,2000);
                }    
            }
            step2.delUser = function(idx){
                this.attendees.splice(idx,1);
            }
            step2.addUser = function(){
                var user = {};
                user.firstName = this.firstName;
                user.lastName = this.lastName;
                user.email = this.email;
                this.attendees.push(user);
                var msg = this.firstName+' '+this.lastName+' has been added';
                ionicToast.show(msg,'top',false,2000);
                this.firstName = this.lastName = this.email = '';
            }
            step2.toggleShowDelete=function(){
                this.showDelete = !step2.showDelete;
            }
            step2.toggleShowAdd = function(){
                this.showAdd = !step2.showAdd;
            }
            step2.onEnter = function(){
                this.showAdd=this.showDelete=false;
                this.setView(0);
            }
            $.wizard.steps.push(step2);

            //Step3 - Add Shared Content for the Meeting
             var step3 = {};
             step3.heading = 'Shared Content';
             step3.template = 'templates/sharedContent.html';
             step3.onEnter = function(){
                 // load decks on entry if not already loaded
                 if(step3.decks == undefined)
                     $.sb.loadDecks().then(function(decks){
                         if(decks != undefined)
                             step3.decks = decks
                         $rootScope.hideLoading();
                     });
                 else{ //decks are loaded just connect to the upload event
                    $.sb.decks = step3.decks;
                    $.sb.connect();
                 }
             }
             step3.onExit = function(){
                 $.sb.disconnect(); //we're disappearing so stop listening for uploads
             }
             $.wizard.steps.push(step3);
        }
    }
    //called when we are exiting the wizard
    $.exitAll = function(){
        $.wizard.steps.forEach(function(step){
            if(step.onExit != undefined)
                step.onExit();
        });
    }

     
     
    
}]);
    