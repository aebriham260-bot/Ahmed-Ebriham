import * as THREE from 'three';

export interface CharacterConfig {
  color: number;
  position: THREE.Vector3;
  isPlayer: boolean;
}

export enum CharacterState {
  IDLE,
  WALKING,
  ATTACKING,
  HIT,
  JUMPING,
  DEAD
}

export class Character {
  mesh: THREE.Group;
  state: CharacterState = CharacterState.IDLE;
  health: number = 100;
  velocity: THREE.Vector3 = new THREE.Vector3();
  isPlayer: boolean;
  
  // Body parts for animation
  torso: THREE.Mesh;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;

  attackCooldown: number = 0;
  hitStun: number = 0;
  
  constructor(config: CharacterConfig) {
    this.isPlayer = config.isPlayer;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(config.position);

    const material = new THREE.MeshStandardMaterial({ color: config.color });

    // Torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), material);
    this.torso.position.y = 1.2;
    this.mesh.add(this.torso);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), material);
    this.head.position.y = 1.75;
    this.mesh.add(this.head);

    // Arms
    this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), material);
    this.leftArm.position.set(-0.45, 1.3, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), material);
    this.rightArm.position.set(0.45, 1.3, 0);
    this.mesh.add(this.rightArm);

    // Legs
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), material);
    this.leftLeg.position.set(-0.2, 0.4, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), material);
    this.rightLeg.position.set(0.2, 0.4, 0);
    this.mesh.add(this.rightLeg);

    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  update(dt: number, opponent: Character) {
    if (this.health <= 0) {
      this.state = CharacterState.DEAD;
      return;
    }

    if (this.hitStun > 0) {
      this.hitStun -= dt;
      this.state = CharacterState.HIT;
      this.animateHit(dt);
    } else {
      if (this.attackCooldown > 0) {
        this.attackCooldown -= dt;
        this.animateAttack(dt);
      } else {
        this.state = CharacterState.IDLE;
        this.animateIdle(dt);
      }
    }

    // Gravity
    if (this.mesh.position.y > 0) {
      this.velocity.y -= 20 * dt;
    } else {
      this.mesh.position.y = 0;
      this.velocity.y = Math.max(0, this.velocity.y);
    }

    this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));

    // Look at opponent
    const targetRotation = Math.atan2(
      opponent.mesh.position.x - this.mesh.position.x,
      opponent.mesh.position.z - this.mesh.position.z
    );
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 0.1);
  }

  move(dir: THREE.Vector3, speed: number) {
    if (this.state === CharacterState.HIT || this.state === CharacterState.DEAD) return;
    this.mesh.position.add(dir.multiplyScalar(speed));
    this.state = CharacterState.WALKING;
  }

  jump() {
    if (this.mesh.position.y <= 0.01 && this.state !== CharacterState.HIT) {
      this.velocity.y = 8;
    }
  }

  attack() {
    if (this.attackCooldown <= 0 && this.state !== CharacterState.HIT) {
      this.state = CharacterState.ATTACKING;
      this.attackCooldown = 0.5;
      return true;
    }
    return false;
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.hitStun = 0.3;
    this.velocity.y = 2; // Slight pop up
  }

  private animateIdle(dt: number) {
    const time = Date.now() * 0.005;
    this.torso.position.y = 1.2 + Math.sin(time) * 0.02;
    this.leftArm.rotation.x = Math.sin(time) * 0.1;
    this.rightArm.rotation.x = Math.cos(time) * 0.1;
  }

  private animateAttack(dt: number) {
    const progress = 1 - (this.attackCooldown / 0.5);
    if (progress < 0.5) {
      this.rightArm.position.z = progress * 2;
      this.rightArm.rotation.x = -Math.PI / 2;
    } else {
      this.rightArm.position.z = (1 - progress) * 2;
    }
  }

  private animateHit(dt: number) {
    this.mesh.position.x += (Math.random() - 0.5) * 0.1;
    this.head.rotation.z = Math.sin(Date.now() * 0.1) * 0.2;
  }
}
