Manages the panic UI elements that appear when the monster is near, including a heartbeat sound, screen shake, and fading vignette to convey player fear.

using UnityEngine;
using UnityEngine.UI;
using System.Collections;

public class PanicUI : MonoBehaviour
{
    [Header("UI Elements")]
    [SerializeField] private Image vignette;
    [SerializeField] private Image heartbeatPulse;
    [SerializeField] private AudioSource heartbeatSound;

    [Header("Settings")]
    [SerializeField] private float maxVignetteIntensity = 0.8f;
    [SerializeField] private float pulseSpeed = 2f;
    [SerializeField] private float heartbeatBaseVolume = 0.3f;
    [SerializeField] private float heartbeatMaxVolume = 0.9f;
    [SerializeField] private float shakeIntensity = 0.05f;
    [SerializeField] private float shakeSpeed = 10f;

    private float currentPanic = 0f; // 0 to 1, where 1 is max panic
    private Vector3 originalPosition;
    private Coroutine shakeCoroutine;

    void Awake()
    {
        if (vignette == null || heartbeatPulse == null || heartbeatSound == null)
        {
            Debug.LogError("PanicUI: Missing required UI references. Assign vignette, heartbeatPulse, and heartbeatSound in the Inspector.");
            enabled = false;
            return;
        }

        originalPosition = transform.position;
        vignette.color = new Color(vignette.color.r, vignette.color.g, vignette.color.b, 0f);
        heartbeatPulse.color = new Color(heartbeatPulse.color.r, heartbeatPulse.color.g, heartbeatPulse.color.b, 0f);
        heartbeatSound.volume = 0f;
    }

    void Update()
    {
        UpdateVignette();
        UpdateHeartbeatPulse();
        UpdateHeartbeatSound();
        ApplyScreenShake();
    }

    public void SetPanicLevel(float level)
    {
        currentPanic = Mathf.Clamp01(level);
    }

    private void UpdateVignette()
    {
        float targetAlpha = maxVignetteIntensity * currentPanic;
        vignette.color = new Color(vignette.color.r, vignette.color.g, vignette.color.b, Mathf.Lerp(vignette.color.a, targetAlpha, Time.deltaTime * 5f));
    }

    private void UpdateHeartbeatPulse()
    {
        float pulseAlpha = Mathf.PingPong(Time.time * pulseSpeed, 1f) * currentPanic;
        heartbeatPulse.color = new Color(heartbeatPulse.color.r, heartbeatPulse.color.g, heartbeatPulse.color.b, pulseAlpha);
    }

    private void UpdateHeartbeatSound()
    {
        float targetVolume = Mathf.Lerp(heartbeatBaseVolume, heartbeatMaxVolume, currentPanic);
        heartbeatSound.volume = Mathf.Lerp(heartbeatSound.volume, targetVolume, Time.deltaTime * 3f);
        if (!heartbeatSound.isPlaying && currentPanic > 0.1f)
            heartbeatSound.Play();
        else if (heartbeatSound.isPlaying && currentPanic <= 0.1f)
            heartbeatSound.Stop();
    }

    private void ApplyScreenShake()
    {
        if (currentPanic <= 0.01f)
        {
            if (shakeCoroutine != null)
            {
                StopCoroutine(shakeCoroutine);
                shakeCoroutine = null;
            }
            transform.position = originalPosition;
            return;
        }

        if (shakeCoroutine == null)
            shakeCoroutine = StartCoroutine(ShakeRoutine());
    }

    private IEnumerator ShakeRoutine()
    {
        while (true)
        {
            float offsetX = Random.Range(-shakeIntensity, shakeIntensity) * currentPanic;
            float offsetY = Random.Range(-shakeIntensity, shakeIntensity) * currentPanic;
            transform.position = originalPosition + new Vector3(offsetX, offsetY, 0f);
            yield return null;
        }
    }
}