'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('starter')
/**
 * @name dragEnter
 * executes `dragEnter` and `dragLeave` events
 */
.directive('dragEnter', ['$timeout', function($timeout) {
    return {
      'scope': false,
      'link': function(scope, element, attrs) {
        var promise;
        var enter = false;
        element.bind('dragover', function (event) {
          if (!isFileDrag(event)) {
            return ;
          }
          if (!enter) {
            scope.$apply(attrs.dragEnter);
            enter = true;
          }
          $timeout.cancel(promise);
          event.preventDefault();
        });
        element.bind('dragleave drop', function (event) {
          $timeout.cancel(promise);
          promise = $timeout(function () {
            scope.$eval(attrs.dragLeave);
            promise = null;
            enter = false;
          }, 100);
        });
        function isFileDrag(dragEvent) {
          var fileDrag = false;
          var dataTransfer = dragEvent.dataTransfer || dragEvent.originalEvent.dataTransfer;
          angular.forEach(dataTransfer && dataTransfer.types, function(val) {
            if (val === 'Files') {
              fileDrag = true;
            }
          });
          return fileDrag;
        }
      }
    };
  }])
.directive('dragDrop', function() {
  return {
    'scope': false,
    'link': function(scope, element, attrs) {
           element.bind('drop', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();

                var files = evt.dataTransfer.files;
                for (var i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader();
                    reader.readAsArrayBuffer(f);

                    reader.onload = (function(theFile) {
                        return function(e) {
                            var newFile = { name : theFile.name,
                                type : theFile.type,
                                size : theFile.size,
                                lastModifiedDate : theFile.lastModifiedDate
                            }

                            scope.addfile(newFile);
                        };
                    })(f);
                }
            });
            element.bind('change',function(event){
                console.log(event);
            });
        }
    }
});