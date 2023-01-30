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

function preload() {
  // collectSound = loadSound("assets/collect.mp3");
  // returnSound = loadSound("assets/return.mp3");
}

function setup() {
  createCanvas(width + 1.5 * graphHeight, height + graphHeight);
  fill(223, 243, 228);

  home = new Home();
  noStroke();

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

  // obstacles.push(new Obstacle(10, 10, 30, 30));
  // obstacles.push(new Obstacle(100, 200, 40, 30));

  smooth();
  rectMode(CENTER);
  frameRate(24);

  createButtons();
}

function createButtons() {
  let buttonNames = [
    "show vision",
    "see coverage",
    "be hungry",
    "add ant",
    "remove ant",
    "increase visibility",
    "decrease visibility",
  ];
  let buttonFunctions = [
    toggleShowVision,
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
    button.position(width, 60 * i);
    button.mousePressed(buttonFunctions[i]);
    buttons.push(i);
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
  visibility -= 10;
}

function draw() {
  if (!seeCoverage) {
    background(108, 75, 94);
    fill(223, 243, 228);
    rectMode(CORNERS);
    rect(0, 0, width, height);
  }

  // obstacles.forEach((obstacle) => {
  //   obstacle.display();
  // });

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
    noStroke();
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

  findClosePheromones(goingHome) {
    let closePheromones = [];
    pheromones.forEach((pheromone) => {
      if (
        this.position.dist(pheromone.position) < 2 * visibility &&
        pheromone.toFood != goingHome
      ) {
        closePheromones.push(pheromone);
      }
    });
    return closePheromones;
  }

  getAngleToPheromone(pheromone) {
    let location = new p5.Vector(pheromone.position.x, pheromone.position.y);
    let pheromoneDirection = location.sub(this.position);
    return this.velocity.angleBetween(pheromoneDirection);
  }

  findStrongestDirection(closePheromones) {
    let left = 0;
    let centre = 0;
    let right = 0;
    closePheromones.forEach((pheromone) => {
      let angle = this.getAngleToPheromone(pheromone);
      if (angle > -visionAngle && angle <= -visionAngle / 3) {
        left += pheromone.strength;
      } else if (angle > -visionAngle / 3 && angle <= visionAngle / 3) {
        centre += pheromone.strength;
      } else if (angle > visionAngle / 3 && angle < visionAngle) {
        right += pheromone.strength;
      }
    });
    if (left > centre && left > right) {
      return -1;
    } else if (centre >= right) {
      return 0;
    } else {
      return 1;
    }
  }

  sensePheromones() {
    let closePheromones = this.findClosePheromones(this.goingHome);
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
    if (frameCount % 3 == 0 && this.pheromoneCounter > 0) {
      pheromones.add(new Pheromone(this.goingHome, this.position.copy(), 1));
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
    this.checkObstacles();

    let acceleration = this.getAcceleration();
    this.keepInsideBox();
    this.updatePosition(acceleration);
    this.releasePheromone();
  }
}
