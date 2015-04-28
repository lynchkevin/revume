'use strict';

/**
* a service to send email when attendees revu 
*/
angular.module('starter.services')
.factory('Revu', ['$resource','baseUrl',function ($resource, baseUrl) {
    var startTarget = baseUrl.endpoint+'/api/revu/start';
    var endTarget = baseUrl.endpoint+'/api/revu/end';
    return {
        start: $resource(startTarget,
                         {},
                         {  send: {method:'POST', params:{}}
                         }),
        end: $resource(endTarget,
                       {},
                        {  send: {method:'POST', params:{}}
                        }),   
                      
        }
}]);
