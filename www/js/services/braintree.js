'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # reviewCtl
 * Controller for Revu.me - leave behind viewer
 */
angular.module('RevuMe')
  .service('Braintree',['$rootScope','bTree','ScriptService','$http','baseUrl','$q',
function ($rootScope, bTree, ScriptService, $http, baseUrl, $q) {
    var $ = this;
    $.planData = undefined;
    
    $.basePath = baseUrl.endpoint+bTree;
    
    $.init = function($scope,pmrCallback){
        $.scope = $scope;
        $.scope.error = {};
        $.callback = pmrCallback || function(){};
        $.getPlansAndAddons()
        .then(function(result){
            $.planData = result.data;
        });
    }
    
    $.getPlansAndAddons = function(){
        var deferred = $q.defer()
        var endpoint = $.basePath+'plans';
        
        $http.get(endpoint)
        .then(function(result){
            deferred.resolve(result);
        });
        return deferred.promise;
    }
        
    $.getPlan = function(name){
        var plan = undefined;       
        var plans = $.planData.plans
        plans.forEach(function(p){
            if(p.name == name)
                plan = p
        });
        return plan;
    }
    
    $.getAddOn = function(name){
        var addOn = undefined;       
        var addOns = $.planData.addOns
        addOns.forEach(function(a){
            if(a.name == name)
                addOn = a
        });
        return addOn;
    }
    
    $.getDiscount = function(name){
        var discount = undefined;
        var discounts = $.planData.discounts;
        discounts.forEach(function(d){
            if(d.name == name)
                discount = d;
        });
        return discount;
    }
    
    $.createCustomer = function(payload){
        var deferred = $q.defer();    
        var script = $.scope.script;
        var endpoint = $.basePath+'customer'
        var admin = ScriptService.getAdmin(script);
        var customer = {firstName:admin.firstName,
                        lastName:admin.lastName,
                        email:admin.email,
                        nonce:payload.nonce
                        };
        $http.post(endpoint,customer)
        .then(function(response){
            var result = response.data;
            if(result.success){
                $.scope.script.customerId = result.customer.id;
                $.scope.token = result.customer.paymentMethods[0].token;
                deferred.resolve(result)
            }   
            else
                deferred.reject(result);
        });        
        return deferred.promise;
    }
    
    $.deleteCustomer = function(customerId){
        var deferred = $q.defer();
        var endpoint = $.basePath+'customer/delete';
        var params = {id:customerId};
        $http.post(endpoint,params)
        .then(function(response){
            var result = response.data;
            if(result.success)
                deferred.resolve(result);
            else
                deferred.reject(result);
        });
        return deferred.promise;
    }
        
    $.createScript = function(script){
        var deferred = $q.defer();
        var token = $.scope.token;
        var endpoint = $.basePath+'subscription';
        var plan = undefined;
        var addOn = $.getAddOn('RevuMe Seat Full Price');
        var discount =  $.getDiscount('RevuMe L1 Seat Discount');
        var annualDiscount = $.getDiscount('RevuMe Annual Discount');
        var aoQuantity = script.totalSeats -1;
        
        if(script.type == 'Monthly')
            plan = $.getPlan('RevuMe Monthly AutoRenew')
        else{
            plan = $.getPlan('RevuMe Annually AutoRenew');
            var applyAnnual = annualDiscount;
        }
        
        addOn = $.getAddOn('RevuMe Seat Full Price');
        discount = $.getDiscount('RevuMe L1 Seat Discount');
        if(plan && addOn && discount){
            var params = {token:token,
                          plan:plan.id,
                          addOn:{id:addOn.id,quantity:aoQuantity},
                          discount:{id:discount.id,quantity:0},
                          annualDiscount:{id:undefined,quantity:1}
                         };
            if(applyAnnual != undefined)
                params.annualDiscount.id = applyAnnual.id;
            if (aoQuantity == 0)
                params.addOn.id = undefined;
            
            if (script.totalSeats >= discount.break)
                params.discount.quantity = script.totalSeats;
            else
                params.discount.id = undefined;
                
            $http.post(endpoint,params)
            .then(function(response){
                var result = response.data;
                if(result.success)
                    deferred.resolve(result.subscription.id);
                else
                    deferred.reject(result);
            });
        } else
            deferred.reject('CreateScript: Undefined plan elements');
        return deferred.promise;    
    }
    
    $.cancel = function(script){
        var deferred = $q.defer();
        var endpoint = $.basePath+'subscription/cancel';
        var params = {id:script.braintreeId};
        //cancel the script
        if(script.braintreeId != undefined){
            $http.post(endpoint,params)
            .then(function(response){
                var result = response.data;
                try{
                    var code = result.errors.errorCollections.subscription.validationErrors.status[0].code;
                    if(code == '81905') //already cancelled
                        result.success = true;
                } catch(err) {
                    console.log('some other error');
                }
                if(result.success)
                    deferred.resolve(result);
                else
                    deferred.reject(result)
            });
            return deferred.promise;
        } else
            deferred.resolve();
    }
    
    $.upgradeToAnnual = function(script){
        var deferred = $q.defer();
        var endpoint = $.basePath+'subscription';
        var params = {id:script.braintreeId};
        
        //cancel the current monthly script
        $.cancel(script)
        .then(function(response){
            if(result.success){
                //create a new annual script
                $.createScript(script)
                .then(function(btId){
                    script.braintreeId = btId;
                    $.updateScript(script);
                    var result = {success:true};
                    result.subscription.id = btId;
                    deferred.resolve(result);
                });
            } else{
                deferred.reject(result);
            }
        });
        return deferred.promise;
    }
    
    $.isAnnualPlan = function(script){
        var deferred = $q.defer();
        $.findSubscription(script)
        .then(function(btScript){
            if(btScript.planId == $.getPlan('RevuMe Annually AutoRenew').id)
                deferred.resolve(true);
            else
                deferred.resolve(false);
        });
        return deferred.promise;
    }
            
    $.updateBTScript = function(script){
        var deferred = $q.defer();
        var endpoint = $.basePath+'subscription';
        var plan = undefined;
        var addOn = $.getAddOn('RevuMe Seat Full Price');
        var discount =  $.getDiscount('RevuMe L1 Seat Discount');
        var aoQuantity = script.totalSeats -1;
        var dcQuantity = 0;
        var monthlyAutoRenew = $.getPlan('RevuMe Monthly AutoRenew');
        var annuallyAutoRenew = $.getPlan('RevuMe Annually AutoRenew');
        var done = false;
        
        $.findSubscription(script)
        .then(function(btScript){

            //update from monthly to annually or vice versa
            if(script.type == 'Annually'){
                if(btScript.planId == monthlyAutoRenew.id){
                    done = true; //stop further processing we need to create a new BT Script
                    $.getToken(script)
                    .then(function(token){
                        $.scope.token = token;
                        return $.upgradeToAnnual(script)
                    }).then(function(result){
                        deferred.resolve(result);
                    });
                }
                plan = annuallyAutoRenew;
            } else
                if(btScript.planId == annuallyAutoRenew.id){
                    plan = annuallyAutoRenew; //downgrading to monthly at the end of the term
                    script.autoRenew = false;
                } else
                    plan = monthlyAutoRenew;

            //if not a change in payment term - then change seats
            if(plan && addOn && discount && !done){
                    var params = {id:script.braintreeId,
                                  plan:plan.id,
                                  addOn:{id:addOn.id,quantity:aoQuantity},
                                  discount:{id:discount.id,quantity:dcQuantity}
                                 };
                    //set id to undefined to remove addons and discounts
                    if (script.totalSeats >= discount.break)
                        dcQuantity = script.totalSeats
                    else
                        params.discount.id = undefined
                    if(aoQuantity == 0)
                        params.addOn.id = undefined;
                    //set auto renew if it has changed
                    if(btScript.neverExpires == true && script.autoRenew == false){
                        params.numberOfBillingCycles = btScript.currentBillingCycle;
                        params.neverExpires = false;
                    } else if(btScript.neverExpires == false && script.autoRenew == true) {
                        params.neverExpires = true;
                    }
                    //update the btSubscription
                    $http.put(endpoint,params)
                    .then(function(response){
                        var result = response.data;
                        if(result.success)
                            deferred.resolve(result.subscription.id);
                        else
                            deferred.reject(result);
                    });
            } else
                deferred.reject('UpdateScript: Undefined elements');
            
        });

        return deferred.promise;    
    }

    $.createToken = function(script,nonce){
        var deferred = $q.defer();
        var endpoint = $.basePath+'paymentMethod';
        var params = {customerId:script.customerId,
                      nonce:nonce
                     };
        $http.post(endpoint,params)
        .then(function(response){
            var result = response.data;
            if(result.success)
                deferred.resolve(result);
            else
                deferred.reject(result);
        })
        return deferred.promise;
    }
    
    $.findCustomer = function(script){
        var deferred = $q.defer();   
        var endpoint = $.basePath+'customer';
        $http.get(endpoint,{params:{id:script.customerId}})
        .then(function(response){
            var customer = response.data;
            if(customer.id != undefined)
                deferred.resolve(customer)
            else
                deferred.reject(response);
        });
        return deferred.promise;
    }
    
    $.getToken = function(script){
        var deferred = $q.defer();
        var paymentMethod = undefined;
        $.findCustomer(script)
        .then(function(customer){
            if(customer.paymentMethods.length > 0){
                customer.paymentMethods.forEach(function(method){
                    if(method.default)
                        paymentMethod = method;
                });
             if(paymentMethod != undefined)
                 deferred.resolve(paymentMethod.token)
              else
                  deferred.reject('no default payment method');
            } else
                deferred.reject('no payment methods for this customer');
        });
        return deferred.promise;
    }
    
    $.newScriptNewCustomer = function(payload){
        var deferred = $q.defer();
        $.createCustomer(payload)
        .then(function(result){
            console.log('new customer created');
            return $.createScript($.scope.script)        
        })
        .then(function(braintreeId){
            console.log('Script Created on Braintree');
            $.scope.script.braintreeId = braintreeId;
            return $.updateScript();
        })
        .then(function(){
            $rootScope.user.script = angular.copy($.scope.script);
            console.log('new script created');
            deferred.resolve();
        })
        .catch(function(result){
            if(result.errors){
                if($.scope.script.customerId != undefined)
                    $.deleteCustomer($.scope.script.customerId)
                $.scope.status.errors = result.errors;
                $.scope.status.errorMessage = 'Failed : '+result.message;
            }
            deferred.reject(result);
        });
        return deferred.promise;
    }
    
    $.newScriptExistingCustomer = function(script){
        var deferred = $q.defer();
        $.findCustomer(script)
        .then(function(customer){
            $.scope.token = customer.paymentMethods[0].token;
            return $.createScript(script);
        }).then(function(braintreeId){
            $.scope.script.braintreeId = braintreeId;
            return $.updateScript();
        }).then(function(response){
            console.log('new script created');
            deferred.resolve();
        }).catch(function(response){
            if(result.errors){
                $.scope.status.errors = result.errors;
                $.scope.status.errorMessage = 'Failed : '+result.message;
            }
            deferred.reject(result);
        });        
    }
    $.findSubscription = function(script){
        var deferred = $q.defer();   
        var endpoint = $.basePath+'subscription';
        $http.get(endpoint,{params:{id:script.braintreeId}})
        .then(function(response){
            var subscription = response.data;
            if(subscription.id != undefined)
                deferred.resolve(subscription)
            else
                deferred.reject(response);
        });
        return deferred.promise;
    }
        
    $.updateScript = function(){
        var deferred = $q.defer();
        var script = $.scope.script;
        var order = $.scope.order || {totalSeats:script.totalSeats,type:script.type};
        script.startDate = new Date(); //now
        script.expirationDate = new Date(); //now
        script.autoRenew = true;
        script.totalSeats = order.totalSeats;
        script.availableSeats = script.totalSeats - script.members.length;
        script.type = order.type;
        switch(script.type){
            case 'Monthly'  :   var month = script.startDate.getMonth();
                                month += 1;
                                script.expirationDate.setMonth(month);
                                break;
            case 'Annually' :   var year = script.startDate.getFullYear();
                                year += 1;
                                script.expirationDate.setFullYear(year);
                                break;
        }
        ScriptService.update(script._id,script).then(function(){
              $.scope.$broadcast("show_message", 'Order Complete!');
              deferred.resolve(script);
        });
        return deferred.promise;
    }
    
    $.payMethReceived = function(payload){
        var script = $.scope.script;
        var endpoint = $.basePath+'customer';
        $.scope.token = undefined;
        $.scope.processCardDisabled = true;
        //create a customer if no CustomerID;
        if(script.customerId == undefined){
            $.newScriptNewCustomer(payload)
            .then(function(){
                console.log('successfully added new customer/script');
                $.callback();
            });

        } else if(script.braintreeId == undefined){ //no existing subscription
            $.newScriptExistingCustomer(script)
            .then(function(){
                console.log('successfully added new script for the customer');
                $.callback();
            });
            
        } //Neeed to add update script for existing customer existing script
    } 
    
  }]);
