// src/script.js

// Helper function to reconstruct a full SVG XML string from the IconifyJSON data object.
// This is needed because IconifyJSON 'body' is just the inner content of the <svg> tag.
/**
 * Reconstructs a full SVG XML string from the IconifyJSON data object.
 * @param {object} iconData - The icon data object from IconifyJSON ({ body: string, width?: number, height?: number }).
 * @returns {string} The full SVG XML string.
 */
function createFullSvgString(iconData) {
    // Use icon specific dimensions, falling back to defaults if necessary (though build.js should provide them)
    const width = iconData.width || 24;
    const height = iconData.height || 24;
    // Assume viewBox origin is 0,0 based on IconifyJSON typical usage
    const viewBox = `0 0 ${width} ${height}`;

    // Include XML declaration, doctype, and xmlns attributes for a valid standalone SVG file
    return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="${viewBox}">
    ${iconData.body}
</svg>`;
}


// Function to trigger the download of an SVG file.
/**
 * Downloads the given SVG string as an .svg file.
 * @param {string} svgString - The full SVG XML string.
 * @param {string} iconName - The name of the icon for the filename.
 */
function downloadSvg(svgString, iconName) {
    try {
        // Create a Blob with the SVG data and specify the MIME type and charset
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        // Create a temporary URL for the blob data
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${iconName}.svg`; // Set the desired filename
        // Append the anchor to the body, trigger a click event, and then remove it
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Release the temporary URL
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error during SVG download process:", error);
        alert("Could not prepare SVG for download.");
    }
}


// Function to convert an SVG string to a PNG data URL and trigger a download.
/**
 * Converts an SVG string to a PNG data URL and triggers a download.
 * @param {string} svgString - The full SVG XML string.
 * @param {string} iconName - The name of the icon for the filename.
 * @param {number} originalWidth - The original width of the icon (used for canvas size).
 * @param {number} originalHeight - The original height of the icon (used for canvas size).
 */
function downloadPng(svgString, iconName, originalWidth, originalHeight) {
     try {
        // Create a canvas element to draw the SVG onto
        const canvas = document.createElement('canvas');
        const scale = 2; // Export at a higher resolution (e.g., 2x) for better quality
        canvas.width = originalWidth * scale;
        canvas.height = originalHeight * scale;
        const ctx = canvas.getContext('2d');

        // Clear the canvas area
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create an Image object to load the SVG data
        const img = new Image();

        // Handle successful image loading (SVG is ready to be drawn)
        img.onload = () => {
            try {
                // Draw the SVG image onto the canvas, scaling to fit the canvas dimensions
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Get the data URL representation of the canvas content as a PNG image
                // Default quality is usually sufficient
                const pngDataUrl = canvas.toDataURL('image/png');

                // Create a temporary anchor element for downloading
                const a = document.createElement('a');
                a.href = pngDataUrl; // The data URL is the source for the download
                a.download = `${iconName}.png`; // Set the desired filename
                 // Append anchor to body, trigger click, and remove
                 document.body.appendChild(a);
                a.click();
                 document.body.removeChild(a);

                // Data URLs do not need URL.revokeObjectURL cleanup
            } catch (drawError) {
                 console.error("Error drawing SVG to canvas or getting PNG data URL:", drawError);
                 alert(`Could not convert "${iconName}" to PNG.`);
            }
        };

         // Handle image loading errors (e.g., if the generated SVG data URL is invalid)
        img.onerror = (imgError) => {
            console.error("Error loading SVG data URL for PNG conversion:", imgError);
             // The error.message from imgError is often not helpful here
            alert(`Could not load SVG data for "${iconName}" PNG export.`);
        };

        // Set the source of the image to a data URL created from the SVG string
        // Using utf8 encoding and encodeURIComponent is crucial for handling various characters in SVG XML safely within a data URL
        const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
        img.src = svgDataUrl;

     } catch (error) {
         console.error("Error during PNG download preparation:", error);
         alert("Could not prepare PNG for download.");
     }
}


// --- Handler functions called by button onclick events ---
// These functions read data from button attributes and call the download logic.

/**
 * Handler function for SVG download button clicks.
 * Reads data from data attributes and triggers the SVG download.
 * @param {HTMLButtonElement} buttonElement - The button element that was clicked (passed via 'this' in onclick).
 */
window.handleSvgDownload = function(buttonElement) {
    try {
        // Read icon name and stringified data from data attributes embedded by build.js
        const iconName = buttonElement.getAttribute('data-icon-name');
        const iconDataString = buttonElement.getAttribute('data-icon-data');

         if (!iconName || !iconDataString) {
             console.error("Missing data attributes on button:", buttonElement);
             alert("Could not get icon data from button.");
             return;
         }

        // Parse the JSON string to get the icon data object
        const iconData = JSON.parse(iconDataString);

        // Use the existing download function
        const fullSvgString = createFullSvgString(iconData);
        downloadSvg(fullSvgString, iconName);

    } catch (error) {
        console.error("Error handling SVG download click:", error);
        // The JSON.parse error would likely end up here if data-icon-data was malformed
        alert("Could not prepare SVG for download. Check console.");
    }
}

/**
 * Handler function for PNG download button clicks.
 * Reads data from data attributes and triggers the PNG download.
 * @param {HTMLButtonElement} buttonElement - The button element that was clicked (passed via 'this' in onclick).
 */
window.handlePngDownload = function(buttonElement) {
     try {
        // Read icon name and stringified data from data attributes embedded by build.js
        const iconName = buttonElement.getAttribute('data-icon-name');
        const iconDataString = buttonElement.getAttribute('data-icon-data');

         if (!iconName || !iconDataString) {
             console.error("Missing data attributes on button:", buttonElement);
             alert("Could not get icon data from button.");
             return;
         }

        // Parse the JSON string to get the icon data object
        const iconData = JSON.parse(iconDataString);

        // Use the existing download function
        const fullSvgString = createFullSvgString(iconData);

        const originalWidth = iconData.width || 24;
        const originalHeight = iconData.height || 24;

        downloadPng(fullSvgString, iconName, originalWidth, originalHeight);

     } catch (error) {
        console.error("Error handling PNG download click:", error);
        // The JSON.parse error would likely end up here if data-icon-data was malformed
        alert("Could not prepare PNG for download. Check console.");
     }
}

// Note: We attach these handler functions to the window object
// so they can be called directly from the 'onclick="..."' attributes
// generated in the HTML by the build.js script.
// window.handleSvgDownload = handleSvgDownload; // Already done above
// window.handlePngDownload = handlePngDownload; // Already done above

// This script does NOT need code to read icons.json or display them,
// as the HTML is pre-generated by the build.js script.