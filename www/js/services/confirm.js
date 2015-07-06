'use strict';

/**
* a service to send email when attendees revu 
*/
angular.module('starter')
.factory('SendConfirm', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/confirm/email/:user';
    return $resource(target,{user:'@user'},{send: {method:'POST', params:{user:'@user'}}});
}])
//authentication path on the user route
.factory('DoConfirm', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/users/confirm/:id';
        return $resource(target,
        {id:'@id'},
        {  confirm : {method:'PUT', params:{id:'@id'}}
        });

}]);
