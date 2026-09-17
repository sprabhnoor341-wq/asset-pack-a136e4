class HeavyBruteEnemy extends pc.ScriptType {
  static scriptName = 'heavy-brute-enemy';

  @attribute({ type: 'number', default: 5, min: 1, max: 20 })
  moveSpeed: number = 5;

  @attribute({ type: 'number', default: 10, min: 5, max: 30 })
  visionRange: number = 10;

  @attribute({ type: 'number', default: 45, min: 20, max: 90 })
  visionAngle: number = 45;

  @attribute({ type: 'number', default: 3, min: 1, max: 10 })
  attackDamage: number = 3;

  @attribute({ type: 'number', default: 2, min: 0.5, max: 5 })
  attackCooldown: number = 2;

  @attribute({ type: 'number', default: 0.5, min: 0.1, max: 2 })
  investigationTime: number = 0.5;

  private state: 'patrol' | 'investigate' | 'chase' | 'attack' = 'patrol';
  private waypoints: pc.Vec3[] = [];
  private currentWaypointIndex: number = 0;
  private player: pc.Entity | null = null;
  private currentClip: string = 'idle';
  private lastAttackTime: number = 0;
  private investigationTimer: number = 0;
  private lastKnownPosition: pc.Vec3 | null = null;

  initialize(): void {
    this.entity.rigidbody.type = 'dynamic';
    this.entity.rigidbody.angularFactor = new pc.Vec3(0, 0, 0);
    
    if (!this.waypoints.length) {
      this.waypoints.push(this.entity.getPosition().clone());
    }
  }

  update(dt: number): void {
    try {
      if (!this.player) return;
      
      const playerPosition = this.player.getPosition();
      const enemyPosition = this.entity.getPosition();
      
      const distanceToPlayer = playerPosition.sub(enemyPosition).length();
      
      if (this.state === 'patrol') {
        this.patrol(dt);
        
        if (this.canSeePlayer(playerPosition, enemyPosition)) {
          this.state = 'investigate';
          this.lastKnownPosition = playerPosition.clone();
          this.investigationTimer = 0;
          this.playClip('alert');
        }
      } else if (this.state === 'investigate') {
        this.investigate(dt);
        
        if (this.canSeePlayer(playerPosition, enemyPosition)) {
          this.state = 'chase';
          this.playClip('chase');
        } else if (this.investigationTimer >= this.investigationTime) {
          if (this.lastKnownPosition) {
            this.entity.lookAt(this.lastKnownPosition);
            const direction = this.lastKnownPosition.sub(enemyPosition).normalize();
            this.entity.translate(direction.scale(this.moveSpeed * dt));
          }
          
          if (distanceToPlayer < 2) {
            this.state = 'attack';
            this.playClip('attack');
          }
        }
      } else if (this.state === 'chase') {
        this.chase(dt);
        
        if (this.canSeePlayer(playerPosition, enemyPosition)) {
          if (distanceToPlayer < 2) {
            this.state = 'attack';
            this.playClip('attack');
          }
        } else {
          this.state = 'investigate';
          this.lastKnownPosition = playerPosition.clone();
          this.investigationTimer = 0;
          this.playClip('alert');
        }
      } else if (this.state === 'attack') {
        this.attack(dt);
        
        if (distanceToPlayer > 2) {
          this.state = 'chase';
          this.playClip('chase');
        } else if (!this.canSeePlayer(playerPosition, enemyPosition)) {
          this.state = 'investigate';
          this.lastKnownPosition = playerPosition.clone();
          this.investigationTimer = 0;
          this.playClip('alert');
        }
      }
    } catch (e) {
      console.error('HeavyBruteEnemy error:', e);
    }
  }

  setWaypoints(points: pc.Vec3[]): void {
    this.waypoints = points;
    this.currentWaypointIndex = 0;
  }

  setPlayer(entity: pc.Entity): void {
    this.player = entity;
  }

  playClip(name: string): void {
    this.currentClip = name;
  }

  patrol(dt: number): void {
    if (!this.waypoints.length) return;
    
    const targetWaypoint = this.waypoints[this.currentWaypointIndex];
    const direction = targetWaypoint.sub(this.entity.getPosition()).normalize();
    
    if (this.entity.getPosition().distance(targetWaypoint) < 0.5) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      this.playClip('idle');
    } else {
      this.entity.lookAt(targetWaypoint);
      this.entity.translate(direction.scale(this.moveSpeed * dt * 0.5));
      this.playClip('walk');
    }
  }

  investigate(dt: number): void {
    this.investigationTimer += dt;
    this.playClip('investigate');
  }

  chase(dt: number): void {
    if (!this.player) return;
    
    const playerPosition = this.player.getPosition();
    const direction = playerPosition.sub(this.entity.getPosition()).normalize();
    
    this.entity.lookAt(playerPosition);
    this.entity.translate(direction.scale(this.moveSpeed * dt));
  }

  attack(dt: number): void {
    const now = this.app.timeScale * this.app.totalTime;
    
    if (now - this.lastAttackTime >= this.attackCooldown) {
      this.damagePlayer(this.attackDamage);
      this.lastAttackTime = now;
    }
  }

  canSeePlayer(playerPosition: pc.Vec3, enemyPosition: pc.Vec3): boolean {
    if (!this.player) return false;
    
    const distance = playerPosition.sub(enemyPosition).length();
    if (distance > this.visionRange) return false;
    
    const enemyForward = this.entity.forward;
    const toPlayer = playerPosition.sub(enemyPosition).normalize();
    
    const angle = Math.acos(pc.Vec3.dot(enemyForward, toPlayer)) * 180 / Math.PI;
    if (angle > this.visionAngle) return false;
    
    return true;
  }

  damagePlayer(amount: number): void {
    const player = this.app.root.findByName('player');
    if (player && player.script && player.script.playerController) {
      player.script.playerController.takeDamage(amount);
    }
  }
}