'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
    .directive('datePicker', [function () {
      return {
          restrict : 'A',
          link : function(scope, element, attrs){
            var el = element[0];
              
            if(el.type != 'fred'){
                var picker = new Pikaday({ field: el , format: 'yyyy-MM-dd'});
                picker._o.onSelect = function(date){
                    var m = (date.getMonth()+1).toString();
                    var d = date.getUTCDate().toString();
                    var y = date.getFullYear().toString();
                    var yyyymmdd = y+'-'+(m[1]?m:'0'+m)+'-'+(d[1]?d:'0'+d);
                    var mmddyyyy = (m[1]?m:'0'+m)+'/'+(d[1]?d:'0'+d)+'/'+y;
                    el.value = mmddyyyy;
                };
            }

            
            }
      }
}]);