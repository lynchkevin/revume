'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('cardCtrl', ['$scope',
                              '$rootScope',
                              'Braintree',
                              'ScriptService',
                              '$state',
                              'baseUrl',
                              '$http',
                              '$q',
                             function ( $scope,
                                        $rootScope,
                                        Braintree,
                                        ScriptService,
                                        $state,
                                        baseUrl,
                                        $http,
                                        $q) {
    
    //Initialize the Scope when everything is Resolved
    $scope.init = function(){
        $scope.paymentDisabled = false;
        $scope.script = ScriptService
        $scope.script = ScriptService.getPendingScript();
        $scope.status = {};
        $scope.script.cost = ScriptService.calculateCost($scope.script);
        $scope.processCardDisabled = false;
        Braintree.init($scope,$scope.pmrCallback);
        if($scope.script.customerId != undefined){
            Braintree.findCustomer($scope.script).then(function(customer){
                $scope.script.customer = customer;
                $scope.script.defaultMethod = undefined;
                $scope.showCardEntry = true;
                customer.paymentMethods.forEach(function(method){
                    if(method.default)
                        $scope.script.defaultMethod = method;
                });
            });
        } else 
            $scope.showCardEntry = false;
        $scope.dropinOptions = {
            onPaymentMethodReceived: function(payload){
                Braintree.changeCard(payload);
            },
            onError : function(payload){
                console.log(payload);
            }
        };
    }
    //callback when paymentMethodRecieved completes
    $scope.pmrCallback = function(){
        $scope.status.message = 'New Card Successfully Added';
        $scope.showCardEntry = false;
        $scope.processCardDisabled = true;
    }

    //Take Action When Cancel or Submit
    $scope.cancel = function(){
       $state.go('app.myAccount');
    }
      


    if($rootScope.user.script == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();               
  }]);
