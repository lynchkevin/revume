'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('starter')
  .controller('libraryCtrl', ['$scope',
                             '$rootScope',
                             '$state',
                             '$window',
                             '$timeout',
                             'Library',
                             '$ionicScrollDelegate',
                             '$ionicListDelegate',
                             'pnFactory',
                             '$ionicPopup',
                             'SessionBuilder',
                             'baseUrl',
                             '$q',
function ($scope,$rootScope,$state,
           $window,$timeout,Library,
           $ionicScrollDelegate,$listDel,
           pnFactory,$ionicPopup,sb,baseUrl,$q) {
      
    $scope.w = angular.element($window);
    
    $scope.init = function(){
        sb.init($scope);
        $scope.baseUrl = baseUrl.endpoint;
        $scope.slidePartial = baseUrl.endpoint+"/templates/slideItems.html";
        $scope.navPartial = baseUrl.endpoint+"/templates/navItems.html"
        console.log($scope.slidePartial,$scope.navPartial);
        $scope.sb=sb;
        pnFactory.init(); 
        reAspect();
        $scope.user={};
        var channel = pnFactory.newChannel("library::fileEvents");
        $scope.progress = "0%"
        $scope.spinner = false;
        $scope.selectedNavId = 0;
        $scope.navItems =[];
        $scope.listName = "Uploaded Files";
        $scope.setModel('files');
        $scope.tap={on:false,index:0};
        channel.subscribe(doFileEvents);
        $listDel.showDelete(false);
        Library.init($scope);
        Library.updateModel($scope).then(function(){
            $scope.deck = {name: ''};
            $scope.category={name:''};
            $scope.addingTo = undefined;
        });
    };
    $scope.slideOver=function(){
        $scope.$broadcast("library::slide");
    }
    $scope.slideBack = function(){
        $scope.$broadcast("!library::slide");        
    }
    $scope.editButton = function(index){
        if($scope.navItems[index].beingEdited)
            return "Done";
        return "Edit";
    };
    $scope.buildSession = function($index){
        sb.build($index).then(function(){
            $scope.slideBack();
        }).catch(function(err){
            $scope.slideBack();
        });
    };
    $scope.addSlide = function(index){
        Library.addSlide($scope,index);
    };
    //select all functionality - add all slides from a navItem
    $scope.addAll = function(){
        Library.addAll($scope);
    };
    $scope.deleteSlide = function(index){
        Library.deleteSlide($scope,index);
    };
    
    $scope.editContainer = function(index){
        if(!$scope.isEditing){
            $scope.slideOver();
            Library.openCollection($scope,index);
        }else{
            Library.closeCollection($scope,index);
        }
    };
                   
    function updateView(){
        var defer = $q.defer();
        Library.updateModel($scope).then(function(){
            defer.resolve();
            $timeout(function(){
                $ionicScrollDelegate.scrollTop();
            },0);
        }).catch(function(err){defer.reject(err)});
        return defer.promise;
    };
        
   $scope.doRefresh = function(){
       updateView().then(function(){
            $scope.$broadcast('scroll.refreshComplete');
       });
   };
    
   $scope.addDeck=function(){
        $scope.addingTo = new Library.decks;
        $scope.addingTo.name = $scope.deck.name;
        $scope.addingTo.user ={};
        $scope.addingTo.user._id = $rootScope.user._id;
        $scope.addingTo.slides=[];
        $scope.addingTo.thumb='';
        Library.newNavItem($scope).then(function(result){
            Library.updateModel($scope).then(function(){
            $timeout(function(){
                $scope.endNavAdd();
            },0);
        });
        }).catch(function(err){
            var alert = $ionicPopup.alert({
                title:'Error',
                template:'Error Code: '+err,
            });
            alert();
        });
   }

    $scope.addCategory= function(){
        $scope.addingTo = new Library.categories;
        $scope.addingTo.name = $scope.category.name;
        $scope.addingTo.user={}
        $scope.addingTo.user._id = $rootScope.user._id;
        $scope.addingTo.slides=[];
        $scope.addingTo.thumb='';
        Library.newNavItem($scope).then(function(result){
            Library.updateModel($scope).then(function(){
                $timeout(function(){
                    $scope.endNavAdd();
                },0);
            });
        }).catch(function(err){
            var alert = $ionicPopup.alert({
                title:'Error',
                template:'Error Code: '+err,
            });
            alert();
        });

    }
            
    $scope.setModel = function(model){
        $scope.modelName = model;
        switch(model){
            case 'files': 
                $scope.listName = "Uploaded Files"
                $scope.showEdit = false;
                Library.setModel($scope,Library.files);
                break;
            case 'decks': 
                $scope.listName = "Your Decks";
                $scope.showEdit = true;
                Library.setModel($scope,Library.decks);
                break;
            case 'categories':
                $scope.listName = "Your Categories";
                $scope.showEdit = true;
                Library.setModel($scope,Library.categories);
                break;
        }
        Library.updateModel($scope).then(function(){
            $timeout(function(){
                $ionicScrollDelegate.scrollTop();
            },0);
        });
    }

    $scope.toggleNavAdd = function(){
        if($scope.showAddItem)
            $scope.endNavAdd();
        else
            $scope.addNavItem();
    };
    $scope.addNavItem = function(){
        $scope.deck.name='';
        $scope.category.name='';
        $scope.showAddItem = true;
    };
    $scope.endNavAdd = function(){
        $scope.showAddItem = false;
        $listDel.showDelete(false);
    }
    // A confirm delete dialog
    function showConfirm(filename) {
    var confirmPopup = $ionicPopup.confirm({
     title: 'Delete '+filename,
     template: 'Are you sure to delete this?'
    });
    return confirmPopup;
    };

    $scope.delNavItem = function($index){
      var filename = $scope.navItems[$index].name;
      showConfirm(filename).then(function(res){
          if(res){
              Library.removeNavItem($scope, $index).then(function(){
                updateView();
              });
          }
      });
    };
    $scope.toggleListDelete = function(){
      if($listDel.showDelete())
        $listDel.showDelete(false);
      else
        $listDel.showDelete(true);
    };

    function doFileEvents(job){
        console.log(job);
        Library.setUserId(job.file_id).then(function(){
            $scope.spinner = false;
            $rootScope.$broadcast("show_message", job.message);
            updateView();
        }).catch(function(err){console.log(err)});
    };

    $scope.setNavSelection = function(id){
      $scope.slideOver();
      $scope.selectedNavId = id;
      Library.updateSlides($scope);
      $ionicScrollDelegate.scrollTop();
    };

    
    function reAspect(){
      $scope.width = verge.viewportW();
      if($scope.width <= 1100){
          $timeout(function(){
          $scope.navClass="col col-50";
          $scope.thumbClass="col col-50";
          },0);
      }else{
          $timeout(function(){
          $scope.navClass="col col-33";
          $scope.thumbClass="col col-67";
          },0);
      };
      $ionicScrollDelegate.scrollTop();
    };
    function reOrder($scope,newPos,oldPos){
        var slide = $scope.slides[oldPos];
        var num = 0;
        if(newPos>oldPos)
            newPos--;
        $scope.slides.splice(oldPos,1);
        $scope.slides.splice(newPos,0,slide);
        $scope.slides.forEach(function(slide){
            slide.originalOrder = num++;
        });
        num=0;
    }
    $scope.tapThumb=function(index){
        if(!$scope.isEditing){
            var newPosition = index;
            var oldPosition = $scope.tap.index;
            if($scope.tap.on){
                reOrder($scope,newPosition,oldPosition);
                Library.updateNavItem($scope);
            }
            $scope.tap.on = !$scope.tap.on;
            $scope.tap.index = index;
        }
    }

    $scope.$on('flow::filesSubmitted',function(event,$flow,flowfile){
    $scope.progress="0%";
    $flow.upload();
    });
    $scope.$on('flow::progress',function(event,$flow,flowfile){
        console.log($flow.progress());
        $scope.progress = ($flow.progress()*100.0).toString()+"%"
    });
    $scope.$on('flow::complete',function(event,$flow){
      $scope.progress = "0%";
      $scope.spinner = true;
      for(var i = $flow.files.length-1;i>=0;i--){
          if($flow.files[i].isComplete())
            $flow.removeFile($flow.files[i]);
      }
      $rootScope.$broadcast("show_message", "upload complete!");
    });


    $scope.$on('$destroy',function() {
        if(channel != undefined) channel.unsubscribe();
    });

    $scope.w.on('orientationchange',function(){
      reAspect();
    });
    $scope.w.bind('resize',function(){
          reAspect(); 
    });

    $scope.init();

}]);
