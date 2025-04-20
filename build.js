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


function buildWebsite() {
    try {
        // 1. Read icons.json
        const iconifyJson = JSON.parse(fs.readFileSync(iconsJsonPath, 'utf-8'));
        const icons = iconifyJson.icons || {};
        const defaultWidth = iconifyJson.width || 24;
        const defaultHeight = iconifyJson.height || 24;

        // 2. Read the source HTML template
        let htmlContent = fs.readFileSync(srcHtmlPath, 'utf-8');

        // 3. Generate HTML for icons
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
                          continue; // Skip this icon if data is invalid
                     }

                     const iconWidth = iconData.width || defaultWidth;
                     const iconHeight = iconData.height || defaultHeight;

                     // Embed SVG directly for preview.
                     const svgNs = "http://www.w3.org/2000/svg";
                      // Important: set viewBox and xmlns for the embedded SVG
                     const svgHtml = `<svg xmlns="${svgNs}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${iconWidth} <span class="math-inline">\{iconHeight\}" style\="width\: 64px; height\: 64px; display\: block; margin\: 0 auto 15px auto;"\></span>{iconData.body}</svg>`;

                     // Pass necessary data to client-side JS functions via onclick attributes
                     // iconData object needs to be stringified and safely embedded
                     const safeIconName = escapeHtml(iconName);
                     const safeIconData = JSON.stringify(iconData).replace(/'/g, "&#039;").replace(/"/g, "&quot;"); // Escape quotes for HTML attribute

                     iconsHtml += `
                     <div class="icon-item">
                         <span class="math-inline">\{svgHtml\}<p>{safeIconName}</p>
                         <div class="icon-buttons">
                         <button onclick='window.downloadSvgFromData(this, "safeIconName",JSON.parse("{safeIconData}"))'>SVG</button>
                         <button onclick='window.downloadPngFromData(this, "safeIconName",JSON.parse("{safeIconData}"))'>PNG</button>
                         </div>
                         </div>`;
                         }
                         }
                         }         // If after processing, no valid icons were added
                         if (iconsHtml === '') {
                             iconsHtml = '<p id="initial-message">No valid icons found in the JSON file.</p>';
                         }
                
                
                        // 4. Inject generated icons HTML into the template
                        htmlContent = htmlContent.replace('', iconsHtml);
                
                        // 5. Create output directory if it doesn't exist
                        if (!fs.existsSync(distDir)){
                            fs.mkdirSync(distDir);
                        }
                
                        // 6. Write the final index.html
                        fs.writeFileSync(destHtmlPath, htmlContent, 'utf-8');
                
                        // 7. Copy CSS and JS files to the output directory
                        fs.copyFileSync(srcCssPath, destCssPath);
                        fs.copyFileSync(srcJsPath, destJsPath);
                
                
                        console.log('Website built successfully!');
                
                    } catch (error) {
                        console.error('Error building website:', error);
                        // Provide more specific error if JSON parsing failed
                        if (error instanceof SyntaxError) {
                            console.error('Reason: icons.json is likely malformed.');
                        }
                        process.exit(1); // Exit with error code to signal failure to GitHub Actions
                    }
                }
                
                // Simple HTML escaping function for names
                function escapeHtml(unsafe) {
                    return unsafe
                         .replace(/&/g, "&amp;")
                         .replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .replace(/"/g, "&quot;")
                         .replace(/'/g, "&#039;");
                }
                
                
                buildWebsite();