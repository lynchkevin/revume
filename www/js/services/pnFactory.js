'use strict';

/**
* A factory to wrap pubnub   
*/
angular.module('starter')
    .factory('pnFactory', ['Users','$q', function (Users,$q) {
        var pnFactory = {};
    
        
        pnFactory.init = function(uuid) {
            uuid = uuid || "anonymous";

            pnFactory.uuid = uuid;
            pnFactory.pubnub = PUBNUB.init({
                keepalive : 30,
                publish_key: 'pub-c-19a2e5ee-5b70-435d-9099-65ae53e5b149',
                subscribe_key: 'sub-c-0f2a418a-b9f1-11e4-80fe-02ee2ddab7fe',
                uuid:uuid,
                ssl: true
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
    
        var findOnline = function(message){
            var found = -1;
            for(var i=0; i<this.users.length; i++){
                if(this.users[i]._id == message.uuid)
                    found=i;
            };
            return found;
        };
            
        var resolve = function(message) { 
            var defer = $q.defer();
            var $$ = this;
            switch(message.action) {
                case "join": 
                    //debounce duplicate messages
                    if(this.findOnline(message)<0){
                        this.getUser(message.uuid).then(function(usr){
                            var user={_id:message.uuid,name:usr.userName};
                            $$.users.push(user);
                            defer.resolve($$.users);
                        });
                    }
                    break;
                case "leave":
                    console.log("presence got leave action!");
                case "timeout":
                    var found = this.findOnline(message);
                    if(found>=0)
                        this.users.splice(found, 1); 
                    defer.resolve(this.users);
                    break;
            }
            return defer.promise;
        };
        
        var setUser = function(userName){
            pnFactory.pubnub.state({
                channel: this.name,
                state:{"userName":userName}
            });
        };
        
        var getUser = function(uuid){
            var defer = new $q.defer();
            Users.byId.get({id:uuid}).$promise.then(function(usr){
                if(usr._id){
                var userName = usr.firstName+' '+usr.lastName;
                usr.userName = userName;
                defer.resolve(usr);
                } else 
                    defer.reject('pnFactory uuid in message not found in user db');
            }).catch(function(err){
                defer.reject(err)
            });
            return defer.promise;
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
              findOnline : findOnline,
              setUser : setUser,
              getUser : getUser,
              users: []
          };
          return channel;
        };
    
        return pnFactory;
}]);