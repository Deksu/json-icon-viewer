// src/script.js

// Helper function to reconstruct full SVG from IconifyJSON data
function createFullSvgString(iconData) {
    const width = iconData.width || 24;
    const height = iconData.height || 24;
     const viewBox = `0 0 ${width} ${height}`; // Assume 0 0 origin from IconifyJSON spec

    // Include XML declaration, doctype, and xmlns attributes for a valid standalone SVG file
    return `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="<span class="math-inline">\{width\}" height\="</span>{height}" viewBox="${viewBox}">
    ${iconData.body}
</svg>`;
}

// Function to trigger SVG download
window.downloadSvgFromData = function(buttonElement, iconName, iconData) {
    try {
         const fullSvgString = createFullSvgString(iconData);
        const blob = new Blob([fullSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${iconName}.svg`;
        document.body.appendChild(a); // Required for some browsers
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the URL
    } catch (error) {
         console.error("Error downloading SVG:", error);
         alert("Could not prepare SVG for download.");
    }
}

// Function to trigger PNG download
window.downloadPngFromData = function(buttonElement, iconName, iconData) {
     try {
        const fullSvgString = createFullSvgString(iconData);

        const originalWidth = iconData.width || 24;
        const originalHeight = iconData.height || 24;
        const scale = 2; // Export at higher resolution
        const canvas = document.createElement('canvas');
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
                 // No revokeObjectURL needed for data URLs
            } catch (drawError) {
                 console.error("Error drawing SVG to canvas or getting PNG data URL:", drawError);
                 alert(`Could not convert "${iconName}" to PNG.`);
            }
        };

        img.onerror = (imgError) => {
            console.error("Error loading SVG data URL for PNG conversion:", imgError);
            alert(`Could not load SVG data for "${iconName}" PNG export.`);
        };

        // Create data URL from SVG string - use encodeURIComponent for safety
        const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(fullSvgString)}`;
        img.src = svgDataUrl;

     } catch (error) {
         console.error("Error preparing PNG download:", error);
         alert("Could not prepare PNG for download.");
     }
}

// Make download functions globally accessible as they are called from onclick attributes
window.createFullSvgString = createFullSvgString; // Might be useful to expose
// downloadSvgFromData and downloadPngFromData are already attached via window.functionName = ...