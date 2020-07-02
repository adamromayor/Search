# Search
Search Algorithms using Javascript

Main.html
Implements all 3 algorithms.

Top buttons:
Start (x, y) - Click to reset starting point
End (x, y) - Click to reset ending point
Add/Remove Wall - Click to continue adding or removing walls
Random Walls - Generates several random walls
BFS - Breadth First Search
DFS - Depth First Search
Dijkstra's - Dijkstra's Algorithm
Reset - Clears grid



How it works:
Click on the grid to create a start node (green)
Click again to create an end node (red)
Click again to create walls (grey)
* You can add as many walls as you wish
* You cannot generate a wall on the start or end node
* Clicking on an existing wall will remove it

Once done adding walls:
Choose the alorithm you want to run

Program will animate and print the path from start to end.
* DFS is not the shortest path
* BFS and Dijkstra's are both shortest path.

If path is not found, it will indicate it below the grid.
