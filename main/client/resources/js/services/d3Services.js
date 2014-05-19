'use strict';

/**** D3-related angular services ****/

angular.module('hexGame.d3AngularServices', [])
    /* Return the game board configuration */
    .constant('boardConfiguration', {
        'cellsRowWidth': 11,
        'cellWidth': 40, //Should be multiple of 2
        'cellHeight': 40, //Should be multiple of 4
        'boardLeftMargin': 10,
        'boardTopMargin': 10,
        'animations': {
            'pawns': true,
            'boardCells': false, //TODO make this dependent on user agent
            'boardTitle': true,
            'singleElementDelay': 50,
            'longDuration': 1000,
            'shortDuration': 500
        },
        'cellSymbolId' : 'cellSymbol'
    })
    /* Return the static data for the game */
    .factory('gameStaticData', function(boardConfiguration) {
        var coordinatesRange = _.range(boardConfiguration.cellsRowWidth);
        var boardTitle = ['B', 'O', 'M', 'B', 'O', 'R', 'A', 'T', 'E', 'C', 'H'];
        var twoDimRange = _.flatten(
            coordinatesRange.map(function(firstDim) {
                return coordinatesRange.map(function (secondDim) { return [firstDim, secondDim]; });
            }), true);
        var boardCells = _.reduce(twoDimRange, function(cells, coordsPair) {
            cells.push({
                x: coordsPair[0],
                y: coordsPair[1]
            });
            return cells;
        }, []);

        return {
            'coordinatesRange': coordinatesRange,
            'boardTitle': boardTitle,
            'boardCells': boardCells
        }
    })
    /* Wrapper to the D3 singleton */
    .factory('d3Service', function($window) {
        if (!angular.isDefined($window.d3)) {
            throw "D3 library doesn't seem included in page"
        }
        return {d3: $window.d3};
    })
    /* Service to calculate coordinates for D3 elements */
    .service('d3CoordinatesService', function(boardConfiguration) {
        var thisService = this;
        this.getCellXCoordinate = function(cell) {
            return boardConfiguration.boardLeftMargin +
                (thisService.getCellXValue(cell) + thisService.getCellYValue(cell)) * boardConfiguration.cellWidth / 2;
        };

        this.getTopCoordinateOfMiddleCellRow = function() {
            return boardConfiguration.boardTopMargin +
                (boardConfiguration.cellsRowWidth - 1) * boardConfiguration.cellHeight * 0.75;
        };

        this.getCellYCoordinate = function(cell) {
            return thisService.getTopCoordinateOfMiddleCellRow() +
                (thisService.getCellYValue(cell) - thisService.getCellXValue(cell))
                    * boardConfiguration.cellHeight * 0.75;
        };

        this.getMiddleYCoordinateOfMiddleCellRow = function() {
            return thisService.getTopCoordinateOfMiddleCellRow()
                + boardConfiguration.cellHeight / 2;
        };

        this.getBoardTitleLetterXCoordinate = function(d, i) {
            return boardConfiguration.boardLeftMargin +
                (i + 0.5) * boardConfiguration.cellWidth;
        };

        this.getBoardTitleLetterYCoordinate = function() {
            return thisService.getTopCoordinateOfMiddleCellRow() + 0.75 * boardConfiguration.cellHeight;
        };

        this.getBottomOfBottomCellRow = function() {
            return boardConfiguration.boardTopMargin +
                (boardConfiguration.cellsRowWidth * 2 - 1) * boardConfiguration.cellHeight * 0.75
        };

        this.getCellXValue = function(cell) {
            return cell.x;
        };

        this.getCellYValue = function(cell) {
            return cell.y;
        };
    })
    /* Service to build and append D3 elements */
    .service('d3ComponentFactoryService', function(boardConfiguration, gameStaticData, d3CoordinatesService) {
        this.appendCellSymbol = function(svg, cellSymbolId) {
            svg
                .append("symbol")
                    .attr("id", cellSymbolId)
                .append("polygon")
                    .attr("width", boardConfiguration.cellWidth)
                    .attr("height", boardConfiguration.cellHeight)
                    .attr("points", getHexagonPoints())
                    .attr("class", "boardCellSymbol");
        };

        this.appendBorders = function(parentElement) {
            _.forEach([{cssClass: 'boardRedBorder', xDirection: "right", yDirection: "down"}, //left red border
                        {cssClass: 'boardRedBorder', xDirection: "left", yDirection: "up"}, //right red border
                        {cssClass: 'boardBlueBorder', xDirection: "right", yDirection: "up"}, //left blue border
                        {cssClass: 'boardBlueBorder', xDirection: "left", yDirection: "down"}], //right blue border
                function(borderConfig) {
                    return parentElement.append('polyline')
                        .attr('class', 'boardBorder ' + borderConfig.cssClass)
                        .attr('points', getBorderPoints(borderConfig.xDirection, borderConfig.yDirection));
            });
        };

        /* Private methods */

        var getHexagonPoints = function() {
            return _.chain([[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25]])
                .map(function(coordsPair) {
                    return coordsPair[0] * boardConfiguration.cellWidth + "," +
                        coordsPair[1] * boardConfiguration.cellHeight
                })
                .reduce(function(points, point) {return points + (points.length > 0 ? ' ' : '') + point;}, "");
        };

        var getBorderPoints = function(xDirection, yDirection) {
            var result = {
                startLeftCoordinate: boardConfiguration.boardLeftMargin +
                    (xDirection == "left" ? boardConfiguration.cellsRowWidth * boardConfiguration.cellWidth : 0),
                startTopCoordinate: d3CoordinatesService.getMiddleYCoordinateOfMiddleCellRow(),
                points: ''};
            return gameStaticData.coordinatesRange.reduce(function(result, rangeIteratorValue) {
                var middlePointYCoordinate = (result.startTopCoordinate + (yDirection == "down" ? 1 : -1) *
                    boardConfiguration.cellHeight * (rangeIteratorValue == 0 ? 0.25 : 0.5));
                var endPointXCoordinate = (result.startLeftCoordinate + (xDirection == "right" ? 1 : -1) *
                    boardConfiguration.cellWidth / 2);
                var endPointYCoordinate = (middlePointYCoordinate + (yDirection == "down" ? 1 : -1) *
                    boardConfiguration.cellHeight / 4);
                result.points += (result.points.length > 0 ? ' ' : '')
                    + result.startLeftCoordinate + ',' + result.startTopCoordinate
                    + ' ' + result.startLeftCoordinate + ',' + middlePointYCoordinate
                    + ' ' + endPointXCoordinate + ',' + endPointYCoordinate;
                result.startLeftCoordinate = endPointXCoordinate;
                result.startTopCoordinate = endPointYCoordinate;
                return result;
            }, result).points;
        };
    })
    /* Service to build and append D3 elements */
    .service('d3TransitionsService', function(boardConfiguration, d3CoordinatesService) {
        this.fadeInAndMoveDown = function(d3Element, animate, delayFn) {
            if (animate) {
                return d3Element
                    .attr('xlink:href', '#' + boardConfiguration.cellSymbolId)
                    .attr('x', d3CoordinatesService.getCellXCoordinate)
                    .attr('y', function(d) { return d.color == 'red' ? 0 : d3CoordinatesService.getBottomOfBottomCellRow() })
                    .attr('opacity', 0)
                    .transition()
                    .attr('y', d3CoordinatesService.getCellYCoordinate)
                    .attr('opacity', 1)
                    .duration(boardConfiguration.animations.longDuration)
                    .delay(delayFn);
            } else {
                return d3Element
                    .attr('xlink:href', '#' + boardConfiguration.cellSymbolId)
                    .attr('x', d3CoordinatesService.getCellXCoordinate)
                    .attr('y', d3CoordinatesService.getCellYCoordinate);
            }
        };
        this.fadeOutMoveUpAndRemove = function(d3Element, animate, delayFn) {
            if (animate) {
                return d3Element
                    .transition()
                    .attr('y', function(d) { return d.color == 'red' ? 0 : d3CoordinatesService.getBottomOfBottomCellRow() })
                    .attr('opacity', 0)
                    .duration(boardConfiguration.animations.longDuration)
                    .delay(delayFn)
                    .each("end", function () {
                        d3.select(this).remove();
                    });
            } else {
                return d3Element.remove();
            }
        };
        this.fadeIn = function(d3Element, animate, delayFn) {
            if (animate) {
                return d3Element
                    .attr('opacity', 0)
                    .transition()
                    .attr('opacity', 1)
                    .duration(boardConfiguration.animations.boardCells ? boardConfiguration.animations.shortDuration :
                        boardConfiguration.animations.longDuration)
                    .delay(delayFn);
            } else {
                return d3Element;
            }
        };
        this.fadeOut = function(d3Element, animate, delayFn) {
            if (animate) {
                return d3Element
                    .attr('opacity', 1)
                    .transition()
                    .attr('opacity', 0)
                    .duration(boardConfiguration.animations.shortDuration)
                    .delay(delayFn)
                    .each("end", function () {
                        d3.select(this).remove();
                    });
            } else {
                return d3Element;
            }
        };
        this.boardCellsAnimationTotalDuration = function() {
            return boardConfiguration.animations.boardCells ?
                2 * (boardConfiguration.cellsRowWidth + 1) * boardConfiguration.animations.singleElementDelay
                + boardConfiguration.animations.longDuration : 0;
        };
    });
