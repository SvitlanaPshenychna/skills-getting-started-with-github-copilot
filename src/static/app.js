document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;


          // Create participants list HTML with delete buttons
          let participantsHTML = '';
          if (details.participants && details.participants.length > 0) {
            participantsHTML = `
              <div class="participants-section">
                <strong>Participants:</strong>
                <ul>
                  ${details.participants
                    .map(
                      (p) =>
                        `<li><span class="participant-name">${p.split("@")[0]}</span> <button class="participant-remove" data-email="${p}" title="Remove ${p}">\u{1F5D1}</button></li>`
                    )
                    .join("")}
                </ul>
              </div>
            `;
          } else {
            participantsHTML = `
              <div class="participants-section">
                <strong>Participants:</strong>
                <p class="no-participants">No participants yet</p>
              </div>
            `;
          }

          activityCard.innerHTML = `
            <h4 class="activity-name">${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
            ${participantsHTML}
          `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      // Delegated click handler is registered once below (outside fetchActivities)
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities immediately so new participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Attach delegated click handler for participant removal (registered once)
  activitiesList.addEventListener("click", async (ev) => {
    const btn = ev.target.closest && ev.target.closest(".participant-remove");
    if (!btn) return;

    const email = btn.dataset.email;
    const card = btn.closest(".activity-card");
    const activityNameEl = card && card.querySelector(".activity-name");
    const activityName = activityNameEl ? activityNameEl.textContent : null;

    if (!activityName || !email) return;

    if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (res.ok) {
        // Refresh activities to reflect change
        fetchActivities();
        messageDiv.textContent = data.message || "Participant removed";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      } else {
        messageDiv.textContent = data.detail || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      messageDiv.textContent = "Failed to remove participant";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  fetchActivities();
});
