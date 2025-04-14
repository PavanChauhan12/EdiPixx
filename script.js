// Improved Cropping Functionality

// DOM Elements (keeping your original DOM elements)
const previewImage = document.getElementById('preview-image');
const placeholder = document.getElementById('placeholder');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset');
const flipXBtn = document.getElementById('flip-x');
const flipYBtn = document.getElementById('flip-y');
const cropBtn = document.getElementById('crop-btn');
const cropConfirmBtn = document.getElementById('crop-confirm-btn');
const cropCancelBtn = document.getElementById('crop-cancel-btn');
const imageContainer = document.querySelector('.image-container');
const presetButtons = document.querySelectorAll('.preset-btn');
const removeBgBtn = document.getElementById('remove-bg-btn');

// Filter inputs and presets (keeping your original code)
const filterInputs = {
    blur: document.getElementById('blur'),
    contrast: document.getElementById('contrast'),
    hueRotate: document.getElementById('hue-rotate'),
    sepia: document.getElementById('sepia'),
    brightness: document.getElementById('brightness')
};

const presets = {
    vintage: { blur: 0.5, contrast: 90, hueRotate: 20, sepia: 60, brightness: 100 },
    cool: { blur: 0.2, contrast: 110, hueRotate: 200, sepia: 0, brightness: 100 },
    warm: { blur: 0.3, contrast: 120, hueRotate: 30, sepia: 30, brightness: 110 },
    bw: { blur: 0, contrast: 100, hueRotate: 0, sepia: 0, brightness: 100, grayscale: 100 },
    modern: { blur: 0, contrast: 130, hueRotate: 0, sepia: 0, brightness: 105 },
    cinematic: { blur: 0.1, contrast: 140, hueRotate: -10, sepia: 20, brightness: 95 },
    vibrant: { blur: 0, contrast: 150, hueRotate: 0, sepia: 0, brightness: 110 }
};

// State
let filters = {
    brightness: 100,
    blur: 0,
    contrast: 100,
    hueRotate: 0,
    sepia: 0,
    grayscale: 0,
    flipX: false,
    flipY: false
};

// Enhanced crop state
let cropState = {
    isCropping: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    width: 0,
    height: 0,
    isResizing: false,
    resizeHandle: null,
    isDragging: false,
    offsetX: 0,
    offsetY: 0
};

// Keep your existing event listeners (file input, filters, etc.)
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            previewImage.src = reader.result;
            previewImage.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Enable buttons when image is loaded
            downloadBtn.disabled = false;
            cropBtn.disabled = false;
            removeBgBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
});

// Functions for filters (keeping your original code)
function updateFilterValue(filterId, value) {
    const filterLabel = document.querySelector(`label[for="${filterId}"]`)
        .nextElementSibling;
    filterLabel.textContent = value;
}

function applyFilters() {
    const filterString = `
        brightness(${filters.brightness}%)
        blur(${filters.blur}px)
        contrast(${filters.contrast}%)
        hue-rotate(${filters.hueRotate}deg)
        sepia(${filters.sepia}%)
        grayscale(${filters.grayscale || 0}%)
    `;
    
    const transform = `scale(${filters.flipX ? -1 : 1}, ${filters.flipY ? -1 : 1})`;
    
    previewImage.style.filter = filterString;
    previewImage.style.transform = transform;
}

// Filter input event listeners (keeping your original code)
Object.entries(filterInputs).forEach(([key, input]) => {
    if (input) {
        input.addEventListener('input', (e) => {
            filters[key] = e.target.value;
            updateFilterValue(input.id, e.target.value);
            applyFilters();
        });
    }
});

// Preset buttons functionality (keeping your original code)
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const presetName = button.getAttribute('data-preset');
        const preset = presets[presetName];
        
        if (preset) {
            // Reset active class
            presetButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Apply preset values
            Object.entries(preset).forEach(([key, value]) => {
                filters[key] = value;
                
                // Update input values if they exist
                const input = filterInputs[key];
                if (input) {
                    input.value = value;
                    updateFilterValue(input.id, value);
                }
            });
            
            applyFilters();
        }
    });
});

// Flip controls (keeping your original code)
flipXBtn.addEventListener('click', () => {
    filters.flipX = !filters.flipX;
    flipXBtn.classList.toggle('active');
    applyFilters();
});

flipYBtn.addEventListener('click', () => {
    filters.flipY = !filters.flipY;
    flipYBtn.classList.toggle('active');
    applyFilters();
});

// Enhanced Cropping Functionality - Start

// Create crop overlay and grid
function createCropOverlay() {
    // Reset previous crop session if any
    resetCropSelection();
    
    // Create crop container
    const cropContainer = document.createElement('div');
    cropContainer.className = 'crop-overlay-container';
    cropContainer.style.position = 'absolute';
    cropContainer.style.top = '0';
    cropContainer.style.left = '0';
    cropContainer.style.width = '100%';
    cropContainer.style.height = '100%';
    cropContainer.style.zIndex = '10';
    
    // Create dark overlay
    const darkOverlay = document.createElement('div');
    darkOverlay.className = 'crop-dark-overlay';
    darkOverlay.style.position = 'absolute';
    darkOverlay.style.top = '0';
    darkOverlay.style.left = '0';
    darkOverlay.style.width = '100%';
    darkOverlay.style.height = '100%';
    darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    cropContainer.appendChild(darkOverlay);
    
    // Create crop selection area
    const cropSelection = document.createElement('div');
    cropSelection.className = 'crop-selection';
    cropSelection.style.position = 'absolute';
    cropSelection.style.border = '2px solid var(--primary)';
    cropSelection.style.boxSizing = 'border-box';
    cropSelection.style.cursor = 'move';
    cropContainer.appendChild(cropSelection);
    
    // Create grid lines for the Rule of Thirds
    for (let i = 1; i <= 2; i++) {
        // Vertical grid lines
        const verticalLine = document.createElement('div');
        verticalLine.className = 'grid-line vertical';
        verticalLine.style.position = 'absolute';
        verticalLine.style.top = '0';
        verticalLine.style.left = `${i * 33.33}%`;
        verticalLine.style.width = '1px';
        verticalLine.style.height = '100%';
        verticalLine.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        cropSelection.appendChild(verticalLine);
        
        // Horizontal grid lines
        const horizontalLine = document.createElement('div');
        horizontalLine.className = 'grid-line horizontal';
        horizontalLine.style.position = 'absolute';
        horizontalLine.style.left = '0';
        horizontalLine.style.top = `${i * 33.33}%`;
        horizontalLine.style.height = '1px';
        horizontalLine.style.width = '100%';
        horizontalLine.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        cropSelection.appendChild(horizontalLine);
    }
    
    // Create resize handles
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${position}`;
        handle.dataset.position = position;
        handle.style.position = 'absolute';
        handle.style.width = '10px';
        handle.style.height = '10px';
        handle.style.backgroundColor = 'var(--primary)';
        handle.style.borderRadius = '50%';
        
        // Position the handles
        switch (position) {
            case 'nw': // Northwest
                handle.style.top = '-5px';
                handle.style.left = '-5px';
                handle.style.cursor = 'nwse-resize';
                break;
            case 'n': // North
                handle.style.top = '-5px';
                handle.style.left = 'calc(50% - 5px)';
                handle.style.cursor = 'ns-resize';
                break;
            case 'ne': // Northeast
                handle.style.top = '-5px';
                handle.style.right = '-5px';
                handle.style.cursor = 'nesw-resize';
                break;
            case 'e': // East
                handle.style.top = 'calc(50% - 5px)';
                handle.style.right = '-5px';
                handle.style.cursor = 'ew-resize';
                break;
            case 'se': // Southeast
                handle.style.bottom = '-5px';
                handle.style.right = '-5px';
                handle.style.cursor = 'nwse-resize';
                break;
            case 's': // South
                handle.style.bottom = '-5px';
                handle.style.left = 'calc(50% - 5px)';
                handle.style.cursor = 'ns-resize';
                break;
            case 'sw': // Southwest
                handle.style.bottom = '-5px';
                handle.style.left = '-5px';
                handle.style.cursor = 'nesw-resize';
                break;
            case 'w': // West
                handle.style.top = 'calc(50% - 5px)';
                handle.style.left = '-5px';
                handle.style.cursor = 'ew-resize';
                break;
        }
        
        cropSelection.appendChild(handle);
    });
    
    // Add the crop container to image container
    imageContainer.appendChild(cropContainer);
    
    return { cropContainer, cropSelection, darkOverlay };
}

// Initialize cropping
function initCrop() {
    cropState.isCropping = true;
    
    // Show crop controls
    document.querySelector('.crop-buttons').style.display = 'flex';
    cropBtn.disabled = true;
    
    // Create crop overlay
    const { cropContainer, cropSelection, darkOverlay } = createCropOverlay();
    
    // Set initial crop selection size (default to 80% of image size)
    const imgRect = previewImage.getBoundingClientRect();
    const containerRect = imageContainer.getBoundingClientRect();
    
    const initialWidth = imgRect.width * 0.8;
    const initialHeight = imgRect.height * 0.8;
    
    // Calculate center position
    const startX = (imgRect.width - initialWidth) / 2 + (imgRect.left - containerRect.left);
    const startY = (imgRect.height - initialHeight) / 2 + (imgRect.top - containerRect.top);
    
    // Update crop selection position and size
    cropSelection.style.left = `${startX}px`;
    cropSelection.style.top = `${startY}px`;
    cropSelection.style.width = `${initialWidth}px`;
    cropSelection.style.height = `${initialHeight}px`;
    
    // Update the crop overlay (cut out the selected area from the dark overlay)
    updateCropOverlay(darkOverlay, cropSelection);
    
    // Add event listeners for mouse interaction
    cropSelection.addEventListener('mousedown', startDragCropSelection);
    cropContainer.addEventListener('mousedown', startNewCropSelection);
    
    // Add event listeners for resize handles
    const resizeHandles = cropSelection.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', startResizeCropSelection);
    });
    
    // Store references
    cropState.cropContainer = cropContainer;
    cropState.cropSelection = cropSelection;
    cropState.darkOverlay = darkOverlay;
}

// Update crop overlay (cut out the selected area)
function updateCropOverlay(darkOverlay, cropSelection) {
    const cropRect = cropSelection.getBoundingClientRect();
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Calculate relative position
    const top = cropRect.top - containerRect.top;
    const left = cropRect.left - containerRect.left;
    const width = cropRect.width;
    const height = cropRect.height;
    
    // Create clip path to cut out the selected area
    darkOverlay.style.clipPath = `
        polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% ${top}px, ${left}px ${top}px,
            ${left}px ${top + height}px, ${left + width}px ${top + height}px,
            ${left + width}px ${top}px, 0% ${top}px
        )
    `;
}

// Start dragging crop selection
function startDragCropSelection(e) {
    // Ignore if clicked on a resize handle
    if (e.target.classList.contains('resize-handle')) {
        return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    cropState.isDragging = true;
    
    const cropSelection = cropState.cropSelection;
    const rect = cropSelection.getBoundingClientRect();
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Calculate offset from mouse position to crop selection top-left corner
    cropState.offsetX = e.clientX - rect.left;
    cropState.offsetY = e.clientY - rect.top;
    
    // Add mouse move and mouse up event listeners
    document.addEventListener('mousemove', dragCropSelection);
    document.addEventListener('mouseup', stopDragCropSelection);
}

// Drag crop selection
function dragCropSelection(e) {
    if (!cropState.isDragging) return;
    
    e.preventDefault();
    
    const cropSelection = cropState.cropSelection;
    const containerRect = imageContainer.getBoundingClientRect();
    const cropRect = cropSelection.getBoundingClientRect();
    
    // Calculate new position
    let newLeft = e.clientX - containerRect.left - cropState.offsetX;
    let newTop = e.clientY - containerRect.top - cropState.offsetY;
    
    // Constrain to container boundaries
    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - cropRect.width));
    newTop = Math.max(0, Math.min(newTop, containerRect.height - cropRect.height));
    
    // Update crop selection position
    cropSelection.style.left = `${newLeft}px`;
    cropSelection.style.top = `${newTop}px`;
    
    // Update the crop overlay
    updateCropOverlay(cropState.darkOverlay, cropSelection);
}

// Stop dragging crop selection
function stopDragCropSelection() {
    cropState.isDragging = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', dragCropSelection);
    document.removeEventListener('mouseup', stopDragCropSelection);
}

// Start resizing crop selection
function startResizeCropSelection(e) {
    e.preventDefault();
    e.stopPropagation();
    
    cropState.isResizing = true;
    cropState.resizeHandle = e.target.dataset.position;
    
    const cropSelection = cropState.cropSelection;
    const rect = cropSelection.getBoundingClientRect();
    
    // Store initial crop selection dimensions and position
    cropState.startX = rect.left;
    cropState.startY = rect.top;
    cropState.width = rect.width;
    cropState.height = rect.height;
    
    // Store initial mouse position
    cropState.mouseStartX = e.clientX;
    cropState.mouseStartY = e.clientY;
    
    // Add mouse move and mouse up event listeners
    document.addEventListener('mousemove', resizeCropSelection);
    document.addEventListener('mouseup', stopResizeCropSelection);
}

// Resize crop selection
function resizeCropSelection(e) {
    if (!cropState.isResizing) return;
    
    e.preventDefault();
    
    const cropSelection = cropState.cropSelection;
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Calculate mouse movement
    const deltaX = e.clientX - cropState.mouseStartX;
    const deltaY = e.clientY - cropState.mouseStartY;
    
    // Calculate new dimensions and position based on which handle is being dragged
    let newLeft = cropState.startX - containerRect.left;
    let newTop = cropState.startY - containerRect.top;
    let newWidth = cropState.width;
    let newHeight = cropState.height;
    
    switch (cropState.resizeHandle) {
        case 'nw': // Northwest
            newLeft += deltaX;
            newTop += deltaY;
            newWidth -= deltaX;
            newHeight -= deltaY;
            break;
        case 'n': // North
            newTop += deltaY;
            newHeight -= deltaY;
            break;
        case 'ne': // Northeast
            newTop += deltaY;
            newWidth += deltaX;
            newHeight -= deltaY;
            break;
        case 'e': // East
            newWidth += deltaX;
            break;
        case 'se': // Southeast
            newWidth += deltaX;
            newHeight += deltaY;
            break;
        case 's': // South
            newHeight += deltaY;
            break;
        case 'sw': // Southwest
            newLeft += deltaX;
            newWidth -= deltaX;
            newHeight += deltaY;
            break;
        case 'w': // West
            newLeft += deltaX;
            newWidth -= deltaX;
            break;
    }
    
    // Ensure minimum size (20x20 pixels)
    if (newWidth < 20) {
        if (['nw', 'sw', 'w'].includes(cropState.resizeHandle)) {
            newLeft = (cropState.startX - containerRect.left) + cropState.width - 20;
        }
        newWidth = 20;
    }
    
    if (newHeight < 20) {
        if (['nw', 'n', 'ne'].includes(cropState.resizeHandle)) {
            newTop = (cropState.startY - containerRect.top) + cropState.height - 20;
        }
        newHeight = 20;
    }
    
    // Constrain to container boundaries
    newLeft = Math.max(0, Math.min(newLeft, containerRect.width - newWidth));
    newTop = Math.max(0, Math.min(newTop, containerRect.height - newHeight));
    
    // Update crop selection position and size
    cropSelection.style.left = `${newLeft}px`;
    cropSelection.style.top = `${newTop}px`;
    cropSelection.style.width = `${newWidth}px`;
    cropSelection.style.height = `${newHeight}px`;
    
    // Update the crop overlay
    updateCropOverlay(cropState.darkOverlay, cropSelection);
}

// Stop resizing crop selection
function stopResizeCropSelection() {
    cropState.isResizing = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', resizeCropSelection);
    document.removeEventListener('mouseup', stopResizeCropSelection);
}

// Start new crop selection (when clicking on the dark overlay)
function startNewCropSelection(e) {
    // Ignore if clicked on crop selection or a resize handle
    if (e.target === cropState.cropSelection || 
        e.target.classList.contains('resize-handle') ||
        cropState.cropSelection.contains(e.target)) {
        return;
    }
    
    e.preventDefault();
    
    const containerRect = imageContainer.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;
    
    cropState.startX = startX;
    cropState.startY = startY;
    cropState.width = 0;
    cropState.height = 0;
    
    // Update crop selection position
    cropState.cropSelection.style.left = `${startX}px`;
    cropState.cropSelection.style.top = `${startY}px`;
    cropState.cropSelection.style.width = '0';
    cropState.cropSelection.style.height = '0';
    
    // Add mouse move and mouse up event listeners
    document.addEventListener('mousemove', dragNewCropSelection);
    document.addEventListener('mouseup', stopNewCropSelection);
}

// Drag new crop selection
function dragNewCropSelection(e) {
    e.preventDefault();
    
    const containerRect = imageContainer.getBoundingClientRect();
    const currentX = e.clientX - containerRect.left;
    const currentY = e.clientY - containerRect.top;
    
    // Calculate width and height
    const width = Math.abs(currentX - cropState.startX);
    const height = Math.abs(currentY - cropState.startY);
    
    // Calculate top-left position
    const left = Math.min(cropState.startX, currentX);
    const top = Math.min(cropState.startY, currentY);
    
    // Update crop selection position and size
    cropState.cropSelection.style.left = `${left}px`;
    cropState.cropSelection.style.top = `${top}px`;
    cropState.cropSelection.style.width = `${width}px`;
    cropState.cropSelection.style.height = `${height}px`;
    
    // Update the crop overlay
    updateCropOverlay(cropState.darkOverlay, cropState.cropSelection);
}

// Stop new crop selection
function stopNewCropSelection() {
    // Remove event listeners
    document.removeEventListener('mousemove', dragNewCropSelection);
    document.removeEventListener('mouseup', stopNewCropSelection);
}

// Apply crop
function applyCrop() {
    if (!cropState.cropSelection) return;
    
    const cropSelection = cropState.cropSelection;
    const cropRect = cropSelection.getBoundingClientRect();
    const imgRect = previewImage.getBoundingClientRect();
    
    // Calculate relative position to the image
    const relLeft = cropRect.left - imgRect.left;
    const relTop = cropRect.top - imgRect.top;
    
    // Calculate scale between displayed size and natural size
    const scaleX = previewImage.naturalWidth / previewImage.offsetWidth;
    const scaleY = previewImage.naturalHeight / previewImage.offsetHeight;
    
    // Calculate crop dimensions in the original image
    const cropX = Math.max(0, relLeft) * scaleX;
    const cropY = Math.max(0, relTop) * scaleY;
    const cropWidth = Math.min(cropRect.width, imgRect.right - cropRect.left) * scaleX;
    const cropHeight = Math.min(cropRect.height, imgRect.bottom - cropRect.top) * scaleY;
    
    // Create canvas for cropping
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    // Draw cropped image
    ctx.drawImage(
        previewImage,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );
    
    // Update preview image
    previewImage.src = canvas.toDataURL();
    
    // Clean up
    finishCropping();
}

// Cancel crop
function cancelCrop() {
    finishCropping();
}

// Finish cropping (cleanup)
function finishCropping() {
    cropState.isCropping = false;
    
    // Remove crop overlay
    resetCropSelection();
    
    // Hide crop controls
    document.querySelector('.crop-buttons').style.display = 'none';
    cropBtn.disabled = false;
}

// Reset crop selection
function resetCropSelection() {
    if (cropState.cropContainer) {
        cropState.cropContainer.remove();
        cropState.cropContainer = null;
        cropState.cropSelection = null;
        cropState.darkOverlay = null;
    }
}

// Attach crop button event listeners
cropBtn.addEventListener('click', initCrop);
cropConfirmBtn.addEventListener('click', applyCrop);
cropCancelBtn.addEventListener('click', cancelCrop);

// Enhanced Cropping Functionality - End

// Reset filters (keeping your original code)
resetBtn.addEventListener('click', () => {
    filters = {
        brightness: 100,
        blur: 0,
        contrast: 100,
        hueRotate: 0,
        sepia: 0,
        grayscale: 0,
        flipX: false,
        flipY: false
    };

    // Reset input values
    Object.entries(filterInputs).forEach(([key, input]) => {
        if (input) {
            input.value = filters[key];
            updateFilterValue(input.id, filters[key]);
        }
    });

    // Reset active classes
    presetButtons.forEach(btn => btn.classList.remove('active'));
    
    // Reset flip buttons
    flipXBtn.classList.remove('active');
    flipYBtn.classList.remove('active');

    applyFilters();
});

// Background removal functionality (keeping your fixed code)
removeBgBtn.addEventListener('click', async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        alert("Please login to use background removal.");
        window.location.href = "login.html";
        return;
    }

    if (!previewImage.src) return;

    const apiKey = '744QuVViqibCNMohss6gqfuT'; // Replace with your key

    removeBgBtn.textContent = 'Removing...';
    removeBgBtn.disabled = true;

    try {
        const blob = await fetch(previewImage.src).then(res => res.blob());
        const formData = new FormData();
        formData.append('image_file', blob, 'image.png');

        const res = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey
            },
            body: formData
        });

        const resultBlob = await res.blob();
        const imgURL = URL.createObjectURL(resultBlob);
        previewImage.src = imgURL;
        applyFilters(); // re-apply filters
    } catch (err) {
        alert("Background removal failed.");
        console.error(err);
    }

    removeBgBtn.textContent = 'Remove Background';
    removeBgBtn.disabled = false;
});

// Download image (keeping your original code)
downloadBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = previewImage.naturalWidth;
    canvas.height = previewImage.naturalHeight;

    // Apply filters
    ctx.filter = `
        brightness(${filters.brightness}%)
        blur(${filters.blur}px)
        contrast(${filters.contrast}%)
        hue-rotate(${filters.hueRotate}deg)
        sepia(${filters.sepia}%)
        grayscale(${filters.grayscale || 0}%)
    `;

    // Handle flips
    if (filters.flipX || filters.flipY) {
        ctx.scale(filters.flipX ? -1 : 1, filters.flipY ? -1 : 1);
        ctx.translate(
            filters.flipX ? -canvas.width : 0,
            filters.flipY ? -canvas.height : 0
        );
    }

    ctx.drawImage(previewImage, 0, 0);

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
});
