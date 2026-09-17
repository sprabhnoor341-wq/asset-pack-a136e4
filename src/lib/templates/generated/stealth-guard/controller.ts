class StealthGuard extends pc.ScriptType {
  static scriptName = 'stealth-guard';

  @attribute({ type: 'number', default: 8, min: 3, max: 15 })
  visionRange: number = 8;

  @attribute({ type: 'number', default: 45, min: 30, max: 90 })
  visionConeAngle: number = 45;

  @attribute({ type: 'number', default: 2, min: 0.5, max: 5 })
  patrolSpeed: number = 2;

  @attribute({ type: 'number', default: 4, min: 1, max: 10 })
  chaseSpeed: number = 4;

  @attribute({ type: 'number', default: 1, min: 0.1, max: 5 })
  attackDamage: number = 1;

  @attribute({ type: 'number', default: 1.2, min: 0.5, max: 3 })
  attackRange: number = 1.2;

  @attribute({ type: 'number', default: 4, min: 1, max: 10 })
  investigateDuration: number = 4;

  @attribute({ type: 'number', default: 40, min: 10, max: 90 })
  rotateSpeed: number = 40;

  @attribute({ type: 'number', default: 3, min: 1, max: 10 })
  hearingRange: number = 3;

  private state: 'patrol' | 'investigate' | 'chase' | 'attack' | 'alert' = 'patrol';
  private waypoints: pc.Vec3[] = [];
  private currentWaypoint: number = 0;
  private lastKnownPlayerPos: pc.Vec3 | null = null;
  private investigateTimer: number = 0;
  private alertTimer: number = 0;
  private player: pc.Entity | null = null;
  private playerNoisePos: pc.Vec3 | null = null;
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
    const playerPos = this.player.getPosition();
    const playerNoise = this.player.script?.playerController?.noise;
    if (playerNoise && this.entity.getPosition().distance(playerPos) < this.hearingRange) {
      this.playerNoisePos = new pc.Vec3(playerPos);
      this.state = 'investigate';
      this.investigateTimer = 0;
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
      case 'alert':
        this.alert(dt);
        break;
    }

    // Check for player visibility
    if (this.hasLineOfSight(playerPos)) {
      this.state = 'chase';
      this.lastKnownPlayerPos = new pc.Vec3(playerPos);
      this.alertTimer = 0;
    } else if (this.state === 'chase' && !this.hasLineOfSight(playerPos)) {
      this.state = 'investigate';
      this.investigateTimer = 0;
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

  playClip(name: string): void {
    this.currentClip = name;
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
    if (this.playerNoisePos) {
      // Investigate noise position
      const pos = this.entity.getPosition();
      const dir = new pc.Vec3(this.playerNoisePos.x - pos.x, 0, this.playerNoisePos.z - pos.z).normalize();
      
      this.entity.translate(dir.scale(this.patrolSpeed * dt));
      
      if (pos.distance(this.playerNoisePos) < 0.5) {
        this.playerNoisePos = null;
      }
    } else if (this.lastKnownPlayerPos) {
      // Investigate last known player position
      this.investigateTimer += dt;
      
      if (this.investigateTimer >= this.investigateDuration) {
        this.state = 'patrol';
        return;
      }

      const pos = this.entity.getPosition();
      const dir = new pc.Vec3(this.lastKnownPlayerPos.x - pos.x, 0, this.lastKnownPlayerPos.z - pos.z).normalize();
      
      this.entity.translate(dir.scale(this.patrolSpeed * dt));
      
      // Look around while investigating
      const rot = this.entity.getEulerAngles();
      this.entity.setLocalEulerAngles(rot.x, rot.y + this.rotateSpeed * dt * 0.5, rot.z);
    } else {
      this.state = 'patrol';
    }
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
        this.player.script.playerController.takeDamage(this.attackDamage * dt);
      }
    } else {
      // Player is out of range, go back to chasing
      this.state = 'chase';
    }
  }

  private alert(dt: number): void {
    this.alertTimer += dt;
    
    if (this.alertTimer >= 2) {
      this.state = 'patrol';
      return;
    }

    // Look around frantically
    const rot = this.entity.getEulerAngles();
    this.entity.setLocalEulerAngles(rot.x, rot.y + this.rotateSpeed * dt * 2, rot.z);
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
}