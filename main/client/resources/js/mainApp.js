'use strict';

/* App level Angular module
 * Requires: ioServices.js, boardDirective.js, controllers.js
 */
angular.module('hexGame', [
                                'hexGame.d3AngularServices',
                                'hexGame.directives.boardDirective',
                                'hexGame.controllers']);
