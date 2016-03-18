'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the barebonesApp
 */
angular.module('RevuMe')
  .controller('dashboardCtrl', ['$scope',
                                '$rootScope',
                                '$window',
                                '$timeout',
                                '$state',
                                '$filter',
                                '$ionicScrollDelegate',
                                '$ionicModal',
                                '$ionicHistory',
                                '$ionicNavBarDelegate',
                                '$ionicSideMenuDelegate',
                                'tourService',
                                'Dashboard',
                                '$q',
                                '$PALLET',
    function($scope,
                $rootScope,
                $window,
                $timeout,
                $state,
                $filter,
                $ionicScrollDelegate,
                $ionicModal,
                $ionicHistory,
                $ionicNavBarDelegate,
                $ionicSideMenuDelegate,
                tourService,
                Dashboard,
                $q,
                $PALLET){
    
        //setup the color pallet so our charts match our color scheme
        $scope.w = angular.element($window);
        $scope.doughnutOptions = {
            percentageInnerCutout : 60,
        }
        //create a new doughnutChart with options set accordingly
        var doughnutChart = function(){
            var chart = {};
            chart.options = $scope.doughnutOptions;
            return chart;
        }
        var emptyChart = function(name,color,center){
            var chart = doughnutChart();
            chart.center = center;
            chart.data = [1];
            chart.labels = [name];
            chart.colors = [color];
            return chart;
        }
        var setMeetingChart = function(target,yet,done,colors){
            if(yet.hasOwnProperty(target) && done.hasOwnProperty(target)){
                var chart = doughnutChart();
                chart.center = yet[target]+done[target];
                if(chart.center == 0){
                    chart = emptyChart('No Meetings',$PALLET.$light,chart.center);
                }else{
                    chart.labels = ['Scheduled','Completed'];
                    chart.data = [yet[target],done[target]];
                    chart.colors = colors;
                }
                return chart;
            }else
                return undefined;
        };
        //Generate the Meeting View
        var genMeetingView = function(){
            var deferred = $q.defer();
            Dashboard.getMeetingStats().then(function(stats){
                $scope.rawMeetingStats = stats;
                var all = stats.all;
                var yet = stats.upcomming;
                var done = stats.completed;
                
                //meeting status for today
                var today = setMeetingChart('today',yet,done,[$PALLET.$positive,$PALLET.$dark]);
                var thisWeek = setMeetingChart('thisWeek',yet,done,[$PALLET.$balanced,$PALLET.$dark]);
                var thisMonth = setMeetingChart('thisMonth',yet,done,[$PALLET.$calm,$PALLET.$dark]);
                var allChart = {}
                allChart.center = all.all;
                if(allChart.center == 0){
                    allChart = emptyChart('No Meetings',$PALLET.$light,allChart.center);
                }else{
                    allChart.lalels = ['Active','Archived'];
                    allChart.data = [all.active,all.archived];
                    allChart.colors = [$PALLET.$positive,$PALLET.$energized];
                }
                //put all chart updates in a timeout loop as a sacrifice to the angular gods
                $timeout(function(){
                    $scope.meetings = {
                        today:today,
                        thisWeek:thisWeek,
                        thisMonth:thisMonth,
                        all:allChart
                    }
                },0);
                return  Dashboard.getRecentInteractions();
            }).then(function(interactions){
                $scope.interactions = [];
                interactions.results.forEach(function(i){
                    var iView = {};
                    //we only bring back single person views (leave behinds)
                    iView.date = i.eventDate;
                    if(i.slideViews.length > 0 )
                        if(i.slideViews[0].views.length>0)
                            iView.contact = i.slideViews[0].views[0].userName;
                        else
                            iView.contact = 'No Name Found';
                    iView.meetingName = i.session.name;
                    iView.totalSlides = i.slideViews.length;
                    iView.totalTime = 0;
                    iView.data = [];
                    iView.labels = [];
                    iView.isShowing = false;
                    i.slideViews.forEach(function(sv){
                        iView.totalTime += sv.duration;
                        iView.labels.push('slide '+sv.slideIndex);
                        iView.data.push(sv.duration);
                    });
                    $scope.interactions.push(iView);
                });
                deferred.resolve();                
            });
            return deferred.promise;
        };
        
        var subSample = function(data){
            var maxPoints = 25 //determined after excruciating analysis by PWC - cost $6.8 million
            var population = data.length;
            var window = Math.round(population/maxPoints);
            var accumulator = 0;
            var result = [];
            var elem ={};
            //make sure we have enough data to subsample
            if(window < 1){
                return data;
            }else {
                for(var i=0, w=0;i<population;i++,w++){
                    if(w==0){
                        elem = {};
                        elem.date = data[i].date;
                        accumulator = 0;
                    }
                    accumulator+=data[i].engagement;
                    if(w>=window-1){
                        elem.engagement = accumulator/window;
                        result.push(elem);
                        w = -1;
                    }
                }
                return result;
            }
        }
                    
                    
        var parseData = function(data){
            var results = {
                e:[],
                d:[]
            };
            var mirror = data.reverse();
            mirror.forEach(function(elem){
                var x = $filter('date')(elem.date,'MMM dd');
                var y = $filter('number')((elem.engagement*100),1);
                results.d.push(x);
                results.e.push(y);
            });
            return results;
        }
        //generate the engagement view
        var genEngagementView = function(){
            var deferred = $q.defer();
            Dashboard.getEngagment().then(function(engagement){
                $scope.rawEngagement = engagement;
                //engagement object looks like
                /*
                engagement = {
                    recent:value,
                    recentData:array,
                    overall:value,
                    overallData:array
                }
                */
                var rData = parseData(engagement.recentData);
                var oData = parseData(subSample(engagement.overallData));
                $scope.engagement = {
                    recentChart:doughnutChart(),
                    rDetailChart:{
                        data:[rData.e],
                        labels:rData.d,
                        colors:[$PALLET.$balanced],
                        series:['Viewer Engagement'],
                        options:{scaleShowLabels:true,scaleLabel:"<%= value + ' %'%>"}
                    },
                    overallChart:doughnutChart(),
                    oDetailChart:{
                        data:[oData.e],
                        labels:oData.d,
                        colors:[$PALLET.$royal],
                        series:['Viewer Engagement'],
                        options:{scaleShowLabels:true,scaleLabel:"<%= value + ' %'%>"}
                    }
                };
                engagement.recent = Math.round(engagement.recent);
                engagement.overall = Math.round(engagement.overall);
                $scope.engagement.recentChart.data = [engagement.recent,(100-engagement.recent)];
                $scope.engagement.recentChart.labels = ['%Engaged','%Distracted'];
                $scope.engagement.recentChart.center = engagement.recent;
                $scope.engagement.recentChart.colors = [$PALLET.$balanced,$PALLET.$light];
                $scope.engagement.overallChart.data = [engagement.overall,(100-engagement.overall)];
                $scope.engagement.overallChart.labels = ['%Engaged','%Distracted']
                $scope.engagement.overallChart.center = engagement.overall;
                $scope.engagement.overallChart.colors = [$PALLET.$royal,$PALLET.$light];                     
                deferred.resolve();
            });
            return deferred.promise;
        };   
        //Generate the File Statistic View
        var genFileView = function(){
            var deferred = $q.defer();
            Dashboard.getFileStats().then(function(stats){
                $scope.rawFileStats = stats;
                var f = stats.files;
                var af = stats.archivedFiles;
                var d = stats.decks;
                var ad = stats.archivedDecks;
                
                //build recent file activity data
                var recentActivity = doughnutChart();
                recentActivity.center = f.thisMonth;
                var all = f.today+f.thisWeek+f.thisMonth;
                if(all==0){
                    recentActivity = emptyChart('No Activity',$PALLET.$light,recentActivity.center);

                }else{
                    recentActivity.labels = ['Today','This Week','This Month'];
                    recentActivity.data = [f.today,f.thisWeek,f.thisMonth];
                    recentActivity.colors=[
                        $PALLET.$positive,
                        $PALLET.$balanced,
                        $PALLET.$calm
                        ];
                }
                
                //build all files summary
                var nativeActivity = doughnutChart();
                nativeActivity.center = f.all + af.stubs.length;
                if(nativeActivity.center == 0){
                    nativeActivity = emptyChart('No Files',$PALLET.$light,nativeActivity.center);
                }else{
                    nativeActivity.labels = ['Active','Archived'];
                    nativeActivity.data = [f.all,af.stubs.length];
                    nativeActivity.colors = [
                        $PALLET.$positive,
                        $PALLET.$energized
                    ];
                }
                $timeout(function(){
                    $scope.files = {
                        recent: recentActivity,
                        native: nativeActivity
                    };
                },0);

                //Recent Deck Activity
                var deckRecent = doughnutChart();
                deckRecent.center = d.thisMonth;
                var all = d.today+d.thisWeek+d.thisMonth;
                if(all==0){
                    deckRecent = emptyChart('No Activity',$PALLET.$light,deckRecent.center);
                }else{
                    deckRecent.labels = ['Today','This Week','This Month'];
                    deckRecent.data = [d.today,d.thisWeek,d.thisMonth];
                    deckRecent.colors=[
                        $PALLET.$positive,
                        $PALLET.$balanced,
                        $PALLET.$calm
                        ];
                }
                // all decks summary data
                var deckNative = doughnutChart();
                deckNative.center = d.all+ad.stubs.length;
                if(deckNative.center == 0){
                    deckNative = emptyChart('No Decks',$PALLET.$light,deckNative.center);
                }else{
                    deckNative.labels = ['Active','Archived'];
                    deckNative.data = [d.all,ad.stubs.length];
                    deckNative.colors = [
                        $PALLET.$positive,
                        $PALLET.$energized
                    ];
                }
                $timeout(function(){
                    $scope.decks = {
                        recent: deckRecent,
                        native: deckNative
                    };
                },0);
                deferred.resolve();
            });
            return deferred.promise;
        };
        var firstButton = {
            name:'Today',
            clicked:false,
            click:function(){
                this.clicked=true;
                genMeetingView().then(function(){
                    $ionicScrollDelegate.resize();
                });
            }
        };
        var secondButton = {
            name:'Engagement',
            clicked:false,
            click:function(){
                this.clicked = true;
                genEngagementView().then(function(){
                    $ionicScrollDelegate.resize();
                });
            }
        };
        var thirdButton = {
            name:'Files',
            clicked:false,
            click:function(){
                this.clicked = true;
                genFileView().then(function(){
                    $ionicScrollDelegate.resize();
                });
            }
        };
        
        //set up the navigation buttons
        $scope.navButtons = {
            class:'button button-dark button-outline dashboard-nav-button',
            clickedClass: 'button button-dark dashboard-nav-button',
            buttons:[firstButton,secondButton,thirdButton],
            todayButton:0,
            engageButton:1,
            fileButton:2,
            click: function(index){
                this.buttons.forEach(function(button){
                    button.clicked = false;
                })
                this.buttons[index].click();
            },
        };
        $scope.goMeetings = function(){
            $state.go('app.sessions');
        }
        $scope.hideInteractions = function(){
            $scope.interactions.forEach(function(i){
                i.isShowing = false;
            });
        }
        $scope.showInteraction = function($index){
            if($scope.interactions[$index].isShowing)
                $scope.hideInteractions();
            else {
                $scope.hideInteractions();
                $scope.iChart.data = [$scope.interactions[$index].data];
                $scope.iChart.labels = $scope.interactions[$index].labels;
                $scope.iChart.series = [$scope.interactions[$index].contact];
                $scope.iChart.colors = [$PALLET.$balanced];
                $scope.iChart.options = {scaleShowLabels:true,scaleLabel:"<%= value + ' sec'%>"};
                $scope.interactions[$index].isShowing = true;
            }
            //tell the scroll that our element is now showing
            $ionicScrollDelegate.resize();
        }
        //initialize the scope variables as needed
        var testWidth = function(){
            if(verge.viewportW()<600)
                $timeout(function(){
                    $scope.minWidth = false;
                    $ionicScrollDelegate.resize();
                },0);
            else
               $timeout(function(){
                    $scope.minWidth = true;
                    $ionicScrollDelegate.resize();
                },0);;
        }
        $scope.init = function(){ 
            //set all charts back to response - we set it false in leave to avoid a bug...
            $scope.navButtons.buttons[0].click();
            $scope.iChart = {};
            testWidth();
        }
        $scope.$on('$ionicView.enter',function(){
            var backView = $ionicHistory.backView();
            if(backView != undefined){
                if(backView.stateName == 'app.signup' || backView.stateName == 'app.signin')
                    $ionicNavBarDelegate.showBackButton(false);
                else
                $ionicNavBarDelegate.showBackButton(true);          
            }
            if($rootScope.user._id != undefined)
                $scope.init();
        });
        $scope.$on('$ionicView.beforeLeave',function(){
            //this will remove all chart canvas elements to avoid a resize error
            $scope.navButtons.buttons.forEach(function(button){
                button.clicked = false;
            })
        });
        //reinialize whem the userID is set
        $scope.$on('userID',function(event,user){
            $scope.init();
        });
        $scope.w.on('orientationchange',function(){
            testWidth();
        });
        $scope.w.bind('resize',function(){
            testWidth(); 
        });
        $scope.$on('Revu.Me:Ready',function(){
            //create a splash modal
            $ionicModal.fromTemplateUrl('templates/splashModal.html',{
                scope: $scope,
                animation:'slide-in-up'
            }).then(function(modal){
                $scope.splash = modal;
            // splash screen for 3 seconds
                $scope.splash.show();
                $timeout(function(){
                    $scope.splash.hide().then(function(){
                        $scope.splash.remove();
                        //slide the menu over if this is the first log in
                        if($rootScope.firstLogin != undefined && $rootScope.firstLogin == true){
                            $rootScope.firstLogin = false;
                            $ionicSideMenuDelegate.toggleLeft(true);
                            $timeout(function(){
                                $ionicSideMenuDelegate.toggleLeft(false);
                            },2000);
                        }
                    });

                },3000);
            }); 
        });
    /* 
        Statistic Types:
            Count: Donut Chart
            Timeline: Rolling Timeline - if today it updates once per 5 seconds
        User Statistics:
            Files: (today,week,timeline)
                Files Uploaded 
                Files Shared You've Shared 
                Files Shared With You
                Archived Files
            Decks: (today,week,timeline)
                Decks Built
                Decks You've Shared
                Decks Shared with You
                Archived Decks
            Meetings (today, week, month, timeline)
                Meetings Scheduled 
                Meetings Performed
                Average Engagement
                Archived Meetings
            Team Leader Board
                Meetings Sheduled
                Meetings Performed
            
        Admin Statistics:
            Users: (Now, Today, Timeline)
            User Activity Log
    */
    $scope.tourService = tourService;  

  }]);
