'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('accountCtrl', ['$scope',
                              '$rootScope',
                              'Braintree',
                              'ScriptService',
                              '$ionicScrollDelegate',
                              '$ionicModal',
                              '$ionicPopup',
                              'TeamService',
                              'userService',
                              '$state',
                              '$filter',
                              '$q',
                             function ( $scope,
                                        $rootScope,
                                        Braintree,
                                        ScriptService,
                                        $ionicScrollDelegate,
                                        $ionicModal,
                                        $ionicPopup,
                                        TeamService,
                                        userService,
                                        $state,
                                        $filter,
                                        $q) {
    // Set up ionic components
    $scope.sd = $ionicScrollDelegate;
    $scope.User = userService.user;
    $ionicModal.fromTemplateUrl('templates/manageSeats.html',{
        scope: $scope,
        animation:'slide-in-up'
    }).then(function(modal){
        $scope.seatModal = modal;
    }); 
    
                                                     
    function setRenewMessage(script){
        if(script.autoRenew)
            script.renewMessage = 'Subscription Renews in '+script.daysLeft+' days';
        else
            script.renewMessage = 'Subscription Expires in '+script.daysLeft+' days';
    }
    
    function setChangeButtonName(script){
        if(script.type == 'Trial')
            $scope.changeButton = {text:'Upgrade Account'};
        else if(script.type == 'Monthly' || script.type == 'Annually')
            $scope.changeButton = {text:'Change Account'};        
    }
    //Initialize the Scope when everything is Resolved
    $scope.init = function(){
        Braintree.init($scope);
        $scope.showChange = false;
        $scope.script = $rootScope.user.script;
        //get the payment method
        if($scope.script.customerId != undefined){
            Braintree.findCustomer($scope.script).then(function(customer){
                $scope.script.customer = customer;
                $scope.script.defaultMethod = undefined;
                $scope.showCardEntry = false;
                customer.paymentMethods.forEach(function(method){
                    if(method.default)
                        $scope.script.defaultMethod = method;
                });
            });
        } 
        setChangeButtonName($scope.script);
        $scope.script.daysLeft = ScriptService.getDaysLeft($scope.script);
        $scope.script.scriptTypes = ScriptService.scriptTypes;
        $scope.script.cost = ScriptService.calculateCost($scope.script);
        setRenewMessage($scope.script);
        // create a new order
        var members = [{user:$rootScope.user._id,role:'Admin'}]
        $scope.order = ScriptService.newScript(ScriptService.scriptTypes[1],members);
        if($scope.script.type == 'Monthly' || $scope.script.type == 'Annually'){
            $scope.order.totalSeats = $scope.script.totalSeats;
            $scope.order.type = $scope.script.type;
        }
        $scope.order.scriptTypes = ScriptService.scriptTypes.slice(1,3);
        $scope.order.stopRenew = !$scope.script.autoRenew;
        $scope.order.price = ScriptService.calculateCost($scope.order);
        $scope.order.hint = 'Pay Annually and Save $'+ScriptService.annualSavings($scope.order);
        $scope.admin = ScriptService.getAdmin($scope.script);
        $scope.script.members.forEach(function(member){
            member.user.name = member.user.firstName+' '+member.user.lastName;
        });
        $scope.script.showTeams = false;
        $scope.form = {};
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $scope.script.teamList = teams;
            if($scope.script.teamList.length >0)
                $scope.script.team = $scope.script.teamList[0];
        });
        $scope.newMember = {};
    }
    // Confirm downgrade from annually to monthly
    function showConfirm(confirmMessage) {
        var confirmPopup = $ionicPopup.confirm(confirmMessage);
        return confirmPopup;
    }
    //show/hide change section
    $scope.changeAccount = function(){
        $scope.showChange = true;
    }
    $scope.cancelChange = function(){
        $scope.showChange = false;
    }
    $scope.changeTerm = function(){
        if($scope.script.type != 'Trial'){
            if($scope.order.type == 'Monthly' && $scope.script.type == 'Annually'){
                var confirmMessage={title:'Downgrade to Monthly',
                                    template: 'Please Confirm Monthly Billing'
                                   };
                showConfirm(confirmMessage).then(function(res){
                    if(res){
                        var dateString = $filter('date')($scope.script.expirationDate,'shortDate');
                        $scope.script.type = $scope.order.type;
                        ScriptService.update($scope.script._id,$scope.script);
                        Braintree.updateBTScript($scope.script);
                        $scope.order.hint = 'Monthly Billing Starts '+dateString;
                    } else
                        $scope.order.type = 'Annually';
                });
            } else {
                //going from monthly to annually
                Braintree.isAnnualPlan($scope.script)
                .then(function(isAnnual){//if it was annual - then just change back
                    if(isAnnual){
                        $scope.script.autoRenew = true;
                        $scope.script.type = 'Annually';
                        ScriptService.update($scope.script._id,$scope.script);
                        Braintree.updateBTScript($scope.script);
                        $scope.order.hint = 'Annual Plan Reinstated';
                    } else
                        $scope.updateOrderSize();
                });
            }   
        }
    }
    
    $scope.decreaseSeats = function(){
        var script = $scope.script;
        var order = $scope.order;
        var deferred = $q.defer();

        var confirmMessage={title:'Reduce Seats',
                            template: 'Please Confirm Fewer Seats'
                           };
        showConfirm(confirmMessage).then(function(res){
            if(res){
                script.totalSeats = order.totalSeats;
                script.availableSeats = script.totalSeats - script.members.length;
                Braintree.updateBTScript(script)
                .then(function(){
                    return ScriptService.update(script._id,script);
                }).then(function(){
                    deferred.resolve();
                }).catch(function(err){
                    deferred.reject(err);
                });
            } else
                deferred.resolve();
        });
        return deferred.promise;
    }
                
    $scope.changeSeatCount = function(){
        var order = $scope.order;
        var script = $scope.script;
        if(order.totalSeats < script.totalSeats)
            $scope.decreaseSeats()
            .then(function(){
                $scope.updateOrderSize();
            });
        else
            $scope.updateOrderSize();
    }
    
    // Handle Changes to Form Input
    $scope.updateOrderSize = function(){
        $scope.order.price = ScriptService.calculateCost($scope.order);
        var savings = ScriptService.annualSavings($scope.order);
        var saveStr = $filter('number')(savings,0);
        switch($scope.order.type){
            case 'Monthly'  :   $scope.order.hint = 'Pay Annually and Save $'+saveStr;
                                break;
            case 'Annually' :   $scope.order.hint = 'You Save $'+saveStr+'!';
        }
    }
    $scope.renewChange = function(){
        $scope.script.autoRenew = !$scope.order.stopRenew;
        ScriptService.update($scope.script._id,$scope.script);
        Braintree.updateBTScript($scope.script);
        setRenewMessage($scope.script);
    }
    $scope.checkout = function(){
        //process credit card
        var script = angular.copy($scope.script);
        $scope.order.show = false;
        $scope.sd.scrollTop();
        $scope.sd.resize();
        script.totalSeats = $scope.order.totalSeats;
        script.type = $scope.order.type;
        //set the pending script here
        ScriptService.setPendingScript(script);
        $state.go('app.payment');
    }
    $scope.changeCard = function(){
        $state.go('app.changeCard');
    }
    // keep the members in case of cancel
    function keepMembers(){
        $scope.currentMembers = [];
        $scope.script.members.forEach(function(member){
            $scope.currentMembers.push(member);
        });
    }
    function restoreMembers(){
        $scope.script.members =[];
        $scope.currentMembers.forEach(function(member){
            $scope.script.members.push(member);
        });
        $scope.script.availableSeats = $scope.script.totalSeats - $scope.script.members.length;
    }
    //show the seat Manager
    $scope.manageSeats = function(){
        keepMembers();
        $scope.seatModal.show();
    }
    $scope.cancelManager = function(){
        $scope.seatModal.hide();
        restoreMembers();
    }
    $scope.setPendingScript = function(){
        $scope.script.totalSeats = $scope.order.totalSeats;
        $scope.script.type = $scope.order.type;
    }
    
    
    //Handle Events from Seat Manager
    $scope.addMember = function(){
        var member = new Object();
        var _id = -1;
        var names = $scope.newMember.name.split(' ');
        member.name =$scope.newMember.name;
        member.firstName = names[0];
        member.lastName = names[1];
        member.email = $scope.newMember.email;
        $scope.User.byEmail.get({email:member.email}).$promise.then(function(user){
            if(user._id == undefined){
                var usr = new $scope.User.byId;
                angular.extend(usr,member);
                usr.$save().then(function(usr){
                    _id = usr._id;
                    $scope.script.members.push({user:member,role:'Viewer'});
                    $scope.newMember.name = '';
                    $scope.newMember.email = '';
                }).catch(function(err){console.log(err)});
            }else{
            member._id = user._id;
            $scope.script.members.push({user:member,role:'Viewer'});
            $scope.newMember.name ='';
            $scope.newMember.email='';
            }
            $scope.script.availableSeats = $scope.script.totalSeats - $scope.script.members.length;
        }).catch(function(err){console.log(err)});     
        this.forms.members.aName.$dirty = false;
        this.forms.members.aEmail.$dirty = false;
    };
    $scope.delMember = function($index){
        $scope.script.members.splice($index,1);
        $scope.script.availableSeats = $scope.script.totalSeats - $scope.script.members.length;
    }
    $scope.addTeam = function(){
        $scope.script.team.members.forEach(function(member){
            if($scope.script.availableSeats > 0){
                member.name = member.firstName+' '+member.lastName;
                $scope.script.members.push({user:member,role:'Viewer'});
                $scope.script.availableSeats = $scope.script.totalSeats - $scope.script.members.length;
            }
        });

    }
    
   $scope.$on('$ionicView.enter', function(){
        if($rootScope.user._id != undefined)
            if($state.current.name == 'app.myAccount')
                setTimeout(function(){
                    $scope.init();
                },0);                
    });
    
    if($rootScope.user.script == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();               
  }]);
