var startPoint = null;
var endPoint = null;
var cursorPoint = null;

//array of component objects
var walls;


//coordinate objects
var startCoords = null;
var endCoords = null;

//array of coordinate objects
var pathCoords;
var wallCoords;
var visited;

//STATES
const START = 0;
const RESET_GRID = -1;
const SET_END = 1;
const SET_WALLS = 2;
const RESET_START = 3;
const RESET_END = 4;
const BFS_SEARCH = 5;
const DFS_SEARCH = 6;
const DA_SEARCH = 7;
const PATH_FOUND = 8;
const PATH_NOT_FOUND = 9;

class Coordinate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
};

class DistanceCoordinate {
    constructor(x, y, dist) {
        this.x = x;
        this.y = y;
        this.dist = dist;
        this.path = new Array();
    }
};



function testPath() {

    for (let i = 0; i < 20; i++) {
        pathCoords.push(new Coordinate(5, i));
    }

    for (let i = 0; i < 20; i++) {
        pathCoords.push(new Coordinate(i, 7));
    }
    Grid.printPath(pathCoords);
}

function startGrid() {
    cursorPoint = new component(Grid.cellSize / 2, Grid.cellSize / 2, 150, 150, 150, 0, 250);
    walls = new Array();
    wallCoords = new Array();
    pathCoords = new Array();
    visited = new Array();
    Grid.start();
}

var Grid = {
    canvas: document.createElement("canvas"),
    cellSize: 25,
    state: START,
    autoFlag: 0,
    searchType: 0,
    start: function () {
        this.canvas.width = 1125;
        this.canvas.height = 800;
        this.context = this.canvas.getContext("2d");
        this.canvas.style.cursor = "none";
        document.getElementById("grid").appendChild(this.canvas);
        this.interval = setInterval(updateGrid, 20);
        window.addEventListener('mousemove', function (e) {
            Grid.x = e.pageX - 263;
            Grid.y = e.pageY - 406;
        });
        this.canvas.addEventListener('click', function (e) {
            Grid.sx = e.pageX - 263;
            Grid.sy = e.pageY - 406;
        });
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawGrid: function () {

        document.getElementById("grid");
        let b = 220;
        let r = 220;
        let g = 220;

        var color = `rgb(${r},${g},${b})`;
        this.context.fillStyle = color;

        for (let i = 0; i < this.canvas.width; i += this.cellSize) {
            for (let j = 0; j < this.canvas.height; j += this.cellSize) {
                this.context.fillRect(i, j, this.cellSize - 1, this.cellSize - 1); //-1 to form gridlines (only fills 24 pixels instead of 25)
            }
        }
    },
    reset: function () {
        this.clear();
        this.state = -1;
        Grid.sx = null;
        //document.getElementById("path").innerHTML = "";
        walls = [];
        pathCoords = [];
        wallCoords = [];
        document.getElementById("start").innerHTML = "Start: (x, y)";
        document.getElementById("end").innerHTML = "End: (x, y)";
        document.getElementById("auto").innerHTML = "Auto Search";
        document.getElementById("path").innerHTML = "";
    },
    resetState: function (x) {

        if (Grid.state < 2) return;

        Grid.state = x;
        if (x === 3) {
            document.getElementById("start").innerHTML = "Start: (x, y)";
        } else if (x === 4) {
            document.getElementById("end").innerHTML = "End: (x, y)";
        }
        document.getElementById("path").innerHTML = "";
        //state 5 is BFS
        //state 6 is DFS
    },
    printPath: function (path) { //path is array of coordinate objects
        document.getElementById("grid");

        let b = 0;
        let r = 0;
        let g = 128;
        var color = `rgb(${r},${g},${b})`;
        this.context.fillStyle = color;

        for (let i = 0; i < path.length; i++) {
            if (b < 200) b += (200 / path.length);

            color = `rgb(${r},${g},${b})`;
            this.context.fillStyle = color;
            this.context.fillRect(path[i].x * this.cellSize, path[i].y * this.cellSize, this.cellSize - 1, this.cellSize - 1);
        }

    },
    autoFind: function (x) { //x = 0 is BFS x = 1 is DFS

        this.searchType = x;

        if (this.autoFlag === 1) {
            this.autoFlag = 0;
            document.getElementById("auto").innerHTML = "Auto Search On";
        }
        else {
            this.autoFlag = 1;
            document.getElementById("auto").innerHTML = "Auto Search Off";
        }
    }
}


function component(width, height, r, g, b, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.r = r;
    this.g = g;
    this.b = b;
    this.update = function () {
        ctx = Grid.context;
        ctx.fillStyle = `rgb(${this.r},${this.g},${this.b})`;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function generateWalls() {


    //will not update if same as starting or ending coordinate
    for (let i = 0; i < Grid.canvas.width / Grid.cellSize; i++) {

        let xcoord = Math.floor((Math.random() * Grid.canvas.width / Grid.cellSize));
        let ycoord = Math.floor((Math.random() * Grid.canvas.height / Grid.cellSize));

        if (startPoint.x == xcoord * Grid.cellSize && startPoint.y == ycoord * Grid.cellSize ||
            endPoint.x == xcoord * Grid.cellSize && endPoint.y == ycoord * Grid.cellSize) {
            Grid.sx = null;
            i--;
        }
        else {
            let coord = new Coordinate(xcoord, ycoord);

            if (!inList(coord, walls)) {

                walls.push(new component(Grid.cellSize - 1, Grid.cellSize - 1, 120, 120, 120, xcoord * Grid.cellSize, ycoord * Grid.cellSize));
                wallCoords.push(new Coordinate(xcoord, ycoord));

            }
            else {
                i--; //if wall exists will run an additional iteration, so total walls still = n
            }

        }
    }
    Grid.sx = null;
    Grid.resetState(2);
}


function findBFS(startingPoint, endingPoint, barriers) {

    let myPath = new Array();
    let Path = new Array();
    let newPath = new Array();
    visited = new Array();

    let maxX = Grid.canvas.width / Grid.cellSize;
    let maxY = Grid.canvas.height / Grid.cellSize;

    if (startingPoint == null || endingPoint == null) return false;

    if (equalCoords(startingPoint, endingPoint)) return true;

    myPath.push(startingPoint); //array of Coordinates
    Path.push(myPath); //queue of arrays

    visited.push(startingPoint);

    while (Path.length > 0) {

        myPath = Path.shift();

        //checks if last vertex in path is the Ending Point
        let v = myPath[myPath.length - 1];
        if (equalCoords(v, endingPoint)) {

            pathCoords = myPath.slice();
            return true;
        }


        if (v.x - 1 >= 0) //move left
        {
            let coord = new Coordinate(v.x - 1, v.y);

            //will only add to path if point is not visited and there is not a barrier
            if (!inList(coord, visited) && !inList(coord, barriers)) {

                newPath = new Array();
                newPath = myPath.slice();
                newPath.push(coord);
                Path.push(newPath);
                visited.push(coord);

                //only prints if Automatic Search is off
                /*
                if (Grid.autoFlag === 0) {
                    Grid.printPath(newPath);
                }
                */
            }
        }

        //   document.getElementById("path").innerHTML = "v.x + 1 is " + (v.x + 1) + " and maxX is " + maxX;
        if (v.x + 1 < maxX) //move right
        {
            let coord = new Coordinate(v.x + 1, v.y);

            //will only add to path if point is not visited and there is not a barrier
            if (!inList(coord, visited) && !inList(coord, barriers)) {
                newPath = new Array();
                newPath = myPath.slice();
                newPath.push(coord);
                Path.push(newPath);
                visited.push(coord);

                //only prints if Automatic Search is off
                /*
                if (Grid.autoFlag === 0) {
                    Grid.printPath(newPath);
                }
                */
            }
        }

        if (v.y - 1 >= 0) //move up
        {
            let coord = new Coordinate(v.x, v.y - 1);

            //will only add to path if point is not visited and there is not a barrier
            if (!inList(coord, visited) && !inList(coord, barriers)) {
                newPath = new Array();
                newPath = myPath.slice();
                newPath.push(coord);
                Path.push(newPath);
                visited.push(coord);

                //only prints if Automatic Search is off
                /*
                if (Grid.autoFlag === 0) {
                    Grid.printPath(newPath);
                }
                */
            }
        }

        if (v.y + 1 < maxY) //move down
        {
            let coord = new Coordinate(v.x, v.y + 1);

            //will only add to path if point is not visited and there is not a barrier
            if (!inList(coord, visited) && !inList(coord, barriers)) {
                newPath = new Array();
                newPath = myPath.slice();
                newPath.push(coord);
                Path.push(newPath);
                visited.push(coord);

                //only prints if Automatic Search is off
                /*
                if (Grid.autoFlag === 0) {
                    Grid.printPath(newPath);
                }
                */
            }
        }

    }

    return false;
}


function findDFS(startingPoint, endingPoint, barriers) {

    let Path = new Array();
    visited = new Array();

    let maxX = Grid.canvas.width / Grid.cellSize;
    let maxY = Grid.canvas.height / Grid.cellSize;



    if (startingPoint == null || endingPoint == null) return false;

    if (equalCoords(startingPoint, endingPoint)) return true;

    //Pushes starting coordinate onto stack
    visited.push(startingPoint);
    Path.push(startingPoint);

    //document.getElementById("test").innerHTML = "I am not in loop";

    let count = 0;

    while (Path.length > 0) {


        let row = Path[Path.length - 1].x;
        let col = Path[Path.length - 1].y;

        //Left
        if (row - 1 >= 0) {
            let coord = new Coordinate(row - 1, col)
            //if coordinate is not visited already
            if (!inList(coord, visited) && !inList(coord, barriers)) {

                //Push onto stack and mark as visited
                Path.push(coord);
                visited.push(coord);

                if (equalCoords(coord, endingPoint)) {
                    pathCoords = Path.slice();
                    return true;
                }
                else {
                    if (Grid.autoFlag == 0) {
                        //  Grid.printPath(Path);
                    }
                }
                //will continue if not in list and not visited
                continue;
            }
        }

        //RIGHT
        if (row + 1 < maxX) {
            let coord = new Coordinate(row + 1, col)
            //if coordinate is not visited already
            if (!inList(coord, visited) && !inList(coord, barriers)) {

                //Push onto stack and mark as visited
                Path.push(coord);
                visited.push(coord);

                if (equalCoords(coord, endingPoint)) {
                    pathCoords = Path.slice();
                    return true;
                }
                else {
                    if (Grid.autoFlag == 0) {
                        //    Grid.printPath(Path);
                    }
                }
                //will continue if not in list and not visited
                continue;
            }
        }

        //UP
        if (col - 1 >= 0) {
            let coord = new Coordinate(row, col - 1)
            //if coordinate is not visited already
            if (!inList(coord, visited) && !inList(coord, barriers)) {

                //Push onto stack and mark as visited
                Path.push(coord);
                visited.push(coord);

                if (equalCoords(coord, endingPoint)) {
                    pathCoords = Path.slice();
                    return true;
                }
                else {
                    if (Grid.autoFlag == 0) {
                        //      Grid.printPath(Path);
                    }
                }
                //will continue if not in list and not visited
                continue;
            }
        }
        //DOWN
        if (col + 1 < maxY) {
            let coord = new Coordinate(row, col + 1)
            //if coordinate is not visited already
            if (!inList(coord, visited) && !inList(coord, barriers)) {

                //Push onto stack and mark as visited
                Path.push(coord);
                visited.push(coord);

                if (equalCoords(coord, endingPoint)) {
                    pathCoords = Path.slice();
                    return true;
                }
                else {
                    if (Grid.autoFlag == 0) {
                        //     Grid.printPath(Path);
                    }
                }
                //will continue if not in list and not visited
                continue;
            }
        }
        Path.pop();
    }

    //Could not find path
    return false;



}

function findDA(startingPoint, endingPoint, barriers) {

    var dist = new Array();
    var q = new Array();
    let maxX = Grid.canvas.width / Grid.cellSize;
    let maxY = Grid.canvas.height / Grid.cellSize;
    let v = new DistanceCoordinate();

    if (startingPoint == null || endingPoint == null) return false;

    if (equalCoords(startingPoint, endingPoint)) return true;


    //initiaize distance array
    for (let i = 0; i < maxX; i++) {
        for (let j = 0; j < maxY; j++) {

            let coord = new Coordinate(i, j);


            if (equalCoords(coord, startingPoint)) { //source node has distance of zero
                dist.push(new DistanceCoordinate(i, j, 0));
                q.push(coord);
            }
            //walls aren't included in distance array
            else {
                dist.push(new DistanceCoordinate(i, j, Number.MAX_SAFE_INTEGER)); //every other node has distance of infinity
                q.push(coord);
            }
        }
    }


    while (q.length > 0) {

        v = findMin(q, dist);

        //returns -1 when v can't be found in list
        if (deleteFromList(v, q) === -1) { //deletes vertex from q
            return false;
        }



        let x = v.x;
        let y = v.y;
        let d = v.dist;
        let v_index = indexOf(v, dist);


        if (d === 0) {
            let coord = new Coordinate(x, y);
            dist[v_index].path.push(coord);
            // document.getElementById("test").innerHTML = "Pushed coordinate onto path";
        }

        //For each neighbor of V
        //Left
        if (x - 1 >= 0) {
            let coord = new Coordinate(x - 1, y);
            let alt = d + 1;
            let index = v_index - maxY;
            //   let index = indexOf(coord, dist);
            if (alt < dist[index].dist) {
                if (!inList(coord, barriers)) {
                    dist[index].dist = alt;
                    //saves path to coordinate
                    //path from source until previous node + new node
                    dist[index].path = dist[v_index].path.slice();
                    dist[index].path.push(coord);
                }
            }

        }

        //Up
        if (y - 1 >= 0) {
            let coord = new Coordinate(x, y - 1);
            let alt = d + 1;
            let index = v_index - 1;
            //  let index = indexOf(coord, dist);
            if (alt < dist[index].dist) {
                if (!inList(coord, barriers)) {
                    dist[index].dist = alt;
                    //saves path to coordinate
                    //path from source until previous node + new node
                    dist[index].path = dist[v_index].path.slice();
                    dist[index].path.push(coord);
                }
            }
        }


        //Right
        if (x + 1 < maxX) {
            let coord = new Coordinate(x + 1, y);
            let alt = d + 1;
            let index = v_index + maxY;
            //let index = indexOf(coord, dist);
            if (alt < dist[index].dist) {
                if (!inList(coord, barriers)) {
                    dist[index].dist = alt;
                    //saves path to coordinate
                    //path from source until previous node + new node
                    dist[index].path = dist[v_index].path.slice();
                    dist[index].path.push(coord);
                }
            }
        }



        //Down
        if (y + 1 < maxY) {
            let coord = new Coordinate(x, y + 1);

            let alt = d + 1;
            let index = v_index + 1;
            //let index = indexOf(coord, dist);
            if (alt < dist[index].dist) {
                if (!inList(coord, barriers)) {
                    dist[index].dist = alt;
                    //saves path to coordinate
                    //path from source until previos node + new node
                    dist[index].path = dist[v_index].path.slice();
                    dist[index].path.push(coord);
                }
            }
        }
    }

    let index = indexOf(endingPoint, dist);

    if (dist[index].dist < Number.MAX_SAFE_INTEGER) {
        pathCoords = dist[index].path.slice();
        return true;
    }

    return false;

}

//List has List.x and List.y
//Deletes node in list and returns

function deleteFromList(node, List) {

    for (let i = 0; i < List.length; i++) {

        //   s += " (" + List[i].x +", " + List[i].y +")";

        if ((node.x === List[i].x) && (node.y === List[i].y)) {
            List.splice(i, 1);
            return 0;
        }
    }
    return -1;
}

//find index of distance coordinate in Distance array
function indexOf(coord, dArray) {

    for (let i = 0; i < dArray.length; i++) {
        if (coord.x == dArray[i].x && coord.y == dArray[i].y) {
            return i;
        }
    }

    return -1;
}


//finds vertex with minimum distance from source
//returns that coordinate
//only returns if coordinate is still in q
function findMin(q, distanceArray) {

    let dCoord = new DistanceCoordinate(-1, -1, Number.MAX_SAFE_INTEGER);
    let min = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < distanceArray.length; i++) {

        let coord = new Coordinate(distanceArray[i].x, distanceArray[i].y);

        if (distanceArray[i].dist <= min) {
            if (inList(coord, q)) {
                min = distanceArray[i].dist;
                dCoord.x = distanceArray[i].x;
                dCoord.y = distanceArray[i].y;
                dCoord.dist = distanceArray[i].dist;
            }
        }

    }

    if (dCoord.x == -1) return false;

    return dCoord;
}

function equalCoords(a, b) {
    if (a == null || b == null) return false;

    if (a.x == b.x && a.y == b.y) {
        return true;
    }

    return false;
}

function inList(coord, List) {
    if (coord == null || List == null) return false;

    for (let i = 0; i < List.length; i++) {
        if (coord.x == List[i].x &&
            coord.y == List[i].y) {
            return true;
        }
    }
    return false;
}



function updateGrid() {

    Grid.clear();
    Grid.drawGrid();

    //Set's location of cursor
    if (Grid.x && Grid.y) {
        cursorPoint.x = Grid.x;
        cursorPoint.y = Grid.y;
    }

    //Set Starting Point and Coordinates
    if (Grid.sx && Grid.sy && Grid.state === START) {
        startPoint = new component(Grid.cellSize - 1, Grid.cellSize - 1, 0, 255, 0, 0, 0);
        startPoint.x = Grid.sx - (Grid.sx % Grid.cellSize);
        startPoint.y = Grid.sy - (Grid.sy % Grid.cellSize);
        startCoords = new Coordinate(startPoint.x / Grid.cellSize, startPoint.y / Grid.cellSize);
        document.getElementById("start").innerHTML = "Start: (" + startCoords.x + ", " + startCoords.y + ")";
        Grid.sx = null;
        Grid.state = 1;
    }

    //Set Ending Point and Coordinates
    else if (Grid.sx && Grid.sy && Grid.state === SET_END) {

        endPoint = new component(Grid.cellSize - 1, Grid.cellSize - 1, 255, 0, 0, 0, 0);
        endPoint.x = Grid.sx - (Grid.sx % Grid.cellSize);
        endPoint.y = Grid.sy - (Grid.sy % Grid.cellSize);

        //will not update if same as starting coordinate
        if (startPoint.x == endPoint.x && startPoint.y == endPoint.y) {
            Grid.sx = null;
        }
        else {
            let coord = new Coordinate(endPoint.x, endPoint.y);
            if (inList(coord, walls)) {
                Grid.sx = null;
            }
            else {
                endCoords = new Coordinate(endPoint.x / Grid.cellSize, endPoint.y / Grid.cellSize);
                document.getElementById("end").innerHTML = "End: (" + endCoords.x + ", " + endCoords.y + ")";
                Grid.sx = null;
                Grid.state = 2;
            }
        }
    }

    //Set Wall Points and Coordinates (Updates arrays)
    else if (Grid.sx && Grid.sy && Grid.state === SET_WALLS) {
        let xcoord = Grid.sx - (Grid.sx % Grid.cellSize);
        let ycoord = Grid.sy - (Grid.sy % Grid.cellSize);

        //will not update if same as starting or ending coordinate
        if (startPoint.x == xcoord && startPoint.y == ycoord ||
            endPoint.x == xcoord && endPoint.y == ycoord) {
            Grid.sx = null;
        }
        else {
            let coord = new Coordinate(xcoord, ycoord);

            //deletes wall, if user clicks on that existing wall
            if (inList(coord, walls)) {
                for (let i = 0; i < walls.length; i++) {

                    if (walls[i].x == xcoord && walls[i].y == ycoord) {
                        walls.splice(i, 1);
                        break;
                    }

                }

                for (let i = 0; i < wallCoords.length; i++) {
                    if (wallCoords[i].x == (xcoord / Grid.cellSize) &&
                        wallCoords[i].y == (ycoord / Grid.cellSize)) {
                        wallCoords.splice(i, 1);
                        break;
                    }
                }
            }
            else {
                walls.push(new component(Grid.cellSize - 1, Grid.cellSize - 1, 120, 120, 120, xcoord, ycoord));
                wallCoords.push(new Coordinate(xcoord / Grid.cellSize, ycoord / Grid.cellSize));


            }
            Grid.sx = null;
        }
    }

    //Resets Starting Point and Coordinate
    else if (Grid.sx && Grid.sy && Grid.state === RESET_START) {

        if (startPoint == null) {
            startPoint = new component(Grid.cellSize - 1, Grid.cellSize - 1, 0, 255, 0, 0, 0);
        }
        else {
            startPoint.r = 0;
            startPoint.g = 255;
            startPoint.b = 0;
        }
        startPoint.x = Grid.sx - (Grid.sx % Grid.cellSize);
        startPoint.y = Grid.sy - (Grid.sy % Grid.cellSize);


        if (startCoords == null) {
            startCoords = new Coordinate(startPoint.x / Grid.cellSize, startPoint.y / Grid.cellSize);
            document.getElementById("start").innerHTML = "Start: (" + startCoords.x + ", " + startCoords.y + ")";
            Grid.sx = null;
            Grid.state = SET_WALLS; //updated start coord
        }
        else {
            startCoords.x = startPoint.x / Grid.cellSize;
            startCoords.y = startPoint.y / Grid.cellSize;
            if (startCoords.x == endCoords.x && startCoords.y == endCoords.y) {
                startPoint = null;
                startCoords = null; //resets starting Coords
                Grid.sx = null;
            }
            else {
                document.getElementById("start").innerHTML = "Start: (" + startCoords.x + ", " + startCoords.y + ")";
                Grid.sx = null;
                Grid.state = SET_WALLS; //updated start coord
            }
        }
    }
    //Resets Ending Point and Coordinate
    else if (Grid.sx && Grid.sy && Grid.state === RESET_END) {

        if (endPoint == null) {
            endPoint = new component(Grid.cellSize - 1, Grid.cellSize - 1, 255, 0, 0, 0, 0);
        }
        else {
            endPoint.r = 255;
            endPoint.g = 0;
            endPoint.b = 0;
        }

        endPoint.x = Grid.sx - (Grid.sx % Grid.cellSize);
        endPoint.y = Grid.sy - (Grid.sy % Grid.cellSize);

        if (endCoords == null) {
            endCoords = new Coordinate(endPoint.x / Grid.cellSize, endPoint.y / Grid.cellSize);
            document.getElementById("end").innerHTML = "End: (" + endCoords.x + ", " + endCoords.y + ")";
            Grid.sx = null;
            Grid.state = SET_WALLS; //updated end coord
        }
        else {
            endCoords.x = endPoint.x / Grid.cellSize;
            endCoords.y = endPoint.y / Grid.cellSize;

            if (startCoords.x == endCoords.x && startCoords.y == endCoords.y) {
                Grid.sx = null;
                endCoords = null;
            }
            else {
                let coord = new Coordinate(endPoint.x, endPoint.y);
                if (inList(coord, walls)) {
                    Grid.sx = null;
                }
                else {
                    document.getElementById("end").innerHTML = "End: (" + endCoords.x + ", " + endCoords.y + ")";
                    Grid.sx = null;
                    Grid.state = SET_WALLS; //updated end coord
                }
            }
        }
    }

    //Resets color to hide start and end point
    if (Grid.state === RESET_GRID) {

        startPoint = null;
        endPoint = null;
        startCoords = null;
        endCoords = null;
        Grid.state = START;
    }

    //Hides starting coordinate if it's reset
    if (Grid.state === RESET_START && startPoint != null) {
        startPoint.r = 220;
        startPoint.g = 220;
        startPoint.b = 220;
    }

    //Hides ending coordinate if it's reset
    if (Grid.state === RESET_END && endPoint != null) {
        endPoint.r = 220;
        endPoint.g = 220;
        endPoint.b = 220;
    }

    //Call BFS
    if (Grid.state === BFS_SEARCH) {

        Grid.sx = null;

        if (findBFS(startCoords, endCoords, wallCoords)) {
            Grid.state = PATH_FOUND;//path found
        } else {
            Grid.state = PATH_NOT_FOUND; //path not found
        }
    }

    //Call DFS
    if (Grid.state === DFS_SEARCH) {
        Grid.sx = null;
        if (findDFS(startCoords, endCoords, wallCoords)) {
            Grid.state = PATH_FOUND;
        } else {
            Grid.state = PATH_NOT_FOUND;
        }
    }

    //Dijkstra's Algorithm
    if (Grid.state === DA_SEARCH) {

        Grid.sx = null;
        if (findDA(startCoords, endCoords, wallCoords)) {
            Grid.state = PATH_FOUND;
        } else {
            Grid.state = PATH_NOT_FOUND;
        }

    }

    //Print Path after search algorithm was called
    if (Grid.state === PATH_FOUND) {
        Grid.sx = null;
        Grid.printPath(pathCoords);
        document.getElementById("path").innerHTML = "<span class =\"badge badge-pill badge-info\">Path Found</span>";
    }

    //Path Not Found
    if (Grid.state === PATH_NOT_FOUND) {
        Grid.sx = null;
        document.getElementById("path").innerHTML = "<span class =\"badge badge-pill badge-info\">Path Not Found</span>";
    }



    //Prints ending point and walls
    if (Grid.state > SET_END) {

        //Prints The Correct Search Type

        if (Grid.autoFlag === 1) {
            if (Grid.searchType === 0) {
                if (findBFS(startCoords, endCoords, wallCoords)
                    && Grid.state != RESET_START && Grid.state != RESET_END) {
                    Grid.sx = null;
                    Grid.printPath(pathCoords);
                }
            }
            else if (Grid.searchType === 1) {
                if (findDFS(startCoords, endCoords, wallCoords)
                    && Grid.state != RESET_START && Grid.state != RESET_END) {
                    Grid.sx = null;
                    Grid.printPath(pathCoords);
                }
            }
            else if (Grid.searchType === 2) {
                if (findDA(startCoords, endCoords, wallCoords)
                    && Grid.state != RESET_START && Grid.state != RESET_END) {
                    Grid.sx = null;
                    Grid.printPath(pathCoords);
                }
            }
        }


        //prints wall;
        for (let i = 0; i < walls.length; i++) {
            walls[i].update();
        }

        //won't print endPoint if it is reset
        if (Grid.state != RESET_END) {
            endPoint.update();
        }
    }

    //Prints starting point
    //Won't print if it is reset
    if (Grid.state > START && Grid.state != RESET_START) {
        startPoint.update();
    }

    //Prints cursor
    cursorPoint.update();
}

