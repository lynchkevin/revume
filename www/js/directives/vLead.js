'use strict';

/**
* v-lead directive to lead a video for followers   
*/
angular.module('starter.directives')
    .directive('vLead',['pnFactory','$stateParams','$ionicSlideBoxDelegate', function (pnFactory,$stateParams,sbDelegate) {
      return {
        restrict : 'A',
        link: function(scope, element, attrs) 
        {
            //initialize the pubnub channel
            // pnFactory.init();
            scope.channelName=$stateParams.id.toString()+".vidActions";
            
            var channel = pnFactory.newChannel(scope.channelName);
            
            // broadcast play events to other users             
            var onPlay = function() {
                var time = scope.myPlayer.currentTime;
                channel.publish({command:"play", where : time})
                console.log("play!");
            };

            var onPause = function() {
                channel.publish({command:"pause"});
                console.log("pause");
            }

            var onSeeked = function() {
                var time = scope.myPlayer.currentTime;
                channel.publish({command:"seekTo", where : time})
                console.log("seeked");
            }
            
            // listen for slidebox change events            
            scope.$on("slideChange", function(event,args){
                var currentSlide = args;
                var me = attrs.vLead;
                if(currentSlide == me){
                    // do anything I need to do when I become visible
                }else{
                    //if I am no longer visible then pause
                    scope.myPlayer.pause();
                }
            });
                 
            
            // get the html5 video player and connect to the callbacks  
            scope.myPlayer = element[0];
            scope.myPlayer.controls=true;            
            scope.myPlayer.onplay = onPlay;
            scope.myPlayer.onpause = onPause;
            scope.myPlayer.onseeked = onSeeked;
 
           scope.$on('$destroy',function() {
               if(channel != undefined){
                channel.unsubscribe();
               };
            });

        }
      }; 
    }
]);