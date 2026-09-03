// This script handles saving and loading the player's progress, including health, inventory, and story state, to ensure continuity between game sessions.
using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;

public class SaveLoadManager : MonoBehaviour
{
    private const string SaveFileName = "cabin_horror_save.dat";
    private string SaveFilePath => Path.Combine(Application.persistentDataPath, SaveFileName);

    [Serializable]
    public class SaveData
    {
        public float playerHealth;
        public float playerMaxHealth;
        public Vector3 playerPosition;
        public Quaternion playerRotation;
        public List<string> inventoryItems;
        public bool[] storyFlags;
        public int currentChapter;
        public float timeSinceLastSave;
        public bool isLightsOn;
        public bool isDoorLocked;
        public float monsterProximityAlert;
    }

    private SaveData currentSaveData = new SaveData();

    private void Awake()
    {
        DontDestroyOnLoad(gameObject);
        LoadGame();
    }

    public void SaveGame()
    {
        try
        {
            currentSaveData.playerHealth = FindObjectOfType<PlayerHealth>()?.currentHealth ?? 100f;
            currentSaveData.playerMaxHealth = FindObjectOfType<PlayerHealth>()?.maxHealth ?? 100f;
            var playerTransform = FindObjectOfType<PlayerController>()?.transform;
            currentSaveData.playerPosition = playerTransform != null ? playerTransform.position : Vector3.zero;
            currentSaveData.playerRotation = playerTransform != null ? playerTransform.rotation : Quaternion.identity;

            var inventory = FindObjectOfType<InventoryManager>();
            currentSaveData.inventoryItems = inventory != null ? inventory.GetItemIds() : new List<string>();

            var storyManager = FindObjectOfType<StoryManager>();
            currentSaveData.storyFlags = storyManager != null ? storyManager.GetStoryFlags() : new bool[10];
            currentSaveData.currentChapter = storyManager != null ? storyManager.GetCurrentChapter() : 0;

            currentSaveData.timeSinceLastSave = Time.time;
            currentSaveData.isLightsOn = FindObjectOfType<LightController>()?.IsLightsOn() ?? false;
            currentSaveData.isDoorLocked = FindObjectOfType<DoorController>()?.IsDoorLocked() ?? true;
            currentSaveData.monsterProximityAlert = FindObjectOfType<MonsterAI>()?.GetProximityAlertLevel() ?? 0f;

            string json = JsonUtility.ToJson(currentSaveData, true);
            File.WriteAllText(SaveFilePath, json);
            Debug.Log($"Game saved to: {SaveFilePath}");
        }
        catch (Exception e)
        {
            Debug.LogError($"Failed to save game: {e.Message}");
        }
    }

    public void LoadGame()
    {
        if (!File.Exists(SaveFilePath))
        {
            Debug.LogWarning("No save file found. Starting new game.");
            InitializeNewGame();
            return;
        }

        try
        {
            string json = File.ReadAllText(SaveFilePath);
            currentSaveData = JsonUtility.FromJson<SaveData>(json);

            ApplySavedData();
            Debug.Log($"Game loaded from: {SaveFilePath}");
        }
        catch (Exception e)
        {
            Debug.LogError($"Failed to load game: {e.Message}. Starting new game.");
            InitializeNewGame();
        }
    }

    private void ApplySavedData()
    {
        var playerHealth = FindObjectOfType<PlayerHealth>();
        if (playerHealth != null)
        {
            playerHealth.SetHealth(currentSaveData.playerHealth);
            playerHealth.SetMaxHealth(currentSaveData.playerMaxHealth);
        }

        var playerController = FindObjectOfType<PlayerController>();
        if (playerController != null)
        {
            playerController.TeleportTo(currentSaveData.playerPosition, currentSaveData.playerRotation);
        }

        var inventoryManager = FindObjectOfType<InventoryManager>();
        if (inventoryManager != null)
        {
            inventoryManager.SetItems(currentSaveData.inventoryItems);
        }

        var storyManager = FindObjectOfType<StoryManager>();
        if (storyManager != null)
        {
            storyManager.SetStoryFlags(currentSaveData.storyFlags);
            storyManager.SetCurrentChapter(currentSaveData.currentChapter);
        }

        var lightController = FindObjectOfType<LightController>();
        if (lightController != null)
        {
            lightController.SetLightsOn(currentSaveData.isLightsOn);
        }

        var doorController = FindObjectOfType<DoorController>();
        if (doorController != null)
        {
            doorController.SetDoorLocked(currentSaveData.isDoorLocked);
        }

        var monsterAI = FindObjectOfType<MonsterAI>();
        if (monsterAI != null)
        {
            monsterAI.SetProximityAlertLevel(currentSaveData.monsterProximityAlert);
        }
    }

    private void InitializeNewGame()
    {
        currentSaveData = new SaveData
        {
            playerHealth = 100f,
            playerMaxHealth = 100f,
            playerPosition = new Vector3(0f, 1f, 0f),
            playerRotation = Quaternion.identity,
            inventoryItems = new List<string>(),
            storyFlags = new bool[10],
            currentChapter = 0,
            timeSinceLastSave = 0f,
            isLightsOn = false,
            isDoorLocked = true,
            monsterProximityAlert = 0f
        };

        ApplySavedData();
        Debug.Log("Initialized new game with default values.");
    }

    public void DeleteSave()
    {
        if (File.Exists(SaveFilePath))
        {
            File.Delete(SaveFilePath);
            Debug.Log("Save file deleted.");
            InitializeNewGame();
        }
    }

    public bool HasSaveFile() => File.Exists(SaveFilePath);
}