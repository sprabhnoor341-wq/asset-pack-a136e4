class AssassinationTargetController extends pc.ScriptType {
  static scriptName = "assassination-target";
  
  @attribute({ type: "number", default: 100, min: 1, max: 500 })
  health: number = 100;
  
  @attribute({ type: "number", default: 1, min: 0.1, max: 5 })
  scoreValue: number = 1;
  
  private currentClip: string = "idle";
  private isAlive: boolean = true;
  
  initialize(): void {
    this.entity.name = "AssassinationTarget";
    
    // Listen for damage events
    this.entity.on('damage', this.onDamage, this);
    
    // Initialize animation
    this.playClip("idle");
  }
  
  update(dt: number): void {
    if (!this.isAlive) return;
    
    // Check if player is nearby for reaction
    const player = this.app.root.findByName("player");
    if (player) {
      const distance = this.entity.getPosition().sub(player.getPosition()).length();
      if (distance < 5) {
        this.playClip("alert");
      }
    }
  }
  
  onDamage(amount: number): void {
    if (!this.isAlive) return;
    
    this.health -= amount;
    this.playClip("hurt");
    
    if (this.health <= 0) {
      this.eliminate();
    }
  }
  
  eliminate(): void {
    this.isAlive = false;
    this.playClip("death");
    
    // Emit elimination event
    this.app.fire("target:eliminated", this.entity, this.scoreValue);
    
    // Disable collision after a delay
    setTimeout(() => {
      if (this.entity.rigidbody) {
        this.entity.rigidbody.enabled = false;
      }
    }, 2000);
  }
  
  playClip(name: string): void {
    if (this.currentClip !== name) {
      this.currentClip = name;
      // In a real implementation, this would trigger the actual animation
    }
  }
}