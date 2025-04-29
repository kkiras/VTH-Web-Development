let filteredShoes = [];
let currentPage = 1;
const itemsPerPage = 10;
let selectedShoeId = null;

function getStockStatus(stock) {
    if (stock === 0) return { label: "Out of Stock", color: "destructive" };
    if (stock <= 5) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
}

function filterShoes() {
    const filterCondition = document.getElementById('sortBy').value;
    console.log(filterCondition);
    fetch('/load-all-shoes?condition=' + filterCondition)
    .then(response => response.json())
    .then(data => {
        filteredShoes = data;
        currentPage = 1;
        renderShoes();
        renderPagination();
    })
    .catch(error => console.error('Error fetching shoes data:', error));
}

function renderShoes() {
    const shoesList = document.getElementById('shoesList');
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredShoes.slice(indexOfFirstItem, indexOfLastItem);

    shoesList.innerHTML = '';

    if (currentItems.length === 0) {
        shoesList.innerHTML = `
            <div class="text-center py-12">
                <div class="icon-circle">⚠️</div>
                <h3>No shoes found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }

    shoesList.classList.add('grid-view');
    currentItems.forEach(shoe => {
        const stockStatus = getStockStatus(shoe.stock);
        
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <div class="card-image">
                ${shoe.image ? `<img src="http://localhost:3000/images/${shoe.image}">` : `<div class="no-image">No Image</div>`}
                <span class="badge ${stockStatus.color}">${stockStatus.label}</span>
            </div>
            <div class="card-content">
                <div class="flex justify-between mb-2">
                    <div>
                        <h3>${shoe.name}</h3>
                        <p class="text-gray">ID: ${shoe.id}</p>
                    </div>
                    <p class="price">${shoe.price}</p>
                </div>
                <div class="sizes">
                    ${shoe.size.slice(0, 5).map(size => `<span>${size}</span>`).join('')}
                    ${shoe.size.length > 5 ? `<span>+${shoe.size.length - 5}</span>` : ''}
                </div>
                <div class="card-actions">
                    <div class="stock-info">Stock: ${shoe.stock} units</div>
                    <div class="dropdown"></div>
                </div>
            </div>
        `;
        
        const detailLink = document.createElement('a');
        detailLink.textContent = 'View Details';
        detailLink.classList.add('btn-update-direct');
        detailLink.href = `/pages/detail.html?id=${shoe.id}`;
        detailLink.addEventListener('click', (event) => {
            localStorage.setItem('shoe', JSON.stringify(shoe));
        });
        
        const dropdown = card.querySelector('.dropdown');
        dropdown.appendChild(detailLink);
        

        shoesList.appendChild(card);
    }); 
}

function renderPagination() {
    const totalPages = Math.ceil(filteredShoes.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    pagination.innerHTML += `
        <a href="#" onclick="setPage(${Math.max(currentPage - 1, 1)})" class="${currentPage === 1 ? 'disabled' : ''}">Previous</a>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagination.innerHTML += `
                <a href="#" onclick="setPage(${i})" class="${currentPage === i ? 'active' : ''}">${i}</a>
            `;
        } else if ((i === 2 && currentPage > 3) || (i === totalPages - 1 && currentPage < totalPages - 2)) {
            pagination.innerHTML += `<span>...</span>`;
        }
    }

    pagination.innerHTML += `
        <a href="#" onclick="setPage(${Math.min(currentPage + 1, totalPages)})" class="${currentPage === totalPages ? 'disabled' : ''}">Next</a>
    `;
}

function setPage(page) {
    currentPage = page;
    renderShoes();
    renderPagination();
}


