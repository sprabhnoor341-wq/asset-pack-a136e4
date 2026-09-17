class StealthAssassin extends pc.ScriptType {
  static scriptName = 'stealth-assassin';

  @attribute({ type: 'number', default: 5, min: 1, max: 20 })
  moveSpeed: number = 5;

  @attribute({ type: 'number', default: 8, min: 1, max: 20 })
  sprintSpeed: number = 8;

  @attribute({ type: 'number', default: 5, min: 1, max: 15 })
  jumpForce: number = 5;

  @attribute({ type: 'number', default: 100, min: 1, max: 500 })
  health: number = 100;

  @attribute({ type: 'number', default: 10, min: 1, max: 30 })
  vanishDuration: number = 10;

  @attribute({ type: 'number', default: 5, min: 1, max: 20 })
  takedownRange: number = 5;

  @attribute({ type: 'number', default: 3, min: 1, max: 10 })
  lockpickSpeed: number = 3;

  private camera: pc.Entity | null = null;
  private isGrounded: boolean = false;
  private isSprinting: boolean = false;
  private isCrouching: boolean = false;
  private isVanished: boolean = false;
  private vanishTimer: number = 0;
  private currentClip: string = 'idle';
  private lastPosition: pc.Vec3 = new pc.Vec3();
  private velocity: pc.Vec3 = new pc.Vec3();

  initialize(): void {
    this.camera = this.app.root.findByName('camera');
    if (!this.camera) {
      return;
    }

    this.entity.rigidbody?.on('collisionstart', this.onCollisionStart, this);
    this.entity.rigidbody?.on('collisionend', this.onCollisionEnd, this);

    this.lastPosition.copy(this.entity.getPosition());
    
    // Set up input for special abilities
    const input = this.app.keyboard;
    input.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'v' || event.key === 'V') {
        this.activateVanish();
      } else if (event.key === 'f' || event.key === 'F') {
        this.silentTakedown();
      } else if (event.key === 'l' || event.key === 'L') {
        this.attemptLockpick();
      }
    });
  }

  update(dt: number): void {
    if (!this.camera) return;

    const input = this.app.keyboard;
    const rigidBody = this.entity.rigidbody;
    if (!rigidBody) return;

    // Handle vanish timer
    if (this.isVanished) {
      this.vanishTimer -= dt;
      if (this.vanishTimer <= 0) {
        this.deactivateVanish();
      }
    }

    // Handle movement input
    const moveDir = new pc.Vec3();
    
    if (input.isPressed(pc.KEY_W)) moveDir.add(this.entity.forward);
    if (input.isPressed(pc.KEY_S)) moveDir.sub(this.entity.forward);
    if (input.isPressed(pc.KEY_A)) moveDir.sub(this.entity.right);
    if (input.isPressed(pc.KEY_D)) moveDir.add(this.entity.right);

    // Normalize movement direction
    if (moveDir.length() > 0) {
      moveDir.normalize();
      
      // Apply silent step if crouching or vanished
      const speed = this.isVanished ? this.moveSpeed * 0.5 : 
                   this.isCrouching ? this.moveSpeed * 0.7 : 
                   this.isSprinting ? this.sprintSpeed : this.moveSpeed;
      
      // Calculate movement
      const movement = moveDir.scale(speed * dt);
      this.entity.translate(movement);
    }

    // Handle sprinting
    this.isSprinting = input.isPressed(pc.KEY_SHIFT);

    // Handle crouching
    this.isCrouching = input.isPressed(pc.KEY_CONTROL);

    // Handle jumping
    if (input.isPressed(pc.KEY_SPACE) && this.isGrounded && !this.isVanished) {
      rigidBody.linearVelocity = new pc.Vec3(0, this.jumpForce, 0);
      this.isGrounded = false;
      this.playClip('jump');
    }

    // Update camera to follow player
    this.updateCamera(dt);

    // Calculate velocity for animation
    const currentPosition = this.entity.getPosition();
    this.velocity.copy(currentPosition).sub(this.lastPosition).scale(1/dt);
    this.lastPosition.copy(currentPosition);

    // Update animation based on movement
    this.updateAnimation();

    // Reset grounded state (will be set again by collision)
    this.isGrounded = false;
  }

  private onCollisionStart(result: pc.CollisionResult): void {
    // Simple ground detection (assuming y is up)
    if (result.normal.y > 0.5) {
      this.isGrounded = true;
    }
  }

  private onCollisionEnd(): void {
    // Ground detection will be handled in collision start
  }

  private updateCamera(dt: number): void {
    if (!this.camera) return;

    // Smooth camera follow
    const targetPosition = this.entity.getPosition().clone().add(new pc.Vec3(0, 1.5, 0));
    const currentPosition = this.camera.getPosition();
    
    const newPosition = currentPosition.lerp(targetPosition, 5 * dt);
    this.camera.setPosition(newPosition);
    
    // Make camera look at player
    this.camera.lookAt(this.entity.getPosition());
  }

  private updateAnimation(): void {
    const speed = this.velocity.length();
    
    if (this.isVanished) {
      this.playClip('vanish');
    } else if (this.isCrouching) {
      this.playClip('crouch');
    } else if (speed < 0.1) {
      this.playClip('idle');
    } else if (this.isSprinting) {
      this.playClip('sprint');
    } else {
      this.playClip('walk');
    }
  }

  public playClip(name: string): void {
    if (this.currentClip !== name) {
      this.currentClip = name;
      // In a real implementation, this would trigger the actual animation
    }
  }

  public takeDamage(amount: number): void {
    if (this.isVanished) return;
    
    this.health -= amount;
    this.playClip('hit');
    
    if (this.health <= 0) {
      this.health = 0;
      this.playClip('death');
      // Handle death in a real game
    }
  }

  public heal(amount: number): void {
    this.health = Math.min(this.health + amount, 100);
    this.playClip('heal');
  }

  private activateVanish(): void {
    if (this.isVanished) return;
    
    this.isVanished = true;
    this.vanishTimer = this.vanishDuration;
    this.playClip('vanish');
    
    // In a real implementation, this would also change rendering
    // to make the player semi-transparent or invisible
  }

  private deactivateVanish(): void {
    this.isVanished = false;
    this.playClip('appear');
  }

  private silentTakedown(): void {
    if (this.isVanished) {
      // Find nearby enemies
      const enemies = this.app.root.findByTag('enemy');
      
      for (const enemy of enemies) {
        const distance = this.entity.getPosition().distance(enemy.getPosition());
        
        if (distance < this.takedownRange) {
          // In a real implementation, this would trigger a takedown animation
          // and then remove/disable the enemy
          this.playClip('takedown');
          
          // Call enemy's takeDamage method if it exists
          if (enemy.script && enemy.script.enemyController) {
            enemy.script.enemyController.takeDamage(100);
          }
        }
      }
    }
  }

  private attemptLockpick(): void {
    // In a real implementation, this would trigger a lockpicking minigame
    // or check if player is near a lockable object
    this.playClip('lockpick');
    
    // Simulate lockpicking time
    setTimeout(() => {
      // Lockpick success
      this.playClip('success');
    }, 1000 / this.lockpickSpeed);
  }
}