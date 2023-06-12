const trail = 1;
const border = 30;
const steeringCorrection = 1;
var antCount = 200;
const deltaTime = 1;

const visionAngle = Math.PI / 3;

var home = null;

const foodCentres = 5;
const avgfoodPerCentre = 200;
var foodCount = 0;
const avgfoodSpread = 3.5;
var eatenFood = 0;
const foodRange = 5;
var ants;
var food;

const width = 800;
const height = 700;

const graphHeight = 100;
var graph = null;

let toHomePheromones;
let toFoodPheromones;
var pheromones;
const maxPheromones = 300;

var obstacles;
const obstacleCount = 3;
var noObstacles;

var currFrames = 0;

const noTerrain = 0;
const verySlowTerrain = 1;
const slowTerrain = 2;
const normalTerrain = 3;
const fastTerrain = 4;
const veryFastTerrain = 5;
const terrainSpeeds = [0, 0.3, 0.65, 1, 1.3, 1.65];
const terrainColours = [
  "rgb(0,0,0)",
  "rgb(251, 216, 127)",
  "rgb(193, 226, 146)",
  "rgb(130, 236, 166)",
  "rgb(76, 245, 183)",
  "rgb(16, 255, 203)",
];

// const heightColours = [
//   [71, 111, 0],
//   [174, 251, 42],
// ];

const heightColours = [
  [221, 255, 217],
  [244, 192, 149],
];

const seedCount = 30;
var seeds;
const cellSize = 10;
var terrainGrid = new Array(Math.ceil(width / cellSize))
  .fill()
  .map(() => new Array(Math.ceil(height / cellSize)).fill(0));
var terrainWidth;
var terrainHeight;

var heightGrid = new Array(Math.ceil(width / cellSize))
  .fill()
  .map(() => new Array(Math.ceil(height / cellSize)).fill(0));

var heightColoursGrid = new Array(Math.ceil(width / cellSize))
  .fill()
  .map(() => new Array(Math.ceil(height / cellSize)).fill(0));

// GUI Variables
var gui;

var visibility = 100;
var visibilityMin = 0;
var visibilityMax = 200;
var visibilityStep = 10;

var pheromoneDistance = 10;
var pheromoneDistanceMin = 1;
var pheromoneDistanceMax = 100;
var pheromoneDistanceStep = 1;

var brushSize = 4;
var brushSizeMin = 1;
var brushSizeMax = 10;
var brushSizeStep = 1;

var desiredAntCount = 200;
var desiredAntCountMin = 1;
var desiredAntCountMax = 500;
var desiredAntCountStep = 1;

var pheromoneDecay = -4.5;
var pheromoneDecayMin = -6;
var pheromoneDecayMax = -2;
var pheromoneDecayStep = 0.1;

var seeCoverage = false;
var hungry = true;
var showGraph = true;
var showVision = false;
var drawingStatus = [
  noTerrain,
  verySlowTerrain,
  slowTerrain,
  normalTerrain,
  fastTerrain,
  veryFastTerrain,
];

var useHeights = true;
var terrainAffectsPheromones = true;

function preload() {
  // collectSound = loadSound("assets/collect.mp3");
  // returnSound = loadSound("assets/return.mp3");
}

function setup() {
  var canvas = createCanvas(width + 2 * graphHeight, height + graphHeight);
  fill(223, 243, 228);

  currentTerrain = useHeights;
  terrainWidth = terrainGrid.length;
  terrainHeight = terrainGrid[0].length;
  seeds = generateSeeds();
  generateHeights();
  generateTerrain();

  home = new Home();
  noStroke();

  toHomePheromones = new QuadTree(
    new Boundary(width / 2, height / 2, width, height),
    5
  );
  toFoodPheromones = new QuadTree(
    new Boundary(width / 2, height / 2, width, height),
    5
  );

  ants = [];
  for (let i = 0; i < antCount; i++) {
    ants.push(new Ant(home.location.x, home.location.y));
  }

  food = new Set();
  for (let j = 0; j < foodCentres; j++) {
    newFoodCentre();
  }

  graph = new Graph();

  obstacles = [];

  pheromones = new Set();

  smooth();
  rectMode(CENTER);
  frameRate(24);

  gui = createGui("Settings");
  gui.addGlobals(
    "visibility",
    "pheromoneDistance",
    "brushSize",
    "desiredAntCount",
    "pheromoneDecay",
    "hungry",
    "seeCoverage",
    "showVision",
    "showGraph",
    "drawingStatus",
    "useHeights",
    "terrainAffectsPheromones"
  );
}

function generateSeeds() {
  seeds = [];
  for (let i = 0; i < seedCount; i++) {
    let x = Math.round(Math.random() * (width / cellSize));
    let y = Math.round(Math.random() * (height / cellSize));
    terrainGrid[x][y] = 1;
    heightGrid[x][y] = 1;
    seeds.push([x, y]);
  }
  return seeds;
}

function generateHeights() {
  for (let x = 0; x < terrainWidth; x++) {
    for (let y = 0; y < terrainHeight; y++) {
      let distances = [];
      for (let i = 0; i < seedCount / 3; i++) {
        let dx = Math.abs(x - seeds[i][0]);
        let dy = Math.abs(y - seeds[i][1]);
        distances.push(dx * dx + dy * dy);
      }
      distances.sort((a, b) => a - b);
      let distance = distances[0];
      let scaledDistance = 1 - distance / 300;
      if (scaledDistance < 0) {
        scaledDistance = 0;
      }
      scaledDistance = Math.pow(scaledDistance, 2);
      heightGrid[x][y] = scaledDistance;
      heightColoursGrid[x][y] = getHeightColour(heightGrid[x][y]);
    }
  }
}

function generateTerrain() {
  for (let x = 0; x < terrainWidth; x++) {
    for (let y = 0; y < terrainHeight; y++) {
      let distances = [];
      for (let i = 0; i < seedCount; i++) {
        let dx = Math.abs(x - seeds[i][0]);
        let dy = Math.abs(y - seeds[i][1]);
        distances.push(dx * dx + dy * dy);
      }
      distances.sort((a, b) => a - b);
      let distance = distances[0];
      if (distance < 20) {
        terrainGrid[x][y] = veryFastTerrain;
      } else if (distance < 60) {
        terrainGrid[x][y] = fastTerrain;
      } else if (distance < 100) {
        terrainGrid[x][y] = normalTerrain;
      } else if (distance < 150) {
        terrainGrid[x][y] = slowTerrain;
      } else {
        terrainGrid[x][y] = verySlowTerrain;
      }
    }
  }
}

function newFoodCentre() {
  let n = Math.random() * 2 * avgfoodPerCentre;
  foodCount += n;
  let centre = generateLocation();
  while (centre.dist(home.location) < 150) {
    centre = generateLocation();
  }
  let spread = Math.random() * 2 * avgfoodSpread + 3;
  for (let k = 0; k < n; k++) {
    food.add(new Food(centre, spread));
  }
}

// function mouseClicked() {
//   let x = mouseX;
//   let y = mouseY;
//   if (x < width && y < height) {
//     obstacles.push(new Obstacle(x, y, 40, 40));
//   }
// }

function generateLocation() {
  let x = Math.random() * (width - 2 * border) + border;
  let y = Math.random() * (height - 2 * border) + border;
  return new p5.Vector(x, y);
}

function checkObstacleLocation(noObstacles, proposed) {
  noObstacles.forEach((location) => {
    if (proposed.dist(location) < 100) {
      return false;
    }
  });
  return true;
}

function getTerrainSpeed(x, y) {
  let terrainX = Math.floor(x / cellSize);
  let terrainY = Math.floor(y / cellSize);
  return terrainGrid[terrainX][terrainY];
}

function getTerrainHeight(x, y) {
  let terrainX = Math.floor(x / cellSize);
  let terrainY = Math.floor(y / cellSize);
  return heightGrid[terrainX][terrainY];
}

function draw() {
  if (!seeCoverage) {
    background(108, 75, 94);
    fill(223, 243, 228);
    rectMode(CORNERS);
    rect(0, 0, width, height);
    if (useHeights) {
      drawHeights();
    } else {
      drawTerrain();
    }
  }

  // toFoodPheromones.show();
  // toHomePheromones.show();
  noStroke();

  obstacles.forEach((obstacle) => {
    obstacle.display();
  });

  pheromones.forEach((pheromone) => {
    pheromone.update();
    pheromone.display();
  });

  if (frameCount % 12 == 0) {
    currFrames = int(getFrameRate());
  }
  fill(0);
  text(currFrames, width - 20, height + 20);

  if (desiredAntCount != antCount) {
    while (desiredAntCount > antCount) {
      addAnt();
    }
    while (desiredAntCount < antCount) {
      removeAnt();
    }
  }

  ants.forEach((ant) => {
    ant.update();
    if (seeCoverage) {
      ant.drawAnt();
    } else {
      ant.drawAntWithTrail();
    }
  });

  food.forEach((piece) => {
    piece.display();
  });

  if (showGraph) {
    graph.display();
  }

  home.display();
}

function drawTerrain() {
  rectMode(CORNER);
  for (let i = 0; i < terrainWidth; i++) {
    for (let j = 0; j < terrainHeight; j++) {
      let col = terrainColours[terrainGrid[i][j]];
      fill(col);
      rect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
}

function drawHeights() {
  rectMode(CORNER);
  for (let i = 0; i < terrainWidth; i++) {
    for (let j = 0; j < terrainHeight; j++) {
      let col = heightColoursGrid[i][j];
      fill(col);
      rect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
}

class Obstacle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  display() {
    fill(0);
    rectMode(CENTER);
    rect(this.x, this.y, this.w, this.h);
  }

  contains(ant) {
    let nextPos = new p5.Vector(ant.position.x, ant.position.y);
    nextPos.add(new p5.Vector(ant.velocity.x, ant.velocity.y));
    return (
      nextPos.x > this.x - this.w &&
      nextPos.x < this.x + this.w &&
      nextPos.y > this.y - this.h &&
      nextPos.y < this.y + this.h
    );
  }
}

class Pheromone {
  constructor(toFood, position, strength) {
    this.toFood = toFood;
    this.position = position;
    this.strength = strength;
  }

  update() {
    this.strength -= Math.exp(pheromoneDecay);
    if (this.strength <= 2 * Math.exp(pheromoneDecay)) {
      if (this.toFood) {
        toFoodPheromones.remove(this.position.copy());
      } else {
        toHomePheromones.remove(this.position.copy());
      }
      pheromones.delete(this);
    }
  }

  display() {
    if (this.toFood) {
      fill("rgba(250, 102, 241," + this.strength + ")");
    } else {
      fill("rgba(57, 143, 249," + this.strength + ")");
    }
    ellipse(this.position.x, this.position.y, 3);
  }
}

class Home {
  constructor() {
    let x = Math.random() * (width - 2 * border) + border;
    let y = Math.random() * (height - 2 * border) + border;
    this.location = new p5.Vector(x, y);
    this.foodCollected = 0;
  }

  display() {
    noStroke();
    fill(89, 149, 237);
    ellipse(this.location.x, this.location.y, 50);
    fill(0, 0, 0);
    textFont("Arial Black");
    text(this.foodCollected, this.location.x - 8, this.location.y + 4);
  }

  receiveFood() {
    this.foodCollected++;
    // returnSound.play();
  }
}

class Graph {
  constructor() {
    this.frameValues = [];
  }

  displayBar(x1, y1, x2, y2) {
    // fill(108, 75, 94);
    // rect(x1, y2, x2, height);
    fill(232, 126, 161);
    rect(x1, y1, x2, y2);
  }

  display() {
    rectMode(CORNERS);

    let graphWidth = min(width, frameCount);
    if (frameCount % 5 == 0) {
      this.frameValues.push((eatenFood * graphHeight) / foodCount);
    }
    for (let frame = 0; frame <= graphWidth; frame++) {
      this.displayBar(
        frame - 1,
        height + graphHeight,
        frame,
        height + graphHeight - this.frameValues[frame]
      );
    }
  }
}

class Food {
  constructor(centre, spread) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * spread;
    let z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) * spread;

    let vectorFromCentre = new p5.Vector(z1, z2);
    this.position = centre.add(vectorFromCentre);
    this.keepFoodInBounds(centre, vectorFromCentre);

    this.eaten = false;
  }

  keepFoodInBounds(centre, vectorFromCentre) {
    let x = this.position.x;
    let y = this.position.y;

    let dx = vectorFromCentre.x;
    let dy = vectorFromCentre.y;

    if (x < border || x > width - border) {
      dx = -dx;
    }
    if (y < border || y > height - border) {
      dy = -dy;
    }
    this.position = new p5.Vector(centre.x + dx, centre.y + dy);
  }

  display() {
    if (!this.eaten) {
      noStroke();
      fill(232, 126, 161);
      ellipse(this.position.x, this.position.y, 5);
    }
  }

  eat() {
    this.eaten = true;
    eatenFood++;
    food.delete(this);
    // collectSound.play();

    if (eatenFood % avgfoodPerCentre == 0) {
      newFoodCentre();
    }
  }
}
class Ant {
  constructor(x, y) {
    this.maxSpeed = 3;
    this.steerStrength = 0.5;
    this.wanderStrength = 0.35;

    this.angle = 0;
    this.position = new p5.Vector(x, y);
    this.velocity = new p5.Vector(0, 0);
    this.desiredDirection = p5.Vector.random2D().normalize();

    this.mPosition = [];
    this.mAngle = [];

    this.targetFood = -1;
    this.goingHome = false;
    this.pheromoneCounter = maxPheromones;
    this.distanceSinceLastPheromone = 0;

    this.terrain = normalTerrain;
  }

  display() {
    rectMode(CENTER);
    rect(0, 0, 5, 10);
  }

  drawAnt() {
    if (this.goingHome) {
      fill(90, 87, 102);
    } else {
      fill(4, 67, 137);
    }
    noStroke();
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle);
    this.display();
    pop();
  }

  drawHeldFood() {
    fill(232, 126, 161);
    ellipse(0, -7, 5);
  }

  drawAntWithTrail() {
    let frame = frameCount % trail;
    this.mPosition[frame] = this.position;
    this.mAngle[frame] = this.angle;

    for (let i = 0; i < trail; i++) {
      let alpha = Math.pow((i + 1) / trail, 2);
      if (this.goingHome) {
        fill("rgba(90, 87, 102," + alpha + ")");
      } else {
        fill("rgba(4, 67, 137," + alpha + ")");
      }

      let index = (frame + 1 + i) % trail;
      if (this.mPosition[index] != null) {
        push();
        translate(this.mPosition[index].x, this.mPosition[index].y);
        rotate(this.mAngle[index]);
        this.display();
        if (i == trail - 1) {
          if (hungry) {
            if (showVision) {
              //this.drawVisibilityArc();
              this.drawVisionCone();
            }
            if (this.goingHome) {
              this.drawHeldFood();
            }
          }
        }
        pop();
      }
    }
  }

  drawVisionCone() {
    fill("rgba(235, 179, 169,0.5)");
    arc(
      0,
      -5,
      visibility,
      visibility,
      -visionAngle / 2 - Math.PI / 2,
      visionAngle / 2 - Math.PI / 2,
      PIE
    );
  }

  drawVisibilityArc() {
    fill("rgba(235, 179, 169,0.15)");
    arc(
      0,
      0,
      visibility,
      visibility,
      visionAngle / 2 - Math.PI / 2,
      -visionAngle / 2 - Math.PI / 2,
      PIE
    );
  }

  keepInsideBox() {
    let pos = this.position;

    if (pos.x < border) {
      this.position.x = border;
      this.quarterTurn();
    }
    if (pos.x > width - border) {
      this.position.x = width - border;
      this.quarterTurn();
    }
    if (pos.y < border) {
      this.position.y = border;
      this.quarterTurn();
    }
    if (pos.y > height - border) {
      this.position.y = height - border;
      this.quarterTurn();
    }
  }

  wander() {
    this.desiredDirection = p5.Vector.random2D()
      .mult(this.wanderStrength)
      .add(this.desiredDirection)
      .normalize();
  }

  findCloseFood() {
    let closeFood = [];
    food.forEach((piece) => {
      if (this.position.dist(piece.position) < visibility) {
        closeFood.push(piece);
      }
    });
    return closeFood;
  }

  pickClosestPiece(closeFood) {
    let closestPiece = closeFood[0];
    let minDistance = this.position.dist(closestPiece.position);
    food.forEach((piece) => {
      if (this.position.dist(piece.position) < minDistance) {
        closestPiece = piece;
        minDistance = this.position.dist(closestPiece.position);
      }
    });
    return closestPiece;
  }

  getAngleToPiece(piece) {
    let location = new p5.Vector(piece.position.x, piece.position.y);
    let foodDirection = location.sub(this.position);
    return Math.abs(this.velocity.angleBetween(foodDirection));
  }

  findHome() {
    if (home.location.dist(this.position) < visibility * 1.5) {
      let target = home.location.copy();
      this.desiredDirection = target.sub(this.position).normalize();
      if (home.location.dist(this.position) < foodRange) {
        home.receiveFood();
        this.goingHome = false;
        this.pheromoneCounter = maxPheromones;
        this.targetFood = -1;
      }
    }
  }

  beHungry() {
    if (this.targetFood === -1) {
      let closeFood = this.findCloseFood();
      if (closeFood.length > 0) {
        let chosenPiece = this.pickClosestPiece(closeFood);
        let angleFromVelocity = this.getAngleToPiece(chosenPiece);
        if (angleFromVelocity < visionAngle) {
          this.targetFood = chosenPiece;
        }
      }
    } else {
      if (food.has(this.targetFood)) {
        let target = this.targetFood.position.copy();
        this.desiredDirection = target.sub(this.position).normalize();
        if (this.targetFood.position.dist(this.position) < foodRange) {
          this.targetFood.eat();
          this.targetFood = -1;
          this.goingHome = true;
          this.pheromoneCounter = maxPheromones;
          this.turnAround();
        }
      } else {
        this.targetFood = -1;
      }
    }
  }

  turnAround() {
    this.desiredDirection = new p5.Vector(-this.velocity.x, -this.velocity.y);
  }

  findClosePheromones(goingHome) {
    let insideSquare;
    let squareBoundary = new Boundary(
      this.position.x,
      this.position.y,
      visibility * 0.6,
      visibility * 0.6
    );
    // squareBoundary.show();
    if (goingHome) {
      insideSquare = toHomePheromones.query(squareBoundary);
    } else {
      insideSquare = toFoodPheromones.query(squareBoundary);
    }
    return insideSquare.filter(
      (pheromone) =>
        this.position.dist(new p5.Vector(pheromone[0], pheromone[1])) <
        visibility
    );
  }

  getAngleToPheromone(pheromone) {
    let location = new p5.Vector(pheromone[0], pheromone[1]);
    let pheromoneDirection = location.sub(this.position);
    return this.velocity.angleBetween(pheromoneDirection);
  }

  findStrongestDirection(closePheromones) {
    let left = 0;
    let centre = 0;
    let right = 0;
    closePheromones.forEach((pheromone) => {
      let pheromoneValue = 1;
      if (terrainAffectsPheromones) {
        if (!useHeights) {
          pheromoneValue = getTerrainSpeed(pheromone[0], pheromone[1]);
        } else {
          pheromoneValue += 1 / getTerrainHeight(pheromone[0], pheromone[1]);
        }
      }
      let angle = this.getAngleToPheromone(pheromone);
      if (angle > -visionAngle && angle <= -visionAngle / 3) {
        left += pheromoneValue;
      } else if (angle > -visionAngle / 3 && angle <= visionAngle / 3) {
        centre += pheromoneValue;
      } else if (angle > visionAngle / 3 && angle < visionAngle) {
        right += pheromoneValue;
      }
    });
    print(left, right, centre);
    if (left > centre && left > right) {
      return -1;
    } else if (right >= centre) {
      return 1;
    } else {
      return 0;
    }
  }

  sensePheromones() {
    let closePheromones = this.findClosePheromones(this.goingHome);
    if (closePheromones.length == 0) {
      return;
    }

    let strongestDirection = this.findStrongestDirection(closePheromones);
    if (strongestDirection == -1) {
      this.desiredDirection.rotate((-2 * visionAngle) / 3);
    } else if (strongestDirection == 1) {
      this.desiredDirection.rotate((2 * visionAngle) / 3);
    }
  }

  getAcceleration() {
    let desiredDirectionCopy = this.desiredDirection.copy();
    let desiredVelocity = desiredDirectionCopy.mult(this.maxSpeed);
    let desiredSteeringForce = desiredVelocity
      .sub(this.velocity)
      .mult(this.steerStrength);
    return desiredSteeringForce.limit(this.steerStrength);
  }

  updatePosition(acceleration) {
    this.terrainSpeed =
      terrainSpeeds[
        terrainGrid[Math.floor(this.position.x / cellSize)][
          Math.floor(this.position.y / cellSize)
        ]
      ];
    this.velocity = this.velocity
      .add(acceleration.mult(deltaTime))
      .limit(this.maxSpeed);

    let step = this.velocity.copy().mult(deltaTime);

    if (useHeights) {
      let predictedPosition = this.predictNewPosition(step);
      let heightDifference = this.getHeightDifference(predictedPosition);
      let gradientFactor = this.getGradientFactor(heightDifference);
      step.mult(gradientFactor);
    } else {
      step.mult(this.terrainSpeed);
    }

    this.distanceSinceLastPheromone += step.mag();

    this.position = this.position.add(step);
    this.position = new p5.Vector(this.position.x, this.position.y);

    this.angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
  }

  predictNewPosition(step) {
    return this.position.copy().add(step.copy());
  }

  getHeightDifference(predictedPosition) {
    return (
      getTerrainHeight(predictedPosition.x, predictedPosition.y) -
      getTerrainHeight(this.position.x, this.position.y)
    );
  }

  getGradientFactor(heightDifference) {
    if (heightDifference > 0) {
      return 0.7;
    } else if (heightDifference < 0) {
      return 1.3;
    } else {
      return 1;
    }
  }

  releasePheromone() {
    if (this.distanceSinceLastPheromone > pheromoneDistance) {
      if (this.goingHome) {
        toFoodPheromones.insert(this.position.copy());
      } else {
        toHomePheromones.insert(this.position.copy());
      }

      pheromones.add(new Pheromone(this.goingHome, this.position.copy(), 1));
      this.pheromoneCounter--;
      this.distanceSinceLastPheromone = 0;
    }
  }

  quarterTurn() {
    this.desiredDirection = p5.Vector.rotate(this.velocity.copy(), HALF_PI);
  }

  keepOutisdeObstacle(obstacle) {
    let leftEdge = obstacle.x - obstacle.w / 2;
    let rightEdge = obstacle.x + obstacle.w / 2;
    let topEdge = obstacle.y - obstacle.h / 2;
    let bottomEdge = obstacle.y + obstacle.h / 2;

    let xInisde = this.position.x > leftEdge && this.position.x < rightEdge;
    let yInside = this.position.y > topEdge && this.position.y < bottomEdge;

    let repel = 4;

    if (yInside) {
      if (this.position.x < leftEdge) {
        this.position.x -= repel;
      } else if (this.position.x > rightEdge) {
        this.position.x += repel;
      }
    } else if (xInisde) {
      if (this.position.y < topEdge) {
        this.position.y -= repel;
      } else if (this.position.y > bottomEdge) {
        this.position.y += repel;
      }
      this.quarterTurn();
    }
  }

  checkObstacles() {
    obstacles.forEach((obstacle) => {
      if (obstacle.contains(this)) {
        this.keepOutisdeObstacle(obstacle);
      }
    });
  }

  update() {
    this.wander();
    if (hungry) {
      if (Math.random() < 0.5) {
        this.sensePheromones();
      }
      if (this.goingHome) {
        this.findHome();
      } else {
        this.beHungry();
      }
    }

    let acceleration = this.getAcceleration();
    this.keepInsideBox();
    this.checkObstacles();
    this.updatePosition(acceleration);
    this.releasePheromone();
  }
}

class Boundary {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  show() {
    stroke(0);
    noFill();
    rectMode(CENTER);
    rect(this.x, this.y, this.w * 2, this.h * 2);
  }

  overlaps(range) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }

  contains(pheromone) {
    return (
      pheromone.x >= this.x - this.w &&
      pheromone.x <= this.x + this.w &&
      pheromone.y >= this.y - this.h &&
      pheromone.y <= this.y + this.h
    );
  }
}

class QuadTree {
  constructor(boundary, capacity) {
    this.pheromones = new Set();
    this.capacity = capacity;
    this.subdivided = false;
    this.boundary = boundary;
  }

  show() {
    stroke(108, 75, 94, 10);
    noFill();
    rectMode(CENTER);
    rect(
      this.boundary.x,
      this.boundary.y,
      this.boundary.w * 2,
      this.boundary.h * 2
    );
    if (this.subdivided) {
      this.northWest.show();
      this.northEast.show();
      this.southWest.show();
      this.southEast.show();
    }
  }

  size() {
    if (!this.subdivided) {
      return this.pheromones.size;
    }
    return (
      this.pheromones.size +
      this.northWest.size() +
      this.northEast.size() +
      this.southWest.size() +
      this.southEast.size()
    );
  }

  query(range, found) {
    if (!found) {
      found = [];
    }

    if (!this.boundary.overlaps(range)) {
      return found;
    }

    this.pheromones.forEach((pheromone) => {
      let pheromoneList = pheromone.split(",").map(Number);
      found.push(pheromoneList);
    });

    if (this.subdivided) {
      this.northEast.query(range, found);
      this.northWest.query(range, found);
      this.southEast.query(range, found);
      this.southWest.query(range, found);
    }
    return found;
  }

  contains(point) {
    return this.boundary.contains(point);
  }

  subdivide() {
    this.subdivided = true;

    let [x, y, w, h] = [
      this.boundary.x,
      this.boundary.y,
      this.boundary.w / 2,
      this.boundary.h / 2,
    ];

    let ne = new Boundary(x + w, y - h, w, h);
    this.northEast = new QuadTree(ne, this.capacity);
    let nw = new Boundary(x - w, y - h, w, h);
    this.northWest = new QuadTree(nw, this.capacity);
    let se = new Boundary(x + w, y + h, w, h);
    this.southEast = new QuadTree(se, this.capacity);
    let sw = new Boundary(x - w, y + h, w, h);
    this.southWest = new QuadTree(sw, this.capacity);
  }

  insert(point) {
    if (!this.contains(point)) {
      return false;
    }

    if (this.pheromones.size < this.capacity) {
      this.pheromones.add(String(point.x) + "," + String(point.y));
      return true;
    } else {
      if (!this.subdivided) {
        this.subdivide();
      }
      return (
        (this.northWest.insert(point) ? true : this.northEast.insert(point))
          ? true
          : this.southEast.insert(point)
      )
        ? true
        : this.southWest.insert(point);
    }
  }

  remove(point) {
    if (!point) {
      return false;
    }
    if (!this.contains(point)) {
      return false;
    }

    if (this.pheromones.has(String(point.x) + "," + String(point.y))) {
      this.pheromones.delete(String(point.x) + "," + String(point.y));
    }

    if (this.subdivided) {
      if (this.size() <= this.capacity) {
        this.subdivided = false;
        let newPheromones = this.query(this.boundary);
        this.pheromones = new Set();
        newPheromones.forEach((pheromone) =>
          this.pheromones.add(String(pheromone[0]) + "," + String(pheromone[1]))
        );
        this.northWest = null;
        this.northEast = null;
        this.southEast = null;
        this.southWest = null;
      } else
        return (
          (this.northWest.remove(point) ? true : this.northEast.remove(point))
            ? true
            : this.southEast.remove(point)
        )
          ? true
          : this.southWest.remove(point);
    }
    return true;
  }
}
function toggleShowVision() {
  showVision = !showVision;
}

function toggleSeeCoverage() {
  seeCoverage = !seeCoverage;
}

function toggleBeHungry() {
  hungry = !hungry;
}

function addAnt() {
  ants.push(new Ant(home.location.x, home.location.y));
  antCount++;
}

function removeAnt() {
  ants.splice(0, 1);
  antCount--;
}

function increaseVisibility() {
  visibility += 10;
}

function decreaseVisibility() {
  visibility = Math.max(0, visibility - 10);
}

function paintNormalTerrain() {
  drawingStatus = normalTerrain;
}

function paintSlowTerrain() {
  drawingStatus = slowTerrain;
}

function paintVerySlowTerrain() {
  drawingStatus = verySlowTerrain;
}

function paintFastTerrain() {
  drawingStatus = fastTerrain;
}

function paintVeryFastTerrain() {
  drawingStatus = veryFastTerrain;
}

function mouseDragged() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }
  if (drawingStatus == 0) {
    return;
  }
  let x = Math.floor(mouseX / cellSize);
  let y = Math.floor(mouseY / cellSize);
  for (let dx = -brushSize; dx <= brushSize; dx++) {
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      if (
        Math.pow(dx, 2) + Math.pow(dy, 2) <= brushSize * brushSize + 1 &&
        x + dx >= 0 &&
        x + dx < width / cellSize &&
        y + dy >= 0 &&
        y + dy < height / cellSize
      ) {
        terrainGrid[x + dx][y + dy] = drawingStatus;
      }
    }
  }
}

function getHeightColour(height) {
  return mixColours(heightColours[0], heightColours[1], height);
}

function mixColours(colour1, colour2, ratio) {
  colour1 = InvertSrgbCompanding(colour1);
  colour2 = InvertSrgbCompanding(colour2);

  let mixedColour = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    mixedColour[i] = colour1[i] * (1 - ratio) + colour2[i] * ratio;
  }

  mixedColour = srgbCompanding(mixedColour);
  return mixedColour;
}

function InvertSrgbCompanding(colour) {
  colour.forEach((value) => {
    value /= 255;
    if (value > 0.04045) {
      value = Math.pow((value + 0.055) / 1.055, 2.4);
    } else {
      value /= 12.92;
    }
    value *= 255;
  });
  return colour;
}

function srgbCompanding(colour) {
  colour.forEach((value) => {
    value /= 255;
    if (value > 0.0031308) {
      value = 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
    } else {
      value *= 12.92;
    }
    value *= 255;
  });
  return colour;
}
