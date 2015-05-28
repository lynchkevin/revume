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
                              'TeamService',
                              '$ionicModal',
                             '$q',
function ($scope,$rootScope,$state,
           $window,$timeout,Library,
           $ionicScrollDelegate,$listDel,
           pnFactory,$ionicPopup,sb,baseUrl,TeamService,$ionicModal,$q) {
      
    $scope.w = angular.element($window);
    
    function setOptions($scope){
        $scope.options = [{name:'Options'},
                          {name:'Edit',class:'button-positive'},
                          {name:'New Meeting',class:'button-calm'},
                          {name:'Share',class:'button-royal'}
                         ];
    }
    
    $scope.init = function(){
        sb.init($scope);
        Library.init($scope);
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
        setOptions($scope);
        $scope.action = {selected:$scope.options[0]};
        $scope.selectedNavId = 0;
        $scope.navItems =[];
        $scope.listName = "Uploaded Files";
        $scope.setModel('files');
        $scope.tap={on:false,index:0};
        channel.subscribe(doFileEvents);
        $listDel.showDelete(false);
        $scope.deck = {name: ''};
        $scope.category={name:''};
        $scope.addingTo = undefined;
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $scope.teams = teams;
        })
        $ionicModal.fromTemplateUrl('templates/shareTemplate.html',{
            scope: $scope,
            animation:'slide-in-up'
        }).then(function(modal){
            $scope.shareModal = modal;
        });
    };
    $scope.slideOver=function(){
        $scope.$broadcast("library::slide");
    }
    $scope.slideBack = function(){
        $scope.$broadcast("!library::slide");        
    }
    $scope.editButton = function($index){
        if($scope.navItems[$index].beingEdited)
            return "Done";
        return "Edit";
    };
    $scope.buildSession = function($index){
        sb.setScope($scope);
        sb.build($index).then(function(){
            $scope.slideBack();
        }).catch(function(err){
            $scope.slideBack();
        });
    };
    $scope.addSlide = function($index){
        Library.addSlide($scope,$index);
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
            switch(model){
                case 'decks':
                    $scope.navItems.forEach(function(navItem){
                        navItem.options = [];
                        $scope.options.forEach(function(option){
                            var action = {};
                            action.name = option.name;
                            action.class= option.class;
                            navItem.options.push(action);
                        })
                        navItem.action = {selected:navItem.options[0]};
                    })
                    break;
                case 'categories':
                    $scope.navItems.forEach(function(navItem){
                        navItem.options=[];
                        for(var i=0; i<2; i++){
                            var action = {};
                            action.name = $scope.options[i].name;
                            action.class= $scope.options[i].class;
                            navItem.options.push(action);
                        }
                        navItem.action = {selected:navItem.options[0]};
                    })
                    break;
                case 'files':
                    $scope.navItems.forEach(function(navItem){
                        navItem.options=[];
                        var action = {};
                        action.name = $scope.options[0].name;
                        action.class= $scope.options[0].class;
                        navItem.options.push(action);
                        action = {};
                        action.name = $scope.options[$scope.options.length-1].name;
                        action.class = $scope.options[$scope.options.length-1].class;
                        navItem.options.push(action);
                        navItem.action = {selected:navItem.options[0]};
                    })
                    break;
            }
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

    $scope.shareNavItem = function($index){
        $scope.selectedNavId = $index;
        $scope.shareModal.show();
    }
    $scope.cancelNavShare = function(){
        $scope.shareModal.hide();
    }
    $scope.updateNavSharing = function(){
        console.log('updating sharing status for item: ',$scope.selectedNavId);
        console.log('Teams are...',$scope.teams);
        consolel.log('Sharing status is :',$scope.navItems[$scope.selectedNavId].sharingTeams);
        $scope.shareModal.hide();
    }
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
    
    //handle tap and re-order events
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
    $scope.selectOption = function(index){
        console.log('Selected Option: ',$scope.navItems[index].action.selected);
        switch($scope.navItems[index].action.selected.name){
                case 'Edit':
                    $scope.navItems[index].action.selected.name = 'Done';
                    $scope.navItems[index].options[0].name = 'Editing...';                    
                    $scope.editContainer(index);
                    break;
                case 'Done':
                    $scope.navItems[index].action.selected.name = 'Edit';
                    $scope.navItems[index].options[0].name = $scope.options[0].name;   
                    $scope.editContainer(index);
                    break;
                case 'New Meeting':
                    $scope.buildSession(index);
                    break;
                case 'Share':
                    $scope.shareNavItem(index);
                    break;
        }
        $scope.navItems[index].action.selected = $scope.navItems[index].options[0];
    }
    $scope.optionButton = function(index,buttonIndex,$event){
        $event.stopPropagation();
        console.log('Selected Option: ',$scope.navItems[index].options[buttonIndex]);
        switch($scope.navItems[index].options[buttonIndex].name){
                case 'Edit':
                    $scope.navItems[index].options[buttonIndex].name = 'Done';                  
                    $scope.editContainer(index);
                    break;
                case 'Done':
                    $scope.navItems[index].options[buttonIndex].name = 'Edit';
                    $scope.editContainer(index);
                    break;
                case 'New Meeting':
                    $scope.buildSession(index);
                    break;
                case 'Share':
                    $scope.shareNavItem(index);
                    break;
        }
    }
    //handle the flow file events
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

    //handle system and window events
    $scope.$on('$destroy',function() {
        if(channel != undefined) channel.unsubscribe();
    });

    $scope.w.on('orientationchange',function(){
      reAspect();
    });
    $scope.w.bind('resize',function(){
          reAspect(); 
    });
    
    if($rootScope.user._id == undefined)
        $rootScope.$on('Revu.Me:Ready',function(event, data){
            $scope.init();
        });
     else
         $scope.init();


}]);
