// src/script.js

// Helper function to reconstruct full SVG from IconifyJSON data
// This function remains the same
function createFullSvgString(iconData) {
    const width = iconData.width || 24;
    const height = iconData.height || 24;
     const viewBox = `0 0 ${width} ${height}`;

    return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="${viewBox}">
    ${iconData.body}
</svg>`;
}

// Function to trigger SVG download
// This function remains the same
function downloadSvg(svgString, iconName) {
    try {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${iconName}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading SVG:", error);
        alert("Could not prepare SVG for download.");
    }
}

// Function to trigger PNG download
// This function remains the same
function downloadPng(svgString, iconName, originalWidth, originalHeight) {
     try {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = originalWidth * scale;
        canvas.height = originalHeight * scale;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const img = new Image();

        img.onload = () => {
            try {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const pngDataUrl = canvas.toDataURL('image/png');

                const a = document.createElement('a');
                a.href = pngDataUrl;
                a.download = `${iconName}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (drawError) {
                 console.error("Error drawing SVG to canvas or getting PNG data URL:", drawError);
                 alert(`Could not convert "${iconName}" to PNG.`);
            }
        };

        img.onerror = (imgError) => {
            console.error("Error loading SVG data URL for PNG conversion:", imgError);
            alert(`Could not load SVG data for "${iconName}" PNG export.`);
        };

        const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(fullSvgString)}`;
        img.src = svgDataUrl;

     } catch (error) {
         console.error("Error preparing PNG download:", error);
         alert("Could not prepare PNG for download.");
     }
}


// --- MODIFIED: New handler functions to read from data attributes ---

// Handler for SVG download button click
window.handleSvgDownload = function(buttonElement) {
    try {
        // Read icon name and stringified data from data attributes
        const iconName = buttonElement.getAttribute('data-icon-name');
        const iconDataString = buttonElement.getAttribute('data-icon-data');

        // Parse the JSON string to get the icon data object
        const iconData = JSON.parse(iconDataString);

        // Use the existing download function
        const fullSvgString = createFullSvgString(iconData);
        downloadSvg(fullSvgString, iconName);

    } catch (error) {
        console.error("Error handling SVG download:", error);
        alert("Could not prepare SVG for download. Check console.");
    }
}

// Handler for PNG download button click
window.handlePngDownload = function(buttonElement) {
     try {
        // Read icon name and stringified data from data attributes
        const iconName = buttonElement.getAttribute('data-icon-name');
        const iconDataString = buttonElement.getAttribute('data-icon-data');

        // Parse the JSON string to get the icon data object
        const iconData = JSON.parse(iconDataString);

        // Use the existing download function
        const fullSvgString = createFullSvgString(iconData);

        const originalWidth = iconData.width || 24;
        const originalHeight = iconData.height || 24;

        downloadPng(fullSvgString, iconName, originalWidth, originalHeight);

     } catch (error) {
        console.error("Error handling PNG download:", error);
        alert("Could not prepare PNG for download. Check console.");
     }
}

// Attach the handlers to the window object so they can be called from onclick attributes
window.handleSvgDownload = handleSvgDownload;
window.handlePngDownload = handlePngDownload;

// No need to expose createFullSvgString or the original download functions globally