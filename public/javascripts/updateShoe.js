function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImage = document.getElementById('previewImage');
            previewImage.innerHTML = `<img src="${e.target.result}" >`;
        };
        reader.readAsDataURL(file);
    }
}

function updatePreview() {
    const name = document.getElementById('name').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const color = document.getElementById('color').value;
    const stock = document.getElementById('stock').value;

    // Update default preview
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewPrice').textContent = price;

    // Update hover preview
    document.getElementById('previewNameHover').textContent = name;
    document.getElementById('previewPriceHover').textContent = price;
    document.getElementById('previewDescriptionHover').textContent = description;
    document.getElementById('previewCategoryHover').textContent = category;
    document.getElementById('previewColorHover').textContent = color;
    document.getElementById('previewStockHover').textContent = `${stock} units`;

    // Update available sizes
    const sizeCheckboxes = document.querySelectorAll('.sizes input[type="checkbox"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(checkbox => checkbox.value);
    const previewSizes = document.getElementById('previewSizesHover');
    previewSizes.innerHTML = sizes.map(size => `<span>${size}</span>`).join('');
}

function populateForm(shoeData) {
    document.getElementById('name').value = shoeData.name || '';
    document.getElementById('price').value = shoeData.price || '';
    document.getElementById('description').value = shoeData.description || '';
    document.getElementById('category').value = shoeData.category || '';
    document.getElementById('color').value = shoeData.color || '';
    document.getElementById('stock').value = shoeData.stock || '';

    // Set the image preview if available
    if (shoeData.image) {
        const previewImage = document.getElementById('previewImage');
        previewImage.innerHTML = `<img src="${shoeData.image}" >`;
    }

    const sizeCheckboxes = document.querySelectorAll('input[name="size[]"]');
    sizeCheckboxes.forEach(checkbox => {
        checkbox.checked = shoeData.size?.includes(checkbox.value) || false;
    });

    updatePreview();
}

// Make the image upload area clickable
const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('image');

imageUploadArea.addEventListener('click', () => {
    imageInput.click();
});

// Add drag-and-drop functionality
imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.style.backgroundColor = '#e0e0e0';
});

imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.style.backgroundColor = 'transparent';
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.style.backgroundColor = 'transparent';
    const file = e.dataTransfer.files[0];
    if (file) {
        imageInput.files = e.dataTransfer.files;
        previewImage({ target: imageInput });
    }
});

// Initial update to populate preview
updatePreview();