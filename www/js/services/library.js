'use strict'

angular.module('starter')
//database objects
.factory('Slides', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/library/slides/:slideId';
    return $resource(target);
}])
.factory('UploadedFiles', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/library/uploadedFiles/:id';
    return $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}}
        });
}])
.factory('Decks', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/library/decks/:id';
    return $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}}
        });
}])
.factory('Categories', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/library/categories/:id';
    return $resource(target,
        {id:'@id'},
        {   delete: {method:'DELETE', params:{id:'@id'}},
            update: {method:'PUT', params:{id:'@id'}}
        });
}])
.factory('Archiver', ['$resource','baseUrl',function ($resource, baseUrl) {
    var target = baseUrl.endpoint+'/api/library/:modelName/setarchive/:id/:isArchived';
    return $resource(target,
        {modelName:'@modelName',id:'@id',isArchived:'@isArchived'},
        {  update: {method:'PUT', params:{modelName:'@modelName',id:'@id',isArchived:'@isArchived'}}
        });
}])

//library service
.service('Library',['UploadedFiles',
                    'Decks',
                    'Categories',
                    '$q',
                    '$timeout',
                    'baseUrl',
                    '$resource',
                    '$rootScope',
                    '$ionicPopup',
                    'rightsManager',
                    'shareMediator',
                    'Archiver',
function(uFiles,
          decks,
          categories,
          $q,$timeout,
          baseUrl,
          $resource,
          $rootScope,
          $ionicPopup,
          rightsAuth,
          shareMediator,
          archiver){
    
    var $ = this;
    var collection={};
    //database objects
    $.files = uFiles;
    $.decks = decks;
    $.categories = categories;
    
    //files currently being uploaded
    $.uploading = {files:[]};

    $.actionList = ['Edit','New Meeting','Share','Hide','Archive','Delete','Reorder','SlideShow'];
    
    function establishRights($scope){
        $.fileRights = rightsAuth.register('files',$scope,$.actionList,$.files);
        $.deckRights = rightsAuth.register('decks',$scope,$.actionList,$.decks);
        $.catRights = rightsAuth.register('categories',$scope,$.actionList,$.categories);
        $.fileRights.setAll('Admin',true); //all are false by default so set admin true
        //$.fileRights.setRight('Admin','New Meeting',false);
        $.fileRights.setRight('Admin','Hide',false);  
        $.fileRights.setRight('Viewer','Share',true);
        $.fileRights.setRight('Viewer','SlideShow',true);
        $.catRights.setAll('Admin',true); //all are false by default so set admin true
        $.catRights.setRight('Admin','New Meeting',false);
        $.catRights.setRight('Admin','Hide',false);
        $.catRights.setRight('Viewer','Share',true);
        $.deckRights.setAll('Admin',true); //all are false by default so set admin true
        $.deckRights.setRight('Admin','Hide',false);
        $.deckRights.setRight('Viewer','Share',true);
        $.deckRights.setRight('Viewer','SlideShow',true);
    }

    $.init = function($scope){
        $.scope = $scope;
        $scope.navItems =[];
        $scope.slides = [];
        $scope.slideStates =[]
        $scope.isEditing = false;
        $scope.editText = "Edit";
        $scope.container ={};
        collection.index=-1;
        establishRights($scope); 
    };  
    
    //files, categories or decks are all flavors of the same class
    $.setModel = function($scope,model){
        $.model = model;
        $scope.model = model;
    };
    function addActions($scope){
        var model = $scope.model;
        var items = $scope.navItems;
        var rights = rightsAuth.findKey(model); //get the rights for the appropriate model;
        items.forEach(function(item){
            var refActions = (item.beingEdited) ? $scope.editActions: $scope.actions ;
            item.actions =[];
            var idx = 0;
            refActions.forEach(function(action){
   //             if($.rightEnabled(model,item.role,action.name)){
                if(rights.getRight(item.role,action.name)){
                   var newAction = {};
                   newAction.name = action.name;
                   newAction.class = action.class;
                   newAction.callBack = action.callBack;
                   newAction.idx = idx++;
                   item.actions.push(newAction);
                   // apply the rights to each item
                   rights.applyRights(item.role,item);
                }
            });
            item.action = {selected:item.actions[0]};
        });
    }    
    
    $.cacheImages = function($scope){
        var deferred = $q.defer();
        $.cachedImages = [];
        var img = {};
        uFiles.query({user:$rootScope.user._id,archiveOn:$rootScope.archiveOn()})
        .$promise.then(function(items){
            items.forEach(function(item){
                item.slides.forEach(function(slide){
                    if(slide.type == 'img'){
                        img = new Image();
                        img.src = slide.src = slide.src;
                        $.cachedImages.push(img);
                    }
                });
            });
        });
        shareMediator.getSharedForCache($.files)
        .then(function(items){
            items.forEach(function(item){
                item.slides.forEach(function(slide){
                    if(slide.type == 'img'){
                        img = new Image();
                        img.src = slide.src = slide.src;
                        $.cachedImages.push(img);
                    }
                });
            });
            deferred.resolve();
            console.log('Total Cached Images = ',$.cachedImages.length);
        });
        return deferred.promise;
    };
    
    $.updateModel = function($scope){
        var deferred = $q.defer();
        if($.model != $scope.model) console.log("model error in Library service");
        shareMediator.getItems($scope.model).then(function(items){
        $scope.selectedNavId = 0;
        // user and slides are poplulated
          if(items.length>0){
            $scope.navItems = items;
            $scope.slides = $scope.navItems[$scope.selectedNavId].slides;
            setEditStates($scope);
            addActions($scope);
          } else {
            $scope.navItems = [];
            $scope.slides = [];
          }
            deferred.resolve($scope);
        }).catch(function(err){
          deferred.reject(err);
        });
        return deferred.promise;
    }
    
    $.updateSlides = function($scope){
        return $q(function(resolve,reject){        
        if($.model != $scope.model) console.log("model error in Library service");        
        $.model.get({id:$scope.navItems[$scope.selectedNavId]._id}).$promise.then(function(item){
            if(item!=undefined){
            $scope.slides = item.slides;
            $scope.navItems[$scope.selectedNavId].slides = item.slides;
            setEditStates($scope);
            } else {
                $scope.slides = [];
                $scope.navItems[$scope.selectedNavId].slides=[];
            }
            resolve($scope.slides);
        }).catch(function(err){
            reject(err)
        });
      });
    };
    
    $.removeNavItem = function($scope, index){
        return $q(function(resolve,reject){
        var result = $scope.navItems.splice(index,1);
        if(result.length>0){
            var whichOne = result[0];
            if(whichOne != undefined){
                console.log('removing item ,',index,' item is ',whichOne);
                console.log(whichOne._id);
                $.model.delete({id:whichOne._id}).$promise.then(function(){
                    resolve();
                }).catch(function(err){
                    reject(err);
                });
            }
        }
        else
            resolve();
        });
    };
    
    $.newNavItem = function($scope){
        if($.model != $scope.model) console.log("model error in Library service"); 
        return $scope.addingTo.$save();
    };
    
    $.updateNavItem = function($scope){
        var defer = $q.defer();
        if(collection.index != -1 ){
            var model = collection.model;                   
            model.update({id:collection.instance._id},collection.instance).$promise.then(function(){
                return model.get({id:collection.instance._id}).$promise;
            }).then(function(item){
                $scope.navItems[$scope.selectedNavId].user = item.user;
                defer.resolve();
            });
        } else {
            var m = $scope.model;
            var id= $scope.selectedNavId;
            m.update({id:$scope.navItems[id]._id},$scope.navItems[id]).$promise.then(function(){
                return m.get({id:$scope.navItems[id]._id}).$promise;
            }).then(function(item){
                $scope.navItems[$scope.selectedNavId].user = item.user;
                defer.resolve();
            });
        }
        return defer.promise;
    };
 
    //run through all navItems and all Slides and set edit states
    function setEditStates($scope){
        for(var i=0; i<$scope.navItems.length; i++){
            var item = $scope.navItems[i];
            item.beingEdited = false;
            if($scope.isEditing)
                if($scope.model == collection.model)
                    if(collection.index ==i)
                        item.beingEdited = true;
        };
        if($scope.slides == undefined || $scope.slides.length<=0)
            return;
        $scope.slides.forEach(function(slide){
                if($scope.navItems[$scope.selectedNavId].beingEdited){
                    slide.included = true;
                    slide.available = false;
                }else{
                    slide.included = false;
                    slide.available=true;
                    if($scope.isEditing){
                        collection.instance.slides.forEach(function(s){
                            if(s.link == slide._id)
                                slide.included = true;
                        })
                    };
                };
            });
    };
                                                               
    $.openCollection=function($scope,$index){
        if(!$scope.isEditing){
            //make sure the model is up to date if we clicked on a non selected elements edit button
            $scope.selectedNavId = $index;
            $.updateSlides($scope).then(function(){
                $scope.isEditing = true;
                $scope.editText = "Done"
                collection.model=$scope.model;
                collection.index = $index;
                collection.instance = $scope.navItems[$index];
                $scope.navItems[$index].beingEdited = true;
                setEditStates($scope);
                $timeout(function(){
                    $scope.statesReady = true;
                },500);
            });
        }
    };
    $.closeCollection=function($scope,$index){
        if($scope.isEditing){
            if($index == collection.index && $scope.model == collection.model){
                $scope.statesReady = false;
                $scope.isEditing=false;
                $scope.editText="Edit";
                $.updateNavItem($scope).then(function(){
                    $scope.navItems[collection.index].beingEdited=false;
                    setEditStates($scope);
                    collection.index = -1;
                });
            }
        }
    };
    $.doAdd = function($scope,$index){
        var target = collection.instance;
        target.slides.push($scope.slides[$index]);
        var length = target.slides.length;
        target.slides[length-1].originalOrder = length-1;
        target.slides[length-1].link = $scope.slides[$index]._id;
        $scope.slides[$index].included = true;
        if(target.slides.length == 1){
            var firstSlide = target.slides[0];
            switch(firstSlide.type){
                    case 'img':
                        collection.instance.thumb = firstSlide.src;
                        break;
                    case 'video':
                        collection.instance.thumb = firstSlide.poster;
                        break;
            }
        }

    };
    $.addSlide=function($scope,$index){
        if($scope.isEditing){
            // test for duplicate adds and confirm
            if(!$scope.slides[$index].included){
                $.doAdd($scope,$index);
                $.updateNavItem($scope);
            }else{
               var confirmPopup = $ionicPopup.confirm({
                 title: 'Add Duplicate Slide?',
                 template: 'Do you want to add this again?'
               });
               confirmPopup.then(function(res) {
                 if(res) {
                        $.doAdd($scope,$index);  
                        $.updateNavItem($scope);
                 } 
               });
            }   
        }
    };  
    //add all the slides from a navItem - like select all - but only of not already selected
    $.addAll=function($scope){
        if($scope.isEditing){
            for(var i=0; i<$scope.slides.length; i++){
                if(!$scope.slides[i].included)
                    $.doAdd($scope,i);
            }
            $.updateNavItem($scope);
        }
    };
    $.deleteSlide=function($scope,$index){
        if($scope.isEditing){
            var target = collection.instance;
            target.slides.splice($index,1);
            if($index == 0){  // removing the first slide so reset the thumb      
                if(target.slides.length >= 1){
                    var firstSlide = target.slides[0];
                    switch(firstSlide.type){
                            case 'img':
                                collection.instance.thumb = firstSlide.src;
                                break;
                            case 'video':
                                collection.instance.thumb = firstSlide.poster;
                                break;
                    }
                }else{
                    collection.instance.thumb = '';
                    $scope.navItems[$scope.selectedNavId].thumb='';
                }
            }
            $.updateNavItem($scope).then(function(){
                if(collection.instance.slides.length>0)
                    $.updateSlides($scope);
                else
                    $.updateModel($scope);
            });
        }
    };  
    $.setUserId = function(file_id){
        var defer = $q.defer();
        var target = baseUrl.endpoint+'/api/library/uploadedFiles/setuser/:id';
        var r = $resource(target,
                        {id:'@id'},
                        {   delete: {method:'DELETE', params:{id:'@id'}},
                            update: {method:'PUT', params:{id:'@id'}}
                        });
        r.update({id:file_id},{id:$rootScope.user._id}).$promise.then(function(){
            defer.resolve();
        }).catch(function(err){
            defer.reject(err);
        });
        return defer.promise; 
    };
    //process the file uploaded to s3
    $.processUpload = function($scope,file){
        var defer = $q.defer();
        var srcPre = 'uploads/';
        var dstPre = 'img/';
        var target = baseUrl.endpoint+'/api/library/uploadedFiles/processFile/:filePath';
        var r = $resource(target,
                          {filePath:'@filePath'},
                        {  convertFile: {method:'GET',params:{filePath:'@filePath'}}
                        });
        r.convertFile({filePath:encodeURI($scope.fullName),userId:$rootScope.user._id}).$promise
        .then(function(status){
            console.log(status);
            var time, timeLabel;
            if(file.size < 5000000){
                time = Math.floor(file.size/15000);
                timeLabel = ' seconds';
                if(time > 60){
                    timeLabel = ' minute(s)'
                    time = Math.floor(time/60);
                }
            }else{
                timeLabel = ' minute(s)';
                time = Math.floor(file.size/4000000);
            }
            file.message = 'Processing: est time: '+time+timeLabel;
            defer.resolve(status);
        }).catch(function(err){
            console.log(err);
            defer.reject(err);
        });
        return defer.promise;
    };
    function indexOfFile(file){
        var idx = -1,i = 0;
        $.uploading.files.forEach(function(f){
            if(f.name == file.name)
                idx = i;
            i++;
        });
        return idx;
    }
    $.uploadComplete = function(result){
        var idx = indexOfFile(result.file);
        if(idx >=0 ){
            $.uploading.files[idx].spinner = false;
            $.uploading.files[idx].timeLeft = 0;
            $.uploading.files.splice(idx,1);
        }
    }
    $.uploadProgress = function(result){
        var idx = indexOfFile(result.file);
        if(idx>=0) {
            $.scope.$apply(function(){
                $.uploading.files[idx].message = result.message;
            });
        }
    }
    $.startUpload = function(files){
        for(var i = 0; i<files.length;i++){
            files[i].spinner = false;
            files[i].progress = '0%';
            files[i].message = ''
            $.uploading.files.push(files[i]);
        }
    }
    $.setArchive = function($scope,index){
        var defer = $q.defer();
        console.log($scope.navItems[index]);
        var navItem = $scope.navItems[index];
        var modelName = $scope.modelName;
        archiver.update({modelName:modelName,id:navItem._id,isArchived:navItem.isArchived})
        .$promise.then(function(){
            defer.resolve();
        });
        return defer.promise;
    }
    
}]);
