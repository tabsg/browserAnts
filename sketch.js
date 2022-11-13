const trail = 20;
const border = 30;
const steeringCorrection = 3;
const antCount = 3;
const foodCount = 100;
const width = 400;
const height = 400;
const visibility = 100;
const visionAngle = Math.PI / 3;
const foodRange = 5;

const seeCoverage = false;
const hungry = true;

const ants = [];
const food = new Set();

function setup() {
  createCanvas(width, height);
  fill(255, 204);
  noStroke();

  for (let i = 0; i < antCount; i++) {
    ants.push(new Ant(width / 2, height / 2));
  }

  for (let j = 0; j < foodCount; j++) {
    food.add(new Food());
  }

  smooth();
  rectMode(CENTER);
  frameRate(24);
}

function draw() {
  if (!seeCoverage) {
    background(0);
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
}

class Food {
  constructor() {
    let x = Math.random() * (width - 2 * border) + border;
    let y = Math.random() * (height - 2 * border) + border;
    this.position = new p5.Vector(x, y);

    this.eaten = false;
  }

  display() {
    if (!this.eaten) {
      fill(0, 255, 0);
      ellipse(this.position.x, this.position.y, 5);
    }
  }

  eat() {
    this.eaten = true;
    food.delete(this);
  }
}
class Ant {
  constructor(x, y) {
    this.deltaTime = 1;

    this.maxSpeed = 5;
    this.steerStrength = 0.5;
    this.wanderStrength = 0.01;

    this.angle = 0;
    this.position = new p5.Vector(x, y);
    this.velocity = new p5.Vector(0, 0);
    this.desiredDirection = p5.Vector.random2D().normalize();

    this.mPosition = [];
    this.mAngle = [];

    this.targetFood = -1;
  }

  display() {
    rect(0, 0, 10, 20);
  }

  drawAnt() {
    fill(255);
    stroke(255);
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle);
    this.display();
    pop();
  }

  drawAntWithTrail() {
    let frame = frameCount % trail;
    this.mPosition[frame] = this.position;
    this.mAngle[frame] = this.angle;

    for (let i = 0; i < trail; i++) {
      let alpha = ((i + 1) / trail) ** 2;
      fill("rgba(255,255,255," + alpha + ")");

      let index = (frame + 1 + i) % trail;
      if (this.mPosition[index] != null) {
        push();
        translate(this.mPosition[index].x, this.mPosition[index].y);
        rotate(this.mAngle[index]);
        this.display();
        if (i == trail - 1 && hungry) {
          this.drawVisibilityArc();
          this.drawVisionCone();
        }
        pop();
      }
    }
  }

  drawVisionCone() {
    fill("rgba(255,0,0,0.25)");
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
    fill("rgba(0,0,255,0.15)");
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
      .add(this.desiredDirection)
      .mult(this.wanderStrength)
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

  pickRandomPiece(food) {
    let index = Math.floor(Math.random() * food.length);
    return food[index];
  }

  getAngleToPiece(piece) {
    let location = new p5.Vector(piece.position.x, piece.position.y);
    let foodDirection = location.sub(this.position);
    return Math.abs(this.velocity.angleBetween(foodDirection));
  }

  beHungry() {
    if (this.targetFood === -1) {
      let closeFood = this.findCloseFood();
      if (closeFood.length > 0) {
        let chosenPiece = this.pickRandomPiece(closeFood);
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
        }
      } else {
        this.targetFood = -1;
      }
    }
  }

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
      this.beHungry();
    }
    let acceleration = this.getAcceleration();
    this.keepInsideBox();
    this.updatePosition(acceleration);
  }
}
