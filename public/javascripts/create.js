function previewImage(event) {
    const file = event.target.files[0];

    if (file) {
        // alert(file.originalname + " " + file.mimetype + " " + file.buffer);
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImage = document.getElementById('previewImage');
            previewImage.innerHTML = `<img src="${e.target.result}" >`;
        };
        reader.readAsDataURL(file);
    }
}

async function previewJSON(event) {
    const file = event.target.files[0];
    const fileName = document.getElementById('json-fileName');
    const summary = document.getElementById('json-summary');
    const firstItem = document.getElementById('json-firstItem');
    const jsonPreview = document.getElementById('jsonPreview');
    const importButton = document.getElementById('btn-import-json');
    
    if (file) {
        fileName.textContent = `Selected file: ${file.name}` ;
        fileName.classList.remove('hidden');
        fileName.classList.add('visible');
        jsonPreview.classList.remove('hidden');
        jsonPreview.classList.add('visible');
        const text = await file.text();
        const jsonData = JSON.parse(text);
        console.log(jsonData);
        if (!Array.isArray(jsonData)) {
            alert('Invalid format: JSON must be an array of shoe objects.');
            return;
        }
        summary.textContent = `Found ${jsonData.length} shoes in the JSON file. Preview of first item:`;
        firstItem.textContent = JSON.stringify(jsonData[0], null, 2);
        importButton.classList.remove('hidden');
        importButton.classList.add('visible');
        importButton.textContent = jsonData.length > 1 ? `Import ${jsonData.length} shoes` : 'Import shoe';


        // jsonPreview.style.display = 'block';
        // importButton.style.display = 'inline-block';

    }
}

function updatePreview() {
    const name = document.getElementById('name').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;
    const brand = document.getElementById('brand').value;
    const color = document.getElementById('color').value;
    const stock = document.getElementById('stock').value;

    document.getElementById('previewName').textContent = name;
    document.getElementById('previewPrice').textContent = price;

    document.getElementById('previewNameHover').textContent = name;
    document.getElementById('previewPriceHover').textContent = price;
    document.getElementById('previewDescriptionHover').textContent = description;
    document.getElementById('previewCategoryHover').textContent = brand;
    document.getElementById('previewColorHover').textContent = color;
    document.getElementById('previewStockHover').textContent = `${stock} units`;

    const sizeCheckboxes = document.querySelectorAll('.sizes input[type="checkbox"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(checkbox => checkbox.value);
    const previewSizes = document.getElementById('previewSizesHover');
    previewSizes.innerHTML = sizes.map(size => `<span>${size}</span>`).join('');
}

const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('image');

imageUploadArea.addEventListener('click', () => {
    imageInput.click();
});

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

const jsonUploadArea = document.getElementById('json-fileUploadArea');
const jsonInput = document.getElementById('json-file');

jsonUploadArea.addEventListener('click', () => {
    jsonInput.click();
});

const jsonFieldToggle = document.getElementById('json-field-toggle');
const jsonContent = document.getElementById('json-content');

jsonFieldToggle.addEventListener('click', () => {
    jsonContent.classList.toggle('show');
});

updatePreview();