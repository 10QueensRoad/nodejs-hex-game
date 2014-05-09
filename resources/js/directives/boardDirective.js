'use strict';

/**** Board directive ****/

angular.module('hexGame.directives.boardDirective', [])
    /* Directive: boardDirective
     * Goal: Creates the main board graphics
     * Usage: <board-directive />
     * Dependencies:
     *  - d3Service: to access the d3 library object
     * Description: Creates the main board with D3
     */
    .directive('boardDirective', function($window, d3Service, d3ComponentFactoryService, d3CoordinatesService) {
        return {
            restrict: 'E',
            template: '<div class="boardDiv"></div>',
            replace: true,
            link: function(scope, element, attrs) {
                var d3 = d3Service.d3;
                var cellSymbolId = 'cellSymbol', cellWidth = 30, cellHeight = 30;
                var svg = d3.select(element[0])
                    .append('svg')
                        .style('width', '100%')
                        .style('height', '100%');

                //Append cell symbol, for re-use
                d3ComponentFactoryService.appendCellSymbol(svg, cellSymbolId);

                //Append SVG group
                var cellsGroup = svg.append("g").attr("id", "cellsGroup");
                var pawnsGroup = svg.append("g").attr("id", "pawnsGroup");
                var bordersGroup = svg.append("g").attr("id", "bordersGroup");

                //Add board cells
                cellsGroup.selectAll(".boardCell")
                    .data(scope.cells)
                    .enter()
                        .append('use')
                            .attr('xlink:href', '#' + cellSymbolId)
                            .attr('x', d3CoordinatesService.getCellXCoordinate)
                            .attr('y', d3CoordinatesService.getCellYCoordinate)
                            .attr('class', 'boardCell')
                            .on('click', function(d) {
                                scope.$apply(function () {
                                    scope.handleBoardClick(d.x, d.y);
                                });
                            });

                //Add border polylines
                d3ComponentFactoryService.appendBorders(bordersGroup);

                var drawPawns = function() {
                    pawnsGroup.selectAll(".pawn")
                        .data(scope.pawns)
                        .enter()
                        .append('use')
                            .attr('xlink:href', '#' + cellSymbolId)
                            .attr('x', d3CoordinatesService.getCellXCoordinate)
                            .attr('y', d3CoordinatesService.getCellYCoordinate)
                            .attr('class', function (d) {
                                return 'pawn ' + d.color + 'Pawn';
                            });
                };

                scope.$watchCollection('pawns', function(newValue) { //TODO: Can't d3 watch the data itself?
                    if (angular.isArray(newValue) && newValue.length > 0) {
                        drawPawns();
                    }
                });
            }
        }
    });