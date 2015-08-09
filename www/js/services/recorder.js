'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # presenceService
 * service to handle presence for the app
 */
angular.module('RevuMe')
  .service('recorder', [function () {
    
    if (!Date.now) {
        Date.now = function() { return new Date().getTime(); }
    };
      
    //set the channel we are going to monitor  
    this.setChannel = function(channel){
        this.channel = channel;
        this.messageStore = [];
    };
      
    //start monitoring the channel
    this.record = function(m){
        var timestamp = Date.now();
        var event = {timestamp:timestamp,m:m};
        var last = {};
        var doPush = true;
        // debounce duplicate set slide messages
        if(this.messageStore.length){
            var last = this.messageStore[this.messageStore.length-1];
            if(last.m.action == "set" && m.action == "set"){
                if(last.m.value == m.value ){
                    doPush = false;
                }
            }
        }
        if(doPush) this.messageStore.push(event);
    };
    
    this.export = function(){
        return this.messageStore;
    }
    
    this.dump = function(){
        this.messageStore.forEach(function(event){
            console.log(event);
        });
    }; 
                       
  }]);