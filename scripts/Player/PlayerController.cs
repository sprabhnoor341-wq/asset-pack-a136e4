// Controls player movement, interaction, and horror mechanics like sanity and monster detection in a cozy forest cabin horror game.

using UnityEngine;
using UnityEngine.UI;

public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 5f;
    public float sprintMultiplier = 1.5f;
    public float rotationSpeed = 10f;

    [Header("Sanity & Horror")]
    public float maxSanity = 100f;
    public float currentSanity;
    public float sanityDrainRate = 5f; // per second when near monster or in dark
    public float sanityRecoveryRate = 2f; // per second when safe and rested
    public Image sanityUI; // Reference to UI Image for sanity bar

    [Header("Detection")]
    public float monsterDetectionRadius = 10f;
    public LayerMask monsterLayer;
    public bool isMonsterNear => Physics.CheckSphere(transform.position, monsterDetectionRadius, monsterLayer);

    [Header("Audio")]
    public AudioSource heartbeatAudio;
    public float minHeartbeatPitch = 0.8f;
    public float maxHeartbeatPitch = 2.0f;

    private CharacterController controller;
    private Animator animator;
    private bool isSprinting = false;

    void Start()
    {
        controller = GetComponent<CharacterController>();
        animator = GetComponent<Animator>();
        currentSanity = maxSanity;
        UpdateSanityUI();
    }

    void Update()
    {
        HandleMovement();
        HandleSprint();
        UpdateSanity();
        UpdateHeartbeat();
        UpdateAnimations();
    }

    void HandleMovement()
    {
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        Vector3 moveDirection = new Vector3(horizontal, 0f, vertical);
        moveDirection = transform.TransformDirection(moveDirection);
        moveDirection.Normalize();

        float speed = moveSpeed * (isSprinting ? sprintMultiplier : 1f);
        controller.Move(moveDirection * speed * Time.deltaTime);

        if (moveDirection != Vector3.zero)
        {
            Quaternion targetRotation = Quaternion.LookRotation(moveDirection);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
        }
    }

    void HandleSprint()
    {
        isSprinting = Input.GetKey(KeyCode.LeftShift) && !animator.GetCurrentAnimatorStateInfo(0).IsName("Idle");
    }

    void UpdateSanity()
    {
        if (isMonsterNear || IsInDarkArea())
        {
            currentSanity = Mathf.Max(0f, currentSanity - sanityDrainRate * Time.deltaTime);
        }
        else
        {
            currentSanity = Mathf.Min(maxSanity, currentSanity + sanityRecoveryRate * Time.deltaTime);
        }

        UpdateSanityUI();

        // Optional: Trigger horror effects at low sanity
        if (currentSanity <= 20f && !heartbeatAudio.isPlaying)
        {
            heartbeatAudio.Play();
        }
        else if (currentSanity > 30f)
        {
            heartbeatAudio.Stop();
        }
    }

    bool IsInDarkArea()
    {
        // Simple placeholder: check if player is far from light sources (e.g., cabin lights)
        // In a full game, this would use light probes or trigger zones
        Collider[] lights = Physics.OverlapSphere(transform.position, 15f, LayerMask.GetMask("Light"));
        return lights.Length == 0;
    }

    void UpdateSanityUI()
    {
        if (sanityUI != null)
        {
            sanityUI.fillAmount = currentSanity / maxSanity;
        }
    }

    void UpdateHeartbeat()
    {
        if (heartbeatAudio != null && heartbeatAudio.isPlaying)
        {
            float t = Mathf.InverseLerp(0f, maxSanity, currentSanity); // 1 = full sanity, 0 = empty
            float pitch = Mathf.Lerp(maxHeartbeatPitch, minHeartbeatPitch, t);
            heartbeatAudio.pitch = pitch;
        }
    }

    void UpdateAnimations()
    {
        bool isMoving = controller.velocity.magnitude > 0.1f;
        animator.SetBool("IsMoving", isMoving);
        animator.SetBool("IsSprinting", isSprinting && isMoving);
    }

    // Optional: Call this when player interacts with objects (e.g., door, lamp)
    public void Interact()
    {
        RaycastHit hit;
        if (Physics.Raycast(transform.position + Vector3.up, transform.forward, out hit, 3f))
        {
            var interactable = hit.collider.GetComponent<IInteractable>();
            if (interactable != null)
            {
                interactable.OnInteract();
            }
        }
    }
}

// Interface for interactable objects (to be implemented by doors, lamps, etc.)
public interface IInteractable
{
    void OnInteract();
}