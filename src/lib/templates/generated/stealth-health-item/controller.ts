class StealthHealthItem extends pc.ScriptType {
    static scriptName = 'stealth-health-item';
    
    @attribute({ type: 'number', default: 25, min: 1, max: 100 })
    healAmount: number = 25;
    
    @attribute({ type: 'boolean', default: true })
    silentPickup: boolean = true;
    
    private player: pc.Entity | null = null;
    private isPickedUp: boolean = false;
    
    initialize(): void {
        this.player = this.app.root.findByName('player');
        
        if (this.entity) {
            this.entity.on('interact', this.onInteract, this);
        }
    }
    
    update(dt: number): void {
        if (this.isPickedUp) {
            this.entity.destroy();
        }
    }
    
    private onInteract(): void {
        if (!this.isPickedUp && this.player) {
            this.isPickedUp = true;
            
            const playerController = this.player.script.playerController;
            if (playerController && typeof playerController.heal === 'function') {
                playerController.heal(this.healAmount);
            }
            
            if (this.silentPickup) {
                this.app.fire('item:pickedup-silent', this.entity, 'health', this.healAmount);
            } else {
                this.app.fire('item:pickedup', this.entity, 'health', this.healAmount);
            }
        }
    }
}