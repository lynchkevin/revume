'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:SlideCtrl
 * @description
 * # presenceService
 * service to handle presence for the app
 */
angular.module('RevuMe')
.factory('EngagementMetrics', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/metrics/:sid/:did';
    return $resource(target);
}])
.service('presAnalyzer',['EngagementMetrics','$q',function (EngagementMetrics,$q) {
    
      
    //look back and set the endtime of the last element in the list  
    function setEndtime(array, endTime){
        if(array.length){
            var idx = array.length-1;
            array[idx].endTime = endTime;
            array[idx].duration = (endTime - array[idx].startTime)/1000.0;
        };
    };
    
    function findUser(users, name){
        var idx = 0;
        var retVal = null;
        users.forEach(function(usr){
            if(usr.name != undefined)
                if(usr.name.valueOf() == name.valueOf()){
                    retVal = users[idx];
                    retVal.idx = idx;
                }
            idx++;
        });
        return retVal;
    };
    function updateUser(users,usr,event){
        var found = findUser(users,usr.name);
        var newUser = {};
        if(found){
            found.events.push(event);
        }else{
            var newUser = new Object();
            newUser.events = [];
            newUser.name = usr.name;
            newUser.events.push(event);
            users.push(newUser);
            
        }
    };
      
    function timeViewed(slide,user){
        var viewingTime = 0.0;
        var lastState = {state:"init"}
        var latestStart = 0;
        var currentState = {};
        var afterSlide = false;
        if(slide.endTime == undefined){
            return 100.0;
        }
        

        user.events.forEach(function(event){
            if(!afterSlide){
                switch(event.m.action) {
                    case  "leave" :
                    case  "timeout" :
                        currentState.state = "gone";
                        currentState.timestamp = event.timestamp;
                        break;
                    case "join":
                        currentState.state = "here";
                        currentState.timestamp = event.timestamp;
                        break;
                    case "engagement":
                        if(event.m.status == "engaged"){
                            currentState.state = "here";
                        }else {
                            currentState.state = "gone"
                        }
                        currentState.timestamp = event.timestamp;
                        break;
                }
                //if an event lands inside the slide duration add fractional amounts for each event
                if (currentState.timestamp >= slide.startTime && currentState.timestamp <= slide.endTime){
                    latestStart = Math.max(lastState.timestamp, slide.startTime);
                    switch(lastState.state){
                            case "init" :
                                if(currentState.state == "gone"){
                                    viewingTime +=(currentState.timestamp - slide.startTime)/1000.0;
                                }
                                break;
                            case "here" :
                                    viewingTime +=(currentState.timestamp - latestStart)/(1000.0); 
                                break;

                    }
                }
                // we're now outside the slide time interval - tally up the viewing time
                if(currentState.timestamp >= slide.endTime){
                    latestStart = Math.max(lastState.timestamp, slide.startTime);
                    switch(lastState.state){
                            case "init" :               
                                viewingTime = 0;
                                break;
                            case "here" :
                                viewingTime += (slide.endTime - latestStart)/(1000.0);
                                break;
                    }
                    afterSlide = true;
                }
                lastState.state = currentState.state;
                lastState.timestamp = currentState.timestamp;
            } //afterSlide loop
        }); //Were out of events - if this is the last event then 
        if(!afterSlide){ // if we have no more events, then the only state is the last state
            latestStart = Math.max(lastState.timestamp, slide.startTime);
            if(lastState.state == "here"){
                viewingTime += (slide.endTime - latestStart)/(1000.0);   
            }
        }
            
        console.log("Slide ",slide.number, "viewingTime : ",viewingTime," user :",user.name);
        return viewingTime;
    }
        
                    
   
    function process(results){
        var usr;
        for(var i= 0 ; i<results.slides.length; i++){
            results.slides[i].users = [];
            for(var j=0; j < results.users.length; j++){
                usr = new Object();
                usr.name = results.users[j].name;
                usr.idx = j;
                usr.engagement = timeViewed(results.slides[i],results.users[j]);
                results.slides[i].users.push(usr);
            }
        }
    }
            
    function report(results){
        var str = "";
        results.slides.forEach(function(slide){
            str = "";
            str = "slide "+slide.number+"duration :"+slide.duration;
            slide.users.forEach(function(user){
                str = str+ " " +user.name+" " + user.engagement;
            });
            console.log(str);
        });
    }
                          
    this.analyze = function(data) {
        var results = {};
        var slide = {};
        results.presentation = {};
        results.slides = [];
        results.users = [];
        
        //take a list of messages and analyze them
        this.messageStore = data;
        this.messageStore.forEach(function(event){
            var msg = event.m;
            switch(msg.action){
                case "new" :
                    results.presentation.id = msg.value;
                    results.presentation.startTime = event.timestamp;
                    break;
                case "end" :
                    results.presentation.endTime = event.timestamp;
                    setEndtime(results.slides,event.timestamp);
                    break;
                case "set" :
                    slide = new Object();
                    slide.number = msg.value;
                    slide.startTime = event.timestamp;
                    setEndtime(results.slides,event.timestamp);
                    results.slides.push(slide);
                    break;
                case "join":
                case "timeout":
                case "leave":
                    var user = {};
                    user.name = msg.userName;
                    updateUser(results.users,user,event);
                    break;
                case "engagement":
                    var u = {};
                    u.name = msg.who;
                    updateUser(results.users,u,event);
                    break;
            }
        });
        process(results);
        report(results);
        return results;
    };
      
      
    this.save = function(record){
        var defer = $q.defer();
        var metrx = new EngagementMetrics;
        var results = record.results;
        var pres = results.presentation;
        var slides = results.slides;
        metrx.session = record.session;
        metrx.eventDate = new Date();
        metrx.deck = record.presentation;
        metrx.duration = (pres.endTime - pres.startTime)/1000.0;
        metrx.slideViews=[];
        for(var i=0;i<slides.length;i++){
            var sview = {};
            sview.slideIndex = parseInt(slides[i].number);
            sview.duration = slides[i].duration;
            sview.views=[];
            slides[i].users.forEach(function(user){
                sview.views.push({userName:user.name,viewed:user.engagement});
            });
            metrx.slideViews.push(sview);
        }
        metrx.viewers=[];
        results.users.forEach(function(user){
            metrx.viewers.push(user.name);
        });
        metrx.$save().then(function(_id){
            defer.resolve(_id);
        }).catch(function(err){defer.reject(err);console.log(err)});
        return defer.promise;
    };
    
    this.get = function(sid,did){
        return EngagementMetrics.query({sid:sid,did:did}).$promise;
    }
            
            

                             
  }]);