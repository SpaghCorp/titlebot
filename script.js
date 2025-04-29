// Function to format the level information message (title part)
function formatTitle(level) {
    return `${level.name} (Insane Demon) By ${level.author} - 100% | MrSpaghetti`;
}

// Function to format the detailed description
function formatDescription(level) {
    return `
Level name: ${level.name}
Publisher: ${level.author}
ID: ${level.id}
Song: ${level.songAuthor} - ${level.songName} (ID: ${level.songID})

#geometrydash
#mrspaghetti`;
}

// Event listener for the form submission
document.getElementById("level-form").addEventListener("submit", async function (event) {
    event.preventDefault();  // Prevent the page from reloading when submitting the form
    const levelId = document.getElementById("level-id").value.trim();  // Get the input value (level ID)
    const output = document.getElementById("output");  // Get the output div to display the result

    // Check if the level ID is not empty
    if (!levelId) {
        output.innerHTML = "Please enter a valid level ID.";  // Display error if no level ID is entered
        return;
    }

    // Fetch level info from the Geometry Dash API using the provided level ID
    try {
        const response = await fetch(`https://gdbrowser.com/api/level/${levelId}`);  // API call
        const level = await response.json();  // Parse the response as JSON

        // Handle case if level is not found or invalid ID
        if (!level || level.error) {
            output.innerHTML = "Error: Level not found or invalid ID.";  // Display error if no level is found
            return;
        }

        // Format the title and description
        const title = formatTitle(level);
        const description = formatDescription(level);

        // Display the formatted message on the page
        output.innerHTML = `
        <pre>${title}</pre>
        <p><button id="copy-title-btn">Copy Title</button></p>
        <pre>${description}</pre>
        <p><button id="copy-description-btn">Copy Description</button></p>
      `;

        // Get the copy buttons and add functionality
        const copyTitleButton = document.getElementById("copy-title-btn");
        const copyDescriptionButton = document.getElementById("copy-description-btn");

        // Copy Title to Clipboard
        copyTitleButton.addEventListener("click", function () {
            navigator.clipboard.writeText(title).then(() => {
            }).catch((error) => {
                console.error("Error copying title to clipboard:", error);
                alert("Failed to copy title.");
            });
        });

        // Copy Description to Clipboard
        copyDescriptionButton.addEventListener("click", function () {
            navigator.clipboard.writeText(description).then(() => {
            }).catch((error) => {
                console.error("Error copying description to clipboard:", error);
                alert("Failed to copy description.");
            });
        });

    } catch (error) {
        // Display error message if something goes wrong
        output.innerHTML = "An error occurred while fetching the level information.";
        console.error(error);  // Log the error for debugging
    }
});
