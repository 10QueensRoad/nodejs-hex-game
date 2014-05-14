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
        'animations': true
    })
    /* Return the range of possible coordinates, based on the current board configuration */
    .factory('coordinatesRange', function(boardConfiguration) {
        return _.range(boardConfiguration.cellsRowWidth);
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
        this.getCellXCoordinate = function(cell) {
            return boardConfiguration.boardLeftMargin +
                (getCellXValue(cell) + getCellYValue(cell)) * boardConfiguration.cellWidth / 2;
        };

        this.getCellYCoordinate = function(cell) {
            return boardConfiguration.boardTopMargin +
                getTopCoordinateOfMiddleCellRow() +
                (getCellYValue(cell) - getCellXValue(cell)) * boardConfiguration.cellHeight * 0.75;
        };

        this.getMiddleYCoordinateOfMiddleCellRow = function() {
            return getTopCoordinateOfMiddleCellRow()
                + boardConfiguration.cellHeight / 2;
        };

        /* Private methods */

        var getCellXValue = function(cell) {
            return cell.x;
        };

        var getCellYValue = function(cell) {
            return cell.y;
        };

        var getTopCoordinateOfMiddleCellRow = function() {
            return (boardConfiguration.cellsRowWidth - 1) * boardConfiguration.cellHeight * 0.75;
        };
    })
    /* Service to build and append D3 elements */
    .service('d3ComponentFactoryService', function(boardConfiguration, d3CoordinatesService, coordinatesRange) {
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
                startTopCoordinate: boardConfiguration.boardTopMargin +
                    d3CoordinatesService.getMiddleYCoordinateOfMiddleCellRow(),
                points: ''};
            return coordinatesRange.reduce(function(result, rangeIteratorValue) {
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
    });
