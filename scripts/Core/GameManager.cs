// This script manages the core game state, including player health, monster proximity, and win/lose conditions for the small cozy forest cabin horror game.
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    // Singleton instance for easy access from other scripts
    public static GameManager Instance { get; private set; }

    // Player state
    public int maxHealth = 3;
    public int currentHealth;
    public bool isInsideCabin = true; // Tracks if player is inside the safe cabin

    // Monster state
    public float monsterDetectionRadius = 10f; // How close the monster must be to detect player
    public float monsterApproachSpeed = 1.5f; // Speed at which monster moves toward player when detected
    public Transform monsterTransform; // Reference to the monster's transform (set in inspector)
    public bool isMonsterActive = false; // Whether the monster is currently hunting

    // Game state
    public bool isGameOver = false;
    public bool hasWon = false;

    // UI References (assign in inspector)
    public GameObject gameOverScreen;
    public GameObject winScreen;
    public UnityEngine.UI.Text healthText;

    private void Awake()
    {
        // Ensure only one GameManager exists
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void Start()
    {
        InitializeGame();
    }

    private void Update()
    {
        if (isGameOver) return;

        UpdateHealthUI();
        CheckMonsterProximity();
        CheckWinCondition();
    }

    private void InitializeGame()
    {
        currentHealth = maxHealth;
        isGameOver = false;
        hasWon = false;
        isInsideCabin = true;
        isMonsterActive = false;

        if (gameOverScreen != null) gameOverScreen.SetActive(false);
        if (winScreen != null) winScreen.SetActive(false);
        if (healthText != null) healthText.text = $"Health: {currentHealth}/{maxHealth}";
    }

    public void TakeDamage(int damageAmount)
    {
        if (isGameOver) return;

        currentHealth -= damageAmount;
        currentHealth = Mathf.Max(0, currentHealth);

        if (healthText != null)
            healthText.text = $"Health: {currentHealth}/{maxHealth}";

        if (currentHealth <= 0)
        {
            TriggerGameOver();
        }
    }

    public void Heal(int healAmount)
    {
        if (isGameOver) return;

        currentHealth = Mathf.Min(maxHealth, currentHealth + healAmount);
        if (healthText != null)
            healthText.text = $"Health: {currentHealth}/{maxHealth}";
    }

    private void UpdateHealthUI()
    {
        if (healthText != null)
            healthText.text = $"Health: {currentHealth}/{maxHealth}";
    }

    private void CheckMonsterProximity()
    {
        if (monsterTransform == null || !isMonsterActive) return;

        float distanceToPlayer = Vector3.Distance(monsterTransform.position, transform.position);

        // If player is inside cabin, they are safe from detection
        if (isInsideCabin)
        {
            // Optional: monster may still linger outside but can't attack
            return;
        }

        // If monster is within detection radius, start chasing
        if (distanceToPlayer <= monsterDetectionRadius)
        {
            // Monster is now actively hunting
            // In a full implementation, this would trigger monster AI to move toward player
            // For now, we just apply damage over time if too close
            if (distanceToPlayer <= 2f) // Close enough to attack
            {
                TakeDamage(1); // Deal 1 damage per frame when very close
            }
        }
    }

    private void CheckWinCondition()
    {
        // Win condition: survive for 5 minutes inside the cabin without dying
        // For simplicity, we'll use a timer-based win (can be replaced with story trigger)
        if (Time.timeSinceLevelLoad >= 300f && !hasWon && !isGameOver) // 5 minutes
        {
            TriggerWin();
        }
    }

    public void TriggerGameOver()
    {
        if (isGameOver) return;

        isGameOver = true;
        Time.timeScale = 0f; // Pause game

        if (gameOverScreen != null)
            gameOverScreen.SetActive(true);

        Debug.Log("Game Over: Player died.");
    }

    public void TriggerWin()
    {
        if (hasWon || isGameOver) return;

        hasWon = true;
        Time.timeScale = 0f; // Pause game

        if (winScreen != null)
            winScreen.SetActive(true);

        Debug.Log("You survived the night! You win.");
    }

    // Called by player script when entering/exiting cabin
    public void SetInsideCabin(bool inside)
    {
        isInsideCabin = inside;
        if (!inside)
        {
            // Player just left cabin — monster may now detect them
            isMonsterActive = true;
        }
    }

    // Optional: Reset game (for restart button)
    public void RestartGame()
    {
        Time.timeScale = 1f;
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }
}