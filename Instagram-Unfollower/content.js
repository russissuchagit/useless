console.log("Instagram Unfollower Content Script Loaded");

// --- Helper Functions ---
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// **IMPORTANT**: These selectors WILL change when Instagram updates its website.
// You will need to inspect the elements in your browser's developer tools
// (right-click -> Inspect) on the "Following" list modal to find the new ones.
const SELECTORS = {
    // Selector for the scrollable container holding the list of users in the modal
    followingModalScrollableList: 'div._aano', // Example: Might be a div with a specific class like _aano
    // Selector for each user item LI within the scrollable list
    userListItem: 'div.x1dm5mii.x16mil14.xiojian.x1yutycm.x1lliihq.xr9ek0c.x1n2onr6.xh8yej3', // Complex example, likely to change
    // Selector for the username link/span within a user list item
    usernameSpan: 'span._ap3a._aaco._aacw._aacx._aad7._aade', // Example, inspect carefully
    // Selector for the full name span within a user list item (optional)
    fullNameSpan: 'span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x1 Lw97py.x71tmk0.x1pk1 V4', // Example, inspect carefully
    // Selector for the "Following" button next to a user in the list
    followingButton: 'button._acan._acap._acas._aj1-', // Example for the button you click to initiate unfollow
    // Selector for the final "Unfollow" confirmation button in the small popup
    unfollowConfirmButton: 'button._a9--._a9_1' // Example for the red confirmation button
};


// --- Core Logic Functions ---

async function scanFollowingList() {
    console.log("Scanning following list...");
    const users = [];
    const scannedUsernames = new Set();

    const modalList = document.querySelector(SELECTORS.followingModalScrollableList);
    if (!modalList) {
        console.error("Could not find the following list container. Selector might be outdated:", SELECTORS.followingModalScrollableList);
        return { error: "Could not find the 'Following' list container. Is the modal open? Selector might need updating." };
    }

    let lastScrollHeight = 0;
    let attempts = 0;
    const maxAttempts = 20; // Limit scroll attempts to prevent infinite loops

    // Scroll down to load all users
    while (attempts < maxAttempts) {
        modalList.scrollTop = modalList.scrollHeight;
        await delay(1500); // Wait for content to potentially load (increase if needed)

        if (modalList.scrollHeight === lastScrollHeight) {
            // If scroll height hasn't changed, try one more time after a longer delay
            await delay(2500);
             if (modalList.scrollHeight === lastScrollHeight) {
                console.log("Scrolling seems complete.");
                break; // Assume we've reached the bottom
             }
        }
        lastScrollHeight = modalList.scrollHeight;
        attempts++;
        console.log(`Scrolling... Attempt ${attempts}`);

         // Extract users currently visible
        const userElements = modalList.querySelectorAll(SELECTORS.userListItem);
        console.log(`Found ${userElements.length} user elements currently in view.`);

        userElements.forEach(item => {
            const usernameEl = item.querySelector(SELECTORS.usernameSpan);
            const fullNameEl = item.querySelector(SELECTORS.fullNameSpan); // Optional

            const username = usernameEl ? usernameEl.textContent.trim() : null;

            if (username && !scannedUsernames.has(username)) {
                 const fullName = fullNameEl ? fullNameEl.textContent.trim() : '';
                 const profileUrl = `https://www.instagram.com/${username}/`; // Construct URL
                 users.push({ username, fullName, profileUrl });
                 scannedUsernames.add(username);
                 // console.log(`Added: ${username}`); // Log added users for debugging
            } else if (!username) {
                 // console.warn("Could not extract username from an item. Selector might be wrong:", SELECTORS.usernameSpan, item);
            }
        });
         console.log(`Total unique users collected so far: ${scannedUsernames.size}`);
    }

    if (attempts >= maxAttempts) {
        console.warn("Reached max scroll attempts. Might not have loaded all users.");
    }

    console.log(`Finished scanning. Found ${users.length} unique users.`);
    if (users.length === 0) {
         return { error: "Found 0 users. Check if the list is open and if selectors are correct: " + SELECTORS.userListItem };
    }
    return { users };
}


async function unfollowUsers(usernamesToUnfollow) {
    console.log("Starting unfollow process for:", usernamesToUnfollow);
    let unfollowedCount = 0;
    let failedCount = 0;

    const modalList = document.querySelector(SELECTORS.followingModalScrollableList);
    if (!modalList) {
        console.error("Could not find the following list container for unfollowing.");
        return { error: "Could not find the 'Following' list container. Cannot proceed with unfollow.", unfollowedCount, failedCount };
    }

    // It's often better to re-query the list items *inside* the loop in case the DOM changes slightly
    // But for simplicity here, we query once. A more robust solution might re-find the user each time.

    for (const username of usernamesToUnfollow) {
        console.log(`Attempting to unfollow ${username}...`);
        let userItemFound = false;

         // Find the specific user item in the list - Scroll into view might be needed for long lists
         const allUserItems = modalList.querySelectorAll(SELECTORS.userListItem);
         for (const item of allUserItems) {
             const usernameEl = item.querySelector(SELECTORS.usernameSpan);
             if (usernameEl && usernameEl.textContent.trim() === username) {
                 userItemFound = true;
                 try {
                    // Scroll the item into view slightly just in case it helps stability
                    item.scrollIntoView({ block: 'center' });
                    await delay(500); // Short delay after scrolling

                     const followingButton = item.querySelector(SELECTORS.followingButton);
                     if (!followingButton || !followingButton.offsetParent) { // Check if visible
                         console.error(`Could not find visible 'Following' button for ${username}. Selector: ${SELECTORS.followingButton}`);
                         failedCount++;
                         continue; // Skip to next user
                     }

                     console.log(`   Clicking 'Following' button for ${username}`);
                     followingButton.click();
                     await delay(1500); // Wait for the confirmation dialog (adjust timing as needed)

                     // Find the CONFIRM Unfollow button (usually in a different modal/dialog)
                     // This selector needs to target the *document* because the confirmation pops up elsewhere
                     const confirmButton = document.querySelector(SELECTORS.unfollowConfirmButton);
                     if (!confirmButton || !confirmButton.offsetParent) { // Check if visible
                         console.error(`Could not find visible 'Unfollow' confirmation button for ${username}. Selector: ${SELECTORS.unfollowConfirmButton}`);
                         // Try clicking the original button again sometimes closes the confirmation if it failed
                         // followingButton.click(); // Be careful with this
                         await delay(500);
                         failedCount++;
                         continue; // Skip to next user
                     }

                     console.log(`   Clicking 'Unfollow' confirmation button for ${username}`);
                     confirmButton.click();
                     unfollowedCount++;
                     console.log(`   Successfully initiated unfollow for ${username}.`);

                     // **CRUCIAL DELAY**: Wait a significant amount of time between unfollows
                     // Start with a longer delay (e.g., 5-10 seconds) to be safe.
                     // Reduce cautiously if needed, but aggressive unfollowing WILL get you blocked.
                     const unfollowDelay = 5000 + Math.random() * 3000; // 5-8 seconds random delay
                     console.log(`   Waiting ${unfollowDelay / 1000}s before next unfollow...`);
                     await delay(unfollowDelay);

                 } catch (err) {
                     console.error(`Error unfollowing ${username}:`, err);
                     failedCount++;
                     // Add a delay even after an error
                     await delay(2000);
                 }
                 break; // Move to the next username once processed
             }
         } // End loop through items on page

         if (!userItemFound) {
            console.warn(`Could not find list item for username: ${username}. Maybe they were already unfollowed or not loaded?`);
            failedCount++;
            await delay(1000); // Small delay even if not found
         }

    } // End loop through usernamesToUnfollow

    console.log(`Unfollow process finished. Success: ${unfollowedCount}, Failed: ${failedCount}`);
    return { success: true, unfollowedCount, failedCount };
}


// --- Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);

    if (request.action === "scanFollowing") {
        scanFollowingList()
            .then(response => {
                console.log("Sending scan response:", response);
                sendResponse(response);
            })
            .catch(error => {
                console.error("Error during scanFollowing:", error);
                sendResponse({ error: error.message || "An unknown error occurred during scan." });
            });
        return true; // Indicates that the response is sent asynchronously
    }

    if (request.action === "unfollowUsers") {
        if (!request.usernames || request.usernames.length === 0) {
            sendResponse({ error: "No usernames provided for unfollowing." });
            return false;
        }
        unfollowUsers(request.usernames)
            .then(response => {
                 console.log("Sending unfollow response:", response);
                 sendResponse(response);
            })
            .catch(error => {
                console.error("Error during unfollowUsers:", error);
                sendResponse({ error: error.message || "An unknown error occurred during unfollow." });
            });
        return true; // Indicates that the response is sent asynchronously
    }

    // Handle other potential messages here if needed

    console.log("Unknown message action:", request.action);
    return false; // No async response intended for unknown actions
});