const fs = require('fs');
const path = require('path');

const iconsJsonPath = path.join(__dirname, 'icons.json');
const srcHtmlPath = path.join(__dirname, 'src', 'index.html');
const srcCssPath = path.join(__dirname, 'src', 'style.css');
const srcJsPath = path.join(__dirname, 'src', 'script.js');

const distDir = path.join(__dirname, 'dist'); // Output directory
const destHtmlPath = path.join(distDir, 'index.html');
const destCssPath = path.join(distDir, 'style.css');
const destJsPath = path.join(distDir, 'script.js');


// Simple HTML escaping function for attribute values and text content
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;"); // Escape single quotes
}

// Simple HTML escaping function specifically for embedding in single-quoted attributes
function escapeForSingleQuotedAttr(unsafe) {
    return unsafe.replace(/'/g, "&#039;"); // Escape single quotes
}


function buildWebsite() {
    try {
        // ... (read json and template, get default dimensions) ...

        let iconsHtml = '';
         const iconNames = Object.keys(icons);

         if (iconNames.length === 0) {
              iconsHtml = '<p id="initial-message">No icons found in the JSON file.</p>';
         } else {
             for (const iconName in icons) {
                 if (Object.hasOwnProperty.call(icons, iconName)) {
                     const iconData = icons[iconName];
                     if (!iconData || typeof iconData.body !== 'string') {
                          console.warn(`Skipping invalid icon data for "${escapeHtml(iconName)}". Missing 'body' or 'body' is not a string.`);
                          continue;
                     }

                     const iconWidth = iconData.width || defaultWidth;
                     const iconHeight = iconData.height || defaultHeight;

                     // Embed SVG directly for preview.
                     const svgNs = "http://www.w3.org/2000/svg";
                      // Important: set viewBox and xmlns for the embedded SVG
                     const svgHtml = `<svg xmlns="${svgNs}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${iconWidth} ${iconHeight}" style="width: 64px; height: 64px; display: block; margin: 0 auto 15px auto;">${iconData.body}</svg>`;

                     // --- MODIFIED: Use data-* attributes to store data ---
                     const safeIconName = escapeHtml(iconName);
                     // Stringify iconData and escape single quotes for embedding in a single-quoted attribute
                     const safeIconDataString = escapeForSingleQuotedAttr(JSON.stringify(iconData));


                     iconsHtml += `
                     <div class="icon-item">
                         ${svgHtml}
                         <p>${safeIconName}</p>
                         <div class="icon-buttons">
                             <button
                                 data-icon-name="${safeIconName}"
                                 data-icon-data='${safeIconDataString}'  // Store stringified JSON in data attribute
                                 onclick="window.handleSvgDownload(this)">SVG</button> <button
                                 data-icon-name="${safeIconName}"
                                 data-icon-data='${safeIconDataString}' // Store stringified JSON in data attribute
                                 onclick="window.handlePngDownload(this)">PNG</button> </div>
                     </div>`;
                     // --- END MODIFIED ---
                 }
             }
         }


         // If after processing, no valid icons were added
         if (iconsHtml === '') {
             iconsHtml = '<p id="initial-message">No valid icons found in the JSON file.</p>';
         }


        // 4. Inject generated icons HTML into the template
        htmlContent = htmlContent.replace('', iconsHtml);

        // ... (create dist directory, write files) ...

        console.log('Website built successfully!');

    } catch (error) {
        console.error('Error building website:', error);
        if (error instanceof SyntaxError) {
            console.error('Reason: icons.json is likely malformed.');
        }
        process.exit(1);
    }
}

// Simple HTML escaping function for names and text content
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Simple HTML escaping function specifically for embedding in single-quoted attributes
function escapeForSingleQuotedAttr(unsafe) {
    return unsafe.replace(/'/g, "&#039;"); // Escape single quotes for attribute value
}


buildWebsite();