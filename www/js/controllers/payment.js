'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('paymentCtrl', ['$scope',
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
    $scope.status = {message:undefined,errors:undefined};
                                 
    $scope.init = function(){
        $scope.paymentDisabled = false;
        $scope.script = ScriptService.getPendingScript();
        $scope.status = {message:undefined,errors:undefined};
        $scope.script.cost = ScriptService.calculateCost($scope.script);
        $scope.processCardDisabled = false;
        Braintree.init($scope,$scope.pmrCallback)
        .then(function(){
            console.log('payment controlller init: script is: ',$scope.script);
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
            } else 
                $scope.showCardEntry = true;
            $scope.dropinOptions = {
                onPaymentMethodReceived: function(payload){
                    Braintree.payMethReceived(payload);
                },
                onError : function(payload){
                    console.log(payload);
                }
            };
        });
    }
    //callback when paymentMethodRecieved completes
    $scope.pmrCallback = function(){
        $scope.status.message = 'Successfully Processed - Thank You!';
        $scope.showCardEntry = false;
        $scope.processCardDisabled = true;
    }
    //update a subscription using default payment
    $scope.defaultPay = function(){
        $scope.paymentDisabled = true;
        $scope.status.message = 'Processing Payment...';
        $scope.status.errors = undefined;
        Braintree.updateBTScript($scope.script)
        .then(function(result){
            $scope.showCardEntry = false;
            return ScriptService.update($scope.script._id,$scope.script);
        }).then(function(result){
            $rootScope.user.script = angular.copy($scope.script);
            $scope.status.message = 'Completed Successfully - Thank You!';
        }).catch(function(result){
            $scope.status.errors = result.errors;
            $scope.status.errorMessage = 'Failed : '+result.message;
        });
            
    }
    //Take Action When Cancel or Submit
    $scope.cancelOrder = function(){
       $state.go('app.myAccount');
    }
      
   $scope.$on('$ionicView.enter', function(){
        if($rootScope.user._id != undefined)
            if($state.current.name == 'app.payment')
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
