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
    $.name = '';
    $.description = '';
    
    //connect to the wizard step so we can send valid signal
    $.idx = wizardService.findStep("templates/datetime.html");
    $.wizardStep = wizardService.steps[$.idx];
    //set the session date and time in case they pick the default
    wizardService.session.date = $.date;
    var hours = $.date.getHours();
    $.time.setHours(hours);
    $.time.setMinutes(0);
    $.time.setSeconds(0);
    $.time.setMilliseconds(0);
    wizardService.session.time = $.time;
    
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
    function checkValid(){
        if($.name != '' && $.description != '')
            $.wizardStep.valid = true;
        else
            $.wizardStep.valid = false;
    }
    $.changeName = function(){
        wizardService.session.name = $.name;
        checkValid();
    }
    $.changeDescription = function(){
        wizardService.session.description = $.description;
        checkValid();
    }
    $.changeBridge = function(){
        wizardService.session.bridge = $.bridge;
    }
}]) 
//controller for salesforce modal to select attendees
.controller('sfdcCtrl',['$rootScope',
                        '$scope',
                        'wizardService',
                        'SalesforceService',
                        'ionicToast',
                        '$timeout',
                        '$q',
                        'baseUrl',
                        '$ionicPopup',
function($rootScope,
          $scope,
          wizardService,
          SalesforceService,
          ionicToast,
          $timeout,
          $q,
          baseUrl,
          $ionicPopup){
    $scope.sfdc = {};
    
    //shorthand
    var $ = $scope.sfdc;
    $.banner = baseUrl.endpoint+'/img/sfdcBanner.png';
    // get our step from the wizard
    var idx = wizardService.findStep('templates/attendees.html');
    $scope.step = wizardService.steps[idx];
    
    // setup the sObjects for Salesforce
    $scope.sObjects = [{
            name : 'Account',
            query: {
                base: 'Select (Select Name, Email, Account.Name from Contacts @person) from Account @owner @company',
                where:{
                    company:"AND Name Like '@company%'",
                    person:"Where Name Like '@person%'",
                },
            }, 
            processResults : function(results){
                var records = results.records;
                var items = [];
                if(records.length>0){
                    records.forEach(function(record){
                        if(record.Contacts != undefined){
                            record.Contacts.records.forEach(function(Contact){
                                var u = {};
                                u.Name = Contact.Name;
                                u.Email = Contact.Email;
                                u.Company = Contact.Account.Name;
                                items.push(u);
                            });
                        }
                    });
                }
                return items;
            },
        },
        {
            name : 'Contact',
            query: {
                base:"Select Name, Email, Account.Name from Contact @owner @company @person",
                where : {
                    company:"AND Account.Name Like '@company%'",
                    person: "AND Name Like '@person%'"
                },
            },
            processResults : function(results){
                return results.records;
            },
        },
        {
            name : 'Lead',
            query: {
                base: "Select Name, Email, Company from Lead @owner @company @person",
                where: {
                    company:"AND Company LIKE '@company%'",
                    person:"AND Name Like '@person%'",
                },
            },
            processResults : function(results){
                return results.records;
            },
        },
        {
            name : 'Opportunity',
            query: {
                base: 'Select Account.Name,(Select Contact.Name, Contact.Email from OpportunityContactRoles @person) from Opportunity @owner @company',
                where:{
                    company:"AND Account.Name Like '@company%'",
                    person:"Where Contact.Name Like '@person%'",
                },
            },
            processResults : function(results){
                var records = results.records;
                var items = [];
                var accountName ='';
                if(records.length>0){
                    records.forEach(function(record){
                        accountName = record.Account.Name;
                        var ocr = record.OpportunityContactRoles;
                        if(ocr != undefined){
                            ocr.records.forEach(function(cr){
                                var u = {};
                                u.Name= cr.Contact.Name;
                                u.Email = cr.Contact.Email;
                                u.Company = accountName;
                                items.push(u);
                            });
                        }
                    });
                }
                return items;
            },
        },
    ];
    //default to contacts
    $.object = $scope.sObjects[1]; 

            
    //initalize the models
    $scope.init = function(){
        $.people = [];
        $.company = '';
        $.person ='';
        // get our step from the wizard
        var idx = wizardService.findStep('templates/attendees.html');
        $scope.step = wizardService.steps[idx];
        $scope.step.attendees = [];
    }
    
    function buildQuery(){
        var sObj = $.object;
        var ownerQs = 'Where owner.Name='+"'"+$scope.nativeUser+"'";
        var companyQs = '';
        var personQs = '';
        var qs = '';
        if($.company != '')
            companyQs = sObj.query.where.company.replace('@company',$.company);
        if($.person != '')
            personQs = sObj.query.where.person.replace('@person',$.person);
        var qs = sObj.query.base
        .replace('@owner',ownerQs)
        .replace('@company',companyQs)
        .replace('@person',personQs);
        return qs
    }
        
    $scope.query = function(){
        var qs = buildQuery();
        qs = encodeURIComponent(qs);
        SalesforceService.query(qs)
        .then(function(results){
            $timeout(function(){
                $.people = $.object.processResults(results);
            },0);
        }).catch(function(error){
            console.log(error);
            var template = 'code : '+error.code
            template +='<br> message : '+error.message;
            var alert = $ionicPopup.alert({
                title:'Salesforce API Error!',
                template: template
            });
            alert.then(function(){
                console.log('Alerted!');
            });
        });
    }
    // add an attendee to the step
    $.changeAttendee = function(index){
        if($.people[index].included){
            var user = $.people[index]
            var names = user.Name.split(' ');
            var u = {}
            u.firstName = names[0];
            u.lastName = names[1];
            u.email = user.Email;
            $scope.step.attendees.push(u);
            var msg = $.people[index].Name+' has been added';
            ionicToast.show(msg,'top',false,2000);
        }else {
            var user = $.people[index]
            var idx =0;
            var found = -1
            $scope.step.attendees.forEach(function(a){
                if(a.email == user.Email)
                    found = idx;
                idx++;
            });
            if(found>=0){
                $scope.step.attendees.splice(found,1);
                var msg = user.Name+' has been removed';
                ionicToast.show(msg,'top',false,2000);
            }
        }       
    }
    //change events
    $.changePerson = function(){
        $scope.query();
    }
    $.changeCompany = function(){
        $scope.query();
    }
    $.changeObject = function(){
        $scope.init();
    }
    $scope.$on('Revu.Me:SFDCShow',function(){
        SalesforceService.getNativeUser().then(function(nativeUser){
            $scope.nativeUser = nativeUser;
            $scope.init();
        });
    });
}])
    

//controller for step2 set attendees
.controller('attendeesCtrl',['$rootScope',
                             '$scope',
                             '$ionicModal',
                             'wizardService',
                             'TeamService',
                             'SessionBuilder',
                             'ionicToast',
                             '$ionicPopup',
                             '$timeout',
                             'baseUrl',
function($rootScope,
        $scope,
        $ionicModal,
        wizardService,
        TeamService,
        SessionBuilder,
        ionicToast,
        $ionicPopup,
        $timeout,
        baseUrl){
    //get the teams from the team service
    TeamService.getAll($rootScope.user._id).then(function(teams){
        $scope.teams = teams;
    });
    //Session Builder
    $scope.sb = SessionBuilder;
    //the step is the primary object
    $scope.step = {};
    var $ = $scope.step;
    $.idx = wizardService.findStep('templates/attendees.html');
    $.wizardStep = wizardService.steps[$.idx];
    
    //helper function to build event names
    function eventName(event){
        var evt = 'step'+$.idx.toString()+'.'+event;
        return evt;
    }
    //create the sfdc modal to select attendees from salesforce
    $ionicModal.fromTemplateUrl('templates/sfdcAttendee.html',{
        scope: $scope,
        animation:'slide-in-up'
    }).then(function(modal){
        $.sfdcModal = modal;
    });
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
        $.sfdcModal.show().then(function(){
            $rootScope.$broadcast('Revu.Me:SFDCShow');
        });
    }
    $.hideSalesforce = function(){
        //get attendees that the modal stashed in the service
        var attendees = wizardService.steps[$.idx].attendees;
        attendees.forEach(function(a){
            $.attendees.push(a);
        });
        $.sfdcModal.hide();
        $.setView(0);
        checkValid();
    }
    view.name = '';
    view.img = baseUrl.endpoint+'/img/salesforce.png';
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
        checkValid();
    }
    function checkValid(){
        if($.attendees.length>0)
            $.wizardStep.valid = true;
        else
            $.wizardStep.valid=false;
        wizardService.session.attendees = $.attendees.slice(0);
    }
    $.delUser = function(idx){
        $.attendees.splice(idx,1);
        checkValid();
    }
    $.addUser = function(){
        var user = {};
        user.firstName = this.firstName;
        user.lastName = this.lastName;
        user.email = this.email.toLowerCase();
        $.attendees.push(user);
        var msg = $.firstName+' '+$.lastName+' has been added';
        ionicToast.show(msg,'top',false,2000);
        $.firstName = $.lastName = $.email = '';
        checkValid();
    }
    $.toggleShowDelete=function(){
        $.showDelete = !$.showDelete;
    }
    $.addUserPopup = function(){
        function validateEmail(email) {
            var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
    //build an instance of the add user popup
        $.message = '';
        $.firstName = $.lastName = $.email = '';
        $.addMultiple = false;
        $ionicPopup.show({
            scope: $scope,
            title: 'Add New Invitee',
            templateUrl: "templates/addUserPopup.html",
            buttons: [
              { text: 'Close',
                type: 'button-assertive'},
              {
                text: '<b>Add</b>',
                type: 'button-calm',
                onTap: function(e) {
                    if($.firstName == '' || $.lastName == '' || $.email == ''){
                        $.message = 'Please Complete the Form!'
                        $timeout(function(){
                            $.message = ''
                        },2000);
                        e.preventDefault();
                    }
                    else if($.firstName == undefined || $.lastName == undefined || $.email == undefined){
                        $.message = 'Please Complete the Form!'
                        $timeout(function(){
                            $.message = ''
                        },2000);
                        e.preventDefault(); 
                    } else {
                        if(validateEmail($.email)){
                            if($.addMultiple){
                                $.addUser();
                                e.preventDefault();
                            }
                            else
                                return true;
                        }else{
                            $.message = 'Invalid Email!'
                            $timeout(function(){
                                $.message = ''
                            },2000);
                            e.preventDefault(); 
                        }
                    }
                }
              }
            ]
        }).then(function(result){
            if(result === true)
                $.addUser();
        });
    }

    $scope.enter = wizardService.$on(eventName('enter'),function(){
        $.showAdd=$.showDelete=false;
        $.setView(0);
    });
    $scope.exit = wizardService.$on(eventName('exit'), function(){
        
       $.attendees.forEach(function(a){ //we're disappearing add the attendees to the session
            console.log(a);
           
            //start from scratch
            $scope.sb.session.attendees = [];
            $scope.sb.session.attIds = [];
           
            $scope.sb.addAttendee(a);
            
        });
        
    });
    $scope.start = wizardService.$on('start',function(){
        $scope.teams.forEach(function(team){
            team.included = false;
        });
        $.attendees = [];
    });
    $scope.$on('$destroy',function(){
        wizardService.$off($scope.enter);
        wizardService.$off($scope.exit);
        wizardService.$off($scope.start);
    });
}])
.controller('sharedContentCtrl',['$rootScope','$scope','wizardService','SessionBuilder','Library',
function($rootScope,$scope,wizardService,SessionBuilder,Library){
    $scope.step = {};
    var $ = $scope.step;
    $.idx = wizardService.findStep('templates/sharedContent.html');
    $.wizardStep = wizardService.steps[$.idx];
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
     function checkValid(){
         if($scope.sb.session.decks.length>0)
             $.wizardStep.valid = true;
         else
             $.wizardStep.valid = false;
     }
     $.addDeck = function(index){
         $scope.sb.addDeck(index);
         checkValid();
     }
     $.delDeck = function(index){
         $scope.sb.delDeck(index);
         checkValid();
     }
     $scope.exit = wizardService.$on(eventName('exit'), function(){
        $scope.sb.disconnect(); //we're disappearing so stop listening for uploads
    });
    $scope.$on('$destroy',function(){
        wizardService.$off($scope.enter);
        wizardService.$off($scope.exit);
    });
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
        $.wizardModal.hide();
        $.$fire('end');
        $.showSummary = false;
        if($.wizardModal != undefined)
           $.wizardModal.remove();
        if($.deferred != undefined)
            $.deferred.resolve({success:true});
    }
    $.cancel = function(){
        $.wizardModal.hide();
        $.$fire('end');
        $.showSummary = false;
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
        $.showSummary = false;
        if(stepNumber >= $.steps.length){ //this is the summary view (a hidden step)
            $.showSummary = true;
            // fire exit on the last step
            $.$fire(eventName($.current,'exit'));
            $.current = stepNumber;
            $.nextEnabled = true;
            $.prevEnabled = true;
        } else { // dont go to step if it is not valid
            if(stepNumber <= 0)
                stepNumber = 0;
            //if showing summary let them go back
            if($.current >= $.steps.length && stepNumber <= $.steps.length){
                //fire onExit for current step
                var c = $.current;
                var n = stepNumber;
                // fire onEnter for next Step
                $.$fire(eventName(n,'enter'));
                $.current = stepNumber;
                $.nextEnabled = true;
                $.prevEnabled = true;
                $ionicSlideBoxDelegate.slide($.current);
            // otherwise we're a normal step so handle accordingly
            } else if($.steps[$.current].valid == true || stepNumber <= $.current){
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
            }
        } 
    };
    //biuld the wizard steps
    $.buildSteps = function(){
        $.showSummary = false;
        if($.steps.length>0){
            $.$fire('start');
             $.steps.forEach(function(s){
                 s.valid = false;
             });
        }else {
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
             $.steps.forEach(function(s){
                 s.valid = false;
             });
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
    