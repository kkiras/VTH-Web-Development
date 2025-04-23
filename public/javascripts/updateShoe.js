

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
    const id = document.getElementById('id').value;
    const name = document.getElementById('name').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;
    const brand = document.getElementById('brand').value;
    const color = document.getElementById('color').value;
    const stock = document.getElementById('stock').value;

    // Update default preview
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewPrice').textContent = price;

    // Update hover preview
    // document.getElementById('previewNameHover').textContent = name;
    document.getElementById('previewNameHover').textContent = name;
    document.getElementById('previewPriceHover').textContent = price;
    document.getElementById('previewDescriptionHover').textContent = description;
    document.getElementById('previewBrandHover').textContent = brand;
    document.getElementById('previewColorHover').textContent = color;
    document.getElementById('previewStockHover').textContent = `${stock} units`;

    // Update available sizes
    const sizeCheckboxes = document.querySelectorAll('.sizes input[type="checkbox"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(checkbox => checkbox.value);
    const previewSizes = document.getElementById('previewSizesHover');
    previewSizes.innerHTML = sizes.map(size => `<span>${size}</span>`).join('');
}

function populateForm(shoeData) {
    document.getElementById('id').value = shoeData.id || '';
    document.getElementById('name').value = shoeData.name || '';
    document.getElementById('price').value = shoeData.price || '';
    document.getElementById('description').value = shoeData.description || '';
    document.getElementById('brand').value = shoeData.brand || '';
    
    document.getElementById('type').value = shoeData.type || '';
    document.getElementById('gender').value = shoeData.gender || '';
    document.getElementById('color').value = shoeData.color || '';
    document.getElementById('stock').value = shoeData.stock || '';

    // Set the image preview if available
    if (shoeData.image) {
        const previewImage = document.getElementById('previewImage');
        previewImage.innerHTML = `<img src="http://localhost:3000/images/${shoeData.image}" >`;
    }

    const sizeCheckboxes = document.querySelectorAll('input[name="size[]"]');
    sizeCheckboxes.forEach(checkbox => {
        checkbox.checked = shoeData.size?.includes(checkbox.value) || false;
    });

    updatePreview();
    console.log('Current next shoe data:', shoeData.id);
}

function btnStateHandle(){
    document.getElementById('btn-add-shoe').disabled = true;
    document.getElementById('btn-add-shoe').style.background = '#ddd';
    document.getElementById('btn-add-shoe').style.cursor = 'not-allowed';

    document.getElementById('btn-submit-shoe').disabled = false;
    document.getElementById('btn-submit-shoe').style.background = '#16a34b';
    document.getElementById('btn-submit-shoe').style.cursor = 'pointer';
}

function resetForm(){
    document.getElementById('id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    document.getElementById('description').value = '';
    document.getElementById('brand').value = '';
    
    document.getElementById('type').value = '';
    document.getElementById('gender').value = '';
    document.getElementById('color').value = '';
    document.getElementById('stock').value = '';

    const sizeCheckboxes = document.querySelectorAll('input[name="size[]"]');
    sizeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('previewImage').innerText = 'No Image';
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