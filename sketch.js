const trail = 1;
const border = 30;
const steeringCorrection = 1;
var antCount = 150;
var visibility = 50;
const visionAngle = Math.PI / 3;

var home = null;

const foodCentres = 5;
const foodPerCentre = 200;
const foodCount = foodCentres * foodPerCentre;
const foodSpread = 20;
var eatenFood = 0;
const foodRange = 5;
const ants = [];
const food = new Set();

const width = 400;
const height = 400;

const graphHeight = 100;
var graph = null;

var seeCoverage = false;
var hungry = true;
const showGraph = true;
var showVision = false;

const buttons = [];

const pheromones = new Set();
const maxPheromones = 300;

const obstacles = [];
const obstacleCount = 3;
var obstaclesPresent = false;

var gridSize = 15;
const toFoodGrid = [];
const toHomeGrid = [];

function preload() {
  // collectSound = loadSound("assets/collect.mp3");
  // returnSound = loadSound("assets/return.mp3");
}

function setup() {
  createCanvas(width + 1.5 * graphHeight, height + graphHeight);
  fill(223, 243, 228);

  home = new Home();

  // let importantLocations = new Set();
  // importantLocations.add(home.location);

  for (let i = 0; i < antCount; i++) {
    ants.push(new Ant(home.location.x, home.location.y));
  }

  for (let j = 0; j < foodCentres; j++) {
    let x = Math.random() * (width - 2 * border) + border;
    let y = Math.random() * (height - 2 * border) + border;
    let centre = new p5.Vector(x, y);

    for (let k = 0; k < foodPerCentre; k++) {
      food.add(new Food(centre));
    }
  }

  graph = new Graph();

  for (let k = 0; k < foodCentres; k++) {
    let x = Math.random() * (width - 2 * border) + border;
    let y = Math.random() * (height - 2 * border) + border;
    let w = (Math.random() * width) / 5 + 10;
    let h = (Math.random() * height) / 5 + 10;
    obstacles.push(new Obstacle(x, y, w, h));
  }

  for (let row = 0; row < height / gridSize; row++) {
    toFoodGrid.push([]);
    toHomeGrid.push([]);
    for (let col = 0; col < width / gridSize; col++) {
      toFoodGrid[row].push(0);
      toHomeGrid[row].push(0);
    }
  }

  smooth();
  rectMode(CENTER);
  frameRate(24);

  createButtons();
}

function draw() {
  noStroke();

  if (!seeCoverage) {
    background(108, 75, 94);
    fill(223, 243, 228);
    rectMode(CORNERS);
    rect(0, 0, width, height);
  }

  if (obstaclesPresent) {
    obstacles.forEach((obstacle) => {
      obstacle.display();
    });
  }

  updateGrids();
  displayGrids();

  pheromones.forEach((pheromone) => {
    pheromone.update();
    pheromone.display();
  });

  text(int(getFrameRate()), width + 10, height + 10);

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

function drawHexagon(x, y, r) {
  beginShape();
  for (let a = 0; a < TAU; a += TAU / 6) {
    vertex(x + r * sin(a), y + r * cos(a));
  }
  endShape(CLOSE);
}

function updateGrids() {
  for (let row = 0; row < height / gridSize; row++) {
    for (let col = 0; col < width / gridSize; col++) {
      toFoodGrid[row][col] = Math.max(toFoodGrid[row][col] - 1.5, 0);
      toHomeGrid[row][col] = Math.max(toHomeGrid[row][col] - 1.5, 0);
    }
  }
}

function axial_round(x, y) {
  const xgrid = Math.round(x),
    ygrid = Math.round(y);
  (x -= xgrid), (y -= ygrid); // remainder
  const dx = Math.round(x + 0.5 * y) * (x * x >= y * y);
  const dy = Math.round(y + 0.5 * x) * (x * x < y * y);
  return [xgrid + dx, ygrid + dy];
}

function cartesianToHex(x, y) {
  var q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / gridSize;
  var r = ((2 / 3) * y) / gridSize;
  return axial_round(q, r);
}

function displayGrids() {
  count = 0;
  for (x = gridSize; x < width - gridSize; x += gridSize / 2.3) {
    for (y = gridSize; y < height - gridSize; y += gridSize * 1.5) {
      let qr = cartesianToHex(x, y);
      let q = qr[0];
      let r = qr[1];
      let toFood = toFoodGrid[r][q + Math.round(r / 2)];
      let toHome = toHomeGrid[r][q + Math.round(r / 2)];
      // if (toFood > toHome) {
      //   fill(92, 128, 1, toFood);
      // } else {
      //   fill(255, 147, 79, toHome);
      // }
      fill(250, 102, 241, toFood);
      drawHexagon(x, y + gridSize * (count % 2 == 0) * 0.75, gridSize / 2);
      fill(57, 143, 249, toHome);
      drawHexagon(x, y + gridSize * (count % 2 == 0) * 0.75, gridSize / 2);
    }
    count++;
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
    this.strength -= 0.02;
    if (this.strength <= 0.02) {
      pheromones.delete(this);
    }
  }

  display() {
    if (this.toFood) {
      fill("rgba(92, 128, 1," + this.strength + ")");
    } else {
      fill("rgba(255, 147, 79," + this.strength + ")");
    }
    ellipse(this.position.x, this.position.y, 3);
  }
}

class Home {
  constructor() {
    //let x = Math.random() * (width - 2 * border) + border;
    //let y = Math.random() * (height - 2 * border) + border;
    this.location = new p5.Vector(300, 300);
    this.foodCollected = 0;
  }

  display() {
    fill(89, 149, 237);
    ellipse(this.location.x, this.location.y, 50);
    fill(0, 0, 0);
    textFont("Arial Black");
    text(this.foodCollected, this.location.x - 4, this.location.y + 4);
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
      this.frameValues.push((graphHeight * eatenFood) / foodCount);
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
  constructor(centre) {
    let directionFromCentre = p5.Vector.random2D();
    let vectorFromCentre = directionFromCentre.setMag(
      Math.random() * foodSpread
    );
    let centrePosition = centre.copy();
    this.position = centrePosition.add(vectorFromCentre);
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
      fill(232, 126, 161);
      ellipse(this.position.x, this.position.y, 5);
    }
  }

  eat() {
    this.eaten = true;
    eatenFood++;
    food.delete(this);
    // collectSound.play();
  }
}
class Ant {
  constructor(x, y) {
    this.deltaTime = 1;

    this.maxSpeed = 3;
    this.steerStrength = 0.5;
    this.wanderStrength = 0.2;

    this.angle = 0;
    this.position = new p5.Vector(x, y);
    this.velocity = new p5.Vector(0, 0);
    this.desiredDirection = p5.Vector.random2D().normalize();

    this.mPosition = [];
    this.mAngle = [];

    this.targetFood = -1;
    this.goingHome = false;
    this.pheromoneCounter = maxPheromones;
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
      0,
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
      this.turnAround();
    }
    if (pos.x > width - border) {
      this.position.x = width - border;
      this.turnAround();
    }
    if (pos.y < border) {
      this.position.y = border;
      this.turnAround();
    }
    if (pos.y > height - border) {
      this.position.y = height - border;
      this.turnAround();
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
    if (home.location.dist(this.position) < visibility) {
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

  getAngleToPheromone(pheromone) {
    let location = new p5.Vector(pheromone.position.x, pheromone.position.y);
    let pheromoneDirection = location.sub(this.position);
    return this.velocity.angleBetween(pheromoneDirection);
  }

  findStrongestDirection(q, r, visibleNeighbours) {
    let left;
    let centre;
    let right;
    if (this.goingHome) {
      left =
        toHomeGrid[r + visibleNeighbours[0][1]][q + visibleNeighbours[0][0]];
      centre =
        toHomeGrid[r + visibleNeighbours[1][1]][q + visibleNeighbours[1][0]];
      right =
        toHomeGrid[r + visibleNeighbours[2][1]][q + visibleNeighbours[2][0]];
    } else {
      left =
        toFoodGrid[r + visibleNeighbours[0][1]][q + visibleNeighbours[0][0]];
      centre =
        toFoodGrid[r + visibleNeighbours[1][1]][q + visibleNeighbours[1][0]];
      right =
        toFoodGrid[r + visibleNeighbours[2][1]][q + visibleNeighbours[2][0]];
    }

    if (left > centre && left > right) {
      return -1;
    } else if (centre >= right) {
      return 0;
    } else {
      return 1;
    }
  }

  sensePheromones() {
    // even rows
    let evenNeighbours = [
      [+1, -1],
      [+1, 0],
      [+1, +1],
      [0, +1],
      [-1, 0],
      [0, -1],
    ];
    // odd rows
    let oddNeighbours = [
      [0, -1],
      [+1, 0],
      [0, +1],
      [-1, +1],
      [-1, 0],
      [-1, -1],
    ];

    let curr = cartesianToHex(this.position.x, this.position.y);
    let q = curr[0];
    let r = curr[1];
    let direction = Math.round((this.angle * 6) / (2 * PI));

    let neighbours = [];
    if (r % 2 == 0) {
      neighbours = evenNeighbours;
    } else {
      neighbours = oddNeighbours;
    }

    let visibleNeighbours = [
      neighbours[(direction + 5) % 6],
      neighbours[(direction + 6) % 6],
      neighbours[(direction + 7) % 6],
    ];

    let strongestDirection = this.findStrongestDirection(
      q + Math.round(r / 2),
      r,
      visibleNeighbours
    );
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
    this.velocity = this.velocity
      .add(acceleration.mult(this.deltaTime))
      .limit(this.maxSpeed);

    this.position = this.position.add(this.velocity.mult(this.deltaTime));
    this.position = new p5.Vector(
      (this.position.x + width) % width,
      (this.position.y + height) % height
    );

    this.angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
  }

  releasePheromone() {
    if (this.pheromoneCounter > 0) {
      // pheromones.add(new Pheromone(this.goingHome, this.position.copy(), 1));
      let qr = cartesianToHex(this.position.x, this.position.y);
      let q = qr[0];
      let r = qr[1];
      if (this.goingHome) {
        toFoodGrid[r][q + Math.floor(r / 2)] = Math.min(
          toFoodGrid[r][q + Math.floor(r / 2)] + 4,
          125
        );
      } else {
        toHomeGrid[r][q + Math.floor(r / 2)] = Math.min(
          toHomeGrid[r][q + Math.floor(r / 2)] + 4,
          125
        );
      }
      this.pheromoneCounter--;
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
      this.turnAround();
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
      this.sensePheromones();
      if (this.goingHome) {
        this.findHome();
      } else {
        this.beHungry();
      }
    }
    if (obstaclesPresent) {
      this.checkObstacles();
    }

    let acceleration = this.getAcceleration();
    this.keepInsideBox();
    this.updatePosition(acceleration);
    this.releasePheromone();
  }
}

function createButtons() {
  let buttonNames = [
    "show vision",
    "toggle obstacles",
    "see coverage",
    "be hungry",
    "add ant",
    "remove ant",
    "increase visibility",
    "decrease visibility",
  ];
  let buttonFunctions = [
    toggleShowVision,
    toggleObstacles,
    toggleSeeCoverage,
    toggleBeHungry,
    addAnt,
    removeAnt,
    increaseVisibility,
    decreaseVisibility,
  ];
  for (let i = 0; i < buttonNames.length; i++) {
    let buttonName = buttonNames[i];
    let button = createButton(buttonName);
    button.position(width, (height / buttonNames.length) * i);
    button.mousePressed(buttonFunctions[i]);
    buttons.push(i);
  }
}

function toggleShowVision() {
  showVision = !showVision;
}

function toggleObstacles() {
  obstaclesPresent = !obstaclesPresent;
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
  visibility -= 10;
}
