This script makes a light flicker randomly to create a tense, atmospheric effect in a horror game.

using UnityEngine;

[RequireComponent(typeof(Light))]
public class LightFlicker : MonoBehaviour
{
    [Header("Flicker Settings")]
    [Tooltip("Minimum intensity the light can drop to (0-1)")]
    [Range(0f, 1f)] public float minIntensity = 0.3f;
    
    [Tooltip("Maximum intensity the light can reach (0-1)")]
    [Range(0f, 1f)] public float maxIntensity = 1.0f;
    
    [Tooltip("How often the light changes intensity (in seconds)")]
    [Range(0.1f, 5f)] public float flickerInterval = 0.2f;
    
    [Tooltip("How smoothly the light transitions between intensities")]
    [Range(0.01f, 1f)] public float smoothness = 0.1f;

    private Light lightComponent;
    private float targetIntensity;
    private float currentIntensity;
    private float timer;

    private void Awake()
    {
        lightComponent = GetComponent<Light>();
        if (lightComponent == null)
        {
            Debug.LogError("LightFlicker requires a Light component on the same GameObject.", this);
            enabled = false;
            return;
        }
        
        currentIntensity = lightComponent.intensity;
        targetIntensity = currentIntensity;
    }

    private void Update()
    {
        timer += Time.deltaTime;
        
        if (timer >= flickerInterval)
        {
            timer = 0f;
            targetIntensity = Random.Range(minIntensity, maxIntensity);
        }

        currentIntensity = Mathf.Lerp(currentIntensity, targetIntensity, smoothness * Time.deltaTime * 10f);
        lightComponent.intensity = currentIntensity;
    }
}