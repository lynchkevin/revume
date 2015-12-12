'use strict'

angular.module('RevuMe')
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
                    'pnFactory',
                    'Evaporate',
                    'onEvent',
function(UploadedFiles,
          Decks,
          Categories,
          $q,$timeout,
          baseUrl,
          $resource,
          $rootScope,
          $ionicPopup,
          rightsManager,
          shareMediator,
          Archiver,
          pnFactory,
          Evaporate,
          onEvent){
    
    var $ = this;
    var collection={};
    //database objects
    $.files = UploadedFiles;
    $.files.modelName = 'files';
    $.decks = Decks;
    $.decks.modelName = 'decks';
    $.categories = Categories;
    $.categories.modelName = 'categories';
    
    //files currently being uploaded
    $.uploading = {files:[]};

    //attach to the onEvent Service
    onEvent.attach($);
    /*
        we fire uploadComplete event
    */
    

    
    //connect to server callbacks
    //pnFactory.init(); - now done once in rootScope    
    $.channel = pnFactory.newChannel("library::fileEvents");
    function uploadComplete(result){
        switch (result.event) {
                case 'end' : 
                    $.uploadComplete(result);
                    $.updateView();
                    $.$fire('uploadComplete');
                    break;
                case 'progress' : 
                    $.uploadProgress(result);
                    break;
                case 'error' :
                    var alert = $ionicPopup.alert({
                        title:'File Upload Fails',
                        template:'message: '+result.error,
                    });
                    alert.then(function(){
                        $.uploadComplete(result);
                        $.updateView();
                        $.$fire('uploadComplete');
                    });
                    break;
        }
    }
    //rootscope must call pubnub.init - then we're ready
    $rootScope.$on('Revu.Me:Ready',function(){
           $.channel.subscribe(uploadComplete);
    });
    
    $.actionList = ['Edit','New Meeting','Share','Hide','Archive','Delete','Reorder','SlideShow'];
    
    function establishRights($scope){
        $.fileRights = rightsManager.register('files',$scope,$.actionList,$.files);
        $.deckRights = rightsManager.register('decks',$scope,$.actionList,$.decks);
        $.catRights = rightsManager.register('categories',$scope,$.actionList,$.categories);
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

    $.fileTypes = function(){
       var deferred = $q.defer();
       var target = baseUrl.endpoint+'/api/library/fileTypes';
       var r = $resource(target);
       r.query().$promise.then(function(types){
           $.validTypes = types;
           deferred.resolve(types);
       }).catch(function(err){
           deferred.reject(err);
       });
       return deferred.promise;
    }
    //set the file types
    $.fileTypes();
    function getExtention(f){
        return f.substr(f.lastIndexOf('.'),f.length-1).toLowerCase();
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
        //Connect to Evaporate
        $.scope.eva = Evaporate;
        // Handle the file completion from Evaporate
        if($.fcEvent == undefined)
            $.fcEvent = $.scope.eva.$on('fileComplete',function(file){
                $.scope.fullName = file.path_
                console.log($.scope.fullName);
                file.spinner = true;
                $.processUpload($.scope,file);
            });
        //handle new files dropped into upload
        if($.fsEvent == undefined)
            $.fsEvent = $.scope.eva.$on('fileSubmitted',function(file,length){
                var ext = getExtention(file.name);
                if($.validTypes.indexOf(ext)>=0)
                    $.startUpload(file);
                else {
                    var alert = $ionicPopup.alert({
                        title:'Invalid File Type !',
                        template:'valid types are: '+$.validTypes,
                    });
                    alert.then(function(){});
                }

            });
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
        var rights = rightsManager.findKey(model); //get the rights for the appropriate model;
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
        UploadedFiles.query({user:$rootScope.user._id,archiveOn:$rootScope.archiveOn()})
        .$promise.then(function(items){
            if(items != undefined){
                items.forEach(function(item){
                    item.slides.forEach(function(slide){
                        if(slide.type == 'img'){
                            img = new Image();
                            img.src = slide.src = slide.src;
                            $.cachedImages.push(img);
                        }
                    });
                });
            }
        });
        shareMediator.getSharedForCache($.files)
        .then(function(items){
            if(items != undefined){
                items.forEach(function(item){
                    if(item.item != undefined){
                        item.item.slides.forEach(function(slide){
                            if(slide.type == 'img'){
                                img = new Image();
                                img.src = slide.src = slide.src;
                                $.cachedImages.push(img);
                            }
                        });
                    }
                });
            }
            deferred.resolve();
            console.log('Total Cached Images = ',$.cachedImages.length);
        });
        return deferred.promise;
    };
    
    $.updateView = function(){
        var defer = $q.defer();
        $rootScope.showLoading();
        //this might be getting called by the session which has no Library view
        if($.scope.model != undefined)
            $.updateModel($.scope).then(function(){
                defer.resolve();
                $rootScope.hideLoading();
                $timeout(function(){
                    $.scope.scrollDelegate.scrollTop();
                },0);
            }).catch(function(err){defer.reject(err)});
        else
            $rootScope.hideLoading();
        return defer.promise;
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
    
   $.newDeckFromFile = function(navItem){
       var defer = $q.defer();
       $.scope.addingTo = new $.decks;
       $.scope.addingTo.name = navItem.name;
       $.scope.addingTo.user={_id: $rootScope.user._id};
       $.scope.addingTo.slides = [];
       $.scope.addingTo.thumb = '';
       $.scope.addingTo.isArchived = false;
       // save the shell first
       $.newNavItem($.scope).then(function(result){
            navItem.slides.forEach(function(slide){
                $.scope.addingTo.slides.push(slide);
            });
            $.scope.addingTo.thumb = navItem.thumb;
            $.scope.addingTo.isArchived = false;
            $.scope.addingTo._id = result._id;
        
            // update the deck
            return $.decks.update({id:$.scope.addingTo._id},$.scope.addingTo).$promise;
       }).then(function(){
           //we have now copied the slides by updating the deck
           //fix the thumb
           defer.resolve($.scope.addingTo);
       });
       return defer.promise;   
   }    
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
        if($scope.fullName == undefined){
            var alert = $ionicPopup.alert({
                title:'File Upload Error',
                template:'file name is missing'
            });
            alert.then(function(){});
        } else {
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
        }
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
    $.startUpload = function(file){
        if(file){
            file.spinner = false;
            file.progress = '0%';
            file.message = ''
            $.uploading.files.push(file);
        }
    }
    $.setArchive = function($scope,index){
        var defer = $q.defer();
        console.log($scope.navItems[index]);
        var navItem = $scope.navItems[index];
        var modelName = $scope.modelName;
        Archiver.update({modelName:modelName,id:navItem._id,isArchived:navItem.isArchived})
        .$promise.then(function(){
            defer.resolve();
        });
        return defer.promise;
    }
    
}]);
