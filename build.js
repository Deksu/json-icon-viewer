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

// Define the placeholder string - MUST MATCH src/index.html EXACTLY
// Changed from comment to a div element for easier debugging if replacement fails
const INJECTION_PLACEHOLDER = '<div id="icon-injection-target"></div>';


// Simple HTML escaping function for names and text content
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;"); // Escape single quotes
}

// Simple HTML escaping function specifically for embedding strings in single-quoted HTML attributes
function escapeSingleQuotesForAttr(unsafe) {
     return unsafe.replace(/'/g, "&#039;"); // Escape single quotes
}


// Main function to build the website
function buildWebsite() {
    let iconifyJson; // Declare iconifyJson here in the function scope

    try {
        console.log(`[Build] Starting website build process.`);
        console.log(`[Build] Checking for icons.json at: ${iconsJsonPath}`);

        if (!fs.existsSync(iconsJsonPath)) {
            console.error(`[Build] Error: icons.json not found at ${iconsJsonPath}.`);
            console.error(`[Build] Please ensure you have downloaded icons.json from the Figma plugin and placed it at the root of the repository.`);
            process.exit(1);
        }
        console.log(`[Build] icons.json found.`);

        // 1. Read icons.json
        const fileContent = fs.readFileSync(iconsJsonPath, 'utf-8');

        console.log(`[Build] Read file content successfully. Content length: ${fileContent.length}`);
         if (fileContent.trim().length === 0) {
              console.error("[Build] Error: icons.json appears to be empty. Exiting.");
              console.error("Reason: The file was read but contains only whitespace or is empty.");
              process.exit(1);
         }
         console.log(`[Build] File content is not empty. First 100 chars: ${fileContent.substring(0, 100)}`);


        // 2. Parse icons.json content
        console.log('[Build] Attempting to parse JSON...');
        try {
            iconifyJson = JSON.parse(fileContent);
            console.log('[Build] JSON.parse executed.');
        } catch (e) {
             console.error('[Build] JSON Parsing Error: Failed to parse icons.json.');
             console.error('[Build] Parsing error details:', e.message);
             // Re-throw the error to be caught by the outer catch block and trigger exit
             throw e;
        }

        // --- Debug Checks: Verify iconifyJson after parsing ---
        console.log(`[Build] Checking state of 'iconifyJson' variable:`);
        console.log(`[Build] - Type of iconifyJson: ${typeof iconifyJson}`);
        console.log(`[Build] - Is iconifyJson null: ${iconifyJson === null}`);
        console.log(`[Build] - Is iconifyJson undefined: ${typeof iconifyJson === 'undefined'}`);
        console.log(`[Build] - Is iconifyJson an object: ${typeof iconifyJson === 'object' && iconifyJson !== null && !Array.isArray(iconifyJson)}`);
        // --- End Debug Checks ---


        console.log('[Build] Checking parsed JSON structure:'); // This line is likely close to the error origin (line 22)
        // --- Structure Checks ---
        if (typeof iconifyJson !== 'object' || iconifyJson === null || Array.isArray(iconifyJson)) {
             console.error('[Build] Error: Parsed JSON is not an object as expected.');
             process.exit(1);
        }
        console.log(`[Build] - Has 'prefix' property: ${iconifyJson.hasOwnProperty('prefix')}`);
        console.log(`[Build] - Has 'icons' property: ${iconifyJson.hasOwnProperty('icons')}`);
        console.log(`[Build] - 'icons' property is an object: ${typeof iconifyJson.icons === 'object' && iconifyJson.icons !== null && !Array.isArray(iconifyJson.icons)}`);

        if (!iconifyJson.hasOwnProperty('icons') || typeof iconifyJson.icons !== 'object' || iconifyJson.icons === null || Array.isArray(iconifyJson.icons)) {
            console.error('[Build] Error: Parsed JSON does not contain a valid "icons" object property.');
             console.error(`[Build] Structure check failed. Full parsed object (first 200 chars): ${JSON.stringify(iconifyJson).substring(0, 200)}`);
            process.exit(1);
        }
        // --- End Structure Checks ---


        const icons = iconifyJson.icons || {}; // Should be an object if previous checks passed

        const defaultWidth = iconifyJson.width || 24;
        const defaultHeight = iconifyJson.height || 24;

        console.log(`[Build] Default dimensions (w x h): ${defaultWidth} x ${defaultHeight}`);


        // 3. Read the source HTML template
        let htmlContent = fs.readFileSync(srcHtmlPath, 'utf-8');
        console.log(`[Build] Read source HTML template from: ${srcHtmlPath}`);
         // Check placeholder exists
        if (!htmlContent.includes('')) {
            console.error('[Build] Error: Placeholder comment NOT found in source HTML template!');
            console.error('Reason: The comment "" must be exactly present in src/index.html');
             process.exit(1);
        }
         console.log('[Build] Placeholder comment found in source HTML template.');


        // 4. Generate HTML for icons
        let iconsHtml = '';
        const iconNames = Object.keys(icons);
        console.log(`[Build] Found ${iconNames.length} icons in the JSON.`);

         if (iconNames.length === 0) {
              console.log('[Build] No icons found in JSON, generating empty state message.');
              iconsHtml = '<p id="initial-message">No icons found in the JSON file.</p>';
         } else {
             console.log('[Build] Starting to generate HTML for icons...');
             iconNames.forEach(iconName => {
                 const iconData = icons[iconName];

                 if (!iconData || typeof iconData.body !== 'string' || iconData.body.trim() === '') {
                      console.warn(`[Build] Warning: Skipping invalid icon data for "${escapeHtml(iconName)}". Missing 'body', 'body' is not a string, or 'body' is empty.`);
                      return; // Skip this icon
                 }

                 const iconWidth = iconData.width || defaultWidth;
                 const iconHeight = iconData.height || defaultHeight;

                 const svgNs = "http://www.w3.org/2000/svg";
                 const svgHtml = `<svg xmlns="${svgNs}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${iconWidth} ${iconHeight}" style="width: 64px; height: 64px; display: block; margin: 0 auto 15px auto;">${iconData.body}</svg>`;

                 const safeIconName = escapeHtml(iconName);
                 const safeIconDataString = escapeSingleQuotesForAttr(JSON.stringify(iconData));


                 iconsHtml += `
                 <div class="icon-item">
                     ${svgHtml}
                     <p>${safeIconName}</p>
                     <div class="icon-buttons">
                         <button
                             data-icon-name="${safeIconName}"
                             data-icon-data='${safeIconDataString}'
                             onclick="window.handleSvgDownload(this)">SVG</button>
                         <button
                             data-icon-name="${safeIconName}"
                             data-icon-data='${safeIconDataString}'
                             onclick="window.handlePngDownload(this)">PNG</button>
                     </div>
                 </div>`;
             });
              console.log('[Build] Finished generating HTML for icons.');
         }

         console.log(`[Build] Generated iconsHtml length: ${iconsHtml.length}`);
         console.log(`[Build] First 500 chars of generated iconsHtml:\n${iconsHtml.substring(0, 500)}`);
         if (iconsHtml.trim().length === 0 && iconNames.length > 0) {
              console.warn('[Build] Warning: No HTML was generated despite finding icons in JSON. Check icon data validity.');
         }


        // 5. Inject generated icons HTML into the template
        console.log('[Build] Attempting to inject generated icons HTML into the template.');
        const finalHtmlContent = htmlContent.replace('', iconsHtml);
        console.log('[Build] String replacement performed.');

        if (finalHtmlContent.includes('')) {
            console.error("[Build] Error: Placeholder comment was NOT replaced in the final HTML!");
            console.error('Reason: The string replacement likely failed. Check the placeholder in src/index.html');
             process.exit(1);
        } else {
             console.log("[Build] Placeholder comment successfully replaced in final HTML.");
        }


        // 6. Create output directory if it doesn't exist
        console.log(`[Build] Ensuring output directory exists: ${distDir}`);
        if (!fs.existsSync(distDir)){
            fs.mkdirSync(distDir, { recursive: true });
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
        if (error.code === 'ENOENT') {
            console.error(`[Build] File System Error: A required source file was not found.`);
            console.error(`[Build] Check paths: ${iconsJsonPath}, ${srcHtmlPath}, ${srcCssPath}, ${srcJsPath}`);
        } else if (error instanceof SyntaxError) {
            console.error('[Build] JSON Parsing Error: Failed to parse icons.json. Check if it is valid JSON.');
            console.error('[Build] Parsing error details:', error.message);
        } else {
             console.error(`[Build] An unexpected error occurred during the build process: ${error.message}`);
             // Log the stack only for unexpected errors, not handled file/syntax errors
             if (error.stack) {
                 console.error('[Build] Error Stack:', error.stack);
             }
        }

        process.exit(1); // Exit with error code to signal failure
    }
}

// ... (escapeHtml and escapeSingleQuotesForAttr functions remain below) ...


// Call the build function
buildWebsite();