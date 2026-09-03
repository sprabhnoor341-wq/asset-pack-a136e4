This script controls the outside monster's behavior, including patrolling, detecting the player, and triggering horror events when the player is near the cabin.  
using UnityEngine;
using System.Collections;

public class OutsideMonster : MonoBehaviour
{
    [Header("Patrol Settings")]
    [Tooltip("Points the monster patrols between (set in Inspector)")]
    public Transform[] patrolPoints;
    [Tooltip("Speed at which the monster moves between patrol points")]
    public float patrolSpeed = 1.5f;
    [Tooltip("How long the monster waits at each patrol point before moving on")]
    public float waitTime = 2f;

    [Header("Detection Settings")]
    [Tooltip("Radius within which the monster can detect the player")]
    public float detectionRadius = 8f;
    [Tooltip("Angle of the monster's forward-facing vision cone (in degrees)")]
    public float visionAngle = 60f;
    [Tooltip("Layers considered as obstacles for line-of-sight checks")]
    public LayerMask obstacleMask;
    [Tooltip("Tag assigned to the player object")]
    public string playerTag = "Player";

    [Header("Horror Events")]
    [Tooltip("Prefab to instantiate when the monster spots the player (e.g., jump scare, sound, visual effect)")]
    public GameObject horrorEffectPrefab;
    [Tooltip("How long to wait after triggering horror effect before resetting detection")]
    public float horrorCooldown = 5f;

    private int currentPatrolIndex = 0;
    private float waitTimer = 0f;
    private bool isWaiting = false;
    private Transform player;
    private bool hasSeenPlayer = false;
    private float horrorCooldownTimer = 0f;

    void Start()
    {
        // Find the player by tag at start
        GameObject playerObj = GameObject.FindGameObjectWithTag(playerTag);
        if (playerObj != null)
            player = playerObj.transform;
        else
            Debug.LogWarning("OutsideMonster: No player found with tag '" + playerTag + "'. Detection disabled.");

        // If no patrol points are set, monster stays idle
        if (patrolPoints == null || patrolPoints.Length == 0)
        {
            Debug.LogWarning("OutsideMonster: No patrol points assigned. Monster will not patrol.");
            patrolPoints = new Transform[1] { transform }; // Default to current position
        }
    }

    void Update()
    {
        // Handle horror cooldown
        if (horrorCooldownTimer > 0f)
        {
            horrorCooldownTimer -= Time.deltaTime;
            return; // Skip behavior during cooldown
        }

        // If player is detected and we haven't triggered horror yet this cycle
        if (player != null && !hasSeenPlayer && CanSeePlayer())
        {
            TriggerHorrorEffect();
            hasSeenPlayer = true;
            horrorCooldownTimer = horrorCooldown;
            return;
        }

        // Reset detection if player is no longer visible (for re-triggering later)
        if (player != null && hasSeenPlayer && !CanSeePlayer())
        {
            hasSeenPlayer = false;
        }

        // Patrol behavior
        if (patrolPoints.Length > 0)
        {
            Patrol();
        }
    }

    bool CanSeePlayer()
    {
        if (player == null) return false;

        Vector3 directionToPlayer = player.position - transform.position;
        float distanceToPlayer = directionToPlayer.magnitude;

        // Check if player is within detection radius
        if (distanceToPlayer > detectionRadius)
            return false;

        // Check if player is within vision cone
        directionToPlayer.Normalize();
        float angle = Vector3.Angle(transform.forward, directionToPlayer);
        if (angle > visionAngle * 0.5f)
            return false;

        // Check for obstacles (line of sight)
        if (Physics.Raycast(transform.position, directionToPlayer, distanceToPlayer, obstacleMask))
            return false;

        return true;
    }

    void TriggerHorrorEffect()
    {
        if (horrorEffectPrefab != null)
        {
            Instantiate(horrorEffectPrefab, transform.position, Quaternion.identity);
            // Optional: Play a sound or trigger cabin lights flicker via event system here
            Debug.Log("OutsideMonster: Horror effect triggered! Player spotted.");
        }
        else
        {
            Debug.LogWarning("OutsideMonster: Horror effect prefab is not assigned.");
        }
    }

    void Patrol()
    {
        if (patrolPoints.Length == 0) return;

        Transform targetPoint = patrolPoints[currentPatrolIndex];
        Vector3 direction = (targetPoint.position - transform.position).normalized;

        // Move toward current patrol point
        transform.position += direction * patrolSpeed * Time.deltaTime;
        transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), Time.deltaTime * 5f);

        // Check if we've reached the point
        if (Vector3.Distance(transform.position, targetPoint.position) < 0.1f)
        {
            if (!isWaiting)
            {
                isWaiting = true;
                waitTimer = waitTime;
            }
            else
            {
                waitTimer -= Time.deltaTime;
                if (waitTimer <= 0f)
                {
                    isWaiting = false;
                    currentPatrolIndex = (currentPatrolIndex + 1) % patrolPoints.Length;
                }
            }
        }
        else
        {
            isWaiting = false; // Reset wait timer if we start moving again
        }
    }

    // Optional: Draw gizmos for debugging patrol path and vision cone
    void OnDrawGizmosSelected()
    {
        // Draw patrol path
        if (patrolPoints != null && patrolPoints.Length > 0)
        {
            Gizmos.color = Color.yellow;
            for (int i = 0; i < patrolPoints.Length; i++)
            {
                if (patrolPoints[i] != null)
                {
                    Gizmos.DrawSphere(patrolPoints[i].position, 0.2f);
                    if (i < patrolPoints.Length - 1 && patrolPoints[i + 1] != null)
                        Gizmos.DrawLine(patrolPoints[i].position, patrolPoints[i + 1].position);
                }
            }
            // Loop back to first point
            if (patrolPoints.Length > 1 && patrolPoints[0] != null && patrolPoints[patrolPoints.Length - 1] != null)
                Gizmos.DrawLine(patrolPoints[patrolPoints.Length - 1].position, patrolPoints[0].position);
        }

        // Draw detection radius
        Gizmos.color = new Color(1f, 0f, 0f, 0.2f);
        Gizmos.DrawSphere(transform.position, detectionRadius);

        // Draw vision cone
        Gizmos.color = new Color(1f, 0f, 0f, 0.3f);
        Vector3 leftBoundary = Quaternion.Euler(0, -visionAngle * 0.5f, 0) * transform.forward * detectionRadius;
        Vector3 rightBoundary = Quaternion.Euler(0, visionAngle * 0.5f, 0) * transform.forward * detectionRadius;
        Gizmos.DrawLine(transform.position, transform.position + leftBoundary);
        Gizmos.DrawLine(transform.position, transform.position + rightBoundary);
        Gizmos.DrawLine(transform.position + leftBoundary, transform.position + rightBoundary);
    }
}