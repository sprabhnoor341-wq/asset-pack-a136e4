This script detects when the player enters a trigger zone and activates horror events like monster sounds or visual cues.

using UnityEngine;

public class TriggerZone : MonoBehaviour
{
    [Header("Settings")]
    [Tooltip("The monster sound to play when player enters")]
    public AudioClip monsterSound;
    
    [Tooltip("Optional: Visual effect to instantiate on trigger")]
    public GameObject triggerEffect;
    
    [Tooltip("How long the effect lasts (if applicable)")]
    public float effectDuration = 3f;
    
    [Tooltip("Whether this trigger can only activate once")]
    public bool oneTimeUse = true;

    [Header("References")]
    [Tooltip("Optional: Assign an AudioSource here, or one will be auto-found on this GameObject")]
    public AudioSource audioSource;

    private bool hasTriggered = false;

    private void Awake()
    {
        // Auto-find AudioSource if not assigned
        if (audioSource == null)
        {
            audioSource = GetComponent<AudioSource>();
            if (audioSource == null)
            {
                Debug.LogWarning("TriggerZone: No AudioSource found on " + name + ". Please add one or assign manually.", this);
            }
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        // Only respond to the player (assumes player has tag "Player")
        if (!other.CompareTag("Player")) return;

        // Prevent re-triggering if set to one-time use
        if (oneTimeUse && hasTriggered) return;

        hasTriggered = true;

        // Play monster sound if assigned and AudioSource exists
        if (monsterSound != null && audioSource != null)
        {
            audioSource.PlayOneShot(monsterSound);
        }

        // Instantiate visual effect if assigned
        if (triggerEffect != null)
        {
            GameObject effectInstance = Instantiate(triggerEffect, transform.position, Quaternion.identity);
            // Auto-destroy effect after duration if it has no self-destruct logic
            if (effectInstance != null && effectDuration > 0f)
            {
                Destroy(effectInstance, effectDuration);
            }
        }

        // Optional: Notify other systems (e.g., GameManager) that horror event started
        // Example: GameManager.Instance.OnHorrorTriggered();
    }

    // Optional: Reset trigger for reuse (if oneTimeUse is false)
    public void ResetTrigger()
    {
        hasTriggered = false;
    }
}