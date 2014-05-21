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
    .directive('boardDirective', function(boardConfiguration, d3Service, d3ComponentFactoryService, d3CoordinatesService, d3TransitionsService) {
        return {
            restrict: 'E',
            template: '<div class="boardDiv"></div>',
            replace: true,
            link: function(scope, element) {
                var d3 = d3Service.d3;
                var svg = d3.select(element[0])
                    .append('svg')
                        .style('width', d3CoordinatesService.getMaxWidth() + 'px')
                        .style('height', d3CoordinatesService.getMaxHeight() + 'px');
                var previousPawnsCount = 0;

                //Append cell symbol, for re-use
                d3ComponentFactoryService.appendCellSymbol(svg, boardConfiguration.cellSymbolId);

                //Append SVG groups
                var cellsGroup = svg.append("g").attr("id", "cellsGroup");
                var pawnsGroup = svg.append("g").attr("id", "pawnsGroup");
                var bordersGroup = svg.append("g").attr("id", "bordersGroup");
                var boardTitleGroup = svg.append("g").attr("id", "boardTitleGroup");
                var winningPathGroup = svg.append("g").attr("id", "winningPathGroup");

                //Add border polylines
                d3ComponentFactoryService.appendBorders(bordersGroup);

                //Draw pawns whenever needed
                scope.$watchCollection('pawns', function(newValue) { //TODO: Can't d3 watch the data itself?
                    if (angular.isArray(newValue)) {
                        drawPawns();
                    }
                });

                //Draw cells whenever needed
                scope.$watchCollection('cells', function(newValue) { //TODO: Can't d3 watch the data itself?
                    if (angular.isArray(newValue)) {
                        drawCells();
                    }
                });

                //Draw board title whenever needed
                scope.$watchCollection('boardTitle', function(newValue) { //TODO: Can't d3 watch the data itself?
                    if (angular.isArray(newValue)) {
                        drawBoardTitle();
                    }
                });

                //Draw winning path whenever needed
                scope.$watchCollection('winningPath', function(newValue) { //TODO: Can't d3 watch the data itself?
                    if (angular.isArray(newValue)) {
                        drawWinningPath();
                    }
                });

                /* Pawns drawing functions */
                var pawnsDelayFunction = function(wayIn) {
                    return function(d, i) {
                        return (wayIn ? (i - previousPawnsCount) : (scope.pawns.length - previousPawnsCount))
                                * boardConfiguration.animations.singleElementDelay;
                    }
                };
                var drawPawns = function() {
                    var pawns = pawnsGroup.selectAll(".pawn")
                        .data(scope.pawns);
                    //Add new pawns
                    d3TransitionsService.fadeInAndMoveDown(pawns
                        .enter()
                        .append('use')
                        .attr('class', function (d) {
                            return 'pawn ' + d.color + 'Pawn';
                        }),
                        boardConfiguration.animations.pawns,
                        pawnsDelayFunction(true)).ease('bounce');
                    //Remove deleted pawns
                    d3TransitionsService.fadeOutMoveUpAndRemove(pawns.exit(),
                        boardConfiguration.animations.pawns,
                        pawnsDelayFunction(false));
                    previousPawnsCount = scope.pawns.length;
                };

                /* Cells drawing functions */
                var boardCellsDelayFunction = function(wayIn) {
                    return function(d) {
                        return (wayIn ? (d3CoordinatesService.getCellXValue(d) + d3CoordinatesService.getCellYValue(d))
                                    : (boardConfiguration.cellsRowWidth * 2
                                        - (d3CoordinatesService.getCellXValue(d) + d3CoordinatesService.getCellYValue(d))))
                                * boardConfiguration.animations.singleElementDelay;
                    };
                };
                var drawCells = function() {
                    var boardCells = cellsGroup.selectAll(".boardCell")
                        .data(scope.cells);
                    //Add new cells
                    d3TransitionsService.fadeInAndMoveDown(boardCells.enter()
                        .append('use')
                        .attr('class', 'boardCell')
                        .on('click', function(d) {
                            scope.$apply(function () {
                                scope.handleBoardClick(d3CoordinatesService.getCellXValue(d),
                                    d3CoordinatesService.getCellYValue(d));
                            });
                        }),
                        boardConfiguration.animations.boardCells,
                        false,
                        boardCellsDelayFunction(true));
                    //Remove deleted cells
                    d3TransitionsService.fadeOutMoveUpAndRemove(boardCells.exit(),
                        boardConfiguration.animations.boardCells,
                        false,
                        boardCellsDelayFunction(false));
                };

                /* Board title drawing function */
                var drawBoardTitle = function() {
                    var boardTitleLetters = boardTitleGroup.selectAll(".boardTitle")
                        .data(scope.boardTitle);
                    //Add new letters
                    d3TransitionsService.fadeIn(boardTitleLetters.enter()
                        .append('text')
                        .attr('x', d3CoordinatesService.getBoardTitleLetterXCoordinate)
                        .attr('y', d3CoordinatesService.getBoardTitleLetterYCoordinate())
                        .attr('class', 'boardTitle'),
                        boardConfiguration.animations.boardTitle,
                        function() { return d3TransitionsService.boardCellsAnimationTotalDuration(); })
                        .text( function (d) { return d; });
                    //Remove deleted letters
                    d3TransitionsService.fadeOut(boardTitleLetters.exit(),
                        boardConfiguration.animations.boardTitle,
                        function() { return d3TransitionsService.boardCellsAnimationTotalDuration(); });
                };
                
                /* Winning path drawing function */
                var drawWinningPath = function() {
                    var winningTextData = [];
                    var winningText = scope.getWinningSide();
                    if (angular.isDefined(winningText)) {
                        winningText = winningText.charAt(0).toUpperCase() + winningText.slice(1) + " won the game!!!";
                        winningTextData.push(winningText);
                    }
                    var winningPathSegments = winningPathGroup.selectAll(".winningPathSegments")
                        .data(scope.winningPath);
                    var winningMessage = winningPathGroup.selectAll(".winningMessageText")
                        .data(winningTextData);
                    //Add new segments
                    var line = d3.svg.line()
      					.interpolate("linear")
                        .x(d3CoordinatesService.getCellMiddleXCoordinate)
                        .y(d3CoordinatesService.getCellMiddleYCoordinate);
                    d3TransitionsService.animatePath(winningPathSegments.enter()
                        .append('path')
                        .attr("d", line(scope.winningPath))
                        .attr('class', 'winningPath'),
                        boardConfiguration.animations.winningPath,
                        function() { return boardConfiguration.animations.shortDuration; });
                    //Add winning message
                    d3TransitionsService.fadeIn(winningMessage.enter()
                            .append('text')
                            .attr('x', d3CoordinatesService.getWinningMessageXCoordinate())
                            .attr('y', d3CoordinatesService.getWinningMessageYCoordinate())
                            .attr('class', 'winningMessage')
                            .text(function (d) { return d; }),
                        boardConfiguration.animations.winningMessage,
                        function() { return boardConfiguration.animations.veryLongDuration; });
                    //Remove deleted segments
                    d3TransitionsService.fadeOut(winningPathSegments.exit(),
                        boardConfiguration.animations.winningPath,
                        function() { return boardConfiguration.animations.shortDuration; });
                    //Remove winning message
                    d3TransitionsService.fadeOut(winningMessage.exit(),
                        boardConfiguration.animations.winningMessage,
                        function() { return boardConfiguration.animations.shortDuration; });
                };
            }
        }
    });