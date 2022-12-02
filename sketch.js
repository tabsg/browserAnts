const trail = 10;
const border = 30;
const steeringCorrection = 3;
var antCount = 15;
var visibility = 100;
const visionAngle = Math.PI / 3;

var home = null;

const foodCentres = 5;
const foodPerCentre = 50;
const foodCount = foodCentres * foodPerCentre;
const foodSpread = 75;
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

function preload() {
  collectSound = loadSound("assets/collect.mp3");
  returnSound = loadSound("assets/return.mp3");
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
    buttons.push[i];
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
    text(this.foodCollected, this.location.x - 4, this.location.y + 4);
  }

  receiveFood() {
    this.foodCollected++;
    returnSound.play();
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
    this.frameValues.push((graphHeight * eatenFood) / foodCount);
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
    collectSound.play();
  }
}
class Ant {
  constructor(x, y) {
    this.deltaTime = 1;

    this.maxSpeed = 5;
    this.steerStrength = 0.5;
    this.wanderStrength = 0.5;

    this.angle = 0;
    this.position = new p5.Vector(x, y);
    this.velocity = new p5.Vector(0, 0);
    this.desiredDirection = p5.Vector.random2D().normalize();

    this.mPosition = [];
    this.mAngle = [];

    this.targetFood = -1;
    this.goingHome = false;
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
      this.velocity.x += steeringCorrection;
    }
    if (pos.x > width - border) {
      this.position.x = width - border;
      this.velocity.x -= steeringCorrection;
    }
    if (pos.y < border) {
      this.position.y = border;
      this.velocity.y += steeringCorrection;
    }
    if (pos.y > height - border) {
      this.position.y = height - border;
      this.velocity.y -= steeringCorrection;
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
        }
      } else {
        this.targetFood = -1;
      }
    }
  }

  // sensePheromones() {
  //   this.updateSensor(leftSensor);
  //   this.updateSensor(centreSensor);
  //   this.updateSensor(rightSensor);

  //   if (centreSensor.value > Math.max(leftSensor.value, rightSensor.value)) {
  //     this.desiredDirection = this.velocity;
  //   } else if (leftSensor.value > rightSensor.value) {
  //     this.desiredDirection.add();
  //   }
  // }

  getAcceleration() {
    let desiredVelocity = this.desiredDirection.mult(this.maxSpeed);
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

  update() {
    this.wander();
    if (hungry) {
      if (this.goingHome) {
        this.findHome();
      } else {
        this.beHungry();
      }
    }
    let acceleration = this.getAcceleration();
    this.keepInsideBox();
    this.updatePosition(acceleration);
  }
}
