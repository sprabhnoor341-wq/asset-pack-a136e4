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

  @attribute({ type: 'number', default: 0.5, min: 0, max: 1 })
  silentStepFactor: number = 0.5;

  @attribute({ type: 'number', default: 10, min: 5, max: 30 })
  shadowStepDistance: number = 10;

  @attribute({ type: 'number', default: 5, min: 1, max: 15 })
  shadowStepCooldown: number = 5;

  @attribute({ type: 'number', default: 10, min: 1, max: 30 })
  takedownRange: number = 10;

  @attribute({ type: 'number', default: 5, min: 1, max: 15 })
  lockpickTime: number = 5;

  private camera: pc.Entity | null = null;
  private isGrounded: boolean = false;
  private isSprinting: boolean = false;
  private isCrouching: boolean = false;
  private lastPosition: pc.Vec3 = new pc.Vec3();
  private velocity: pc.Vec3 = new pc.Vec3();
  private currentClip: string = 'idle';
  private shadowStepReady: boolean = true;
  private lastShadowStep: number = 0;
  private isLockpicking: boolean = false;
  private lockpickStartTime: number = 0;

  initialize(): void {
    // Find camera entity
    this.camera = this.app.root.findByName('camera');
    if (!this.camera) {
      return;
    }

    // Set up collision detection
    this.entity.rigidbody?.on('collisionstart', this.onCollisionStart, this);
    this.entity.rigidbody?.on('collisionend', this.onCollisionEnd, this);

    // Initialize last position
    this.lastPosition.copy(this.entity.getPosition());
  }

  update(dt: number): void {
    if (!this.camera) return;

    const input = this.app.keyboard;
    const rigidBody = this.entity.rigidbody;
    if (!rigidBody) return;

    // Handle movement input
    const moveDir = new pc.Vec3();
    
    if (input.isPressed(pc.KEY_W)) moveDir.add(this.entity.forward);
    if (input.isPressed(pc.KEY_S)) moveDir.sub(this.entity.forward);
    if (input.isPressed(pc.KEY_A)) moveDir.sub(this.entity.right);
    if (input.isPressed(pc.KEY_D)) moveDir.add(this.entity.right);

    // Normalize movement direction
    if (moveDir.length() > 0) {
      moveDir.normalize();
      
      // Apply silent step if crouching
      const speed = this.isCrouching ? this.moveSpeed * this.silentStepFactor : 
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
    if (input.isPressed(pc.KEY_SPACE) && this.isGrounded) {
      rigidBody.linearVelocity = new pc.Vec3(0, this.jumpForce, 0);
      this.isGrounded = false;
      this.playClip('jump');
    }

    // Handle shadow step
    if (input.isPressed(pc.KEY_Q) && this.shadowStepReady && !this.isLockpicking) {
      this.performShadowStep();
    }

    // Handle lockpicking
    if (input.isPressed(pc.KEY_E) && this.isGrounded) {
      this.startLockpicking();
    } else if (!input.isPressed(pc.KEY_E) && this.isLockpicking) {
      this.stopLockpicking();
    }

    // Update shadow step cooldown
    if (!this.shadowStepReady) {
      const now = Date.now();
      if (now - this.lastShadowStep > this.shadowStepCooldown * 1000) {
        this.shadowStepReady = true;
      }
    }

    // Update lockpicking progress
    if (this.isLockpicking) {
      const now = Date.now();
      const progress = (now - this.lockpickStartTime) / 1000;
      if (progress >= this.lockpickTime) {
        this.completeLockpicking();
      }
    }

    // Update camera to follow player
    this.updateCamera(dt);

    // Calculate velocity for silent step effect
    const currentPosition = this.entity.getPosition();
    this.velocity.copy(currentPosition).sub(this.lastPosition).scale(1/dt);
    this.lastPosition.copy(currentPosition);

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

  private performShadowStep(): void {
    // Find direction to move (forward by default)
    const direction = this.entity.forward.clone();
    
    // Calculate new position
    const newPosition = this.entity.getPosition().clone().add(direction.scale(this.shadowStepDistance));
    
    // Teleport to new position
    this.entity.rigidbody?.teleport(newPosition.x, newPosition.y, newPosition.z);
    
    // Set cooldown
    this.shadowStepReady = false;
    this.lastShadowStep = Date.now();
    
    // Play animation
    this.playClip('shadowstep');
  }

  private startLockpicking(): void {
    this.isLockpicking = true;
    this.lockpickStartTime = Date.now();
    this.playClip('lockpick');
  }

  private stopLockpicking(): void {
    this.isLockpicking = false;
    this.playClip('idle');
  }

  private completeLockpicking(): void {
    this.isLockpicking = false;
    // In a real game, this would unlock a door or container
    this.playClip('idle');
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

  public takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      // Handle death in a real game
    }
    this.playClip('hit');
  }

  public heal(amount: number): void {
    this.health = Math.min(this.health + amount, 100);
    this.playClip('heal');
  }

  public playClip(name: string): void {
    this.currentClip = name;
  }
}