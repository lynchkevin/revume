'use strict';

/**
* dynamically resize image to the width of the element  
*/

angular.module('RevuMe')
    .directive('resizeWidth', ['$compile',function ($compile) {
      return {
          restrict : 'A',
          replace : true,
          link : function(scope,element, attrs){
            var el = element[0];
            var width = el.clientWidth;
            var baseUrl = 'https://api.thumbr.io/';
            // modify the source to proxy the resize service
            var src = attrs.resizeWidth;
            var size = width.toString()+'x';
            //var thumbr = thumbrio(src,size,undefined,baseUrl);
            //var resizeUrl = 'src=\"https://ftad3z7hfmbl.firesize.com/'+width.toString()+'/g_none/'+src+'\"';
            var resizeUrl = 'src=\"'+src+'\"';
            // fuck with the html to shove the new src where our directive used to be
            var html = el.outerHTML;
            var directiveText = 'resize-width=';
            var start = el.outerHTML.indexOf('resize-width');
            var end = el.outerHTML.slice(start).indexOf(' ');
            var directiveTextLength = directiveText.length;
            var urlTextLength = src.length;
            var restOfHTML = end+start;
            var newHTML = html.slice(0,start)+resizeUrl+html.slice(restOfHTML);
            var e = $compile(newHTML)(scope);
            element.replaceWith(e);
            
          }
      };
}]);