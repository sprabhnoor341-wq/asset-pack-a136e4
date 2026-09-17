class AssassinationTarget extends pc.ScriptType {
  static scriptName = "assassination-target";
  
  /** Whether this target has been eliminated */
  @attribute({ type: "boolean", default: false })
  eliminated: boolean = false;
  
  /** Health of the target */
  @attribute({ type: "number", default: 1 })
  health: number = 1;
  
  /** Animation clip names */
  @attribute({ type: "string", default: "idle" })
  idleClip: string = "idle";
  
  @attribute({ type: "string", default: "death" })
  deathClip: string = "death";
  
  /** Current animation clip */
  private currentClip: string = "idle";
  
  initialize(): void {
    // Initialize target state
    this.eliminated = false;
    this.health = this.health;
    this.currentClip = this.idleClip;
  }
  
  update(dt: number): void {
    // Target behavior update logic
  }
  
  /** Take damage from player attack */
  takeDamage(amount: number): void {
    if (this.eliminated) return;
    
    this.health -= amount;
    
    if (this.health <= 0) {
      this.eliminate();
    }
  }
  
  /** Eliminate the target */
  eliminate(): void {
    if (this.eliminated) return;
    
    this.eliminated = true;
    this.playClip(this.deathClip);
    
    // Optional: Trigger elimination event
    this.fire("eliminated");
  }
  
  /** Play animation clip */
  playClip(name: string): void {
    this.currentClip = name;
    
    // In a real implementation, this would control the animation component
    // For now, just store the clip name
  }
}