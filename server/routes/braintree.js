var express = require('express');
var bTree = express.Router();
var Promise = require('bluebird');
var braintree = Promise.promisifyAll(require('braintree'));
var nonces = braintree.Test.Nonces;
var env = process.env.NODE_ENV;

var sandBoxPlans = {plans:[{name:'RevuMe Monthly AutoRenew',id:'8ccr'},
                           {name:'RevuMe Annually AutoRenew',id:'86n6'}],
                    addOns:[{name:'RevuMe Seat Full Price',id:'k6c6'}],
                    discounts:[{name:'RevuMe L1 Seat Discount',id:'2mtw',break:50},
                               {name:'RevuMe Annual Discount',id:'5mfg'}]
                   };


var sandbox = braintree.connect({  
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.SB_MERCH,
  publicKey: process.env.SB_PUB,
  privateKey: process.env.SB_PRI
});

var production = braintree.connect({  
  environment: braintree.Environment.Production,
  merchantId: process.env.PD_MERCH,
  publicKey: process.env.PD_PUB,
  privateKey: process.env.PD_PRI
});
var target = sandbox;

if(env!='development'){
    target = production;
    console.log('Braintree target is PRODUCTION');
} else 
    console.log('Braintree target is SANDBOX');

//send a confirmation email with a link
bTree.get('/braintree/client_token',function(req,res){
  console.log('get sandbox token');
  target.clientToken.generate({},function(err,response){
    res.send(response.clientToken);
  });
});


bTree.get('/braintree/test',function(req,res){
    target.transaction.sale({
        amount: '10.00',
        paymentMethodNonce: braintree.Test.Nonces.Transactable
    },function(err,result){
        console.log(result);
        console.log(err);
        res.send(result);
    });
});


bTree.post('/braintree/customer',function(req,res){
    console.log('sandbox/customer - create');
    console.log('body is: ',req.body);
    var sent = req.body;
    target.customer.create({
        firstName: sent.firstName,
        lastName: sent.lastName,
        email: sent.email,
        paymentMethodNonce:sent.nonce},function(err,result){
            res.send(result);
    });
});
bTree.post('/braintree/customer/delete',function(req,res){
    console.log('sandbox/customer - create');
    console.log('body is: ',req.body);
    var sent = req.body;
    target.customer.delete(sent.id,
        function(err){
            var result = {success:true};
            if(err){
                result.success = false;
                result.err = err;
            }   
            res.send(result);
    });
});
bTree.get('/braintree/customer',function(req,res){
    console.log('sandbox get customer id: ',req.query);
    target.customer.find(req.query.id,function(err,customer){
        res.send(customer);
    });
});
bTree.post('/braintree/paymentMethod',function(req,res){
    console.log('create payment method');
    console.log('body is: ',req.body);
    var sent = req.body;
    target.paymentMethod.create({
        customerId:sent.customerId,
        paymentMethodNonce:sent.nonce,
        options:{
            makeDefault:true,
        }
    },function(err,result){
        if(err){
            console.log(err)
            res.send(err);
        } else
            res.send(result);
    });
});

bTree.post('/braintree/paymentMethod/change',function(req,res){
    console.log('change payment method');
    console.log('body is: ',req.body);
    var sent = req.body;
    var newToken = undefined;
    //create a new token
    target.paymentMethod.create({
        customerId:sent.customerId,
        paymentMethodNonce:sent.nonce,
        options:{makeDefault:true}
    },function(err,result){
        if(err){
            console.log(err)
            res.send(err);
        } else { 
            //we've created a new token - now make it the default;
            newToken = result.creditCard.token;
            console.log('New Token Created : ', newToken , ' Default is: ',result.creditCard.default);
            console.log('Old Token is : ',sent.oldToken);
            res.send(result);
        }
    });
});

//update the payment method default status
bTree.put('/braintree/paymentMethod',function(req,res){
    console.log('Update payment method');
    console.log('body is: ',req.body);
    var sent = req.body;
    target.paymentMethod.delete({makeDefault:sent.makeDefault},function(err,result){
        if(err){
            console.log(err);
            res.send({success:false,errors:err});
        } else {
            console.log(result);
            res.send(result);
        }
    });
});

bTree.post('/braintree/transact',function(req,res){
    console.log('Create a Transaction');
    console.log('body is : ',req.body);
    var sent = req.body;
    target.transaction.sale({
        amount:sent.amount,
        paymentMethodNonce:sent.nonce,
        option:{
            submitForSettlement:true,
        }
    },function(err, result){
        res.send(result);
    });
});
bTree.post('/braintree/formSubmit',function(req,res){
    console.log('Form Submit');
    console.log('body is ',req.body);
});

function addUpdateRemove(target,source,collection,quantity){
    if(source != undefined){
        if(target.length > 0){
            collection.update = [
                {existingId: source, quantity:quantity}
                ];
        } else {
            collection.add = [
                {inheritedFromId: source, quantity:quantity}
                ];
        }
    } else {
        if(target.length > 0){
            collection.remove = [target[0].id];
        }
    }
}

//create a subscription
bTree.post('/braintree/subscription',function(req,res){
    var sent = req.body;
    var addOns = {};
    var discounts = {};

    console.log('Create a Subscription');
    console.log('body is : ',req.body);

    if(sent.addOn.id != undefined)
        addOns.add = [{inheritedFromId:sent.addOn.id,quantity:sent.addOn.quantity}];
    if(sent.discount.id != undefined)
        discounts.add = [{inheritedFromId:sent.discount.id,quantity:sent.discount.quantity}]

                          
    console.log('addOns : ',addOns);
    console.log('discounts: ',discounts);

    target.subscription.create({
        paymentMethodToken: sent.token,
        planId: sent.plan,
        addOns:addOns,
        discounts:discounts
    },function(err,result){
            res.send(result);
    });
});
//find a subscription
bTree.get('/braintree/subscription',function(req,res){
    console.log('sandbox get subscription id: ',req.query);
    target.subscription.find(req.query.id,function(err,subscription){
        res.send(subscription);
    });
})


bTree.put('/braintree/subscription',function(req,res){
    console.log('Update a Subscription');
    console.log('body is : ',req.body);
    var sent = req.body;
    //find the subscription
    target.subscription.find(sent.id,function(err,subscription){
        var script = subscription;
        var addOns = {};
        var discounts = {};
        var params = {};
        
        addUpdateRemove(script.addOns,sent.addOn.id,addOns,sent.addOn.quantity);
        addUpdateRemove(script.discounts,sent.discount.id,discounts,sent.discount.quantity);
        console.log('addOns: ',addOns);
        console.log('discounts: ',discounts);
        //setup the paramaters for braintree update
        params.planId = sent.plan;
        params.addOns = addOns;
        params.discounts = discounts;
        if(sent.neverExpires != undefined)
            params.neverExpires = sent.neverExpires;
        if(sent.numberOfBillingCycles != undefined)
            params.numberOfBillingCycles = sent.numberOfBillingCycles;
        if(sent.newToken != undefined)
            params.paymentMethodToken = sent.newToken;
        console.log('params are : ',params);            
        target.subscription.update(sent.id,params,
        function(err,result){
            console.log(result);
            res.send(result)
        });
    });
})
bTree.post('/braintree/subscription/cancel',function(req,res){
    console.log('Cancel a subscription');
    console.log('body is : ',req.body);
    var sent = req.body;
    
    target.subscription.cancel(sent.id,
    function(err,result){
        console.log(result);
        res.send(result);
    });
})
bTree.get('/braintree/plans',function(req,res){
    console.log('sandbox/plans');
    res.json(sandBoxPlans);
});
module.exports = bTree;


