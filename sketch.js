const trail = 20;
const border = 30;
const steeringCorrection = 3;
const ants = [];
const antCount = 10;
const seeCoverage = true;

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

      let colour = 255 * i / trail
      fill(colour)
      stroke(colour)

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

  update() {
    let wanderDirection = p5.Vector.random2D();
    this.desiredDirection = (wanderDirection.add(this.desiredDirection).mult(this.wanderStrength)).normalize();
    let desiredVelocity = this.desiredDirection.mult(this.maxSpeed);
    let desiredSteeringForce = (desiredVelocity.sub(this.velocity)).mult(this.steerStrength);
    let acceleration = desiredSteeringForce.limit(this.steerStrength);

    let pos = this.position;

    if (pos.x < border) {
      this.position.x = border
      this.velocity.x += steeringCorrection;
    }
    if (pos.x > (width - border)) {
      this.position.x = width - border
      this.velocity.x -= steeringCorrection;
    }
    if (pos.y < border) {
      this.position.y = border
      this.velocity.y += steeringCorrection;
    }
    if (pos.y > (height - border)) {
      this.position.y = height - border
      this.velocity.y -= steeringCorrection;
    }

    this.velocity = (this.velocity.add(acceleration.mult(this.deltaTime))).limit(this.maxSpeed);
    this.position = this.position.add(this.velocity.mult(this.deltaTime));
    this.position = new p5.Vector((this.position.x + width) % width, (this.position.y + height) % height);


    this.angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
  }
}

function setup() {
  createCanvas(400, 400);
  fill(255, 204);
  noStroke();

  for (let i = 0; i < antCount; i++) {
    ants.push(new Ant(width / 2, height / 2));
  }
  smooth();
  rectMode(CENTER);
  frameRate(24);
}

function draw() {

  ants.forEach(ant => {
    ant.update();
    if (seeCoverage) { ant.drawAnt(); }
    else {
      background(0);
      ant.drawAntWithTrail();
    }
  });
}


