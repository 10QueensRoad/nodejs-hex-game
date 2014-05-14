'use strict';

/**** Board directive ****/

angular.module('hexGame.directives.boardDirective', [])
    /* Directive: boardDirective
     * Goal: Creates the main board graphics
     * Usage: <board-directive />
     * Dependencies:
     *  - boardConfiguration: to get the current board configuration
     *  - d3Service: to access the d3 library object
     *  - d3ComponentFactoryService: to draw the D3 elements
     *  - d3CoordinatesService: to position the D3 elements
     * Description: Creates the main board with D3
     */
    .directive('boardDirective', function(boardConfiguration, d3Service, d3ComponentFactoryService, d3CoordinatesService) {
        return {
            restrict: 'E',
            template: '<div class="boardDiv"></div>',
            replace: true,
            link: function(scope, element) {
                var d3 = d3Service.d3;
                var cellSymbolId = 'cellSymbol';
                var svg = d3.select(element[0])
                    .append('svg')
                        .style('width', '100%')
                        .style('height', '100%');
                var previousPawnsCount = 0;

                //Append cell symbol, for re-use
                d3ComponentFactoryService.appendCellSymbol(svg, cellSymbolId);

                //Append SVG groups
                var cellsGroup = svg.append("g").attr("id", "cellsGroup");
                var pawnsGroup = svg.append("g").attr("id", "pawnsGroup");
                var bordersGroup = svg.append("g").attr("id", "bordersGroup");

                //Add border polylines
                d3ComponentFactoryService.appendBorders(bordersGroup);

                //Draw pawns when needed
                scope.$watchCollection('pawns', function(newValue) { //TODO: Can't d3 watch the data itself?
                    if (angular.isArray(newValue)) {
                        drawPawns();
                    }
                });

                //Draw cells when needed
                scope.$watchCollection('cells', function(newValue) { //TODO: Can't d3 watch the data itself?
                    if (angular.isArray(newValue)) {
                        drawCells();
                    }
                });

                /* Pawns drawing functions */
                var pawnsDelayFunction = function(wayIn) {
                    return function(d, i) {
                        return (wayIn ? (i - previousPawnsCount) : (scope.pawns.length - previousPawnsCount)) * 50;
                    }
                };
                var drawPawns = function() {
                    var pawns = pawnsGroup.selectAll(".pawn")
                        .data(scope.pawns);
                    //Add new pawns
                    fadeInAndMoveDown(pawns
                        .enter()
                        .append('use')
                        .attr('class', function (d) {
                            return 'pawn ' + d.color + 'Pawn';
                        }), pawnsDelayFunction(true));
                    //Remove deleted pawns
                    fadeOutMoveUpAndRemove(pawns.exit(), pawnsDelayFunction(false));
                    previousPawnsCount = scope.pawns.length;
                };

                /* Cells drawing functions */
                var boardCellsDelayFunction = function(wayIn) {
                    return function(d) {
                        return (wayIn ? (d.x + d.y) : (boardConfiguration.cellsRowWidth * 2 - (d.x + d.y))) * 50;
                    };
                };
                var drawCells = function() {
                    var boardCells = cellsGroup.selectAll(".boardCell")
                        .data(scope.cells);
                    //Add new cells
                    fadeInAndMoveDown(boardCells.enter()
                        .append('use')
                        .attr('class', 'boardCell')
                        .on('click', function(d) {
                            scope.$apply(function () {
                                scope.handleBoardClick(d.x, d.y);
                            });
                        }), boardCellsDelayFunction(true));
                    //Remove deleted cells
                    fadeOutMoveUpAndRemove(boardCells.exit(), boardCellsDelayFunction(false));
                };

                /* Transitions functions */
                var fadeInAndMoveDown = function(d3Element, delayFn) {
                    if (boardConfiguration.animations) {
                        d3Element
                            .attr('xlink:href', '#' + cellSymbolId)
                            .attr('x', d3CoordinatesService.getCellXCoordinate)
                            .attr('y', 0)
                            .attr('opacity', 0)
                            .transition()
                            .attr('y', d3CoordinatesService.getCellYCoordinate)
                            .attr('opacity', 1)
                            .duration(1000)
                            .delay(delayFn);
                    } else {
                        d3Element
                            .attr('xlink:href', '#' + cellSymbolId)
                            .attr('x', d3CoordinatesService.getCellXCoordinate)
                            .attr('y', d3CoordinatesService.getCellYCoordinate);
                    }
                };
                var fadeOutMoveUpAndRemove = function(d3Element, delayFn) {
                    if (boardConfiguration.animations) {
                        d3Element
                            .transition()
                            .attr('y', 0)
                            .attr('opacity', 0)
                            .duration(1000)
                            .delay(delayFn)
                            .each("end", function () {
                                d3.select(this).remove();
                            });
                    } else {
                        d3Element.remove();
                    }
                };
            }
        }
    });