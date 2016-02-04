'use strict';

/**
* A Wizard service to build a new session
*/

angular.module('RevuMe')

// controller for the step that sets name/description/date/time/conference
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
    $scope.session = wizardService.sb.session;
    $.bridge = $scope.session.bridge;

    //set the session date and time in case they pick the default
    wizardService.sb.session.date = $.date;
    var hours = $.date.getHours();
    $.time.setHours(hours);
    $.time.setMinutes(0);
    $.time.setSeconds(0);
    $.time.setMilliseconds(0);
    wizardService.sb.session.time = $.time;
    // connect to the date and time picker
    $.datepickerObject = wizardService.datepickerObject;
    $.timePickerObject = wizardService.timePickerObject;
    $.timePickerObject.inputEpochTime = ($.time.getHours() * 3600);
    
    function checkValid(){
        if($.name != '' && $.description != '')
            $.wizardStep.valid = true;
        else
            $.wizardStep.valid = false;
    }
    $.changeName = function(){
        wizardService.sb.session.name = $.name;
        checkValid();
    }
    $.changeDescription = function(){
        wizardService.sb.session.description = $.description;
        checkValid();
    }
    $.changeBridge = function(){
        wizardService.sb.session.bridge = $.bridge;
    }
}]) 
//controller for salesforce modal to select attendees
.controller('sfdcCtrl',['$rootScope',
                        '$scope',
                        'wizardService',
                        'SalesforceService',
                        '$ionicModal',
                        'ionicToast',
                        '$timeout',
                        '$q',
                        'baseUrl',
                        '$ionicPopup',
function($rootScope,
          $scope,
          wizardService,
          SalesforceService,
          $ionicModal,
          ionicToast,
          $timeout,
          $q,
          baseUrl,
          $ionicPopup){
    $scope.sfdc = {};
    
    //shorthand
    var $ = $scope.sfdc;
    $.banner = baseUrl.endpoint+'/img/sfdcBanner.png';
    $.img = baseUrl.endpoint+'/img/salesforce.png';
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
                    var validResult = false;
                    records.forEach(function(record){
                        if(record.Contacts != undefined){
                            validResult = true;
                            record.Contacts.records.forEach(function(Contact){
                                var u = {};
                                u.Name = Contact.Name;
                                u.Email = Contact.Email;
                                u.Company = Contact.Account.Name;
                                items.push(u);
                            });              
                        }
                    });
                    if(!validResult){//not contacts found - so insert a stub
                            var u = {Name:'No Records Found'};
                            items.push(u);
                            validResult = true;
                    }   
                }else{//not contacts found - so insert a stub
                    var u = {Name:'No Records Found'};
                    items.push(u);
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
                if(results.records.length>0)
                    return results.records;
                else{
                        var u = {Name:'No Records Found'};
                        results.records.push(u);
                        return results.records;
                    }
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
                if(results.records.length > 0)
                    return results.records;
                else{
                    var u = {Name:'No Records Found'};
                    results.records.push(u);
                    return results.records;
                }
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
                //don't add an account twice
                var exists = function(company){
                    return items.some(function(item){
                        if(item.Company==company)
                            return true;
                    });
                }   
                if(records.length>0){
                    var validResult= false;
                    records.forEach(function(record){
                        accountName = record.Account.Name;
                        if(!exists(accountName)){
                            var ocr = record.OpportunityContactRoles;
                            if(ocr != undefined){
                                validResult = true;
                                ocr.records.forEach(function(cr){
                                    var u = {};
                                    u.Name= cr.Contact.Name;
                                    u.Email = cr.Contact.Email;
                                    u.Company = accountName;
                                    items.push(u);
                                });
                            }
                        }
                    });         
                    if(!validResult){//not contacts found - so insert a stub
                            var u = {Name:'No Records Found'};
                            items.push(u);
                            validResult = true;
                    }   
                }else{
                    var u = {Name:'No Records Found'};
                    items.push(u);
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
    //show hide this modal
    $scope.showSalesforce = function(fromWizard){
        //we handle the hide differently if we are called directly or from the wizard
        if(fromWizard == undefined)
            $scope.fromWizard = false;
        else
            $scope.fromWizard = fromWizard;
        $rootScope.showLoading();
        SalesforceService.getNativeUser().then(function(nativeUser){
            $scope.nativeUser = nativeUser;
            $scope.init();        
            //create the sfdc modal to select attendees from salesforce
            $ionicModal.fromTemplateUrl('templates/sfdcAttendee.html',{
                scope: $scope,
                animation:'slide-in-up'
            }).then(function(modal){
                $scope.sfdcModal = modal;
                return $scope.sfdcModal.show();
            }).then(function(){
                $rootScope.hideLoading();
            });
        });

    }
    $scope.hideSalesforce = function(){
        var promises = [];
        $scope.step.attendees.forEach(function(attendee){
            promises.push(wizardService.sb.addAttendee(attendee));
        });
        $q.all(promises).then(function(){
            $scope.sfdcModal.hide();
            $scope.sfdcModal.remove();    
            $rootScope.$broadcast('Revu.Me:sfdcUpdate')
        });
    }
}])
    

//controller for step2 set attendees
.controller('attendeesCtrl',['$rootScope',
                             '$scope',
                             'wizardService',
                             'TeamService',
                             'ionicToast',
                             '$ionicPopup',
                             '$timeout',
                             'baseUrl',
                             '$q',
function($rootScope,
        $scope,
        wizardService,
        TeamService,
        ionicToast,
        $ionicPopup,
        $timeout,
        baseUrl,
         $q){

    //the step is the primary object
    $scope.step = {};
    var $ = $scope.step;
    $.idx = wizardService.findStep('templates/attendees.html');
    $.wizardStep = wizardService.steps[$.idx];
    // the salesforce controller stashes attendees in the step
    $.wizardStep.attendees = [];
    
    //this gets initialized by session builder
    TeamService.getAll($rootScope.user._id).then(function(teams){
        $scope.teams = teams;
        $scope.teams.forEach(function(team){
            team.included = false; 
        });
    });
    //helper function to build event names
    function eventName(event){
        var evt = 'step'+$.idx.toString()+'.'+event;
        return evt;
    }
    //initialize some other variables
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
    view.name = '';
    view.img = baseUrl.endpoint+'/img/salesforce.png';
    $.views.push(view);
    //sfdc broadcasts when done
    $scope.$on('Revu.Me:sfdcUpdate',function(){
        checkValid();
    });
    //the step has multiple views
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
            wizardService.sb.addTeam(index);
            $.attendees = wizardService.sb.session.attendees.slice(0);
            var msg = team.members.length.toString()+' Members Added';
            ionicToast.show(msg,'top',false,2000);
        } else {//remove the team
            wizardService.sb.removeTeam(index);
           $.attendees = wizardService.sb.session.attendees.slice(0);
            var msg = team.members.length.toString()+' Members Removed';
            ionicToast.show(msg,'top',false,2000);
        }   
        checkValid();
    }
    function checkValid(){
        //copy into a convenient variable for the view
        var session = wizardService.sb.session;
        $.attendees = session.attendees.slice(0);
        if(session.attendees.length>0)
            $.wizardStep.valid = true;
        else
            $.wizardStep.valid=false;
        $.setView(0);
    }
    $.delUser = function(idx){
        wizardService.sb.delAttendee(idx);
        checkValid();
    }
    $.addUser = function(){
        var user = {};
        user.firstName = this.firstName;
        user.lastName = this.lastName;
        user.email = this.email.toLowerCase();
        wizardService.sb.addAttendee(user).then(function(){
            var msg = $.firstName+' '+$.lastName+' has been added';
            ionicToast.show(msg,'top',false,2000);
            $.firstName = $.lastName = $.email = '';
            checkValid();
        });
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
    $scope.start = wizardService.$on('start',function(){
        //get the teams from the team service
        $scope.teams = wizardService.sb.session.teamList;
        $scope.teams.forEach(function(team){
            team.included = false;
        });
        //this is used only for the view - checkvalid copies here
        $.attendees = [];
    });
    $scope.$on('$destroy',function(){
        wizardService.$off($scope.enter);
        wizardService.$off($scope.start);
    });
}])
.controller('sharedContentCtrl',['$rootScope','$scope','wizardService',
function($rootScope,$scope,wizardService){
    $scope.step = {};
    var $ = $scope.step;
    $.idx = wizardService.findStep('templates/sharedContent.html');
    $.wizardStep = wizardService.steps[$.idx];
    $scope.sb = wizardService.sb;
    $scope.library = wizardService.sb.Library;
    
    function eventName(event){
        var evt = 'step'+$.idx.toString()+'.'+event;
        return evt;
    }
    function insertBuildDeckinFront(){
        if($.wizardStep.buildIdx != undefined){
            var idx = $.wizardStep.buildIdx;
            var theDeck = $.decks[idx];
            theDeck.added = true;
            //remove the deck from the list and insert in the front
            $.decks.splice(idx,1);
            $.decks.unshift(theDeck);
            $.wizardStep.buildIdx = undefined;
            checkValid();
        }
    }
    function loadDecks(){
        if($.decks == undefined)
             $scope.sb.loadDecks().then(function(decks){
                 if(decks != undefined)
                     $.decks = decks
                 $rootScope.hideLoading();
                 insertBuildDeckinFront();
             });
         else{ //decks are loaded just connect to the upload event
            $.decks = $scope.sb.decks;
            insertBuildDeckinFront();
        }
    }
    //cant count on enter if we are the first step
    loadDecks();
    // check if we need to modify the deck list based on 
    // building a new meeting from a deck

    $scope.enter = wizardService.$on(eventName('enter'),function(){
         // load decks on entry if not already loaded
        loadDecks();
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
    $scope.$on('$destroy',function(){
        wizardService.$off($scope.enter);
    });
}])
// controller for the step that summarizes and confirms the session
.controller('summaryCtrl',['$scope','wizardService','$timeout','$q','$ionicPopup',
function($scope,wizardService,$timeout,$q,$ionicPopup){
    
    //connect to the wizard step so we can send valid signal
    $scope.idx = wizardService.findStep("templates/summaryConfirm.html");
    $scope.wizardStep = wizardService.steps[$scope.idx];
    $scope.modal = wizardService.modal;
    
    //we need to have the session builder in our scope in order for 
    // subEdit to work from the session builder
    $scope.sb = wizardService.sb;
    
    //create a copy of the session in case of cancel
    $scope.saveSession = angular.copy(wizardService.sb.session);
    $scope.session = wizardService.sb.session;
    //also store away the date and time picker values
    $scope.saveDate = wizardService.datepickerObject.inputDate;
    $scope.saveTime = wizardService.timePickerObject.inputEpochTime;
    //also store away the sb decks so we no what has been added
    $scope.saveDecks = angular.copy(wizardService.sb.decks);
    
    //handy shorthand
    var $ = $scope.session;
    //initilize defaults
    $.shouldShowDelete = false;
    $.showTeams = false;
    
    // connect to the date and time picker
    $scope.datepickerObject = wizardService.datepickerObject;
    $scope.timePickerObject = wizardService.timePickerObject;  
    $scope.datepickerObject.inputDate = wizardService.datepickerObject.inputDate;
    $scope.timePickerObject.inputEpochTime = wizardService.timePickerObject.inputEpochTime;
    
    //standard function for building the event name based on step number
    function eventName(event){
        var evt = 'step'+$.idx.toString()+'.'+event;
        return evt;
    }
    function checkValid(){
        if($.decks.length>0 && $.attendees.length>0)
            $scope.wizardStep.valid = true;
        else
            $scope.wizardStep.valid = false; 
    }
    //need to check valid
    checkValid();
    $scope.$on('Revu.Me:sfdcUpdate',function(){
        checkValid();
    });
    
    function unsavedEdits(){
        var dirty = false;
        var ss = $scope.saveSession;
        
        if(ss.name != $.name || ss.description != $.description)
            dirty = true;
        if(ss.bridge != $.bridge || ss.length != $.length)
            dirty = true;
        if(ss.decks.length != $.decks.length || ss.attendees.length != $.attendees.length)
            dirty = true;
        if($scope.saveDate != $scope.datepickerObject.inputDate)
            dirty = true;
        if($scope.saveTime != $scope.timePickerObject.inputEpochTime)
            dirty = true;
        return dirty;
    }
    //if cancel edit - lets confirm so they don't lose changes
    function confirmCancel(){
        var defer = $q.defer();
        var confirm = $ionicPopup.confirm({
                title:'Unsaved Changes',
                template:'Do you want to save your changes?'
            });
            confirm.then(function(res){
                if(res){
                    defer.resolve(false);
                } else {
                    defer.resolve(true);
                }
            });
            return defer.promise;
    }
    
    $scope.cancel = function(){
        switch(wizardService.action){
            case 'New':
            case 'Build':
                //restore the old copy as if it never happened
                wizardService.sb.session = angular.copy($scope.saveSession);
                //restore the date and time
                wizardService.datepickerObject.inputDate = $scope.saveDate;
                wizardService.timePickerObject.inputEpochTime = $scope.saveTime;
                // reset the decks
                wizardService.sb.decks = angular.copy($scope.saveDecks);
                //if they cancel the confirm then tell the wizard to go back
                // the wizard will close the modal
                wizardService.prevStep();
                break;
            case 'Edit':
                if(unsavedEdits()){
                    confirmCancel().then(function(cancel){
                        if(cancel)
                            wizardService.cancel();
                        else
                            wizardService.complete();
                    });
                }else {
                    wizardService.cancel();
                }
                break;
        }
    }
    $scope.confirm = function(){
        wizardService.complete();
    }
    $scope.showDecks = function(){
        //this will add decks if needed
        wizardService.sb.subEdit($scope).then(function(){
            checkValid();
        });
    }
    $scope.delDeck = function($index){
        wizardService.sb.delDeck($index);
        checkValid();
    }
    $scope.addAttendee = function(){
        var fullName = $.formname;
        var email = $.formemail;
        var names = fullName.split(' ');
        var user = {};
        user.firstName = names[0];
        user.lastName = names[1];
        user.email = email;
        wizardService.sb.addAttendee(user).then(function(){
            $.formname = '';
            $.formemail = '';
            checkValid();
        });
    }
    $scope.delAttendee = function($index){
        wizardService.sb.delAttendee($index);
        checkValid();
    }
    $scope.addTeam = function(){
        wizardService.sb.addTeam();
        checkValid();
    }
    $scope.toggleListDelete = function(){
        $.shouldShowDelete = !$.shouldShowDelete;
    }
}]) 
//controller for the wizard modal view (template)      
.controller('wizardCtrl',['$rootScope','$scope','wizardService',
function($rootScope,$scope, wizardService){
    $scope.step = {} //an object used by all templates
    $scope.wizard = wizardService;
    $scope.wizard.name = 'Create a New Meeting';
    $scope.sb = wizardService.sb;
    wizardService.setStep(wizardService.current);
}])
.service('wizardService', ['$rootScope',
                           '$ionicSlideBoxDelegate',
                           '$ionicScrollDelegate',
                           '$ionicModal',
                           'SessionBuilder',
                           '$q',
                           'ionicToast',
                           'onEvent',
 function ( $rootScope,
            $ionicSlideBoxDelegate,
            $ionicScrollDelegate,
            $ionicModal,
            SessionBuilder,
            $q,
            ionicToast,
            onEvent) {
     var $ = this;
    
    // the wizard has a group of steps it displays
    // each step has a template and a controller
    $.steps = [];
    $.current = 0;
    $.sb = SessionBuilder;
    $.action = undefined;
    $.ignoreSlide = false;
     
    // enable events for this service
    onEvent.attach($);

    $.initDateTime = function(){
        $.timePickerObject.inputEpochTime = ($.sb.session.time.getHours() * 3600)+($.sb.session.time.getMinutes()*60);
        $.datepickerObject.inputDate = $.sb.session.date;
    }
 
    // initialize the wizard with the calling scope
    $.init = function($scope){
        var deferred = $q.defer();
        $.sb.init($scope).then(function(){
            $.current = 0;
            $.scope = $scope;
            $.buildSteps();
            //add the date and time picker
            $.datepickerObject = {
                titleLabel: 'Title',  //Optional
                todayLabel: 'Today',  //Optional
                closeLabel: 'Close',  //Optional
                setLabel: 'Set',  //Optional
                setButtonType : 'button-dark',  //Optional
                todayButtonType : 'button-stable',  //Optional
                closeButtonType : 'button-assertive',  //Optional
                inputDate: $.sb.session.date,  //Optional
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
                        $.sb.session.date = val;
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
                        $.time = $.sb.session.date;
                        $.time.setHours(hours);
                        $.time.setMinutes(minutes);
                        $.time.setSeconds(0);
                        $.time.setMilliseconds(0);
                        $.sb.session.time = $.time;
                    }
                }
            }; 
            $.initDateTime();
            deferred.resolve();
        });
        return deferred.promise;
    }
    //manage the wizard forward and back logistics
    $.nextStep = function() {
        var c = $.current;
        $.setStep(++c);
    }
    
    $.prevStep = function() {
        var c = $.current;
        $.setStep(--c);
    };

    function eventName(stepNumber, event){
        return 'step'+stepNumber.toString()+'.'+event;
    }
    $.setStep = function(stepNumber) {
        if(!$.ignoreSlide){
            if(stepNumber <= 0)
                stepNumber = 0;    
            // otherwise we're a normal step so handle accordingly
            if($.steps[$.current].valid == true || stepNumber <= $.current){
                //fire onExit for current step
                var c = $.current;
                var n = stepNumber;
                // fire onExit for current step
                $.$fire(eventName(c,'exit'));
                if($.steps[c].type == 'modal' && $.modal != undefined){
                    $.modal.hide();
                    $.modal.remove();
                    $.modal = undefined;
                }
                // fire onEnter for next Step
                $.$fire(eventName(n,'enter'));
                $.current = stepNumber;
                $.nextEnabled = true;
                if(stepNumber > 0)
                    $.prevEnabled = true;
                if($.steps[$.current].type == 'pane'){
                    $ionicSlideBoxDelegate.slide($.current);
                    $ionicSlideBoxDelegate.update();
                }else if ($.steps[$.current].type == 'modal'){
                    var step = $.steps[$.current];
                    $ionicModal.fromTemplateUrl(step.template,{
                        scope:$.scope,
                        animation:'slide-in-up'
                    }).then(function(modal){
                        $.modal = modal;
                        $.modal.show();
                    });
                }
            }else {//user swiped to invalid step so go back
                //since we're sliding back - ignore the next event
                $.ignoreSlide = true;
                $ionicSlideBoxDelegate.slide($.current);
            }
        }else{
            $.ignoreSlide=false;
        }
    }
    //build the wizard steps
    $.buildSteps = function(){
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
            step.showInLegend = true;
            step.type = 'pane';
            $.steps.push(step);

            //Step2 - Add attendees
            step = {};
            step.heading = 'Who\'s Invited';
            step.template = 'templates/attendees.html';
            step.showInLegend = true;
            step.type = 'pane';
            $.steps.push(step);

            //Step3 - Add Shared Content for the Meeting
             step = {};
             step.heading = 'Shared Content';
             step.template = 'templates/sharedContent.html';
             step.showInLegend = true;
             step.type = 'pane';
             step.buildIdx = undefined;
             $.steps.push(step);
            
            //Step4 - A summary step to confirm - does not show in legend
             step = {};
             step.heading = 'Summary & Confirm';
             step.template = 'templates/summaryConfirm.html';
             step.showInLegend = false;
             step.type = 'modal'
             $.steps.push(step);
             // Set valid false for each step initially so Next is disabled
             $.steps.forEach(function(s){
                 s.valid = false;
             });
            $.$fire('start');
            $.stepsStandard = angular.copy($.steps);
        }
    } 
    //help controllers find their corresponding step in the service
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
    // reshuffle the wizard based on the mode (new,build,edit)
    $.reorderSteps = function(){
        switch($.action){
            case 'New' :
                $.steps = angular.copy($.stepsStandard);
                $.current = 0;
                break;
            case 'Build' :
                $.steps[0] = angular.copy($.stepsStandard[2]);
                $.steps[1] = angular.copy($.stepsStandard[0]);
                $.steps[2] = angular.copy($.stepsStandard[1]);
                $.steps[3] = angular.copy($.stepsStandard[3]);
                $.current = 0;
                break;
            case 'Edit' :
                $.steps = angular.copy($.stepsStandard);
                $.steps.forEach(function(s){
                    s.valid = true;
                });
                $.current = 3;
                break;
        }
    }
    // create a new session
    $.new = function($scope){
        $.action = 'New';
        $.deferred = $q.defer();
        $.init($scope).then(function(){
            $.reorderSteps(); // configure the wizard based on mode
            $.sb.new();        
            $.initDateTime();
            return $ionicModal.fromTemplateUrl('templates/wizard.html',
                    { scope: $.scope, animation:'slide-in-up' });
        }).then(function(modal){
            $.wizardModal = modal;
            // allow the sessionbuilder to process uploads
            $.sb.connect();
            return $.wizardModal.show()
        }).then(function(){
            $rootScope.hideLoading();
        }).catch(function(){
            $.sb.disconnect();
            $rootScope.hideLoading();
        });
        return $.deferred.promise;       
    }
    // build a session from a deck
    $.build = function($scope,navItem,index){
        $.action = 'Build';
        $.deferred = $q.defer();
        $.init($scope).then(function(){
            $.reorderSteps(); // configure the wizard based on mode
            $.steps[0].buildIdx = index; //set the index deck to build around
            $.sb.build(navItem,index);   
            $.initDateTime();
            return $ionicModal.fromTemplateUrl('templates/wizard.html',
                    { scope: $.scope, animation:'slide-in-up' });
        }).then(function(modal){
            $.wizardModal = modal;
            // allow the sessionbuilder to process uploads
            $.sb.connect();
            return $.wizardModal.show()
        }).then(function(){
            $rootScope.hideLoading();
            // allow the sessionbuilder to process uploads
        }).catch(function(){
            $.sb.disconnect();
            $rootScope.hideLoading();
        });
        return $.deferred.promise;       
    }
    // edit an existing session
    $.edit = function($scope,session){
        $.action = 'Edit';
        $.deferred = $q.defer();
        $.init($scope).then(function(){
            $.reorderSteps(); // configure the wizard based on mode
            return $.sb.edit(session);  
        }).then(function(){
            $.initDateTime();
            var step = $.steps[$.current];
            $ionicModal.fromTemplateUrl(step.template,{
                scope:$.scope,
                animation:'slide-in-up'
            }).then(function(modal){
                $.modal = modal;
                // allow the sessionbuilder to process uploads
                $.sb.connect();
                $.modal.show();
                $rootScope.hideLoading();
            });
        });
        return $.deferred.promise;       
    }
    
    // navigation controls
    $.complete = function(){
        $.sb.disconnect();
        $.$fire('end');
        if($.modal != undefined){
            $.modal.hide();
            $.modal.remove();
            $.modal = undefined;
        }
        switch($.action){
            case 'New':    
            case 'Build':
                $.sb.saveSession().then(function(){
                    $.wizardModal.hide();
                    if($.wizardModal)
                        $.wizardModal.remove();
                    if($.deferred!=undefined)
                        $.deferred.resolve();
                });
                break;
            case 'Edit':
                $.sb.updateSession().then(function(session){
                    ionicToast.show('Meeting has been updated','top',false,2000);
                    if($.wizardModal){
                        $.wizardModal.hide();
                        $.wizardModal.remove();
                    }
                    if($.deferred!=undefined)
                        $.deferred.resolve(session);
                })
        }

    }
    $.cancel = function(){
        $.sb.disconnect();
        if($.modal != undefined){
            $.modal.hide();
            $.modal.remove();
            $.modal = undefined;
        }
        if($.wizardModal != undefined)
            $.wizardModal.hide();
        $.$fire('end');
        if($.wizardModal != undefined)
           $.wizardModal.remove();
        if($.deferred != undefined)
            $.deferred.reject();
    }
                
}]);
    