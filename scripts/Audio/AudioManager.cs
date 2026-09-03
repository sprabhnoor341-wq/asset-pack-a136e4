Manages all audio playback including background music, ambient sounds, and sound effects for the cozy forest cabin horror game.

using UnityEngine;
using System.Collections.Generic;

public class AudioManager : MonoBehaviour
{
    [Header("Audio Sources")]
    public AudioSource musicSource;     // For looping background music
    public AudioSource sfxSource;       // For one-shot sound effects
    public AudioSource ambientSource;   // For ambient environmental sounds (wind, creaks, etc.)

    [Header("Audio Clips")]
    public AudioClip[] musicTracks;     // List of background music tracks (looping)
    public AudioClip[] ambientClips;    // Ambient sounds (wind, rain, distant animal noises)
    public AudioClip[] sfxClips;        // Sound effects (door creak, footstep, monster growl, etc.)

    [Header("Settings")]
    [Range(0f, 1f)] public float musicVolume = 0.5f;
    [Range(0f, 1f)] public float sfxVolume = 0.7f;
    [Range(0f, 1f)] public float ambientVolume = 0.4f;

    private int currentMusicIndex = 0;
    private float ambientTimer = 0f;
    private float ambientIntervalMin = 8f;
    private float ambientIntervalMax = 15f;
    private float nextAmbientTime;

    void Awake()
    {
        // Ensure only one AudioManager exists
        if (FindObjectsOfType<AudioManager>().Length > 1)
        {
            Destroy(gameObject);
            return;
        }
        DontDestroyOnLoad(gameObject);

        InitializeAudioSources();
        PlayRandomMusic();
        ScheduleNextAmbient();
    }

    void InitializeAudioSources()
    {
        if (musicSource == null) musicSource = gameObject.AddComponent<AudioSource>();
        if (sfxSource == null) sfxSource = gameObject.AddComponent<AudioSource>();
        if (ambientSource == null) ambientSource = gameObject.AddComponent<AudioSource>();

        musicSource.loop = true;
        musicSource.playOnAwake = false;
        sfxSource.loop = false;
        sfxSource.playOnAwake = false;
        ambientSource.loop = false;
        ambientSource.playOnAwake = false;

        musicSource.volume = musicVolume;
        sfxSource.volume = sfxVolume;
        ambientSource.volume = ambientVolume;
    }

    void Update()
    {
        // Handle ambient sound scheduling
        ambientTimer += Time.deltaTime;
        if (ambientTimer >= nextAmbientTime)
        {
            PlayRandomAmbient();
            ScheduleNextAmbient();
        }
    }

    void ScheduleNextAmbient()
    {
        ambientTimer = 0f;
        nextAmbientTime = Random.Range(ambientIntervalMin, ambientIntervalMax);
    }

    public void PlayRandomMusic()
    {
        if (musicTracks.Length == 0) return;

        currentMusicIndex = Random.Range(0, musicTracks.Length);
        musicSource.clip = musicTracks[currentMusicIndex];
        musicSource.Play();
    }

    public void PlayRandomAmbient()
    {
        if (ambientClips.Length == 0) return;
        int index = Random.Range(0, ambientClips.Length);
        ambientSource.clip = ambientClips[index];
        ambientSource.Play();
    }

    public void PlaySFX(string clipName)
    {
        AudioClip clip = System.Array.Find(sfxClips, c => c.name == clipName);
        if (clip != null)
        {
            sfxSource.PlayOneShot(clip, sfxVolume);
        }
        else
        {
            Debug.LogWarning($"AudioManager: SFX clip '{clipName}' not found.");
        }
    }

    public void PlaySFXAtPosition(string clipName, Vector3 position)
    {
        AudioClip clip = System.Array.Find(sfxClips, c => c.name == clipName);
        if (clip != null)
        {
            AudioSource.PlayClipAtPoint(clip, position, sfxVolume);
        }
        else
        {
            Debug.LogWarning($"AudioManager: SFX clip '{clipName}' not found for positional play.");
        }
    }

    public void SetMusicVolume(float volume)
    {
        musicVolume = Mathf.Clamp01(volume);
        if (musicSource != null) musicSource.volume = musicVolume;
    }

    public void SetSFXVolume(float volume)
    {
        sfxVolume = Mathf.Clamp01(volume);
        if (sfxSource != null) sfxSource.volume = sfxVolume;
    }

    public void SetAmbientVolume(float volume)
    {
        ambientVolume = Mathf.Clamp01(volume);
        if (ambientSource != null) ambientSource.volume = ambientVolume;
    }

    public void StopMusic()
    {
        if (musicSource != null) musicSource.Stop();
    }

    public void PauseMusic()
    {
        if (musicSource != null) musicSource.Pause();
    }

    public void UnpauseMusic()
    {
        if (musicSource != null && !musicSource.isPlaying) musicSource.UnPause();
    }
}