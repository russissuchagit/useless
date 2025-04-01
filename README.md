How to Install and Use:
1.	Save the files: Create a folder (e.g., instagram-unfollower) and save the four files (manifest.json, popup.html, popup.js, content.js) inside it. Create the images subfolder and add the placeholder icon files.
2.	Open Chrome Extensions: Open Google Chrome, type chrome://extensions in the address bar, and press Enter.
3.	Enable Developer Mode: In the top-right corner, toggle "Developer mode" ON.
4.	Load Unpacked: Click the "Load unpacked" button that appears.
5.	Select Folder: Navigate to and select the folder where you saved the extension files (e.g., instagram-unfollower).
6.	Extension Added: The "Instagram Following Cleaner" extension should now appear in your list of extensions. You'll see its icon (the placeholder you created) in your Chrome toolbar.
7.	Go to Instagram: Navigate to https://www.instagram.com/ and log in.
8.	Open Following List: Go to your profile page. Click on the number next to "following". A modal window will pop up showing the list of people you follow.
9.	Scroll Down (Important): Manually scroll down inside the modal window until you've loaded a good portion (ideally all) of the users you want to potentially unfollow. The script tries to scroll, but doing it manually first helps ensure users are loaded.
10.	Click Extension Icon: Click the "Instagram Following Cleaner" icon in your Chrome toolbar.
11.	Scan: Click the "Scan Following List" button in the popup. The script will try to find all the loaded users in the modal.
12.	Select Users: If successful, the popup will display the list of usernames with checkboxes. Check the boxes next to the users you want to unfollow. Use "Select/Deselect All" if needed.
13.	Unfollow: Click the "Unfollow Selected" button.
14.	Wait Patiently: The script will now attempt to click the "Following" button, then the "Unfollow" confirmation button for each selected user, with significant delays between each action. Do not close the Instagram tab or the popup while this is running. Monitor the status message in the popup.
15.	Completion: Once finished, the popup will show a summary. You might need to refresh the Instagram page or re-scan to see the changes reflected.
Maintenance:
•	When Instagram changes its website layout, the SELECTORS in content.js will likely become invalid. The scan or unfollow process will fail.
•	You'll need to use your browser's Developer Tools (Right-click -> Inspect) on the Instagram "Following" list modal to find the new HTML elements and their corresponding CSS classes or attributes, then update the SELECTORS object in content.js.
•	Reload the extension (chrome://extensions/, find the extension, click the reload icon) after saving changes to content.js.
