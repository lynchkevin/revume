var express = require('express');
var bTree = express.Router();
var Promise = require('bluebird');
var braintree = Promise.promisifyAll(require('braintree'));
var nonces = braintree.Test.Nonces;

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
//send a confirmation email with a link
bTree.get('/sandbox/client_token',function(req,res){
  console.log('get sandbox token');
  sandbox.clientToken.generate({},function(err,response){
    res.send(response.clientToken);
  });
});

bTree.get('/production/client_token',function(req,res){
  console.log('get production token');
  production.clientToken.generate({}, function (err, response) {
    res.send(response.clientToken);
  });
});

bTree.get('/sandbox/test',function(req,res){
    sandbox.transaction.sale({
        amount: '10.00',
        paymentMethodNonce: braintree.Test.Nonces.Transactable
    },function(err,result){
        console.log(result);
        console.log(err);
        res.send(result);
    });
});


bTree.post('/sandbox/customer',function(req,res){
    console.log('sandbox/customer - create');
    console.log('body is: ',req.body);
    var sent = req.body;
    sandbox.customer.create({
        firstName: sent.firstName,
        lastName: sent.lastName,
        email: sent.email,
        paymentMethodNonce:sent.nonce},function(err,result){
            res.send(result);
    });
});
bTree.post('/sandbox/customer/delete',function(req,res){
    console.log('sandbox/customer - create');
    console.log('body is: ',req.body);
    var sent = req.body;
    sandbox.customer.delete(sent.id,
        function(err){
            var result = {success:true};
            if(err){
                result.success = false;
                result.err = err;
            }   
            res.send(result);
    });
});
bTree.get('/sandbox/customer',function(req,res){
    console.log('sandbox get customer id: ',req.query);
    sandbox.customer.find(req.query.id,function(err,customer){
        res.send(customer);
    });
});
bTree.post('/sandbox/paymentMethod',function(req,res){
    console.log('create payment method');
    console.log('body is: ',req.body);
    var sent = req.body;
    sandbox.paymentMethod.create({
        customerId:sent.customerId,
        paymentMethodNonce:sent.nonce,
        option:{
            verifyCard:true,
        }
    },function(err,result){
        if(err){
            console.log(err)
            res.send(err);
        } else
            res.send(result);
    });
});
bTree.post('/sandbox/transact',function(req,res){
    console.log('Create a Transaction');
    console.log('body is : ',req.body);
    var sent = req.body;
    sandbox.transaction.sale({
        amount:sent.amount,
        paymentMethodNonce:sent.nonce,
        option:{
            submitForSettlement:true,
        }
    },function(err, result){
        res.send(result);
    });
});
bTree.post('/sandbox/formSubmit',function(req,res){
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
bTree.post('/sandbox/subscription',function(req,res){
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

    sandbox.subscription.create({
        paymentMethodToken: sent.token,
        planId: sent.plan,
        addOns:addOns,
        discounts:discounts
    },function(err,result){
            res.send(result);
    });
});
//find a subscription
bTree.get('/sandbox/subscription',function(req,res){
    console.log('sandbox get subscription id: ',req.query);
    sandbox.subscription.find(req.query.id,function(err,subscription){
        res.send(subscription);
    });
})


bTree.put('/sandbox/subscription',function(req,res){
    console.log('Update a Subscription');
    console.log('body is : ',req.body);
    var sent = req.body;
    //find the subscription
    sandbox.subscription.find(sent.id,function(err,subscription){
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
        console.log('params are : ',params);            
        sandbox.subscription.update(sent.id,params,
        function(err,result){
            console.log(result);
            res.send(result)
        });
    });
})
bTree.post('/sandbox/subscription/cancel',function(req,res){
    console.log('Cancel a subscription');
    console.log('body is : ',req.body);
    var sent = req.body;
    
    sandbox.subscription.cancel(sent.id,
    function(err,result){
        console.log(result);
        res.send(result);
    });
})
bTree.get('/sandbox/plans',function(req,res){
    console.log('sandbox/plans');
    res.json(sandBoxPlans);
});
module.exports = bTree;


