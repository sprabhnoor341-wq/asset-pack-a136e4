This script manages the interior environment of the cabin, including lighting, sound ambience, and interactive objects to enhance the cozy yet tense atmosphere before the monster outside becomes apparent.  
using UnityEngine;  
using System.Collections;  

public class CabinInterior : MonoBehaviour  
{  
    [Header("Lighting")]  
    public Light fireplaceLight;  
    public float fireplaceFlickerMin = 0.8f;  
    public float fireplaceFlickerMax = 1.2f;  
    public float flickerSpeed = 0.3f;  

    [Header("Ambience")]  
    public AudioSource windAudio;  
    public AudioSource creakAudio;  
    public float creakIntervalMin = 8f;  
    public float creakIntervalMax = 15f;  

    [Header("Interactive Objects")]  
    public GameObject lantern;  
    public bool lanternLit = true;  
    public Light lanternLight;  

    private float _creakTimer;  
    private bool _isPlayerInside = false;  

    void Start()  
    {  
        if (fireplaceLight == null)  
            fireplaceLight = GetComponentInChildren<Light>();  

        if (lanternLight == null && lantern != null)  
            lanternLight = lantern.GetComponentInChildren<Light>();  

        _creakTimer = Random.Range(creakIntervalMin, creakIntervalMax);  

        // Start ambient coroutines  
        StartCoroutine(FlickerFireplace());  
        StartCoroutine(PlayCreaks());  
    }  

    void Update()  
    {  
        // Optional: Toggle lantern with 'F' key for player interaction  
        if (Input.GetKeyDown(KeyCode.F) && lantern != null)  
        {  
            lanternLit = !lanternLit;  
            lanternLight.enabled = lanternLit;  
        }  
    }  

    IEnumerator FlickerFireplace()  
    {  
        while (true)  
        {  
            if (fireplaceLight != null)  
            {  
                fireplaceLight.intensity = Random.Range(fireplaceFlickerMin, fireplaceFlickerMax);  
            }  
            yield return new WaitForSeconds(flickerSpeed);  
        }  
    }  

    IEnumerator PlayCreaks()  
    {  
        while (true)  
        {  
            yield return new WaitForSeconds(_creakTimer);  
            if (creakAudio != null && !creakAudio.isPlaying)  
            {  
                creakAudio.Play();  
                _creakTimer = Random.Range(creakIntervalMin, creakIntervalMax);  
            }  
        }  
    }  

    // Called by player trigger when entering cabin  
    public void OnPlayerEnter()  
    {  
        _isPlayerInside = true;  
        if (windAudio != null)  
            windAudio.volume = 0.3f; // Muffle wind inside  
    }  

    // Called by player trigger when exiting cabin  
    public void OnPlayerExit()  
    {  
        _isPlayerInside = false;  
        if (windAudio != null)  
            windAudio.volume = 1.0f; // Restore wind outside  
    }  

    // Optional: Play a sudden loud creak for jump scare  
    public void PlaySuddenCreak()  
    {  
        if (creakAudio != null)  
        {  
            creakAudio.PlayOneShot(creakAudio.clip);  
        }  
    }  
}