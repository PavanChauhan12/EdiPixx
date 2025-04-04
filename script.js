// DOM Elements
const previewImage = document.getElementById('preview-image');
const placeholder = document.getElementById('placeholder');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset');
const flipXBtn = document.getElementById('flip-x');
const flipYBtn = document.getElementById('flip-y');

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
            downloadBtn.disabled = false;
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
