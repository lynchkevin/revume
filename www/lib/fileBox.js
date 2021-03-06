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
        - 'GoogleService    - service that talks to Google Drive api
        - 'WindowsService   - service that talks to MS OneDrive
        - SalesforceService - service that talks to Salesforce
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
.config(['helloProvider','helloInitParams','redirectUrl',
function(helloProvider,helloInitParams,redirectUrl) {
    helloProvider.init(helloInitParams,{redirect_uri:redirectUrl});
}])
.run(['$ionicPlatform','$rootScope','$timeout','hello',
function($ionicPlatform,$rootScope,$timeout,hello) {
  $ionicPlatform.ready(function() {
    hello.on("auth.login", function (r) {
        var auth = r.authResponse;
        var network = auth.network;
        $rootScope[network] = auth;
        var event = 'auth.'+network;
        console.log(auth);
        //wait for all services to instantiate before firing
        $timeout(function(){
            $rootScope.$broadcast(event,auth);
        },1500);
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
        template:'<i class="icon icon-left ion-social-dropbox" style="color:RGB(26,99,218)"></i><span style="color:RGB(26,99,218)"> &nbsp Dropbox </span>'
    }
}])
.directive('boxButton',['$compile','$parse','baseUrl',function($compile,$parse,baseUrl){
    return{
        restrict: 'A',
        template:'<img src="'+baseUrl.endpoint+'/img/box_navy.png" style="max-width:35px;vertical-align:middle"><span style="color:RGB(17,34,70)">&nbsp </span> ',
    }
}])
.directive('googleButton',['$compile','$parse','baseUrl',function($compile,$parse,baseUrl){
    return{
        restrict: 'A',
        template:'<img src="'+baseUrl.endpoint+'/img/google-drive.png" style="max-width:20px;vertical-align:middle"><span style="color:RGB(98,101,104);vertical-align:middle">&nbsp Drive</span> ',
    }
}])
.directive('windowsButton',['$compile','$parse','baseUrl',function($compile,$parse,baseUrl){
    return{
        restrict: 'A',
        template:'<img src="'+baseUrl.endpoint+'/img/onedrive.png" style="max-width:100px;vertical-align:middle"><span style="vertical-align:middle"></span> ',
    }
}])
.directive('resize',['$window', function ($window) {
    return function (scope, element) {
        var el = element[0];
        var w  = angular.element($window);
        scope.getDimensions = function () {
            return {
                'h': el.offsetHeight,
                'w': el.offsetWidth
            };
        };
        scope.$watch(scope.getDimensions, function (newValue, oldValue) {
            scope.elHeight = newValue.h;
            scope.elWidth = newValue.w;
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
}])
//collapse all the evaporate settings into a foolproof package
.directive('fileBox',['$compile','FileNav',function($compile,FileNav){
    return{
        restrict: 'E',
        replace:true,
        templateUrl: 'templates/fileBox.html',
        compile: function(element,attrs){
                //modify the template based on the closeOnSelect attribute passed in...
                var closeOnSelect = attrs.closeOnSelect || false;
                var el = element[0];
                //find button bar
                var bbIdxs = [];
                for(var i=0; i<el.childNodes.length;i++){
                    if(el.childNodes[i].className == "button-bar")
                        bbIdxs.push(i);
                }
                if(bbIdxs.length>0){
                    bbIdxs.forEach(function(idx){
                        var buttonBar = el.childNodes[idx];
                        var buttons = buttonBar.children;
                        for(var i=0; i<buttons.length;i++){
                            var attributes = buttons[i].attributes;
                            var ngClick = attributes.getNamedItem('ng-click');
                            var start = ngClick.nodeValue.slice(0,-1);
                            var newNodeValue = start+','+attrs.closeOnSelect+')';
                            ngClick.nodeValue = newNodeValue;     
                            attributes.setNamedItem(ngClick);
                        };
                    });
                } else {
                    console.log('fileBox directive - button-bar not found!!!');
                }
        }
    };
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
                            newPart ="/<a style=\"cursor:pointer\" ng-click=\""+scope.callBack+"("+"'"+breadCrumb+"\')\">"+part+"</a>";
                        else
                            newPart = '/'+part;
                        html += newPart;
                    }
                });
                element[0].innerHTML = $sce.trustAsHtml(html);
                $compile(element.contents())(scope);
                $timeout(function(){
                    $ionicScrollDelegate.$getByHandle('path').scrollBottom(true);
                },0);
            }
        
            scope.updateLinksBox = function(){
                var folder = ngModelCtrl.$viewValue;
                var parts = folder.path_collection.entries;
                var html = '';
                var newPart = undefined;
                
                parts.forEach(function(part){
                    if(scope.callBack !== undefined)
                        newPart ="/<a style=\"cursor:pointer\" ng-click=\""+scope.callBack+"("+"'"+part.id+"\')\">"+part.name+"</a>";
                    else
                        newPart = '/'+part.name;
                    html += newPart;
                });
                if(folder.id != 0){
                    newPart = "/<a style=\"cursor:pointer\" ng-click=\""+scope.callBack+"("+"'"+folder.id+"\')\">"+folder.name+"</a>";
                    html+=newPart;
                    element[0].innerHTML = $sce.trustAsHtml(html);
                    $compile(element.contents())(scope);
                    $timeout(function(){
                        $ionicScrollDelegate.$getByHandle('path').scrollBottom(true);
                    },0);
                }else{
                    element[0].innerHTML = $sce.trustAsHtml(html);
                    $compile(element.contents())(scope);
                    $timeout(function(){
                        $ionicScrollDelegate.$getByHandle('path').scrollBottom(true);
                    },0);
                }
            }
            scope.updateLinksGoogle = function(){
                var folder = ngModelCtrl.$viewValue;
                var parts = folder.path;
                var html = '';
                var newPart = undefined;
                
                parts.forEach(function(part){
                    if(scope.callBack !== undefined)
                        newPart ="/<a style=\"cursor:pointer\" ng-click=\""+scope.callBack+"("+"'"+part.id+"\')\">"+part.name+"</a>";
                    else
                        newPart = '/'+part.name;
                    html += newPart;
                });
                element[0].innerHTML = $sce.trustAsHtml(html);
                $compile(element.contents())(scope);
                $timeout(function(){
                    $ionicScrollDelegate.$getByHandle('path').scrollBottom(true);
                },0);
            
            }
            scope.updateLinksWindows = function(){
                var folder = ngModelCtrl.$viewValue;
                var parts = folder.path;
                var html = '';
                var newPart = undefined;
                
                parts.forEach(function(part){
                    if(scope.callBack !== undefined)
                        newPart ="/<a style=\"cursor:pointer\" ng-click=\""+scope.callBack+"("+"'"+part.id+"\')\">"+part.name+"</a>";
                    else
                        newPart = '/'+part.name;
                    html += newPart;
                });
                element[0].innerHTML = $sce.trustAsHtml(html);
                $compile(element.contents())(scope);
                $timeout(function(){
                    $ionicScrollDelegate.$getByHandle('path').scrollBottom(true);
                },0);
            
            }
            scope.$watch(model,function(model){
                if(model){
                    switch(model.root){
                        case 'Dropbox' : 
                            scope.updateLinksDropBox();
                            break;
                        case 'Box' : 
                            scope.updateLinksBox();
                            break;
                        case 'Drive' :
                            scope.updateLinksGoogle();
                            break;
                        case 'OneDrive' :
                            scope.updateLinksWindows();
                            break;
                    }
                }
            });
                
        }
    }
}])

//controller for the fileNavigator view (template)      
.controller('fileNavCtrl',['$rootScope','$scope','FileNav',
function($rootScope,$scope, FileNav){
    //attach to the service when scope is created.
    //This just hangs some objects off the scope that is used by the template
    FileNav.attach($scope);
    $scope.commands = {};
    $scope.commands.show = function(service, closeOnSelect){
        $scope.fileNavigator.show($scope, service, closeOnSelect);
    }
}])
.service('FileNav',['$rootScope',
                    '$state',
                    '$timeout',
                    'baseUrl',
                    'DropboxService',
                    'BoxService',
                    'GoogleService',
                    'WindowsService',
                    'SalesforceService',
                    'Evaporate',
                    '$ionicModal',
                    '$ionicLoading',
                    '$ionicScrollDelegate',
                    'onEvent',
    function( $rootScope,
              $state,
              $timeout,
              baseUrl,
              DropboxService,
              BoxService,
              GoogleService,
              WindowsService,
              SalesforceService,
              Evaporate,
              $ionicModal,
              $ionicLoading,
              $ionicScrollDelegate,
              onEvent){
    // shorthand
    var $ = this;
    //enable events on this service
    onEvent.attach($);
    // this service fires a file event when a file has been selected 
    $.eva = Evaporate;
    
    //connect to box and dropbox services
    $.dropBox = DropboxService;
    $.box = BoxService;
    $.google = GoogleService;
    $.windows = WindowsService;
    $.sfdc = SalesforceService;  
        
    $.attach = function($scope){
        //allow the thin controller to connect to the service
        $scope.eva = $.eva;
        $scope.fileNavigator = $.fileNavigator;
    }
    //dropbox and box services 'file' event callback                    
    $.selectedCallback = function(file){
        $timeout(function(){
            $.eva.Inbox.push(file);
            $.$fire('file',file);
            if($.fileNavigator.active.closeOnSelect)
                $.fileNavigator.hide();
        },0);
    }
    //attach dropbox and box to evaporate
    $.dropBox.$on('file',$.selectedCallback);
    $.box.$on('file',$.selectedCallback);
    $.google.$on('file',$.selectedCallback);
    $.windows.$on('file',$.selectedCallback);
        
    //backdrops to show while loading
    //Loading Templates for Each Service
    var templateStart = '<div style="display:block">';
    var templateEnd = '<br><p>Loading...</p></div>';
    var dropboxBranding = '<img style="max-width:64px" src="'+baseUrl.endpoint+'/img/Dropbox-white.png"></img>';
    var boxBranding = '<img style="max-width:64px" src="'+baseUrl.endpoint+'/img/box_white.png"></img>';
    var googleBranding = '<img style="max-width:64px" src="'+baseUrl.endpoint+'/img/google-drive.png"></img>';
    var windowsBranding = '<img style="max-width:64px" src="'+baseUrl.endpoint+'/img/onedrive-white.png"></img>';
    // build the branded loading templates
    $.dropboxTemplate = templateStart+dropboxBranding+templateEnd;
    $.boxTemplate = templateStart+boxBranding+templateEnd;  
    $.googleTemplate = templateStart+googleBranding+templateEnd;  
    $.windowsTemplate = templateStart+windowsBranding+templateEnd;  
        
    // Use the templates to show loading 
    $.loadStart = function(){
        $ionicLoading.show({
            template: $.fileNavigator.active.template
        });
    }
    $.loadEnd = function(){
        $ionicLoading.hide();
        $timeout(function(){
            $ionicScrollDelegate.$getByHandle('fileNavigator').scrollTop();   
        },0);
    }
    // connect to the service events
    $.dropBox.$on('loadStart',$.loadStart);
    $.box.$on('loadStart',$.loadStart);
    $.google.$on('loadStart',$.loadStart);
    $.windows.$on('loadStart',$.loadStart);
    $.dropBox.$on('loadEnd',$.loadEnd);
    $.box.$on('loadEnd',$.loadEnd);    
    $.google.$on('loadEnd',$.loadEnd);
    $.windows.$on('loadEnd',$.loadEnd);
        
    //The fileNavigator does all the work...                         
    $.fileNavigator = {
        dropBox : { service:$.dropBox,
                    template:$.dropboxTemplate,
                  },
        Box : { service:$.box,
                template:$.boxTemplate,
              },
        Google : {  service:$.google,
                    template:$.googleTemplate,
              },
        Windows : {  service:$.windows,
                    template:$.windowsTemplate,
              },
        show : function($scope,service,closeOnSelect){
                    if(this.hasOwnProperty(service) && closeOnSelect != undefined){
                        var svc = this[service];
                        this.active = svc.service;
                        this.active.template = svc.template; 
                        this.active.closeOnSelect = closeOnSelect;
                        this.active.showRoot();
                        $ionicModal.fromTemplateUrl('templates/fileNavigator.html', {
                            scope: $scope
                        }).then(function(modal) {
                            $.fileModal = modal;
                            $.fileModal.show();
                        }); 
                    }
                },
        hide : function(){
                    $.fileModal.hide();
                    $.fileModal.remove();
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
        return undefined;
    }   
    //attach this functionality to the client
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

.service('DropboxService',['$rootScope','hello','$timeout','$sce','onEvent','$q',
function($rootScope,hello,$timeout,$sce,onEvent,$q){
    var $ = this;
    $.name = 'Dropbox';
    $.root = $.name;
    //just in case we are instantiated after the auth broadcast from rootscope
    if($rootScope.hasOwnProperty('dropbox'))
        $.authData = $rootScope['dropbox'];
    
    var dropBox = hello('dropbox');
    var noop = function(){};
    $.loggedIn = false;
    $.folders = undefined;
    $.toParentVisible = false;

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
    //get the user information
    $.getUser = function(){
        var deferred = $q.defer();
        function userFromDropbox(u){
            var user = {};
            user.firstName = u.first_name;
            user.lastName = u.last_name;
            user.email = u.email;
            user.accountId = u.id;
            return user;
        }
        if(!$.loggedIn)
            dropBox.login().then(function(){
                dropBox.api('me',function(u){
                    var user = userFromDropbox(u);
                    deferred.resolve(user);
                });
            });
        else
            dropBox.api('me',function(u){
                var user = userFromDropbox(u);
                deferred.resolve(user);
            });
        return deferred.promise;
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
                    $.toParentVisible = false;
                    $.folders = folders;
                    $.folders.root = $.root; 
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
    $.toParent = function(){
        var path = $.folders.path;
        var parentPath  = path.slice(0,path.lastIndexOf('/'));
        if(parentPath =="" || parentPath == "/" || parentPath == undefined)
            $.showRoot()
        else
            $.showFolder(parentPath);
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
                $.toParentVisible = true;
                $.folders = contents
                $.folders.root = $.root; 
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
    $.name = 'Box'; //used for filenav titles - the root is used if the product name is different from company
    $.root = $.name; //the name of the product and company are the same
    //just in case we are instantiated after the auth broadcast from rootscope
    if($rootScope.hasOwnProperty('box'))
        $.authData = $rootScope['box'];
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
    $.toParentVisible = false;
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
    //get the user information
    $.getUser = function(){
        var deferred = $q.defer();
        function userFromBox(u){
            var user = {};
            var names = u.name.split(' ');
            user.firstName = names[0];
            user.lastName = names[1];
            user.email = u.login;
            user.accountId = u.id;
            return user;
        }
            
        if(!$.loggedIn)
            box.login().then(function(){
                box.api('me',function(u){
                    var user = userFromBox(u);
                    deferred.resolve(user);
                });
            });
        else
            box.api('me',function(u){
                var user = userFromBox(u);
                deferred.resolve(user);
            });
        return deferred.promise;
    }
    //show the root directory    
    $.showRoot = function(){
        var doit = function(){
            $.$fire('loadStart');
            var endpoint = 'https://api.box.com/2.0/folders/0'
            box.api(endpoint,'get',{},function(folders){
                $timeout(function(){
                    $.toParentVisible = false;
                    $.folders = folders;
                    $.folders.root = $.root;
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

    $.toParent = function(){
        var length = $.folders.path_collection.entries.length;
        var idx = length-1 ;
        if(idx >= 0)
            $.showFolder($.folders.path_collection.entries[idx].id);
        else
            $.showRoot();
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
                $.toParentVisible = true;
                $.folders = contents
                $.folders.root = $.root;
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
                    
}])

.service('GoogleService',['$rootScope',
                          'hello',
                          '$timeout',
                          '$sce',
                          'onEvent',
                          '$q',
                          '$ionicPopup',
                          '$http',
function($rootScope,hello,$timeout,$sce,onEvent,$q,$ionicPopup,$http){
    var $ = this;
    $.name = 'Google'; //Used for file navigator so it needs to be brand/user friendly
    $.root = 'Drive'; //consistent name for the root directory
    
    //google doesnt have the concept of a path so we need to create one
    $.path = [];
    //just in case we are instantiated after the auth broadcast from rootscope
    if($rootScope.hasOwnProperty('google'))
        $.authData = $rootScope['google'];
    
    var google = hello('google');
    var options = {scope:'email,files'};
    var noop = function(){};
    $.loggedIn = false;
    $.folders = undefined;
    $.toParentVisible = false;
    
    onEvent.attach($);
    
    function blobToFile(theBlob,fileName){
        theBlob.lastModifiedDate = new Date();
        theBlob.name = fileName;
        return theBlob;
    }
    
    //OATH2 signin
    $.authenticate = function(){
        if(!$.loggedIn)
            google.login(options).then(function(){
                $.loggedIn = true;
            });
        else
            google.logout().then(function(){
                $.loggedIn = false;
                $.authData = undefined;
                $.$fire('auth');
            });
    } 
    //get the user information
    $.getUser = function(){
        var deferred = $q.defer();
        function userFromGoogle(u){
            var user = {};
            user.firstName = u.first_name;
            user.lastName = u.last_name;
            user.email = u.email;
            user.accountId = u.id;
            return user;
        }
        if(!$.loggedIn || $.loggedIn)
            google.login(options).then(function(){
                google.api('me',function(u){
                    var user = userFromGoogle(u);
                    deferred.resolve(user);
                });
            });
        else
            google.api('me',function(u){
                var user = userFromDropbox(u);
                deferred.resolve(user);
            });
        return deferred.promise;
    }
    // Show the root directory of google drive
    //show the root directory    
    $.showRoot = function(){
        var doit = function(){
            $.$fire('loadStart');
            google.api('me/folders','get',{},function(folders){
                $.path = [];
                $timeout(function(){
                    $.toParentVisible = false;
                    $.folders = folders;
                    $.folders.root = $.root;
                    $.folders.path = $.path;
                    $.$fire('loadEnd');
                });
            });
                
        }
        //if not authenticated - then authenticate
        if(!$.authData){
            google.login(options).then(function(){
                $.loggedIn = true;
                doit();
            });
        } else {
            doit();
        }
    }
    // set path - used when user clicks on breadcrumbs
    function setPath(folderId){
        function findInPath(folderId){
            var idx = -1;
            var where = 0;
            $.path.forEach(function(node){
                if(node.id == folderId)
                    idx = where;
                where+=1;
            });
            return idx;
        }
                
        var idx = findInPath(folderId);
        if(idx>=0){
            $.path = $.path.slice(0,idx+1)   
        } 
    }
    $.toParent = function(){
       if($.path.length<2)
           $.showRoot();
        else
           $.showFolder($.path[$.path.length-2].id);
    }

    //show the contents of a folder
    $.showFolder = function(path){
         $.$fire('loadStart');
         setPath(path);
         google.api('me/folder','get',{id:path},function(contents){
            if(contents.data.length == 0){
                var file = {title:'No Files Found',
                            is_dir:false,
                            thumb_exists:false,
                            is_empty:true,
                            path:contents.path,
                           };
                contents.data.push(file);
            }else{
                contents.data.forEach(function(item){
                    if(item.type == undefined)
                        item.type = item.fileExtension;
                });
            }
            $timeout(function(){
                $.toParentVisible = true;
                $.folders = contents
                $.folders.path = $.path;
                $.folders.root = $.root;
                $.$fire('loadEnd');
            },0);
        });
    }
    //select an item in a folder
    $.select = function(index){
        if($.folders.data.length >= index){
            var item = $.folders.data[index];
            if(item.type == 'folder'){
                $.path.push(item);
                $.showFolder(item.id);
            }else
                $.getFile(item);
            
        }
    }
    //get the file from google Drive
    $.getFile = function(driveFile){
        $.$fire('loadStart');
        google.api('me/file','get',{id:driveFile.id},function(response){
            if(response && response.downloadUrl){
                var fileUrl = response.downloadUrl;
                var authHeader = 'Bearer '+$.authData.access_token;
                var options = {responseType:'blob',
                               headers:{'Authorization':authHeader},
                              };
                $http.get(fileUrl,options)
                .then(function(response){
                    var blob = response.data;
                    if(blob){
                        $.file = blobToFile(blob,driveFile.title);
                        $.$fire('file',$.file);
                        $.$fire('loadEnd');
                    }
                });
            } else {
                $.$fire('loadEnd');
                var template = 'code : '+response.error.code
                template +='<br> message : '+response.error.message;
                var alert = $ionicPopup.alert({
                    title:'Drive API Error !',
                    template: template
                });
                alert.then(function(){
                    console.log('Alerted!');
                });
            }
            console.log(response);
        });
    }
    $rootScope.$on('auth.google',function(event,auth){
        $.authData = auth;
        google.api('/me',function(p){
            $timeout(function(){
                $.loggedIn = true;
                $.userInfo = p;
                $.$fire('auth');
                console.log(p);
            },0);
        });
    });
                    
}])
.service('WindowsService',['$rootScope',
                           'hello',
                           '$timeout',
                           '$sce',
                           'onEvent',
                           '$q',
                           '$ionicPopup',
                           '$http',
function($rootScope,hello,$timeout,$sce,onEvent,$q,$ionicPopup,$http){
    var $ = this;
    $.name = 'Microsoft'; //only used for filenavigator window
    $.root = 'OneDrive'; //specify the name of the root directory
    //windows doesnt have the concept of a path so we need to create one
    $.path = [];

    
    //just in case we are instantiated after the auth broadcast from rootscope
    if($rootScope.hasOwnProperty('windows'))
        $.authData = $rootScope['windows'];
    
    var windows = hello('windows');
    var options = {scope:'email,files'};
    var noop = function(){};
    $.loggedIn = false;
    $.folders = undefined;
    $.toParentVisible = false;
    
    onEvent.attach($);

    function blobToFile(theBlob,fileName){
        theBlob.lastModifiedDate = new Date();
        theBlob.name = fileName;
        return theBlob;
    }

    //OATH2 signin
    $.authenticate = function(){
        if(!$.loggedIn)
            windows.login(options).then(function(){
                $.loggedIn = true;
            });
        else
            windows.logout().then(function(){
                $.loggedIn = false;
                $.authData = undefined;
                $.$fire('auth');
            });
    } 
    //get the user information
    $.getUser = function(){
        var deferred = $q.defer();
        function userFromWindows(u){
            var user = {};
            user.firstName = u.first_name;
            user.lastName = u.last_name;
            user.email = u.email;
            user.accountId = u.id;
            return user;
        }
        if(!$.loggedIn)
            windows.login(options).then(function(){
                windows.api('me',function(u){
                    var user = userFromWindows(u);
                    deferred.resolve(user);
                });
            });
        else
            windows.api('me',function(u){
                var user = userFromWindows(u);
                deferred.resolve(user);
            });
        return deferred.promise;
    }
    $.showRoot = function(){
        var doit = function(){
            $.$fire('loadStart');
            windows.api('me/folders','get',{},function(folders){
                $.path = [];
                $timeout(function(){
                    $.toParentVisible = false;
                    $.folders = folders;
                    $.folders.root = $.root;
                    $.folders.path = $.path;
                    $.$fire('loadEnd');
                });
            });
                
        }
        //if not authenticated - then authenticate
        if(!$.authData){
            windows.login(options).then(function(){
                $.loggedIn = true;
                doit();
            });
        } else {
            doit();
        }
    }   
    
    // set path - used when user clicks on breadcrumbs
    function setPath(folderId){
        function findInPath(folderId){
            var idx = -1;
            var where = 0;
            $.path.forEach(function(node){
                if(node.id == folderId)
                    idx = where;
                where+=1;
            });
            return idx;
        }
                
        var idx = findInPath(folderId);
        if(idx>=0){
            $.path = $.path.slice(0,idx+1)   
        } 
    }
    $.toParent = function(){
       if($.path.length<2)
           $.showRoot();
        else
           $.showFolder($.path[$.path.length-2].id);
    }
    //show the contents of a folder
    $.showFolder = function(path){
         $.$fire('loadStart');
         setPath(path);
         windows.api('me/folder','get',{id:path},function(contents){
            if(contents.data.length == 0){
                var file = {name:'No Files Found',
                            is_dir:false,
                            thumb_exists:false,
                            is_empty:true,
                            path:contents.path,
                           };
                contents.data.push(file);
            }else{
                contents.data.forEach(function(item){
                    if(item.type == undefined)
                        item.type = item.fileExtension;
                });
            }
            $timeout(function(){
                $.toParentVisible = true;
                $.folders = contents
                $.folders.root = $.root;
                $.folders.path = $.path;
                $.$fire('loadEnd');
            },0);
        });
    }
    //select an item in a folder
    $.select = function(index){
        if($.folders.data.length >= index){
            var item = $.folders.data[index];
            if(item.type == 'folder'||item.type == 'album'){
                $.path.push(item);
                $.showFolder(item.id);
            }else
                $.getFile(item);
            
        }
    }
    //get the file from google Drive
    $.getFile = function(windowsFile){
        $.$fire('loadStart');
        var fileUrl = 'https://apis.live.net/v5.0/'+windowsFile.id+'/content'
        var authHeader = 'Bearer '+$.authData.access_token;
        var options = {params:{'suppress_redirects':true,
                               'access_token':$.authData.access_token,
                              },
                      };
        $http.get(fileUrl,options)
        .then(function(response){
            if(response.data && response.data.location){
                var linkUrl = response.data.location;
                var options = {responseType:'blob',
                               headers:{'Authorization':authHeader},
                              };
                $http.get(linkUrl,options)
                .then(function(response){
                    blob = response.data;
                    if(blob){
                        $.file = blobToFile(blob,windowsFile.name);
                        $.$fire('file',$.file);
                        $.$fire('loadEnd');
                    }else {
                        $.$fire('loadEnd');
                        var template = 'code : '+response.error.code
                        template +='<br> message : '+response.error.message;
                        var alert = $ionicPopup.alert({
                            title:'Drive API Error !',
                            template: template
                        });
                        alert.then(function(){
                            console.log('Alerted!');
                        });
                    }
                });
            } 
            else {
                $.$fire('loadEnd');
                var template = 'code : '+response.error.code
                template +='<br> message : '+response.error.message;
                var alert = $ionicPopup.alert({
                    title:'Drive API Error !',
                    template: template
                });
                alert.then(function(){
                    console.log('Alerted!');
                });
            }
        });
    };
    $rootScope.$on('auth.windows',function(event,auth){
        $.authData = auth;
        windows.api('/me',function(p){
            $timeout(function(){
                $.loggedIn = true;
                $.userInfo = p;
                $.$fire('auth');
                console.log(p);
            },0);
        });
    });
                    
}])
.service('SalesforceService',['$rootScope',
                           'hello',
                           '$timeout',
                           '$sce',
                           'onEvent',
                           '$q',
                           '$ionicPopup',
                           '$http',
                           'baseUrl',
function($rootScope,hello,$timeout,$sce,onEvent,$q,$ionicPopup,$http,baseUrl){
    var $ = this;
    $.name = 'Salesforce'; //only used for filenavigator window
    $.root = 'files'; //specify the name of the root directory
    //windows doesnt have the concept of a path so we need to create one
    $.path = [];
    
    var baseRoute = baseUrl.endpoint+'/api/sfdc/';
    $.routes = {
        auth: baseRoute+'authData',
        query: baseRoute+'query',
    };
    
    var sfdc = hello('sfdc');
    var encodedScope= encodeURIComponent('api id full web refresh_token');
    var options = {scope:encodedScope};
    var noop = function(){};
    $.loggedIn = false;

    
    onEvent.attach($);
    
    //we need the native user to make queries into salesforxe
    $.getNativeUser = function(){
        var deferred = $q.defer();
        if(!$.loggedIn )
            $.getUser().then(function(){
                deferred.resolve($.authData.sfdcUser);
            })
        else
            deferred.resolve($.authData.sfdcUser);
        return deferred.promise;
    }

    //get the user information
    $.getUser = function(){
        var deferred = $q.defer();
        function userFromSalesforce(u){
            var user = {};
            user.firstName = u.first_name;
            user.lastName = u.last_name;
            user.email = u.email;
            user.accountId = u.user_id;
            $.authData.sfdcUser = u.display_name;
            return user;
        }
        if(!$.loggedIn){
            sfdc.login(options).then(function(data){
                $.authData = data.authResponse;
                //get the user information
               return $http.post($.routes.auth,$.authData);
            }).then(function(response){
                if(response.data.error == undefined){
                    var user = userFromSalesforce(response.data);
                    deferred.resolve(user);
                } else
                    deferred.reject(response.data.error);
            });
        } else {
            $http.post($.routes.auth,$.authData).then(function(response){
                if(response.data.error == undefined){
                    var user = userFromSalesforce(response.data);
                    deferred.resolve(user);
                } else
                    deferred.reject(response.data.error);
            });
        }
        return deferred.promise;
    }
    $.query = function(sql){
        var deferred = $q.defer();
        if(!$.loggedIn){
            sfdc.login(options).then(function(data){
                $.authData = data.authResponse;
                //get the user information
               return $http.post($.routes.auth,$.authData);
            }).then(function(response){
                var options = {params:{'sql':encodeURIComponent(sql)}}
                return $http.get($.routes.query,options);
            }).then(function(response){
                if(response.data.error == undefined){
                    deferred.resolve(response.data);
                } else{
                    deferred.reject(response.data.error);
                }
            });
        } else {
            var options = {params:{'sql':sql}}
            $http.get($.routes.query,options).then(function(response){
                if(response.data.error == undefined){
                    deferred.resolve(response.data);
                } else{
                    deferred.reject(response.data.error);
                }
            });
        }   
        return deferred.promise;
    }
    
   $.processAuth = function(event,auth){
        $.authData = auth;
        $http.post($.routes.auth,$.authData)
        .then(function(response){
            if(response.data.error != undefined)
                throw(response.data.error.message);
            $.loggedIn = true;
            $.userInfo = response;
            console.log('/api/sfdc/authData success: ',response);
            return $.getUser();
        }).then(function(){
            $.$fire('auth');
        }).catch(function(response){
            console.log('/api/sfdc/authData error: ',response);
        });
   }
   $rootScope.$on('auth.sfdc',function(event,auth){
       $.processAuth(event,auth);

   });
                    
}])
.service('SigninPartners',['authService',
                           'GoogleService',
                           'WindowsService',
                           'DropboxService',
                           'BoxService',
                           'SalesforceService',
function(authService,GoogleService,WindowsService,DropboxService,BoxService,SalesforceService){
    
    var $ = this;
    
    $.network = {
        Google : {
            getUser : GoogleService.getUser,
            helloService : 'google',
        },
        Windows : {
            getUser : WindowsService.getUser,
            helloService:'windows',
        },
        Dropbox : {
            getUser : DropboxService.getUser,
            helloService:'dropbox',
        },
        Box : {
            getUser : BoxService.getUser,
            helloService:'box',
        },
        
        Salesforce: {
            getUser : SalesforceService.getUser,
            helloService:'sfdc',
        },
        
        authService : authService,
    };
}]);






