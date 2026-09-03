Manages the player's inventory, allowing items to be added, removed, and checked for use in puzzles or survival mechanics.

using System.Collections.Generic;
using UnityEngine;

public class Inventory : MonoBehaviour
{
    // List to hold items currently in the player's inventory
    private List<string> items = new List<string>();

    // Adds an item to the inventory
    public void AddItem(string itemName)
    {
        if (string.IsNullOrEmpty(itemName)) return;
        items.Add(itemName);
        Debug.Log("Added: " + itemName);
    }

    // Removes an item from the inventory if it exists
    public bool RemoveItem(string itemName)
    {
        if (string.IsNullOrEmpty(itemName)) return false;
        bool removed = items.Remove(itemName);
        if (removed)
            Debug.Log("Removed: " + itemName);
        else
            Debug.LogWarning("Item not found: " + itemName);
        return removed;
    }

    // Checks if the player has a specific item in their inventory
    public bool HasItem(string itemName)
    {
        if (string.IsNullOrEmpty(itemName)) return false;
        return items.Contains(itemName);
    }

    // Returns a copy of the current inventory list (read-only access)
    public List<string> GetItems()
    {
        return new List<string>(items);
    }

    // Clears all items from the inventory (useful for resetting or game over)
    public void Clear()
    {
        items.Clear();
        Debug.Log("Inventory cleared.");
    }
}