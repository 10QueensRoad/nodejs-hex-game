'use strict';

/* App level Angular module
 * Requires: commonServices.js, boardDirective.js, controllers.js
 */
angular.module('hexGame', ['hexGame.commonAngularServices',
                                'hexGame.d3AngularServices',
                                'hexGame.directives.boardDirective',
                                'hexGame.controllers']);