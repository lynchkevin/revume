/*
fileBox.js - A self Contained Module to Interface with Box and Dropbox
    Included Items:
    1.ngHello - a provider for hello.js - an OAUTH library used to authenticate to various services
    2 fileBox - which has a few components
        - 'pathToLinks'     - directive for creating clickable breadcrumbs for the selected box/dropbox path
        - 'dropboxButton'   - directive that creates a branded dropbox button that connects to this controller
        - 'boxButton'       - directive that creates a box branded button just like the one above
        - 'fileNavigator'   - a view (template) used for both Box and Dropbox 
                            - uses the pathToLinks directive
        - 'fileNavCtrl      - the controller for the FileNavigator view
        - 'DropboxService   - service the models the dropbox rest api
        - 'BoxService       - service that models the box rest api
                            - requires node routes because box sends files back in a location header 
                            that is difficult to read in the browser, so we proxy it in node.
        - 'onEvent'         - a service that allows any other service to provide subscribable events for callbacks
        - 'Evaporate'       - a service that interfaces with the evaporate upload module
        
    Dependencies:
        Javascript Librarys:
            <script src="lib/ngStorage.js"></script>
            <script class="pre" src="lib/hello/dist/hello.all.js"></script>
            <script class="pre" src="lib/hello/src/modules/box.js"></script>
            
        Node Routes:
           baseUrl/api/box  - this library tests this route and throws an error if the route is missing
        
        Images:
            box_navy.png,
            box_white.png,
            Dropbox-white.png
*/
angular.module('ngHello', [])
.provider('hello',function(){
     this.$get = function(){
         return hello;
     };
    
     this.init = function(services,options){
         hello.init(services,options);
     };
})
.config(['helloProvider','redirectUrl','baseUrl',
function(helloProvider,redirectUrl,baseUrl) {

  helloProvider.init({dropbox:'f9cdswrtfz1jsd9',
                      box:'11rseev2g1yripmmx833cp5jhiqy82v2'},
                     {
                        redirect_uri:redirectUrl,
                    });
}])
.run(['$ionicPlatform','$rootScope','hello',
function($ionicPlatform,$rootScope,hello) {
  $ionicPlatform.ready(function() {
    hello.on("auth.login", function (r) {
        var auth = r.authResponse;
        var network = auth.network;
        $rootScope[network] = auth;
        var event = 'auth.'+network;
        console.log(auth);
        $rootScope.$broadcast(event,auth);
    });
  });
}]);
angular.module('fileBox',['ngHello'])
.run(['$ionicPlatform','$ionicPopup','BoxService',
function($ionicPlatform,$ionicPopup,BoxService) {
  $ionicPlatform.ready(function() {
      BoxService.testApi()
      .then(function(){
          console.log('Box API is Alive');
      }).catch(function(){
          $ionicPopup.alert({
              title:'Error on Startup',
              template: 'No Response From Box Proxy'
          });
      });
  });
}])
.directive('dropboxButton',['$compile','$parse',function($compile,$parse){
    return{
        restrict: 'A',
        template:'<i class="icon icon-left ion-social-dropbox positive"></i>  Dropbox Import'
    }
}])
.directive('boxButton',['$compile','$parse','baseUrl',function($compile,$parse,baseUrl){
    return{
        restrict: 'A',
        template:'<img src="'+baseUrl.endpoint+'/img/box_navy.png" style="max-width:30px" >  Import',
    }
}])
//collapse all the evaporate settings into a foolproof package
.directive('fileBox',['$compile',function($compile){
    return{
        restrict: 'E',
        replace:true,
        templateUrl: 'templates/fileBox.html'
    }
}])
//create a drop zone that is connected to evaporate
.directive('dropZone',['$compile',function($compile){
    return{
        restrict: 'E',
        replace:true,
        template:'<div ng-controller="fileNavCtrl"><div class="centered-container" evaporate eva-model="eva.Data" ng-model="eva.Inbox"><p>Drop your file(s) here</p></div></div>',
        link: function(scope,element,attrs){
            $compile(element.contents())(scope);
        }
    }
}])
//path directive that creates a path with clickable breadcrumbs
.directive('pathToLinks',['$sce','$parse','$compile','$timeout','$ionicScrollDelegate',
function($sce,$parse,$compile,$timeout,$ionicScrollDelegate){
    return{
        restrict: 'EA',
        require:'ngModel',
        link: function(scope,element,attrs,ngModelCtrl){
            var model = $parse(attrs.ngModel);
            scope.callBack = attrs.onChange || undefined;
            
            scope.updateLinksDropBox = function(){
                var folder = ngModelCtrl.$viewValue;
                var path = folder.path;
                var parts = path.split('/');
                var breadCrumb = '';
                var html = '';
                var newPart = undefined;
                
                parts.forEach(function(part){
                    if(part != ''){
                        breadCrumb += '/'+part;
                        if(scope.callBack !== undefined)
                            newPart ="/<a ng-click=\""+scope.callBack+"("+"'"+breadCrumb+"\')\">"+part+"</a>";
                        else
                            newPart = '/'+part;
                        html += newPart;
                    }
                });
                element[0].innerHTML = $sce.trustAsHtml(html);
                $compile(element.contents())(scope);
                $ionicScrollDelegate.$getByHandle('path').scrollBottom(true);
            }
        
            scope.updateLinksBox = function(){
                var folder = ngModelCtrl.$viewValue;
                var parts = folder.path_collection.entries;
                var html = '';
                var newPart = undefined;
                
                parts.forEach(function(part){
                    if(scope.callBack !== undefined)
                        newPart ="/<a ng-click=\""+scope.callBack+"("+"'"+part.id+"\')\">"+part.name+"</a>";
                    else
                        newPart = '/'+part.name;
                    html += newPart;
                });
                if(folder.id != 0){
                    newPart = "/<a ng-click=\""+scope.callBack+"("+"'"+folder.id+"\')\">"+folder.name+"</a>";
                    html+=newPart;
                    element[0].innerHTML = $sce.trustAsHtml(html);
                    $compile(element.contents())(scope);
                    $ionicScrollDelegate.$getByHandle('path').scrollBottom(true);
                }
            }
            
            scope.$watch(model,function(model){
                if(model){
                    if(model.hasOwnProperty('item_collection'))
                        scope.updateLinksBox();
                    if(model.hasOwnProperty('is_dir')&&model.hasOwnProperty('thumb_exists'))
                        scope.updateLinksDropBox();
                }
            });
                
        }
    }
}])

//controller for the fileNavigator view (template)      
.controller('fileNavCtrl',['$scope',
                           '$timeout',
                           'Evaporate',
                           'DropboxService',
                           'BoxService',
                           '$ionicModal',
                           '$ionicLoading',
                           '$ionicScrollDelegate',
                           'baseUrl',
function($scope,
          $timeout,
          Evaporate,
          DropboxService,
          BoxService,$ionicModal,
          $ionicLoading,
          $ionicScrollDelegate,
          baseUrl){
    //connect to box and dropbox services
    $scope.dropBox = DropboxService;
    $scope.box = BoxService;
    // create a modal to show the fileNavigator
    $ionicModal.fromTemplateUrl('templates/fileNavigator.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.fileModal = modal;
    });
    //bring in the evaporate module
    $scope.eva = Evaporate;  
    $scope.eva.$on('fileSubmitted',function(){console.log('Test: file submitted!')});
    
    //dropbox and box services 'file' event callback                    
    $scope.selectedCallback = function(file){
        $timeout(function(){
            $scope.eva.Inbox.push(file);
        },0);
    }
    //attach dropbox and box to evaporate
    $scope.dropBox.$on('file',$scope.selectedCallback);
    $scope.box.$on('file',$scope.selectedCallback);

    //backdrops to show while loading
    //Loading Templates for Each Service
    var templateStart = '<div style="display:block">';
    var templateEnd = '<p>Loading...</p></div>';
    
    var dropboxBranding = '<img style="max-width:64px" src="'+baseUrl.endpoint+'/img/Dropbox-white.png"></img>';
    var dropboxTemplate = templateStart+dropboxBranding+templateEnd;
                             
    var boxBranding = '<img style="max-width:64px" src="'+baseUrl.endpoint+'/img/box_white.png"></img>';
    var boxTemplate = templateStart+boxBranding+templateEnd;
    $scope.loadStart = function(){
        $ionicLoading.show({
            template: $scope.active.template
        });
    }
    $scope.loadEnd = function(){
        $ionicLoading.hide();
        $ionicScrollDelegate.$getByHandle('fileNavigator').scrollTop();
    }
    // connect to the service events
    $scope.dropBox.$on('loadStart',$scope.loadStart);
    $scope.box.$on('loadStart',$scope.loadStart);
    $scope.dropBox.$on('loadEnd',$scope.loadEnd);
    $scope.box.$on('loadEnd',$scope.loadEnd);
                             
    //The fileNavigator does all the work...                         
    $scope.fileNavigator = {
        dropBox : { provider:$scope.dropBox,
                    template:dropboxTemplate
                  },
        Box : { provider:$scope.box,
                template:boxTemplate
              },
        show : function(service){
                    if(this.hasOwnProperty(service)){
                        var svc = this[service];
                        $scope.active = svc.provider;
                        $scope.active.template = svc.template;
                        $scope.active.showRoot();
                        $scope.fileModal.show();
                    }
                },
        hide : function(){
                    $scope.fileModal.hide();
                },
    }  

}])
//service that models both dropbox and box rest APIs
.service('onEvent',[function(){
    var $ = this;
    var noop = function(){};
    
    function eventName(event){
        return '._.'+event;
    }
    //allow services to publish an event with $on
    var on = function(event,callback){
        var noop = function(){};
        var $event = eventName(event);
        var id = undefined;
        if(this.hasOwnProperty($event) && callback){
            this[$event].push(callback)
            id = this[$event].length - 1;
        }
        else if(callback){
            this[$event] = [];
            this[$event].push(callback);
            id = this[$event].length - 1;
        }
        return {event:$event,id:id};
    }
    //allow an event to fire an event with $fire
    var fire = function(event){
        var $event = eventName(event);
        var args = Array.prototype.slice.call(arguments);
        args.shift(); //remove the event
        if(this.hasOwnProperty($event)){
           this[$event].forEach(function(listener){
               listener.apply(listener,args);
           });
        }
    }
    var off = function(identifier){
        if(identifier && identifier.event){
            var $event = identifier.event;
            if(this.hasOwnProperty($event))
                this[$event].splice(identifier.id,1)
        }
    }   
    //attach thise functionality to the client
    $.attach = function(client){
        client.$on = on;
        client.$fire = fire;
        client.$off = off;
    }
}])
// Evaporate service for managing file uploads....
.service('Evaporate',['onEvent',function(onEvent){
    $ = this;
    
    //support attachable events using 'on'
    onEvent.attach($);
    /*  events we fire
        fileSubmitted
        fileProgress
        fileCompleted
        fileError
    */
    $.Data = {
        dir: 'uploads',
        timestampSeparator: '_',
        headersCommon: {
        'Cache-Control': 'max-age=3600'
        },
        headersSigned: {
        'x-amz-acl': 'bucket-owner-full-control'
        },
        onFileSubmitted: function(file){ 
            file.progress = '0%'; 
            $.$fire('fileSubmitted',file);
        },
        onFileProgress: function (file) {
            console.log(
              'onProgress || name: %s, uploaded: %f%, remaining: %d seconds',
              file.name,
              file.progress,
              file.timeLeft
            );
            file.progressString = (file.progress).toString()+"%";
            $.$fire('fileProgress',file);
        },
        onFileComplete: function (file) {
            console.log('onComplete || name: %s', file.name);
            file.fullName = file.path_
            $.$fire('fileComplete',file);
        },
        onFileError: function (file, message) {
            console.log('onError || message: %s', message);
            file.errMessage = message;
            $.$fire('fileError',message);
        }
    }   
                             
    //any file(s) added to this array will get uploaded via $watch in directive            
    $.Inbox = [];
}])
.service('DropboxService',['$rootScope','hello','$timeout','$sce','onEvent',
function($rootScope,hello,$timeout,$sce,onEvent){
    var $ = this;
    $.name = 'Dropbox';
    
    var dropBox = hello('dropbox');
    var noop = function(){};
    $.loggedIn = false;
    $.folders = undefined;

    onEvent.attach($);

    function blobToFile(theBlob,fileName){
        theBlob.lastModifiedDate = new Date();
        theBlob.name = fileName;
        return theBlob;
    }
    //OATH2 signin
    $.authenticate = function(){
        if(!$.loggedIn)
            dropBox.login().then(function(){
                $.loggedIn = true;
            });
        else
            dropBox.logout().then(function(){
                $.loggedIn = false;
                $.authData = undefined;
                $.$fire('auth');
            });
    } 
    // strip out the long openXml descriptors
    function stripOpenXmlCrap(type){
        if(type.indexOf('vnd.openxmlformats')>0){
            var start = type.indexOf('/');
            var end = type.lastIndexOf('.')+1;
            type = type.replace(type.substring(start,end),'/');
        }
        return type;
    }
    //show the root directory    
    $.showRoot = function(){
        var doit = function(){
            $.$fire('loadStart');
            dropBox.api('me/folders','get',{},function(folders){
                folders.data.forEach(function(file){
                    file.type = stripOpenXmlCrap(file.type);
                });
                $timeout(function(){
                     $.folders = folders;
                     $.loadThumbs();
                    $.$fire('loadEnd');
                });
            });
                
        }
        //if not authenticated - then authenticate
        if(!$.authData){
            dropBox.login().then(function(){
                $.loggedIn = true;
                doit();
            });
        } else {
            doit();
        }
    }
    //show the contents of a folder
    $.showFolder = function(path){
         $.$fire('loadStart');
        dropBox.api('me/folder','get',{id:path},function(contents){
            if(contents.data.length == 0){
                var file = {name:'No Files Found',
                            is_dir:false,
                            thumb_exists:false,
                            is_empty:true,
                            path:contents.path,
                           };
                contents.data.push(file);
            } else {
                contents.data.forEach(function(file){
                    file.type = stripOpenXmlCrap(file.type);
                });
            }
            $timeout(function(){
                $.folders = contents
                $.loadThumbs();
                $.$fire('loadEnd');
            },0);
        });
    }
    //get the thumbnails for each file in the current folder
    $.loadThumbs = function(){
        $.folders.data.forEach(function(file){
            if(file.thumb_exists){
                var path = file.path;
                var endPoint = 'https://content.dropboxapi.com/1/thumbnails/auto'+path; 
                dropBox.api(endPoint,'get',function(thumb){
                    var thumbUrl = (window.URL || window.webkitURL).createObjectURL( thumb );
                    $timeout(function(){
                    file.thumb = $sce.trustAsResourceUrl(thumbUrl);
                    },0);
                });
            }
        });
    }
    //get the file from dropbox
    $.getFile = function(dropBoxFile){
        var path =dropBoxFile.path;
        var endPoint = 'https://content.dropboxapi.com/1/files/auto'+path;
        $.$fire('loadStart');
        dropBox.api(endPoint,'get',function(blob){
            $.file = blobToFile(blob,dropBoxFile.name);
            $.$fire('file',$.file);
            $.$fire('loadEnd');
        });        
    }
    //select an item in a folder
    $.select = function(index){
        if($.folders.data.length >= index){
            var item = $.folders.data[index];
            if(item.is_empty){
                var lastSlash = item.path.lastIndexOf('/');
                if(lastSlash != -1){
                    var path = item.path.substring(1,lastSlash);
                    $.showFolder(path);
                } else
                    $.showRoot();       
            }else{
                if(item.type == 'folder')
                    $.showFolder(item.path);
                else
                    $.getFile(item);
            }
        }
    }
    
    $rootScope.$on('auth.dropbox',function(event,auth){
        $.authData = auth;
        dropBox.api('/me',function(p){
            $timeout(function(){
                $.loggedIn = true;
                $.userInfo = p;
                $.$fire('auth');
                console.log(p);
            },0);
        });
    });
                    
}])

.service('BoxService',['$rootScope','hello','$timeout','$sce','$http','onEvent','$q','baseUrl','$ionicPopup',
function($rootScope,hello,$timeout,$sce,$http,onEvent,$q,baseUrl,$ionicPopup){
    var $ = this;
    $.name = 'Box';
    
    var baseRoute = baseUrl.endpoint+'/api/box';
    var routes = {
            baseRoute: baseRoute,
            file:baseRoute+'/file',
            thumbnail:baseRoute+'/thumbnail',
            auth:baseRoute+'/authData'
                 }
    
    var box = hello('box');
    var noop = function(){};
    $.loggedIn = false;
    $.folders = undefined;
    onEvent.attach($);
    
    function blobToFile(theBlob,fileName){
        theBlob.lastModifiedDate = new Date();
        theBlob.name = fileName;
        return theBlob;
    }
    //OATH2 signin
    $.authenticate = function(){
        if(!$.loggedIn)
            box.login().then(function(){
                $.loggedIn = true;
            });
        else
            box.logout().then(function(){
                $.loggedIn = false;
                $.authData = undefined;
                $.$fire('auth');
            });
    }
    //show the root directory    
    $.showRoot = function(){
        var doit = function(){
            $.$fire('loadStart');
            var endpoint = 'https://api.box.com/2.0/folders/0'
            box.api(endpoint,'get',{},function(folders){
                $timeout(function(){
                     $.folders = folders;
                     $.folders.root = folders.name;
                     $.folders.path = '';
                     $.$fire('loadEnd');
                });
            });
        }
        //if not authenticated - then authenticate
        if(!$.authData){
            box.login().then(function(){
                $.loggedIn = true;
                doit();
            });
        } else {
            doit();
        }
    }
    
    function buildPath(folder){
        var path = '';
        folder.root = folder.path_collection.entries.shift().name;//remove the first item 
        folder.path_collection.entries.forEach(function(node){
            path += '/'+node.name;
        });
        path += '/'+folder.name;
        return path;
    }
    
    $.upOneLevel = function(folder){
        var length = folder.path_collection.entries.length;
        var idx = length -1;
        var retVal = '0';
        if(idx > 0)
            retVal = folder.path_collection.entries[idx].id;
        return retVal;
    }

            
        
    //show the contents of a folder
    $.showFolder = function(id){
        var endpoint = 'https://api.box.com/2.0/folders/@{FOLDER_ID}';
        $.$fire('loadStart');
        box.api(endpoint,'get',{FOLDER_ID:id},function(contents){
            contents.path = buildPath(contents);
            var gp = $.upOneLevel(contents);
            if(contents.item_collection.entries.length == 0){
                var file = {name:'No Files Found',
                            is_dir:false,
                            thumb_exists:false,
                            is_empty:true,
                            grandParent:gp,
                           };
                contents.item_collection.entries.push(file);
            }
            $timeout(function(){
                $.folders = contents
                $.$fire('loadEnd');
            },0);
        });
    }
    //get the thumbnails for each file in the current folder
    $.loadThumbs = function(){
        $.folders.item_collection.entries.forEach(function(file){
            if(file.type != 'folder'){
                var endpoint = baseUrl+'/api/box/thumbnail';
                $http.get(routes.thumbnail,{params:{_id:file.id}})
                .then(function(response){
                    if(response.data){
                        var abView = new Uint8Array(response.data);
                        var base64 = response.data;
                        var thumbUrl = 'data:image/png;base64,'+base64;
                        //var thumb = new Blob([abView],{type:'image/png'});
                        //var thumbUrl = (window.URL || window.webkitURL).createObjectURL( thumb );
                        $timeout(function(){
                        file.thumb = thumbUrl;
                        },0);
                    }
                });
            }
        });
    }
    //get the file from box
    $.getFile = function(boxFile){
        $.$fire('loadStart');
        $http.get(routes.file,{params:{_id:boxFile.id}})
        .then(function(response){
            if(response.data && response.data.success){
                var payload = response.data;
                var fileUrl = payload.link;
                if(fileUrl){
                    $http.get(fileUrl,{responseType:'blob'})
                    .then(function(response){
                        var blob = response.data;
                        if(blob){
                            $.file = blobToFile(blob,boxFile.name);
                            $.$fire('file',$.file);
                            $.$fire('loadEnd');
                        }
                    });
                }
            } else {
                $.$fire('loadEnd');
                var alert = $ionicPopup.alert({
                    title:'Box API Error !',
                    template:'Message : '+response.data.error,
                });
                alert.then(function(){});
            }
            console.log(response);
        }).catch(function(error){
            console.log(error);
        });
    }
    //select an item in a folder
    $.select = function(index){
        if($.folders.item_collection.entries.length >= index){
            var item = $.folders.item_collection.entries[index];
            if(item.is_empty){
                if(item.parent == '0')
                    $.showRoot();
                else
                    $.showFolder(item.grandParent);   
            }else{
                if(item.type == 'folder')
                    $.showFolder(item.id);
                else
                    $.getFile(item);
            }
        }
    }
    
    // make sure the api routes are installed on the server
    $.testApi = function(){
        var deferred = $q.defer();
        
        $http.get(routes.baseRoute)
        .then(function(response){
            if(response.data.success)
                deferred.resolve();
            else
                deferred.reject();
        }).catch(function(){
            deferred.reject();
        });
        
        return deferred.promise;
    }
    
    $rootScope.$on('auth.box',function(event,auth){
        $.authData = auth;
        //send the auth data to the server
        $http.post(routes.auth,$.authData)
        .then(function(response){
            console.log('/api/box/authData success: ',response);
        }).catch(function(response){
            console.log('/api/box/authData error: ',response);
        });
        $.$fire('auth');
    });
                    
}]);





