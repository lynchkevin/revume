'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
    .directive('timeFormat', ['$filter',function ($filter) {
      return {
        restrict : 'A',
        require: 'ngModel',
        link : function(scope, element, attrs, ngModel){
            scope.el = element[0];
            function validTime(value){
                        var parts = value.split(' ');
                        var hrMn = parts[0].split(':');
                        if((hrMn[0].length != 0) && (hrMn[1].length >1)){
                            var hour = parseInt(hrMn[0]);
                            var min = hrMn[1];
                            var amPm = parts[1];
                            switch(amPm){
                                case 'PM': break;
                                case 'AM': break;
                                default : amPm = 'PM';
                            }
                            if(amPm == 'PM' && hour < 12)
                                hour += 12;                          
                            return {hour:hour.toString(),min:min,amPm:amPm};
                        } else 
                            return null;
            }
            
            function formatTime(value){
                var stripMilli = value.slice(0,value.indexOf('.'));
                var parts = stripMilli.split(':');
                if(parts[0].length>0 && parts[1].length>1){
                    var hr = parseInt(parts[0]);
                    var amPm = (hr>=12) ? 'PM':'AM';
                    if(hr > 12)
                        hr -= 12;
                    var mn = parts[1];
                    if(mn.length <2)
                        mn = '0'+mn;
                    var str = hr.toString()+':'+mn+' '+amPm;
                    return str
                }else
                    return null;
            }
                
            if(scope.el.type != 'time' && ngModel){
                ngModel.$formatters.unshift(function(value){
                    var pure = null;
                    if(value != undefined && value != '')
                        pure = formatTime(value);
                    if(pure)
                        return pure
                    else
                        return value;
                });
                ngModel.$parsers.unshift(function(viewValue){
                    var pure = validTime(viewValue);
                    if(pure != null){
                        var str = pure.hour+':'+pure.min+':00.000';
                        ngModel.$setValidity('time',true);
                        return str;
                    }else{
                        return undefined;
                    }
                });
        

            }
        }

            
    }
      
}])

    .directive('dateFormat',['$parse',function($parse){
      return {
          restrict : 'A',
          require: 'ngModel',
          link : function(scope, element, attrs, ngModel){
                var el = element[0];
                if(el.type != 'date'){
                    ngModel.$formatters.unshift(function(value){
                       var parts = value.split('-');
                       var pure = parts[1]+'/'+parts[2]+'/'+parts[0];
                       return pure;
                    });
                    ngModel.$parsers.unshift(function(viewValue){
                        var parts = viewValue.split('/');
                        var str = parts[2]+'-'+parts[0]+'-'+parts[1];
                        return str;
                    });
                }
    
            }
      }
}]);