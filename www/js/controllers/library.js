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
                             '$resource',
                             'Library',
                             '$ionicScrollDelegate',
                             '$ionicListDelegate',
                             'pnFactory',
                             '$ionicPopup',
                             'SessionBuilder',
                             'baseUrl',
                             'shareMediator',
                             '$ionicModal',
                             '$q',
function ($scope,$rootScope,$state,
           $window,$timeout,$resource,Library,
           $ionicScrollDelegate,$listDel,
           pnFactory,$ionicPopup,sb,baseUrl,shareMediator,$ionicModal,$q) {
      
    $scope.w = angular.element($window);
    
    $scope.init = function(){
        sb.init($scope)
        Library.init($scope);
        $scope.baseUrl = baseUrl.endpoint;
        $scope.slidePartial = baseUrl.endpoint+"/templates/slideItems.html";
        $scope.navPartial = baseUrl.endpoint+"/templates/navItems.html"
        $scope.sb=sb;
        pnFactory.init(); 
        reAspect();
        $scope.user={};
        $scope.progress = "0%"
        $scope.spinner = false;
        $scope.timeLeft = 0;
        setActions($scope);
        $scope.selectedNavId = 0;
        $scope.navItems =[];
        $scope.listName = "Uploaded Files";
        $scope.setModel('files');
        $scope.tap={on:false,index:0};
        $listDel.showDelete(false);
        $scope.deck = {name: ''};
        $scope.category={name:''};
        $scope.addingTo = undefined;
        shareMediator.init($scope);
        // initialize the evaporate uploader
        $scope.evaData = {
          dir: 'uploads',
          timestampSeparator: '_',
          headersCommon: {
            'Cache-Control': 'max-age=3600'
          },
          headersSigned: {
            'x-amz-acl': 'bucket-owner-full-control'
          },
          onFileSubmitted: function(files){
              $scope.progess = '0%';
          },
          onFileProgress: function (file) {
            console.log(
              'onProgress || name: %s, uploaded: %f%, remaining: %d seconds',
              file.name,
              file.progress,
              file.timeLeft
            );
            $scope.progress = (file.progress).toString()+"%";
            $scope.timeLeft = file.timeLeft;
          },
          onFileComplete: function (file) {
            console.log('onComplete || name: %s', file.name);
            $scope.fullName = file.path_
            console.log($scope.fullName);
            $scope.progress = "0%";
            $scope.spinner = true;
            $scope.timeLeft = 0;
            $rootScope.$broadcast("show_message", "upload complete...converting");
            Library.processUpload($scope).then(function(uFile){
                $scope.spinner = false;
                $rootScope.$broadcast("show_message", 'Conversion Complete');
                updateView();
            }).catch(function(err){
                console.log(err);
            });        
          },
          onFileError: function (file, message) {
            console.log('onError || message: %s', message);
          }
        };
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
        sb.init($scope).then(function(){
            return sb.build($index)
        }).then(function(){
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
    
    function add(){
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
    
   $scope.addDeck=function(){
        $scope.addingTo = new Library.decks;
        $scope.addingTo.name = $scope.deck.name;
        add();
   }

    $scope.addCategory= function(){
        $scope.addingTo = new Library.categories;
        $scope.addingTo.name = $scope.category.name;
        add();
    }
    
    function fixSharedTeams($scope){
        $scope.navItems.forEach(function(item){
            item.sharedTeams = [];
        })
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
            fixSharedTeams($scope);
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
        TeamService.getAll($rootScope.user._id).then(function(teams){
            $scope.teams = teams;
            $scope.selectedNavId = $index;
            $scope.shareModal.show();
        }).catch(function(err){
            console.log('library controller shaveNavItem - error: ',err);
        });
    }
    $scope.cancelNavShare = function(){
        $scope.shareModal.hide();
    }
    $scope.updateNavSharing = function(){
        console.log('updating sharing status for item: ',$scope.selectedNavId);
        console.log('Teams are...',$scope.teams);
        console.log('Sharing status is :',$scope.navItems[$scope.selectedNavId].sharedTeams);
        Library.shareNavItem($scope).then(function(){
            $scope.shareModal.hide();
        });
        
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
        if(!$scope.isEditing && $scope.navItems[$scope.selectedNavId]._$Reorder){
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

    //handle actions with rights management
    function editCB(index,buttonIndex,$event,type){
        var action = $scope.navItems[index].actions[buttonIndex];
        action.name = 'Done'; 
        action.callBack = doneCB;
        $scope.editContainer(index);
        if(type != 'button'){
            $scope.navItems[index].actions[0].name = 'Editing...';
            $scope.navItems[index].actions[0].class = 'button-assertive';
        } else {
            $event.stopPropagation();
            action.class = 'button-assertive';
        }
         $scope.navItems[index].action.selected = $scope.navItems[index].actions[0];
    }
    function doneCB(index,buttonIndex,$event,type){
        var action = $scope.navItems[index].actions[buttonIndex];        
        action.name = 'Edit';
        action.callBack = editCB;
        $scope.editContainer(index);      
        if(type != 'button'){
            $scope.navItems[index].actions[0].name = 'Options';
            $scope.navItems[index].actions[0].class = 'button-positive';
        } else {
            action.class = 'button-positive';
            $event.stopPropagation();
        }
        $scope.navItems[index].action.selected = $scope.navItems[index].actions[0];       
    }
    function newMeetingCB(index,buttonIndex,$event,type){
        if(type=='button')
            $event.stopPropagation();
        $scope.buildSession(index);
        $scope.navItems[index].action.selected = $scope.navItems[index].actions[0];    
    }
    function shareCB(index,buttonIndex,$event,type){
        if(type=='button')
            $event.stopPropagation();
        $scope.selectedNavId = index;
        shareMediator.shareItem(index);
        $scope.navItems[index].action.selected = $scope.navItems[index].actions[0];
    }
    function delCB(index,buttonIndex,$event,type){
        $scope.delNavItem(index);
        $scope.navItems[index].action.selected = $scope.navItems[index].actions[0];
    }
    function setActions($scope){
        //set the available action actions
        $scope.actions = [{name:'Options'},
                          {name:'Edit',class:'button-positive'},
                          {name:'New Meeting',class:'button-calm'},
                          {name:'Share',class:'button-royal'},
                          {name:'Delete'}
                         ];
        $scope.actions[1].callBack=editCB
        $scope.actions[2].callBack=newMeetingCB;
        $scope.actions[3].callBack=shareCB;
        $scope.actions[4].callBack=delCB;
        //when an item is being edited - user these actions
        $scope.editActions = [{name:'Editing...'},
                              {name:'Done',class:'button-assertive'},
                              {name:'New Meeting',class:'button-calm'},
                              {name:'Share',class:'button-royal'},
                              {name:'Delete'}
                             ];
        $scope.editActions[1].callBack=doneCB
        $scope.editActions[2].callBack=newMeetingCB;
        $scope.editActions[3].callBack=shareCB;
        $scope.editActions[4].callBack=delCB;
    }

    //handle system and window events
    $scope.$on('$destroy',function() {
        if($scope.shareMediator != undefined) $scope.shareMediator.destroy();
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
