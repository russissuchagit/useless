const scanButton = document.getElementById('scanButton');
const unfollowButton = document.getElementById('unfollowButton');
const userListDiv = document.getElementById('userList');
const statusDiv = document.getElementById('status');
const controlsDiv = document.getElementById('controls');
const selectAllCheckbox = document.getElementById('selectAll');

let currentUsers = []; // To store the scanned users

// --- Helper Functions ---
function updateStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.color = isError ? 'red' : '#555';
    console.log(message); // Also log to console for debugging
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Event Listeners ---
scanButton.addEventListener('click', async () => {
    updateStatus('Scanning initiated...');
    scanButton.disabled = true;
    userListDiv.innerHTML = ''; // Clear previous list
    controlsDiv.style.display = 'none';
    selectAllCheckbox.checked = false;
    currentUsers = [];

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.includes("instagram.com")) {
            updateStatus('Error: Please navigate to your Instagram profile and open the "Following" list first.', true);
            scanButton.disabled = false;
            return;
        }

        // Send message to content script to start scanning
        const response = await chrome.tabs.sendMessage(tab.id, { action: "scanFollowing" });

        if (chrome.runtime.lastError) {
             updateStatus(`Error: ${chrome.runtime.lastError.message}. Did you reload the extension after changes?`, true);
             scanButton.disabled = false;
             return;
        }

        if (response && response.users && response.users.length > 0) {
            currentUsers = response.users;
            displayUsers(currentUsers);
            updateStatus(`Scan complete. Found ${currentUsers.length} users. Select users to unfollow.`);
            controlsDiv.style.display = 'block';
        } else if (response && response.error) {
             updateStatus(`Error from page: ${response.error}`, true);
        }
         else {
            updateStatus('No users found. Ensure the "Following" list is open and visible.', true);
        }
    } catch (error) {
        updateStatus(`Error: ${error.message}. Is the Instagram page fully loaded? Is the 'Following' list open?`, true);
        console.error("Scanning error:", error);
    } finally {
        scanButton.disabled = false;
    }
});

unfollowButton.addEventListener('click', async () => {
    const selectedUsers = [];
    const checkboxes = userListDiv.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        updateStatus('No users selected to unfollow.', true);
        return;
    }

    checkboxes.forEach(checkbox => {
        selectedUsers.push(checkbox.value); // The value is the username
    });

    updateStatus(`Starting to unfollow ${selectedUsers.length} users... This will take time.`);
    unfollowButton.disabled = true;
    scanButton.disabled = true;
    selectAllCheckbox.disabled = true;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
             throw new Error("Could not get active tab.");
        }

        // Send message to content script to start unfollowing
         const response = await chrome.tabs.sendMessage(tab.id, {
             action: "unfollowUsers",
             usernames: selectedUsers
         });

         if(chrome.runtime.lastError) {
             updateStatus(`Error sending unfollow request: ${chrome.runtime.lastError.message}`, true);
         } else if (response && response.success) {
            updateStatus(`Successfully unfollowed ${response.unfollowedCount} of ${selectedUsers.length} users. Failures: ${response.failedCount}. Refresh the list to see changes.`);
            // Optionally re-scan or remove unfollowed users from the UI
         } else if (response && response.error) {
             updateStatus(`Unfollow Error: ${response.error}`, true);
         } else {
             updateStatus(`Unfollow process completed or stopped. Check console for details.`, true);
         }

    } catch (error) {
        updateStatus(`Error during unfollow process: ${error.message}`, true);
        console.error("Unfollowing error:", error);
    } finally {
        unfollowButton.disabled = false;
        scanButton.disabled = false;
        selectAllCheckbox.disabled = false;
        // Consider re-enabling checkboxes after completion/error
    }
});


selectAllCheckbox.addEventListener('change', (event) => {
    const checkboxes = userListDiv.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked;
    });
});


// --- UI Population ---
function displayUsers(users) {
    userListDiv.innerHTML = ''; // Clear previous content
    if (!users || users.length === 0) {
        userListDiv.innerHTML = '<p>No users found.</p>';
        return;
    }

    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = user.username; // Store username in value
        checkbox.id = `user-${user.username}`;

        const label = document.createElement('label');
        label.setAttribute('for', `user-${user.username}`);
        // Display username, link could be added if needed
        label.textContent = user.username + (user.fullName ? ` (${user.fullName})` : '');
        // Optional: Add profile link for easy checking
        // const link = document.createElement('a');
        // link.href = user.profileUrl;
        // link.textContent = user.username + (user.fullName ? ` (${user.fullName})` : '');
        // link.target = "_blank"; // Open in new tab
        // label.appendChild(link);


        div.appendChild(checkbox);
        div.appendChild(label);
        userListDiv.appendChild(div);
    });
}

// Initial status message
updateStatus("Ready. Open your 'Following' list on Instagram first.");