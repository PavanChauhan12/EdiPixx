// DOM Elements
const previewImage = document.getElementById('preview-image');
const placeholder = document.getElementById('placeholder');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset');
const flipXBtn = document.getElementById('flip-x');
const flipYBtn = document.getElementById('flip-y');
const removeBgBtn = document.getElementById('remove-bg-btn');

// Filter inputs
const filterInputs = {
    blur: document.getElementById('blur'),
    contrast: document.getElementById('contrast'),
    hueRotate: document.getElementById('hue-rotate'),
    sepia: document.getElementById('sepia')
};

// State
let filters = {
    blur: 0,
    contrast: 100,
    hueRotate: 0,
    sepia: 0,
    flipX: false,
    flipY: false
};

// Event Listeners
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            previewImage.src = reader.result;
            previewImage.style.display = 'block';
            placeholder.style.display = 'none';
            if (localStorage.getItem('isLoggedIn') === 'true') {
                downloadBtn.disabled = false;
            } 
            
            removeBgBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
});

// Update filter values display
function updateFilterValue(filterId, value) {
    const filterLabel = document.querySelector(`label[for="${filterId}"]`)
        .nextElementSibling;
    filterLabel.textContent = value;
}

// Apply filters to image
function applyFilters() {
    const filterString = `
        blur(${filters.blur}px)
        contrast(${filters.contrast}%)
        hue-rotate(${filters.hueRotate}deg)
        sepia(${filters.sepia}%)
    `;
    
    const transform = `scale(${filters.flipX ? -1 : 1}, ${filters.flipY ? -1 : 1})`;
    
    previewImage.style.filter = filterString;
    previewImage.style.transform = transform;
}

// Filter input event listeners
Object.entries(filterInputs).forEach(([key, input]) => {
    input.addEventListener('input', (e) => {
        filters[key] = e.target.value;
        updateFilterValue(input.id, e.target.value);
        applyFilters();
    });
});

// Flip controls
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



// Reset filters
resetBtn.addEventListener('click', () => {
    filters = {
        blur: 0,
        contrast: 100,
        hueRotate: 0,
        sepia: 0,
        flipX: false,
        flipY: false
    };

    // Reset input values
    Object.entries(filterInputs).forEach(([key, input]) => {
        input.value = filters[key];
        updateFilterValue(input.id, filters[key]);
    });

    // Reset flip buttons
    flipXBtn.classList.remove('active');
    flipYBtn.classList.remove('active');

    applyFilters();
});

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

    removeBgBtn.textContent = '🧼 Remove Background';
    removeBgBtn.disabled = false;
});


// Download image
downloadBtn.addEventListener('click', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        alert("Please login to download your image.");
        window.location.href = "login.html";
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = previewImage.naturalWidth;
    canvas.height = previewImage.naturalHeight;

    ctx.filter = `
        blur(${filters.blur}px)
        contrast(${filters.contrast}%)
        hue-rotate(${filters.hueRotate}deg)
        sepia(${filters.sepia}%)
    `;

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
