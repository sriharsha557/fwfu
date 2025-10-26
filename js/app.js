// ========== MOCK PRODUCT DATABASE ==========
let products = [
    {id: 1, name: "Ferrari 488", brand: "Hot Wheels", scale: "1:18", category: "Sports", price: 2500, description: "Red sports car", image: "🏎️", inStock: true, onSale: true, salePrice: 1999},
    {id: 2, name: "BMW M3", brand: "Majorette", scale: "1:24", category: "Sports", price: 1500, description: "Black sedan", image: "🚗", inStock: true, onSale: false, salePrice: null},
    {id: 3, name: "Ford Mustang", brand: "Bburago", scale: "1:43", category: "Classic", price: 800, description: "Classic muscle car", image: "🏎️", inStock: true, onSale: true, salePrice: 599},
    {id: 4, name: "Range Rover", brand: "Siku", scale: "1:12", category: "SUV", price: 3500, description: "Luxury SUV", image: "🚙", inStock: false, onSale: false, salePrice: null},
    {id: 5, name: "Lamborghini", brand: "Hot Wheels", scale: "1:18", category: "Sports", price: 2800, description: "Yellow supercar", image: "🏎️", inStock: true, onSale: false, salePrice: null},
];

let cart = [];
let nextId = 6;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    loadCart();
    renderProducts();
    renderFeaturedProducts();
    renderAdminTable();
    updateCartCount();
}

// ========== SECTION MANAGEMENT ==========
function showSection(id) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show selected section
    document.getElementById(id).classList.add('active');
    
    // Render section content if needed
    if (id === 'shop') renderProducts();
    if (id === 'cart') renderCart();
    if (id === 'checkout') renderCheckoutSummary();
    if (id === 'admin') renderAdminTable();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// ========== PRODUCT RENDERING ==========
function renderProducts(filtered = null) {
    const grid = document.getElementById('productsGrid');
    const displayProducts = filtered || products;
    
    if (displayProducts.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>No products found</p></div>';
        return;
    }
    
    grid.innerHTML = displayProducts.map(p => `
        <div class="product-card">
            <div class="product-image">
                ${p.image}
                ${p.onSale ? '<div class="product-badge">SALE</div>' : ''}
                ${!p.inStock ? '<div class="product-badge" style="background: #999;">OUT OF STOCK</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-details">${p.scale} Scale • ${p.category}</div>
                <div class="product-price">
                    ${p.onSale ? `<span class="original">₹${p.price}</span>₹${p.salePrice}` : `₹${p.price}`}
                </div>
                <button class="btn" ${!p.inStock ? 'disabled' : ''} onclick="addToCart(${p.id})">
                    ${p.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderFeaturedProducts() {
    const featured = products.slice(0, 3);
    const grid = document.getElementById('featuredProducts');
    
    grid.innerHTML = featured.map(p => `
        <div class="product-card">
            <div class="product-image">
                ${p.image}
                ${p.onSale ? '<div class="product-badge">SALE</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-details">${p.scale} • ${p.category}</div>
                <div class="product-price">
                    ${p.onSale ? `<span class="original">₹${p.price}</span>₹${p.salePrice}` : `₹${p.price}`}
                </div>
                <button class="btn" onclick="addToCart(${p.id}); showSection('shop')">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// ========== FILTER FUNCTIONALITY ==========
function applyFilters() {
    const brand = document.getElementById('filterBrand').value;
    const scale = document.getElementById('filterScale').value;
    const category = document.getElementById('filterCategory').value;
    const price = parseInt(document.getElementById('filterPrice').value) || Infinity;
    const inStockOnly = document.getElementById('filterStock').checked;
    const saleOnly = document.getElementById('filterSale').checked;

    const filtered = products.filter(p => {
        if (brand && p.brand !== brand) return false;
        if (scale && p.scale !== scale) return false;
        if (category && p.category !== category) return false;
        if (p.price > price) return false;
        if (inStockOnly && !p.inStock) return false;
        if (saleOnly && !p.onSale) return false;
        return true;
    });

    renderProducts(filtered);
}

// ========== CART FUNCTIONS ==========
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product && product.inStock) {
        cart.push({...product});
        saveCart();
        updateCartCount();
        alert(`${product.name} added to cart!`);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCart();
}

function saveCart() {
    localStorage.setItem('fwfu_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('fwfu_cart');
    cart = saved ? JSON.parse(saved) : [];
}

function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

function renderCart() {
    const content = document.getElementById('cartContent');
    
    if (cart.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <p>Your cart is empty</p>
                <button class="btn" style="max-width: 200px; margin-top: 1rem;" onclick="showSection('shop')">
                    Continue Shopping
                </button>
            </div>
        `;
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.onSale ? item.salePrice : item.price), 0);

    content.innerHTML = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Scale</th>
                    <th>Price</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${cart.map((item, idx) => `
                    <tr>
                        <td>${item.name} (${item.brand})</td>
                        <td>${item.scale}</td>
                        <td>₹${item.onSale ? item.salePrice : item.price}</td>
                        <td><button class="remove-btn" onclick="removeFromCart(${idx})">Remove</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="summary" style="margin-top: 1.5rem;">
            <div class="summary-total">
                <span>Total:</span>
                <span>₹${total}</span>
            </div>
        </div>
        <button class="btn" style="margin-top: 1.5rem; max-width: 300px;" onclick="showSection('checkout')">
            Proceed to Checkout
        </button>
        <button class="btn btn-secondary" style="margin-top: 1rem; max-width: 300px;" onclick="showSection('shop')">
            Continue Shopping
        </button>
    `;
}

// ========== CHECKOUT FUNCTIONS ==========
function renderCheckoutSummary() {
    const summary = document.getElementById('checkoutSummary');
    const total = cart.reduce((sum, item) => sum + (item.onSale ? item.salePrice : item.price), 0);

    summary.innerHTML = `
        <h3>Order Summary</h3>
        ${cart.map(item => `
            <div class="summary-item">
                <span>${item.name} (${item.scale})</span>
                <span>₹${item.onSale ? item.salePrice : item.price}</span>
            </div>
        `).join('')}
        <div class="summary-total" style="margin-top: 1rem;">
            <span>Total:</span>
            <span>₹${total}</span>
        </div>
    `;
}

function placeOrder() {
    const name = document.getElementById('checkoutName').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();

    if (!name || !phone || !address) {
        alert('Please fill all fields');
        return;
    }

    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.onSale ? item.salePrice : item.price), 0);

    let message = `Hi, I'd like to place an order from FWFU.in:%0A%0A`;
    
    cart.forEach(item => {
        message += `• ${item.name} (${item.scale} Scale) - ₹${item.onSale ? item.salePrice : item.price}%0A`;
    });

    message += `%0ATotal: ₹${total}%0A`;
    message += `Shipping Address: ${address}%0A`;
    message += `Name: ${name}%0APhone: ${phone}`;

    // Open WhatsApp Web
    window.open(`https://wa.me/?text=${message}`, '_blank');
    
    // Clear cart after order
    cart = [];
    saveCart();
    updateCartCount();
}

// ========== ADMIN PANEL FUNCTIONS ==========
function switchAdminTab(tab) {
    document.getElementById('adminProducts').style.display = tab === 'products' ? 'block' : 'none';
    document.getElementById('adminAdd').style.display = tab === 'add' ? 'block' : 'none';

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.brand}</td>
            <td>${p.scale}</td>
            <td>
                <input type="number" value="${p.price}" min="0" step="10" 
                       onchange="updatePrice(${p.id}, this.value)">
            </td>
            <td>
                <input type="number" value="${p.salePrice || ''}" min="0" step="10" placeholder="N/A"
                       onchange="updateSalePrice(${p.id}, this.value)">
            </td>
            <td><input type="checkbox" ${p.inStock ? 'checked' : ''} onchange="toggleStock(${p.id})"></td>
            <td><input type="checkbox" ${p.onSale ? 'checked' : ''} onchange="toggleSale(${p.id})"></td>
            <td>
                <button class="remove-btn" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function toggleStock(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.inStock = !product.inStock;
        renderProducts();
        renderFeaturedProducts();
    }
}

function toggleSale(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.onSale = !product.onSale;
        renderProducts();
        renderFeaturedProducts();
    }
}

function updatePrice(id, newPrice) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.price = parseInt(newPrice) || 0;
        renderProducts();
        renderFeaturedProducts();
    }
}

function updateSalePrice(id, newSalePrice) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.salePrice = newSalePrice ? parseInt(newSalePrice) : null;
        renderProducts();
        renderFeaturedProducts();
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        renderAdminTable();
        renderProducts();
        renderFeaturedProducts();
    }
}

function addNewProduct() {
    const name = document.getElementById('adminName').value.trim();
    const brand = document.getElementById('adminBrand').value;
    const scale = document.getElementById('adminScale').value;
    const category = document.getElementById('adminCategory').value;
    const price = parseInt(document.getElementById('adminPrice').value);
    const description = document.getElementById('adminDescription').value.trim();
    const inStock = document.getElementById('adminInStock').checked;
    const onSale = document.getElementById('adminOnSale').checked;
    const salePrice = onSale ? parseInt(document.getElementById('adminSalePrice').value) : null;

    if (!name || !brand || !scale || !category || !price) {
        alert('Please fill all required fields');
        return;
    }

    const newProduct = {
        id: nextId++,
        name,
        brand,
        scale,
        category,
        price,
        description,
        image: '🚗',
        inStock,
        onSale,
        salePrice
    };

    products.push(newProduct);
    
    // Clear form
    document.getElementById('adminName').value = '';
    document.getElementById('adminBrand').value = '';
    document.getElementById('adminScale').value = '';
    document.getElementById('adminCategory').value = '';
    document.getElementById('adminPrice').value = '';
    document.getElementById('adminDescription').value = '';
    document.getElementById('adminInStock').checked = true;
    document.getElementById('adminOnSale').checked = false;
    document.getElementById('adminSalePrice').value = '';

    renderAdminTable();
    renderProducts();
    renderFeaturedProducts();
    alert('Product added successfully!');
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    const saleCheckbox = document.getElementById('adminOnSale');
    if (saleCheckbox) {
        saleCheckbox.addEventListener('change', function() {
            document.getElementById('salePriceGroup').style.display = this.checked ? 'block' : 'none';
        });
    }
});
