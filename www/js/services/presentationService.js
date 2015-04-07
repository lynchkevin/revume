'use strict';

/**
* A factory to wrap pubnub   
*/

angular.module('starter.services')
    .service('Presentation', ['$resource','baseUrl',function ($resource,baseUrl) {

    var target = baseUrl.endpoint+'/api/presentations/:id';
    return $resource(target);
        
}]);