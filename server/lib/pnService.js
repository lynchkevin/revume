var express = require('express');
var PUBNUB = require('pubnub');

var pnService = function(){
    var pnFactory = this;
    
        pnFactory.init = function(uuid) {
            uuid = uuid || "anonymous";

            pnFactory.uuid = uuid;
            pnFactory.pubnub = PUBNUB.init({
                keepalive : 30,
                publish_key: 'pub-c-19a2e5ee-5b70-435d-9099-65ae53e5b149',
                subscribe_key: 'sub-c-0f2a418a-b9f1-11e4-80fe-02ee2ddab7fe',
                uuid:uuid,
                ssl:true,
            });
        };
    
        var publish = function(message) {
            if(arguments.length == 1){
                pnFactory.pubnub.publish({
                    channel : this.name,
                    message : message
                });
            };
        };    
    
        var subscribe = function(mCallback, pCallback){
            var noop = function(){};
            var mcb = mCallback || noop;
            var pcb = pCallback || noop;
            pnFactory.pubnub.subscribe({
                channel : this.name,
                presence : pcb,
                message : mcb,
                heartbeat : 60,
                connect: function(){console.log("Connected with SSL")}
            });
        };
        
      var history = function(hCallback){
            var noop = function(){};
            var hcb = hCallback || noop;
            pnFactory.pubnub.history({
                channel : this.name,
                count:100,
                callback : hcb
            });
        };
            
        var unsubscribe = function(){
            pnFactory.pubnub.unsubscribe({
                channel : this.name,
            });
        };
        
        var hereNow = function(hnCallback){
            var noop = function(){};
            var hncb = hnCallback || noop;
            pnFactory.pubnub.here_now({
                channel : this.name,
                callback : hncb
            });
        };
    
        var resolve = function(message) { 
            switch(message.action) {
                case "join": 
                    this.users.push(message.uuid); 
                    break;
                case "leave":
                    console.log("presence got leave action!");
                case "timeout":
                    this.users.splice(this.users.indexOf(message.uuid), 1); 
                    break;
            }
            return this.users;
        }
        
        
        
        pnFactory.newChannel = function(channelName){
          var noop = function(){};
          var channel = {
              name : channelName,
              publish : publish,
              subscribe : subscribe,
              unsubscribe : unsubscribe,
              hereNow : hereNow,
              history : history,
              resolveUsers : resolve,
              users: []
          };
          return channel;
        };
    
        return pnFactory;
}
    

module.exports = pnService();
