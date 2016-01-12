'use strict';

/**
* a service to manage users  
*/
angular.module('RevuMe')
.provider('screenleap',function(){
     this.$get = function(){
         return screenleap;
     };
})
.service('Screenleap', ['screenleap','$http','$q','$ionicPopup','$rootScope','baseUrl','onEvent','$window', '$cookieStore',
function (screenleap,$http,$q,$ionicPopup,$rootScope,baseUrl,onEvent,$window,$cookieStore) {
    var $ = this;
    
    //attach event management
    onEvent.attach($);
    /* events we fire
        screenShareStart,
        presenterConnect,
        screenShareEnd,
        viewerConnect,
        viewerDisconnect,
        onPause,
        onResume,
        error
    */
    //setup some service variables
    $.screenleap = screenleap;
    $.sharingSession = undefined;
    $.api = baseUrl.endpoint+'/api/screenleap';
    

    //get the clients external IP address (needed for screenleap)
    var json = 'https://api.ipify.org/?format=json';
    $http.get(json).then(function(result) {
        $.clientIP = result.data.ip;
    }, function(e) {
        console.log('Screenleap Service - error getting IP');
    });
    $.downloadAndStart = function(){
        $.screenleap.downloadAndStartNativeApp();
    }
    $.startFromClick = function(){
        $.screenleap.startAppUsingCustomProtocolHandler();
    }
    $.startSharing = function(){
        var deferred = $q.defer();
        var url = $.api+'/start';
        //get the most recent window position and dimensions
        $.reAspect()
        $http.get(url,{params:{clientIP:$.clientIP,
                               rectangle:$.rectangle}}).then(function(response){
            if(response.data[1] != undefined){
                $.sharingSession = JSON.parse(response.data[1]);
                if($.sharingSession.errorMessage != undefined){
                    var response = {errorMessage:$.sharingSession.errorMessage}
                    throw response;
                } else {
                    $.screenleap.startSharing('NATIVE',$.sharingSession,$.callbacks);
                    deferred.resolve($.sharingSession);
                }
            }
        }).catch(function(response){
          var template = response.errorMessage;
          var alert = $ionicPopup.alert({
                    title:'Screenleap API Error !',
                    template: template
                });
                alert.then(function(){
                    deferred.reject(response);
                });
        });
        return deferred.promise;
    }
    
    $.endSharing = function(){
        var url = $.api+'/stop';
        if($.sharingSession != undefined){
            $http.post(url,{sharingSession:$.sharingSession}).then(function(response){
                console.log('sharing sessions stopped: ',response);
            }).catch(function(err){
              var template = err.statusText;
              var alert = $ionicPopup.alert({
                        title:'Screenleap API Error !',
                        template: template
                    });
                    alert.then(function(){
                        console.log('Alerted!');
                    });
            });
        }
    }
    
    $.screenleap.onScreenShareStart = function(){
        console.log('screenShare start');
        //if everything worked let's see if screenleap's cookie is set
        var cookie = $cookieStore.get('__aa');
        if(cookie == undefined)
            $cookieStore.put('__aa',true);
        $.$fire('screenShareStarted');
    }
    $.screenleap.onPresenterConnect = function(){
        console.log('Presenter Connected');
    }
    $.screenleap.onScreenShareEnd = function(){
        $.$fire('screenShareEnd');
        console.log('Screen Share End');
    }
    $.screenleap.onViewerConnect = function(participantId, externalId){
        console.log('viewConnected participantID: ',participantId,' externalId: ',externalId);
    }
    $.screenleap.onViewerDisconnect = function(participantId, externalId){
        console.log('viewDisconnected participantID: ',participantId,' externalId: ',externalId);
    }
    $.onDownloadStarting = function(){
        console.log('downloadStarting');
        $.$fire('downloadStarting');
    }
    
    $.onScreenShareStarting = function(){
        console.log('screenShareStarting');
        $.$fire('screenShareStarting');
    }
   
    $.onAppConnectionFailed = function(){
        console.log('app connection failed');
    }
    $.onScreenShareStartError = function(){
        console.log('screen share start error');
    }
    $.onLocalServerFailed = function(){
        console.log('screen share local webserver failure');
    }
    //setup the native callbacks
    $.callbacks = {
        nativeDownloadStarting:$.onDownloadStarting,
        screenShareStarting:$.onScreenShareStarting,
        appConnectionFailed:$.onAppConnectionFailed,
        screenShareStartError:$.onScreenShareStartError,
        localWebServerStartFailed:$.onLocalServerFailed
    };
    $.reAspect = function(){
        if($window.screenX < 0)
            var screenX = $window.screen.availWidth+$window.screenX;
        else
            var screenX = $window.screenX;
        console.log('screenX = ',screenX);
        $.rectangle = {
            rectangleXPos:screenX,
            rectangleYPos:$window.screenY,
            rectangleWidth:$window.outerWidth,
            rectangleHeight:$window.outerHeight
        }
    }
}]);