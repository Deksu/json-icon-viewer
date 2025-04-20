// build.js
const fs = require('fs');
const path = require('path');

// Define paths for source and destination files/directories
const iconsJsonPath = path.join(__dirname, 'icons.json');
const srcHtmlPath = path.join(__dirname, 'src', 'index.html');
const srcCssPath = path.join(__dirname, 'src', 'style.css');
const srcJsPath = path.join(__dirname, 'src', 'script.js');

const distDir = path.join(__dirname, 'dist'); // Output directory for built website
const destHtmlPath = path.join(distDir, 'index.html');
const destCssPath = path.join(distDir, 'style.css');
const destJsPath = path.join(distDir, 'script.js');

// Simple HTML escaping function for names and text content
// Prevents issues when injecting names into HTML elements
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;"); // Escape single quotes
}

// Simple HTML escaping function specifically for embedding strings in single-quoted HTML attributes
// This is crucial for the JSON string embedded in data-icon-data='...'
function escapeForSingleQuotedAttr(unsafe) {
    // Only escape single quotes, as the attribute value will be wrapped in single quotes
    // Other HTML entities like & < > " are fine within a single-quoted attribute value unless they are part of the structure
    // However, for robustness, we might keep escaping essential HTML entities plus the attribute delimiter
     return unsafe
        .replace(/&/g, "&amp;")
        .replace(/'/g, "&#039;") // Escape single quotes
        .replace(/"/g, "&quot;"); // Escape double quotes just in case they appear inside a single-quoted attribute somehow, although less critical than the attribute quote itself. Let's focus on the attribute delimiter.
}
// Let's refine escapeForSingleQuotedAttr to only strictly escape the quote being used for the attribute:
function escapeSingleQuotesForAttr(unsafe) {
     return unsafe.replace(/'/g, "&#039;"); // Escape single quotes
}
// And escapeDoubleQuotesForAttr if we were using double quotes:
// function escapeDoubleQuotesForAttr(unsafe) { return unsafe.replace(/"/g, "&quot;"); }


// Main function to build the website
function buildWebsite() {
    try {
        console.log(`[Build] Starting website build process.`);
        console.log(`[Build] Checking for icons.json at: ${iconsJsonPath}`);

        // --- Debug Check: Ensure icons.json exists ---
        if (!fs.existsSync(iconsJsonPath)) {
            console.error(`[Build] Error: icons.json not found at ${iconsJsonPath}.`);
            console.error(`[Build] Please ensure you have downloaded icons.json from the Figma plugin and placed it at the root of the repository.`);
            process.exit(1); // Exit with error code if file is missing
        }
        console.log(`[Build] icons.json found.`);
        // --- End Debug Check ---

        // 1. Read icons.json
        const fileContent = fs.readFileSync(iconsJsonPath, 'utf-8');

        // --- Debug Check: Ensure file is not empty ---
        console.log(`[Build] Read file content successfully. Content length: ${fileContent.length}`);
         if (fileContent.trim().length === 0) {
              console.error("[Build] Error: icons.json appears to be empty. Exiting.");
              console.error("Reason: The file was read but contains only whitespace or is empty.");
              process.exit(1); // Exit if file is empty
         }
         console.log(`[Build] File content is not empty. First 100 chars: ${fileContent.substring(0, 100)}`);
        // --- End Debug Check ---


        // 2. Parse icons.json content
        const iconifyJson = JSON.parse(fileContent);
        console.log('[Build] JSON parsed successfully.');

        // --- Debug Check: Validate parsed JSON structure ---
        console.log(`[Build] Parsed JSON structure check:`);
        console.log(`[Build]  - Has 'prefix' property: ${iconifyJson.hasOwnProperty('prefix')}`);
        console.log(`[Build]  - Has 'icons' property: ${iconifyJson.hasOwnProperty('icons')}`);
        console.log(`[Build]  - 'icons' is an object: ${typeof iconifyJson.icons === 'object' && iconifyJson.icons !== null && !Array.isArray(iconifyJson.icons)}`);

        if (!iconifyJson || typeof iconifyJson.icons !== 'object' || iconifyJson.icons === null || Array.isArray(iconifyJson.icons)) {
            console.error('[Build] Error: Parsed JSON does not match expected IconifyJSON structure (missing or invalid "icons" object).');
             console.error(`[Build] Received structure keys: ${Object.keys(iconifyJson).join(', ')}`);
            process.exit(1); // Exit if JSON structure is invalid
        }
        // --- End Debug Check ---


        const icons = iconifyJson.icons || {}; // Should be an object if previous check passed, but fallback is safe
        const defaultWidth = iconifyJson.width || 24;
        const defaultHeight = iconifyJson.height || 24;

        console.log(`[Build] Default dimensions (w x h): ${defaultWidth} x ${defaultHeight}`);


        // 3. Read the source HTML template
        let htmlContent = fs.readFileSync(srcHtmlPath, 'utf-8');
        console.log(`[Build] Read source HTML template from: ${srcHtmlPath}`);


        // 4. Generate HTML for icons
        let iconsHtml = '';
        const iconNames = Object.keys(icons);
        console.log(`[Build] Found ${iconNames.length} icons in the JSON.`);

         if (iconNames.length === 0) {
              console.log('[Build] No icons found in JSON, generating empty state message.');
              iconsHtml = '<p id="initial-message">No icons found in the JSON file.</p>';
         } else {
             iconNames.forEach(iconName => { // Use forEach for potentially better iteration order than for...in
                 const iconData = icons[iconName];

                 // --- Debug Check: Validate individual icon data ---
                 if (!iconData || typeof iconData.body !== 'string') {
                      console.warn(`[Build] Warning: Skipping invalid icon data for "${escapeHtml(iconName)}". Missing 'body' or 'body' is not a string.`);
                      return; // Skip this icon
                 }
                 // --- End Debug Check ---

                 const iconWidth = iconData.width || defaultWidth;
                 const iconHeight = iconData.height || defaultHeight;

                 // Embed SVG directly for preview.
                 const svgNs = "http://www.w3.org/2000/svg";
                 const svgHtml = `<svg xmlns="${svgNs}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${iconWidth} ${iconHeight}" style="width: 64px; height: 64px; display: block; margin: 0 auto 15px auto;">${iconData.body}</svg>`;

                 // --- Use data-* attributes to store data ---
                 const safeIconName = escapeHtml(iconName);
                 // Stringify iconData and escape single quotes for embedding in a single-quoted attribute value
                 const safeIconDataString = escapeSingleQuotesForAttr(JSON.stringify(iconData));


                 iconsHtml += `
                 <div class="icon-item">
                     ${svgHtml}
                     <p>${safeIconName}</p>
                     <div class="icon-buttons">
                         <button
                             data-icon-name="${safeIconName}"
                             data-icon-data='${safeIconDataString}'  // Store stringified JSON in data attribute using single quotes
                             onclick="window.handleSvgDownload(this)">SVG</button> <button
                             data-icon-name="${safeIconName}"
                             data-icon-data='${safeIconDataString}' // Store stringified JSON in data attribute using single quotes
                             onclick="window.handlePngDownload(this)">PNG</button> </div>
                 </div>`;
                 // --- END data-* attributes ---
             });
         }


         // If after processing, no valid icons were added (could happen if JSON had keys but all data was invalid)
         if (iconsHtml.trim() === '') { // Check trimmed string in case only whitespace was generated
              console.log('[Build] No valid icons were generated after processing.');
              iconsHtml = '<p id="initial-message">No valid icons found in the JSON file.</p>';
         }


        // 5. Inject generated icons HTML into the template
        console.log('[Build] Injecting generated icons HTML into the template.');
        const finalHtmlContent = htmlContent.replace('', iconsHtml);


        // 6. Create output directory if it doesn't exist
        console.log(`[Build] Ensuring output directory exists: ${distDir}`);
        if (!fs.existsSync(distDir)){
            fs.mkdirSync(distDir, { recursive: true }); // Use recursive: true for nested directories
            console.log(`[Build] Created output directory: ${distDir}`);
        } else {
             console.log(`[Build] Output directory already exists: ${distDir}`);
        }


        // 7. Write the final index.html
        console.log(`[Build] Writing final index.html to: ${destHtmlPath}`);
        fs.writeFileSync(destHtmlPath, finalHtmlContent, 'utf-8');
        console.log('[Build] index.html written.');

        // 8. Copy CSS and JS files to the output directory
        console.log(`[Build] Copying style.css to: ${destCssPath}`);
        fs.copyFileSync(srcCssPath, destCssPath);
         console.log(`[Build] Copying script.js to: ${destJsPath}`);
        fs.copyFileSync(srcJsPath, destJsPath);
        console.log('[Build] CSS and JS files copied.');


        console.log('[Build] Website build completed successfully!');

    } catch (error) {
        console.error('[Build] Error building website:', error);
        // More specific error handling for common issues
        if (error.code === 'ENOENT') {
            console.error(`[Build] File System Error: A required source file was not found.`);
            console.error(`[Build] Check paths: ${iconsJsonPath}, ${srcHtmlPath}, ${srcCssPath}, ${srcJsPath}`);
        } else if (error instanceof SyntaxError) {
            console.error('[Build] JSON Parsing Error: Failed to parse icons.json. Check if it is valid JSON.');
            console.error('[Build] Parsing error details:', error.message);
        } else {
             console.error(`[Build] An unexpected error occurred during the build process: ${error.message}`);
             if (error.stack) {
                 console.error('[Build] Error Stack:', error.stack);
             }
        }

        process.exit(1); // Exit with error code to signal failure to GitHub Actions
    }
}

// Call the build function to start the process
buildWebsite();