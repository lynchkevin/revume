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
//library service
.service('Library',['UploadedFiles','Decks','Categories','$q','baseUrl','$resource','$rootScope','$ionicPopup',
function(uFiles,decks,categories,$q,baseUrl,$resource,$rootScope,$ionicPopup){
    var $ = this;
    var collection={};
    //database objects
    $.files = uFiles;
    $.decks = decks;
    $.categories = categories;
    
    //files, categories or decks are all flavors of the same class
    $.setModel = function($scope,model){
        $.model = model;
        $scope.model = model;
    };
    
    $.updateModel = function($scope){
        return $q(function(resolve,reject){
          if($.model != $scope.model) console.log("model error in Library service");
          $scope.navItems = $.model.query({user:$rootScope.user._id});
          $scope.selectedNavId = 0;
          $scope.navItems.$promise.then(function(items){
          // user and slides are poplulated
              if(items.length>0){
                $scope.navItems = items;
                $scope.slides = $scope.navItems[$scope.selectedNavId].slides;
                setEditStates($scope);
              } else {
                $scope.navItems = [];
                $scope.slides = [];
              }
                resolve($scope);
          }).catch(function(err){
              reject(err);
          });
        });
      };
    
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

    $.init = function($scope){
        $scope.navItems =[];
        $scope.slides = [];
        $scope.slideStates =[]
        $scope.isEditing = false;
        $scope.editText = "Edit";
        $scope.container ={};
        collection.index=-1;
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
            });
        }
    };
    $.closeCollection=function($scope,$index){
        if($scope.isEditing){
            if($index == collection.index && $scope.model == collection.model){
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
}]);
