'use strict';

/**
* a service to manage teams  
*/
angular.module('starter')

.factory('Teams', ['$resource','baseUrl',function ($resource,baseUrl) {
    var target = baseUrl.endpoint+'/api/teams/:id';  
    return $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}}
        });
}])

.service('TeamService', ['Teams',
                         'Users',
                         '$q',
                         '$ionicPopover',
                         '$rootScope', 
function (Teams,Users,$q,$ionicPopover,$rootScope) {
    var $ = this;
    var permissionList = [{name:'read/write'},{name:'read-only'}];
    $.scope = undefined;
    
    $.init = function($scope){
        $scope.editTeamId = undefined;
        $scope.permissions = permissionList;
    }
    function nameToPermission(name){
        for(var i=0; i<permissionList.length; i++)
            if(name == permissionList[i].name)
                return permissionList[i];
    }
    //map dbMember to simple Member shim
    $.toMemberShim = function(dbTeam){
        dbTeam.members.forEach(function(member){
            var user = member.user;
            //collaps the user - the role is alread there
            member.firstName = user.firstName;
            member.lastName = user.lastName;
            member.email = user.email;
            member._id = user._id;  
            member.role = nameToPermission(member.role);
        });
    };
    //map shim back to DB model
    $.fromMemberShim = function(team){
        team.members.forEach(function(member){
            var user = {};
            user.firstName = member.firstName;
            user.lastName = member.lastName;
            user.email = member.email;
            user._id = member._id;
            var m = {};
            member.user = user;
        });
    }
    //get all teams
    $.getAll = function(userId){
        var defer = $q.defer();
        Teams.query({user:userId}).$promise.then(function(teams){
            teams.forEach(function(team){
                $.toMemberShim(team);
            });
            defer.resolve(teams);
        });
        return defer.promise;
    }
    //do refresh of the team collection
    $.refreshTeams = function($scope){
        var defer = $q.defer();
        var _id = $rootScope.user._id;
        if(_id != undefined){
            $.getAll(_id).then(function(teams){
                $scope.teams = teams;
                defer.resolve();
            }); 
        };
        return defer.promise;
    }
    //setup for a new team
    $.newTeam = function($scope){
        $scope.addTeam={};
        $scope.addTeam.name='';  
        $scope.addTeam.memberString='';
        $scope.addTeam.members=[];
        $scope.addTeam.nameString ='';
        $scope.addTeam.emailString='';
        $scope.addTeam._id = undefined;
        $scope.autoComplete = {};
        $scope.autoComplete.entries=[];  
    }
    //setup to edit a team
    $.editTeam = function($scope,idx){
        var team = $scope.teams[idx];
        $scope.editTeamId = team._id;
        $scope.addTeam={};
        $scope.addTeam.name=team.name;  
        $scope.addTeam.memberString='';
        $scope.addTeam.members = [];
        team.members.forEach(function(member){
            $scope.addTeam.members.push(member);
            $scope.addTeam.memberString+=
                member.firstName+','+member.lastName+','+member.email+','+member.role.name+';';
        });
        $scope.addTeam.nameString ='';
        $scope.addTeam.emailString='';
        $scope.addTeam._id = undefined;
        $scope.autoComplete = {};
        $scope.autoComplete.entries=[];
    }
    //add a member to a team
    $.addMember = function($scope){
        var m = {}
        var nStr = $scope.addTeam.nameString.split(' ');
        m.firstName = nStr[0];
        m.lastName = nStr[1];
        m.email = $scope.addTeam.emailString;
        m.role = $scope.permissions[1]; //set new members to read by default
        $scope.addTeam.memberString+= m.firstName+','+m.lastName+','+m.email+','+m.role.name+';';
        if($scope.addTeam._id != undefined)
            m._id = $scope.addTeam._id;
        $scope.addTeam.members.unshift(m);
        $scope.addTeam.nameString ='';
        $scope.addTeam.emailString='';
        $scope.addTeam._id = undefined;
    }
    //delete a member
    $.delMember = function($scope,$index){
        $scope.addTeam.memberString = '';
        $scope.addTeam.members.splice($index,1);
        $scope.addTeam.members.forEach(function(member){
            $scope.addTeam.memberString+=
                member.firstName+','+member.lastName+','+member.email+','+member.role.name+';';
        });
    } 
    //regex to validate an email address that comes in via comma delimited
    function validateEmail(email) {
        var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        return re.test(email);
    }
    //validate a comma delimited member list
    $.validateMembers= function($scope){
        var mStr = $scope.addTeam.memberString;
        var memberList = [];
        $scope.addTeam.memberString = mStr.replace(/(\r\n|\n|\r)/gm,"");
        memberList = $scope.addTeam.memberString.split(';');
        memberList.forEach(function(elem){
            if(elem.length>0){
                var m = elem.split(',');
                var member = {};
                if(m.length<3){
                    member.valid = false;
                } else {
                    member.firstName = m[0];
                    member.lastName = m[1];
                    member.email = m[2];
                    member.role = nameToPermission(m[3]);
                    member.valid = validateEmail(member.email);
                    $scope.addTeam.members.push(member);
                }
            };
        }); 
    }
    //build a team object from the users input
    $.teamFromInput = function($scope){
        //add the owner (this user) to the member list before saving
        var owner = {};
        var team = {};
        var member = {};
        var name = $rootScope.user.name.split(' ');
        team.members = [];
        owner.firstName = name[0];
        owner.lastName = name[1];
        owner.email = $rootScope.user.email;
        owner._id = $rootScope.user._id;
        owner.role = $scope.permissions[0];
        team.name = $scope.addTeam.name;
        if($scope.editTeamId == undefined)
            team.members.push(owner);
        else
            team._id = $scope.editTeamId;
        $scope.addTeam.members.forEach(function(member){
            team.members.push(member);
        });
        //done getting input so reset editTeamId
        $scope.editTeamId = undefined;
        return team;
    }
    //build a database team from the model - add new users if needed
    $.teamFromTeam = function(team){
        var defer = $q.defer();
        var promises = [];
        var dbTeam = new Teams;
        $.fromMemberShim(team);
        dbTeam.name = team.name;
        dbTeam.members = [];
        if(team._id != undefined)
            dbTeam._id = team._id;
        team.members.forEach(function(member){
            //if this is a new user save to database
            if(member.user._id == undefined){
                var usr = new Users.byId
                var d = $q.defer();
                angular.extend(usr,member.user);
                promises.push(d);
                usr.$save().then(function(usr){
                    var m = {};
                    m.user =usr._id;
                    m.role = member.role.name;
                    dbTeam.members.push(m);
                    d.resolve();
                });
            }
            else{ //if not a new user then just push the _id
                var m = {};
                m.user =member.user._id;
                m.role = member.role.name;
                dbTeam.members.push(m);
            }
        })
        $q.all(promises).then(function(){
            defer.resolve(dbTeam);
        });
        return defer.promise;
    }
    //create a new team
    $.save = function(team){
        var defer = $q.defer();
        $.teamFromTeam(team).then(function(dbTeam){
            return dbTeam.$save();
        }).then(function(){
            defer.resolve();
        });     
        return defer.promise;
    };
    //update a team
    $.update = function(team){
        var defer = $q.defer();
        $.teamFromTeam(team).then(function(dbTeam){
            return Teams.update({id:dbTeam._id},dbTeam);
        }).then(function(){
            defer.resolve();
        });
        return defer.promise;
    }
    //delete a team
    $.delete = function(_id){
        var defer = $q.defer();
        Teams.delete({id:_id}).$promise.then(function(){
            defer.resolve();
        });
        return defer.promise;
    }
}]);