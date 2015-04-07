'use strict';

/**
* v-follow directive to follow video from a leader 
*/
angular.module('starter.directives')
    .directive('vFollow',['pnFactory','$stateParams', function (pnFactory,$stateParams) {
      return {
        restrict : 'A',
        link: function(scope, element, attrs) 
        {
            //initialize the pubnub channel
            // pnFactory.init(); (done at log in)
            
            scope.channelName = $stateParams.id.toString()+".vidActions";              
            var channel = pnFactory.newChannel(scope.channelName);

            // get the html5 video player and disable the controls   
            scope.myPlayer = element[0];
 
            
            var waitForLeader = function(){
                if(scope.myPlayer != undefined){           
                    scope.myPlayer.pause();
                }
            };
            //if the follower pushes play immediately pause and wait for leader
            scope.myPlayer.onplay = waitForLeader;
            
            // define call backs for leader events
            var doPlay = function(time){
                var noop = function(){};
                if(scope.myPlayer != undefined){
                    //leader wants us to proceed so disconnect callback
                    scope.myPlayer.onplay = noop;
                    scope.myPlayer.currentTime = time;                
                    scope.myPlayer.play();
                    scope.myPlayer.controls=false;    
                }
            };

            var doPause = function(){
                if(scope.myPlayer != undefined){
                    scope.myPlayer.pause();
                }      
            };
            
            var doSeek = function(time){
                if(scope.myPlayer != undefined){
                    scope.myPlayer.currentTime = time;
                }      
            };

            // this is the main callback that listens for the channel actions
            var handleAction = function(action){
                switch(action.command) {
                    case "play":
                        doPlay(action.where);
                        break;
                    case "pause":
                        doPause();
                        break;
                    case "seekTo":
                        doSeek(action.where);
                        break;            
                }
            };
            //then subscribe to the channel and wait
            channel.subscribe(handleAction);
            // listen for slidebox change events            
            scope.$on("slideChange", function(event,args){
                var currentSlide = args;
                var me = attrs.vLead;
                if(currentSlide == me){
                    // do anything I need to do when I become visible
                    //when we slide in wait for leader (this is in case we slide back to this slide)
                    scope.myPlayer.onplay = waitForLeader;                    
                }else{
                    //if I am no longer visible do something here
                }
            });

           scope.$on('$destroy',function() {
                if(channel != undefined) channel.unsubscribe();
            });

        }
        }; 
    }
]);