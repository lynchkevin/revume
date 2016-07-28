'use strict';

/**
 * @ngdoc function
 * @name barebonesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the systemMonitor
 */
angular.module('RevuMe')    
  .filter('handyTime',['$filter',function($filter){
    return function(input){
        var retVal = 'handyTime filter error - undefined input';
        if(input!=undefined){
            if(input < 60){
                var sec = $filter('number')((Number(input)),2);
                var nStr = sec.toString();
                retVal = nStr+' sec';
            } else if (input < 3600){
                var min = $filter('number')((Number(input)/60),2);
                var nStr = min.toString();
                retVal = nStr+' min';
            } else {
                var num = parseFloat(input);
                var hr = Math.floor(num/3600);
                var nStr = hr.toString();
                var min = (num-(3600*hr))/60;
                min = $filter('number')(min,2);
                retVal = hr+' hr '+min+' min';
            }
        }
        return retVal;
    }
  }])
  .controller('systemMonitorCtrl', ['$scope',
                                    '$rootScope',
                                    '$window',
                                    '$timeout',
                                    '$interval',
                                    '$ionicScrollDelegate',
                                    'logService',
                                    'ionicToast',
                                    '$PALLET',
                                    '$filter',
                                    '$moment',
                                    '$q',
    function ($scope,$rootScope,$window,$timeout,$interval,$ionicScrollDelegate,logService,ionicToast,$PALLET,$filter,$moment,$q){
    //fake constants
    $scope.pollingInterval = 5 * 1000; //5 seconds;
    $scope.startingGaugeMax = 5; //5 users;
    $scope.timelineLength = 20; //samples
    $scope.timeline = {};
    $scope.channel = undefined;
    $scope.users = [];
    $scope.uChart = {};
    $scope.poller = undefined;
    /*  Two sections - real-time data (now) and Historical Queries
    
        Now:
        Build a timeline of users over minutes using hour:min: y = users.length, x = hh:mm
        Build a currently on-line list (which is just users)
        Click on User and see history of:
            need a selector bar:
                paths taken today
                Visits over time
        
    */
    //setup the view navigation buttons
    var firstButton = {
        name:'Now',
        clicked:false,
        click:function(){
            this.clicked=true;
            engageTheMechanism();
        }
    };
    var secondButton = {
        name:'Trends',
        clicked:false,
        click:function(){
            this.clicked = true;
            buildTrends();
        }
    };
    var thirdButton = {
        name:'Analyze',
        clicked:false,
        click:function(){
            this.clicked = true;
        }
    };

    //set up the navigation buttons
    $scope.navButtons = {
        class:'button button-dark button-outline dashboard-nav-button',
        clickedClass: 'button button-dark dashboard-nav-button',
        buttons:[firstButton,secondButton,thirdButton],
        nowButton:0,
        trendsButton:1,
        analyzeButton:2,
        click: function(index){
            this.buttons.forEach(function(button){
                button.clicked = false;
            })
            this.buttons[index].click();
        },
    };
    //build the users online gauge - this updates in real time
    var buildGuage = function(count){
        if($scope.uChart.guage==undefined)
            $scope.uChart.guage = {};
        var guage =$scope.uChart.guage;
        if(guage.max == undefined)
            guage.max= $scope.startingGaugeMax;
        if(count >= guage.max)
            guage.max *= 2;
        guage.count = count;
        guage.headRoom = guage.max-guage.count;
        guage.options = {percentageInnerCutout : 60};
        guage.data = [guage.count,guage.headRoom];
        guage.labels = ['Users Online',' '];
        guage.colors = [$PALLET.$calm,$PALLET.$light];
        guage.center = guage.count;
    }
    //a poller that makes time seem as if it's passing by even though everything actually updates as it happens
    var startPoller = function(){
        if(!angular.isDefined($scope.poller))
           $scope.poller = $interval(function(){
            buildTimeline($scope.users.length);
        },$scope.pollingInterval);
    }
    var stopPoller = function(){
        if(angular.isDefined($scope.poller))
           $interval.cancel($scope.poller);
    }
    //each time the interval fires - we update the sample time on the timeline
    var updateSampleTime = function(){
        var sec = $scope.sampleTime.getSeconds();
        var min = $scope.sampleTime.getMinutes();
        var hour = $scope.sampleTime.getHours();
        var secInterval = $scope.pollingInterval/1000;
        sec += secInterval;
        if(sec >=60){
            sec = 0;
            min+=1;
        }
        if(min >= 60){
            min = 0;
            hour+=1;
        }
        if(hour >= 23)
            hour = 0;
        $scope.sampleTime.setHours(hour);
        $scope.sampleTime.setMinutes(min);
        $scope.sampleTime.setSeconds(sec);
    }
    //initilize the timeline labels and data
    var initializeLabelsAndData = function(count){
        var now = new Date();
        var secInterval = $scope.pollingInterval / 1000;
        var sec = now.getSeconds();
        var min = now.getMinutes();
        var hour = now.getHours();
        sec = Math.ceil(sec/secInterval)*secInterval;
        var numSamples = $scope.timelineLength;
        var sampleTime = new Date()
        sampleTime.setHours(hour);
        sampleTime.setMinutes(min);
        sampleTime.setSeconds(sec);
        var timeLabels = [];
        var timeSeries = [];
        timeLabels.push($filter('date')(sampleTime,'HH:mm:ss'));
        timeSeries.push(count);
        $scope.sampleTime = sampleTime;
        //show the future samples
        for(var i = 1; i < numSamples;i++){
            sec -= secInterval ;
                if(sec<=0){
                    sec = 60-secInterval;
                    min-=1;
                }
                if(min<=0){
                    min = 59;
                    hour-=1;
                }
                if(hour<=0)
                    hour = 23;
            sampleTime.setHours(hour);
            sampleTime.setMinutes(min);
            sampleTime.setSeconds(sec);
            timeLabels.push($filter('date')(sampleTime,'HH:mm:ss'));
            timeSeries.push(0);
        }   
        return {labels:timeLabels,data:timeSeries};
    }
    //build the timeline
    var buildTimeline = function(count){
        if($scope.uChart.timeline == undefined)
            $scope.uChart.timeline = {};
        var tl = $scope.uChart.timeline;
        if(tl.labels == undefined){
            var labelsAndData = initializeLabelsAndData(count);
            tl.labels = labelsAndData.labels;
            tl.data = [labelsAndData.data];
        }else{
            updateSampleTime();
            //add the new count to the front of the time series and pop the oldest value
            tl.data[0].unshift(count);
            tl.data[0].pop();
            //add the new time label and pop the oldest label
            tl.labels.unshift($filter('date')($scope.sampleTime,'HH:mm:ss'));
            tl.labels.pop();
        }
        tl.series = ['Users Online'];
        tl.colors = [$PALLET.$balanced];
        tl.options = {animation:false};
        $scope.uChart.timeline = tl;
    }
    $scope.getUserPath = function(){
    }
    var groupById = function(){
        var findId = function(array,id){
            var idx = undefined;
            var i = 0;
            array.some(function(elem){
                if(elem.user._id == id){
                    idx = i;
                    return true;
                }else{
                    i++;
                    return false;
                }
            });
            return idx;
        };
        var dayIdx = 0;
        $scope.trends.byDay.forEach(function(day){
            var users = day.userData;
            day.data.forEach(function(item){
                if(item.user){
                    var idx = findId(users,item.user._id);
                    if(idx == undefined){
                        users.push({user:item.user,data:[item],visitTime:item.elapsed,show:false});
                        $scope.trends.byDayTotals[dayIdx]++;
                    }else{
                        users[idx].data.push(item);
                        users[idx].visitTime += item.elapsed;
                    }
                }
            });
            dayIdx++;
        });
    }
    var groupByDay = function(daysBack,trends){
        var sorted = {
            byDay:[],
            byDayTotals:[],
        };
        var startMoment = $moment();
        var sampleDate = new Date();
        //set totals to 0 for all days in a month
        for(var i=0; i<daysBack; i++){
            sampleDate = new Date(startMoment.toDate());
            sorted.byDayTotals.push(0);
            sorted.byDay.push({date:sampleDate,data:[],userData:[]});
            startMoment.subtract(1,'days');
        }
        //do the grouping and calculate totals
        trends.forEach(function(trend){
            var idx = $moment().dayOfYear() - $moment(trend.date).dayOfYear();
            if(idx>=0 && idx<daysBack)
                sorted.byDay[idx].data.push(trend)
        });
        return sorted;
    }
    var buildTrendCharts = function(){
        $scope.trendChart = {week:{},month:{}};
        var tChart = $scope.trendChart;
        //build the week chart
        tChart.week.data = [$scope.trends.byDayTotals.slice(0,7)];
        var weekLabels = [];
        for(var i = 0; i<7; i++){
            var day = $scope.trends.byDay[i];
            var dateStr = $filter('date')(day.date,'EEE dd');
            weekLabels.push(dateStr);
        }
        var monthLabels = [];
        $scope.trends.byDay.forEach(function(day){
            var dateStr = $filter('date')(day.date,'MMM dd');
            monthLabels.push(dateStr);
        });
        tChart.week.labels = weekLabels;
        tChart.week.colors = [$PALLET.$balanced];
        tChart.week.series = ['Unique Visits']
        tChart.week.options = {};
        //build the month chart
        tChart.month.data = [$scope.trends.byDayTotals.slice(0)];
        tChart.month.labels = monthLabels;
        tChart.month.colors = [$PALLET.$dark];
        tChart.month.series = ['Unique Visits'];
        tChart.month.options = {};
    }
    var buildTrends = function(){
        var deferred = $q.defer();
        var month = 31;
        logService.getRecentHistory(month).then(function(activities){
            $scope.trends = groupByDay(month,activities);
            groupById();
            buildTrendCharts();
            updateView();
        });
    }
    
    var resolveUsers = function(pnUsers){
        var deferred = $q.defer();
        var promises = [];
        $scope.users = [];
        pnUsers.uuids.forEach(function(uuid){
            if(uuid != 'user_log')
                promises.push($scope.channel.getUser(uuid));
            else
                promises.push($q.defer().resolve());
        });
        $q.all(promises).then(function(users){
            $scope.users = [];
            users.forEach(function(user){
                if(user){
                    user.showHistory = false;
                    $scope.users.push(user);
                }
                    
            });
            deferred.resolve();
        });
        return deferred.promise;
    }
    
    var setWhosOnline = function(){
        var deferred = $q.defer();
        var userInfo = {};
        function hnCallBack(userInfo){
            console.log('systemMonitor: hereNow returns: ',userInfo);
            resolveUsers(userInfo).then(function(){
                deferred.resolve();
            });
        };
        $scope.channel.hereNow(hnCallBack);
        return deferred.promise;
    };
    
    var engageTheMechanism = function(){
        setWhosOnline().then(function(){
            buildGuage($scope.users.length);
            buildTimeline($scope.users.length);
            $scope.users.forEach(function(user){
                initUserHistory(user);
            });
            startPoller();
            $ionicScrollDelegate.resize();
        });
    }
    var findUser = function(array,_id){
        var u = undefined;
        var idx = 0;
        array.some(function(user){
            if(user._id == _id){
                u = user;
                u.idx = idx;
                return true;
            }
            else{
                idx++;
                return false;
            }
        });
        return u;
    }
    var initTotalTime = function(user){
        if(user && user.history){
            var totalTime = 0;
            user.history.forEach(function(elem){
                totalTime += Number(elem.elapsed);
            });
            user.totalTime = totalTime;
        }
    }   
    var initUserHistory = function(user){
        var deferred = $q.defer();
        if(user && user._id){
            logService.getRecentUserHistory(user._id,0).then(function(activities){
                $timeout(function(){
                    user.history = activities.slice(0);
                    initTotalTime(user); 
                },0);
                deferred.resolve();
            }).catch(function(err){
                console.log('systemMonitor: initUserHistory - logService err: ',err);
                deferred.reject()
            });
            return deferred.promise;
        }else
            deferred.resolve();
        return deferred.promise;
    }
    var updateUserHistory = function(message){
        var user = findUser($scope.users,message.user._id);
        if(user != undefined){
            if(user.history == undefined){
                initUserHistory(user).then(function(){
                    if(message)
                        $timeout(function(){
                            user.history.unshift(message);
                        },0);
                }).catch(function(err){
                    console.log('systemMonitor: updateUserHistory - logService err: ',err);
                });
            } else {
                $timeout(function(){
                    user.history.unshift(message);
                    user.totalTime += Number(message.elapsed);
                },0);
            }
        }
    }

    var updateView = function(){
        $ionicScrollDelegate.resize();
    }
    $scope.toggleUserData = function(dayIdx,userIdx){
        if($scope.trends && $scope.trends.byDay && (dayIdx < $scope.trends.byDay.length)){
            var day = $scope.trends.byDay[dayIdx];
            if(day && day.userData && (userIdx < day.userData.length)){
                day.userData[userIdx].show = !day.userData[userIdx].show;
                updateView();
            }
        }
    }
    $scope.showHistory = function($index){
        if(!$scope.users[$index].showHistory)
            $scope.users[$index].showHistory = true;
        else
            $scope.users[$index].showHistory = false;
        updateView();
    }
    //subscribe to updates from the user activity log
    $scope.$on('Revu.Me.Activity',function(event, message){
        console.log('systemMonitor Activity: ',message);
        message.fromState = message.fromState.name;
        message.toState = message.toState.name;
        updateUserHistory(message);
    });
    //subscribe to updates on changes in presence
    $scope.$on("presence_change",function(){
        engageTheMechanism();
    });
    //subscribe to initialization done from app.js
    $scope.$on('Revu.Me:Ready',function(){
        $scope.channel = $rootScope.mainChannel;
        $scope.navButtons.buttons[$scope.navButtons.nowButton].click();
    });
    //re-initialize the view
    $scope.$on('$ionicView.enter',function(){
        if($rootScope.mainChannel){
            $scope.channel = $rootScope.mainChannel;
            $scope.navButtons.buttons[$scope.navButtons.nowButton].click();
        }
    });
    //clean up when we exit
    $scope.$on('$destroy',function(){
        stopPoller();
    });
    //resize the view when it changes
    angular.element($window).on('orientationchange',function(){
        updateView();
    });
    angular.element($window).bind('resize',function(){
        updateView();
    });
  }]);
