const fs = require('fs');
const path = require('path');

const iconsJsonPath = path.join(__dirname, 'icons.json');
const srcHtmlPath = path.join(__dirname, 'src', 'index.html');
const srcCssPath = path.join(__dirname, 'src', 'style.css');
const srcJsPath = path.join(__dirname, 'src', 'script.js');

const distDir = path.join(__dirname, 'dist');
const destHtmlPath = path.join(distDir, 'index.html');
const destCssPath = path.join(distDir, 'style.css');
const destJsPath = path.join(distDir, 'script.js');

// ... (escapeHtml and escapeSingleQuotesForAttr functions) ...


function buildWebsite() {
    try {
        console.log(`[Build] Starting website build process.`);
        // ... (initial file checks and parsing) ...

        const icons = iconifyJson.icons || {};
        const defaultWidth = iconifyJson.width || 24;
        const defaultHeight = iconifyJson.height || 24;

        console.log(`[Build] Default dimensions (w x h): ${defaultWidth} x ${defaultHeight}`);


        // 3. Read the source HTML template
        let htmlContent = fs.readFileSync(srcHtmlPath, 'utf-8');
        console.log(`[Build] Read source HTML template from: ${srcHtmlPath}`);
        // --- Debug: Check if placeholder exists in template ---
        if (htmlContent.includes('')) {
            console.log('[Build] Placeholder comment found in source HTML template.');
        } else {
            console.error('[Build] Error: Placeholder comment NOT found in source HTML template!');
            console.error('Reason: The comment "" must be exactly present in src/index.html');
             process.exit(1); // Exit if placeholder is missing
        }
         // --- End Debug ---


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

                 if (!iconData || typeof iconData.body !== 'string' || iconData.body.trim() === '') { // Also check if body is empty
                      console.warn(`[Build] Warning: Skipping invalid icon data for "${escapeHtml(iconName)}". Missing 'body', 'body' is not a string, or 'body' is empty.`);
                      return; // Skip this icon
                 }

                 const iconWidth = iconData.width || defaultWidth;
                 const iconHeight = iconData.height || defaultHeight;

                 // Embed SVG directly for preview.
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

         // --- Debug: Check generated iconsHtml content ---
         console.log(`[Build] Generated iconsHtml length: ${iconsHtml.length}`);
         console.log(`[Build] First 500 chars of generated iconsHtml:\n${iconsHtml.substring(0, 500)}`);
         if (iconsHtml.trim().length === 0 && iconNames.length > 0) {
              console.warn('[Build] Warning: No HTML was generated despite finding icons in JSON. Check icon data validity.');
         }
         // --- End Debug ---


        // 5. Inject generated icons HTML into the template
        console.log('[Build] Attempting to inject generated icons HTML into the template.');
        const finalHtmlContent = htmlContent.replace('', iconsHtml);
        console.log('[Build] String replacement performed.');

        // --- Debug: Check if replacement was successful ---
        if (finalHtmlContent.includes('')) {
            console.error("[Build] Error: Placeholder comment was NOT replaced in the final HTML!");
            console.error('Reason: The string replacement likely failed. Check the placeholder in src/index.html');
             process.exit(1); // Exit if replacement didn't work
        } else {
             console.log("[Build] Placeholder comment successfully replaced in final HTML.");
        }
         // --- End Debug ---


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
             if (error.stack) {
                 console.error('[Build] Error Stack:', error.stack);
             }
        }

        process.exit(1); // Exit with error code
    }
}

// ... (escapeHtml and escapeSingleQuotesForAttr functions remain below) ...

// Call the build function
buildWebsite();