'use strict';

/**
* date-picker directive to interface with Jquery Plugin   
*/

angular.module('RevuMe')
    .directive('vBackgroundImage', function () {
        return function (scope, element, attrs) {
            element.css({
                'width': '100%',
                'height':'100%',
                'background-image': 'url(' + attrs.vBackgroundImage + ')',
                'background-size': 'cover',
                'background-repeat': 'no-repeat'
            });
        };
    });
