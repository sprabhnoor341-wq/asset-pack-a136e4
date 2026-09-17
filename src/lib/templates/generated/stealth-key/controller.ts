class StealthKey extends pc.ScriptType {
    static scriptName = 'stealth-key';
    
    @attribute({ type: 'string', default: 'key_pickup' })
    pickupSound: string = 'key_pickup';
    
    @attribute({ type: 'number', default: 1, min: 1 })
    keyId: number = 1;
    
    private player: pc.Entity | null = null;
    private isPickedUp: boolean = false;
    private rotationSpeed: number = 30;
    
    initialize(): void {
        // Find the player entity
        this.player = this.app.root.findByName('player');
        
        // Add interaction handler
        if (this.entity) {
            this.entity.on('interact', this.onInteract, this);
        }
    }
    
    update(dt: number): void {
        if (!this.isPickedUp && this.entity && this.entity.rigidbody) {
            // Rotate the key when not picked up
            this.entity.rigidbody.angularVelocity = new pc.Vec3(0, this.rotationSpeed * dt, 0);
        }
    }
    
    private onInteract(): void {
        if (!this.isPickedUp && this.player) {
            this.isPickedUp = true;
            
            // Emit pickup event
            this.app.fire('key:pickedup', this.keyId);
            
            // Play pickup sound
            if (this.pickupSound) {
                this.app.sound.playSound(this.pickupSound);
            }
            
            // Remove the key from the world
            this.entity.destroy();
        }
    }
}