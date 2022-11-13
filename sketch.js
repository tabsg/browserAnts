const trail = 20;
const border = 30;
const steeringCorrection = 3;
const antCount = 10;

const seeCoverage = false;
const hungry = true;

const ants = [];
const food = [];

function setup() {
  createCanvas(400, 400);
  fill(255, 204);
  noStroke();

  for (let i = 0; i < antCount; i++) {
    ants.push(new Ant(width / 2, height / 2));
  }

  food.push(new Food(width / 2, height / 2));

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
  constructor(x, y) {
    this.position = new p5.Vector(x, y);
  }

  display() {
    fill(0, 255, 0);
    ellipse(this.position.x, this.position.y, 5);
  }
}
class Ant {
  constructor(x, y) {
    this.deltaTime = 1;

    this.maxSpeed = 10;
    this.steerStrength = 1;
    this.wanderStrength = 0.1;

    this.angle = 0;
    this.position = new p5.Vector(x, y);
    this.velocity = new p5.Vector(0, 0);
    this.desiredDirection = p5.Vector.random2D().normalize();

    this.mPosition = [];
    this.mAngle = [];

    this.targetFood = [];
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
        pop();
      }
    }
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
    let acceleration = this.getAcceleration();
    this.keepInsideBox();
    this.updatePosition(acceleration);
  }
}
