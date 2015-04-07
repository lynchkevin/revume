angular.module('starter.services',[]);

angular.module('starter.services')
.factory('Session', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/sessions/:sessionId';
    return $resource(target);
}]);