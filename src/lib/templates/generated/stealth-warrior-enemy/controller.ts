class StealthWarriorEnemy extends pc.ScriptType {
  static scriptName = 'stealth-warrior-enemy';

  @attribute({ type: 'number', default: 6, min: 3, max: 15 })
  visionRange: number = 6;

  @attribute({ type: 'number', default: 45, min: 30, max: 90 })
  visionConeAngle: number = 45;

  @attribute({ type: 'number', default: 2, min: 0.5, max: 5 })
  patrolSpeed: number = 2;

  @attribute({ type: 'number', default: 4, min: 1, max: 10 })
  chaseSpeed: number = 4;

  @attribute({ type: 'number', default: 1.5, min: 0.1, max: 5 })
  attackDamage: number = 1.5;

  @attribute({ type: 'number', default: 1.8, min: 0.5, max: 3 })
  attackRange: number = 1.8;

  @attribute({ type: 'number', default: 5, min: 1, max: 10 })
  investigateDuration: number = 5;

  @attribute({ type: 'number', default: 40, min: 10, max: 90 })
  rotateSpeed: number = 40;

  @attribute({ type: 'number', default: 4, min: 1, max: 10 })
  hearingRange: number = 4;

  @attribute({ type: 'number', default: 0.3, min: 0.1, max: 1 })
  noiseDetectionThreshold: number = 0.3;

  private state: 'patrol' | 'investigate' | 'chase' | 'attack' = 'patrol';
  private waypoints: pc.Vec3[] = [];
  private currentWaypoint: number = 0;
  private lastKnownPlayerPos: pc.Vec3 | null = null;
  private investigateTimer: number = 0;
  private player: pc.Entity | null = null;
  private currentClip: string = 'idle';

  initialize(): void {
    this.setPlayer(this.app.root.findByName('player'));
    this.entity.on('setWaypoints', (waypoints: pc.Vec3[]) => {
      this.setWaypoints(waypoints);
    });
  }

  update(dt: number): void {
    if (!this.player) return;

    // Check for player noise
    const playerScript = this.player.script?.playerController;
    if (playerScript && playerScript.noise > this.noiseDetectionThreshold) {
      const playerPos = this.player.getPosition();
      if (this.entity.getPosition().distance(playerPos) < this.hearingRange) {
        this.state = 'investigate';
        this.lastKnownPlayerPos = new pc.Vec3(playerPos);
        this.investigateTimer = 0;
        this.playClip('investigate');
      }
    }

    switch (this.state) {
      case 'patrol':
        this.patrol(dt);
        break;
      case 'investigate':
        this.investigate(dt);
        break;
      case 'chase':
        this.chase(dt);
        break;
      case 'attack':
        this.attack(dt);
        break;
    }

    // Check for player visibility
    const playerPos = this.player.getPosition();
    
    if (this.hasLineOfSight(playerPos)) {
      this.state = 'chase';
      this.lastKnownPlayerPos = new pc.Vec3(playerPos);
      this.playClip('chase');
    } else if (this.state === 'chase' && !this.hasLineOfSight(playerPos)) {
      this.state = 'investigate';
      this.investigateTimer = 0;
      this.playClip('investigate');
    }
  }

  setWaypoints(points: pc.Vec3[]): void {
    this.waypoints = points || [];
    if (this.waypoints.length > 0) {
      this.currentWaypoint = 0;
    }
  }

  setPlayer(player: pc.Entity): void {
    this.player = player;
  }

  private patrol(dt: number): void {
    if (this.waypoints.length === 0) {
      // Stand still and look around
      const rot = this.entity.getEulerAngles();
      this.entity.setLocalEulerAngles(rot.x, rot.y + this.rotateSpeed * dt, rot.z);
      return;
    }

    const target = this.waypoints[this.currentWaypoint];
    const pos = this.entity.getPosition();
    const dir = new pc.Vec3(target.x - pos.x, 0, target.z - pos.z).normalize();
    
    this.entity.translate(dir.scale(this.patrolSpeed * dt));
    
    if (pos.distance(target) < 0.5) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
    }
  }

  private investigate(dt: number): void {
    if (!this.lastKnownPlayerPos) {
      this.state = 'patrol';
      this.playClip('idle');
      return;
    }

    this.investigateTimer += dt;
    
    if (this.investigateTimer >= this.investigateDuration) {
      this.state = 'patrol';
      this.playClip('idle');
      return;
    }

    const pos = this.entity.getPosition();
    const dir = new pc.Vec3(this.lastKnownPlayerPos.x - pos.x, 0, this.lastKnownPlayerPos.z - pos.z).normalize();
    
    this.entity.translate(dir.scale(this.patrolSpeed * dt));
    
    // Look around while investigating
    const rot = this.entity.getEulerAngles();
    this.entity.setLocalEulerAngles(rot.x, rot.y + this.rotateSpeed * dt * 0.7, rot.z);
  }

  private chase(dt: number): void {
    if (!this.player) return;

    const playerPos = this.player.getPosition();
    const pos = this.entity.getPosition();
    const dir = new pc.Vec3(playerPos.x - pos.x, 0, playerPos.z - pos.z).normalize();
    
    this.entity.translate(dir.scale(this.chaseSpeed * dt));
    
    // Look at player while chasing
    const lookAt = new pc.Vec3(playerPos.x, pos.y, playerPos.z);
    this.entity.lookAt(lookAt);
  }

  private attack(dt: number): void {
    if (!this.player) return;

    const playerPos = this.player.getPosition();
    const pos = this.entity.getPosition();
    
    if (pos.distance(playerPos) < this.attackRange) {
      // Apply damage to player
      if (this.player.script && this.player.script.playerController) {
        this.player.script.playerController.damage(this.attackDamage * dt);
      }
    } else {
      // Player is out of range, go back to chasing
      this.state = 'chase';
    }
  }

  private hasLineOfSight(targetPos: pc.Vec3): boolean {
    const pos = this.entity.getPosition();
    const dist = pos.distance(targetPos);
    if (dist > this.visionRange) return false;

    // Vision cone check
    const forward = this.entity.forward;
    const dir = new pc.Vec3(targetPos.x - pos.x, 0, targetPos.z - pos.z).normalize();
    const dot = forward.x * dir.x + forward.z * dir.z;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    return angle <= this.visionConeAngle;
  }

  playClip(name: string): void {
    this.currentClip = name;
  }

  damagePlayer(amount: number): void {
    const player = this.app.root.findByName("player");
    if (player && player.script && player.script.playerController) {
      player.script.playerController.takeDamage(amount);
    }
  }
}