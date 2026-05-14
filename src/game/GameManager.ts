import * as THREE from 'three';
import { Character, CharacterState } from './Character';

export class GameManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player: Character;
  enemy: Character;
  
  isGameOver: boolean = false;
  winner: string | null = null;
  
  private keys: { [key: string]: boolean } = {};
  private clock: THREE.Clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 30);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 2, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid helper
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(grid);

    // Characters
    this.player = new Character({
      color: 0x4285f4, // Blue
      position: new THREE.Vector3(-2, 0, 0),
      isPlayer: true
    });
    this.scene.add(this.player.mesh);

    this.enemy = new Character({
      color: 0xea4335, // Red
      position: new THREE.Vector3(2, 0, 0),
      isPlayer: false
    });
    this.scene.add(this.enemy.mesh);

    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update() {
    if (this.isGameOver) return;

    const dt = this.clock.getDelta();

    this.handleInput(dt);
    this.handleAI(dt);

    this.player.update(dt, this.enemy);
    this.enemy.update(dt, this.player);

    this.checkCollisions();
    this.updateCamera();

    if (this.player.health <= 0) {
      this.isGameOver = true;
      this.winner = 'Enemy';
    } else if (this.enemy.health <= 0) {
      this.isGameOver = true;
      this.winner = 'Player';
    }

    this.renderer.render(this.scene, this.camera);
  }

  private handleInput(dt: number) {
    const speed = 5 * dt;
    if (this.keys['KeyA']) this.player.move(new THREE.Vector3(-1, 0, 0), speed);
    if (this.keys['KeyD']) this.player.move(new THREE.Vector3(1, 0, 0), speed);
    if (this.keys['KeyW']) this.player.move(new THREE.Vector3(0, 0, -1), speed);
    if (this.keys['KeyS']) this.player.move(new THREE.Vector3(0, 0, 1), speed);
    if (this.keys['Space']) this.player.jump();
    if (this.keys['KeyJ']) this.player.attack();
  }

  private handleAI(dt: number) {
    const dist = this.player.mesh.position.distanceTo(this.enemy.mesh.position);
    const speed = 3 * dt;

    if (dist > 1.5) {
      const dir = this.player.mesh.position.clone().sub(this.enemy.mesh.position).normalize();
      this.enemy.move(dir, speed);
    } else {
      if (Math.random() < 0.05) {
        this.enemy.attack();
      }
    }
  }

  private checkCollisions() {
    // Simple distance based collision for attacks
    if (this.player.state === CharacterState.ATTACKING && this.player.attackCooldown > 0.4) {
      const dist = this.player.mesh.position.distanceTo(this.enemy.mesh.position);
      if (dist < 1.2 && this.enemy.state !== CharacterState.HIT) {
        this.enemy.takeDamage(10);
      }
    }

    if (this.enemy.state === CharacterState.ATTACKING && this.enemy.attackCooldown > 0.4) {
      const dist = this.enemy.mesh.position.distanceTo(this.player.mesh.position);
      if (dist < 1.2 && this.player.state !== CharacterState.HIT) {
        this.player.takeDamage(10);
      }
    }

    // Boundary check
    [this.player, this.enemy].forEach(char => {
      char.mesh.position.x = Math.max(-9, Math.min(9, char.mesh.position.x));
      char.mesh.position.z = Math.max(-9, Math.min(9, char.mesh.position.z));
    });
  }

  private updateCamera() {
    const midpoint = this.player.mesh.position.clone().add(this.enemy.mesh.position).multiplyScalar(0.5);
    const dist = this.player.mesh.position.distanceTo(this.enemy.mesh.position);
    
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, midpoint.x, 0.1);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, midpoint.z + 5 + dist * 0.5, 0.1);
    this.camera.lookAt(midpoint);
  }

  dispose() {
    this.renderer.dispose();
    // Remove event listeners if needed
  }
}
