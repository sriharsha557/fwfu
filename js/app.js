// ========== SUPABASE CONFIGURATION ==========
// ⚠️ IMPORTANT: Replace these with your actual values from Supabase
const SUPABASE_URL = 'https://fxwdnjgecqswhypelmet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4d2RuamdlY3Fzd2h5cGVsbWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTExMjksImV4cCI6MjA3NzA2NzEyOX0.MoPHJYNhg7-61DQTqE8ehGcfdaG6bN9MSbr6fCJcbaw';
const BUCKET_NAME = 'product-images';

// Initialize Supabase client
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== PRODUCT DATABASE ==========
let products = [];
let cart = [];
let nextId = 1;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    init();
});

async function init() {
    try {
        await fetchProductsFromSupabase();
        loadCart();
        renderFeaturedProducts();
        renderAdminTable();
        updateCartCount();
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        // Show default products if Supabase fails
        initializeDefaultProducts();
    }
}

// ========== FETCH PRODUCTS FROM SUPABASE ==========
async function fetchProductsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.warn('Supabase fetch error:', error);
            initializeDefaultProducts();
            return;
        }

        products = data || [];
        console.log(`✅ Loaded ${products.length} products from Supabase`);
        renderProducts();
        renderFeaturedProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        initializeDefaultProducts();
    }
}

// ========== DEFAULT PRODUCTS (for testing without Supabase) ==========
function initializeDefaultProducts() {
    products = [
        {
            id: 1,
            name: "Ferrari 488",
            brand: "Hot Wheels",
            scale: "1:18",
            category: "Sports",
            price: 2500,
            description: "Red sports car",
            image_url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/ferari.jpg`,
            in_stock: true,
            on_sale: true,
            sale_price: 1999,
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            name: "BMW M3",
            brand: "Majorette",
            scale: "1:24",
            category: "Sports",
            price: 1500,
            description: "Black sedan",
            image_url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/bmw.jpg`,
            in_stock: true,
            on_sale: false,
            sale_price: null,
            created_at: new Date().toISOString()
        },
        {
            id: 3,
            name: "Ford Mustang",
            brand: "Bburago",
            scale: "1:43",
            category: "Classic",
            price: 800,
            description: "Classic muscle car",
            image_url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/ford.jpg`,
            in_stock: true,
            on_sale: true,
            sale_price: 599,
            created_at: new Date().toISOString()
        }
    ];
    nextId = 4;
}

// ========== SECTION MANAGEMENT ==========
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id === 'shop') renderProducts();
    if (id === 'cart') renderCart();
    if (id === 'checkout') renderCheckoutSummary();
    if (id === 'admin') renderAdminTable();
    
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
                ${p.image_url ? 
                    `<img src="${p.image_url}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; background: #f0f0f0;">` : 
                    '<div style="display:flex; align-items:center; justify-content:center; font-size:3rem;">🚗</div>'
                }
                ${p.on_sale ? '<div class="product-badge">SALE</div>' : ''}
                ${!p.in_stock ? '<div class="product-badge" style="background: #999;">OUT OF STOCK</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-details">${p.scale} Scale • ${p.category}</div>
                <div class="product-price">
                    ${p.on_sale ? `<span class="original">₹${p.price}</span>₹${p.sale_price}` : `₹${p.price}`}
                </div>
                <button class="btn" ${!p.in_stock ? 'disabled' : ''} onclick="addToCart(${p.id})">
                    ${p.in_stock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderFeaturedProducts() {
    const featured = products.slice(0, 3);
    const grid = document.getElementById('featuredProducts');
    
    if (featured.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">Featured products coming soon</p>';
        return;
    }
    
    grid.innerHTML = featured.map(p => `
        <div class="product-card">
            <div class="product-image">
                ${p.image_url ? 
                    `<img src="${p.image_url}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; background: #f0f0f0;">` : 
                    '<div style="display:flex; align-items:center; justify-content:center; font-size:3rem;">🚗</div>'
                }
                ${p.on_sale ? '<div class="product-badge">SALE</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-details">${p.scale} • ${p.category}</div>
                <div class="product-price">
                    ${p.on_sale ? `<span class="original">₹${p.price}</span>₹${p.sale_price}` : `₹${p.price}`}
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
        if (inStockOnly && !p.in_stock) return false;
        if (saleOnly && !p.on_sale) return false;
        return true;
    });

    renderProducts(filtered);
}

// ========== CART FUNCTIONS ==========
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product && product.in_stock) {
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

    const total = cart.reduce((sum, item) => sum + (item.on_sale ? item.sale_price : item.price), 0);

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
                        <td>₹${item.on_sale ? item.sale_price : item.price}</td>
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
    const total = cart.reduce((sum, item) => sum + (item.on_sale ? item.sale_price : item.price), 0);

    summary.innerHTML = `
        <h3>Order Summary</h3>
        ${cart.map(item => `
            <div class="summary-item">
                <span>${item.name} (${item.scale})</span>
                <span>₹${item.on_sale ? item.sale_price : item.price}</span>
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

    const total = cart.reduce((sum, item) => sum + (item.on_sale ? item.sale_price : item.price), 0);

    let message = `Hi, I'd like to place an order from FWFU.in:%0A%0A`;
    
    cart.forEach(item => {
        message += `• ${item.name} (${item.scale} Scale) - ₹${item.on_sale ? item.sale_price : item.price}%0A`;
    });

    message += `%0ATotal: ₹${total}%0A`;
    message += `Shipping Address: ${address}%0A`;
    message += `Name: ${name}%0APhone: ${phone}`;

    window.open(`https://wa.me/?text=${message}`, '_blank');
    
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
                <input type="number" value="${p.sale_price || ''}" min="0" step="10" placeholder="N/A"
                       onchange="updateSalePrice(${p.id}, this.value)">
            </td>
            <td><input type="checkbox" ${p.in_stock ? 'checked' : ''} onchange="toggleStock(${p.id})"></td>
            <td><input type="checkbox" ${p.on_sale ? 'checked' : ''} onchange="toggleSale(${p.id})"></td>
            <td>
                <button class="remove-btn" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function toggleStock(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.in_stock = !product.in_stock;
        updateProductInSupabase(product);
    }
}

function toggleSale(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.on_sale = !product.on_sale;
        updateProductInSupabase(product);
    }
}

function updatePrice(id, newPrice) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.price = parseInt(newPrice) || 0;
        updateProductInSupabase(product);
    }
}

function updateSalePrice(id, newSalePrice) {
    const product = products.find(p => p.id === id);
    if (product) {
        product.sale_price = newSalePrice ? parseInt(newSalePrice) : null;
        updateProductInSupabase(product);
    }
}

async function updateProductInSupabase(product) {
    try {
        const { error } = await supabase
            .from('products')
            .update({
                name: product.name,
                price: product.price,
                sale_price: product.sale_price,
                in_stock: product.in_stock,
                on_sale: product.on_sale,
                updated_at: new Date().toISOString()
            })
            .eq('id', product.id);

        if (error) {
            console.error('Update error:', error);
            alert('Error updating product');
        } else {
            console.log('✅ Product updated');
            renderProducts();
            renderFeaturedProducts();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Delete error:', error);
                alert('Error deleting product');
            } else {
                products = products.filter(p => p.id !== id);
                renderAdminTable();
                renderProducts();
                renderFeaturedProducts();
                console.log('✅ Product deleted');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// ========== UPLOAD IMAGE TO SUPABASE ==========
async function uploadImageToSupabase(file) {
    try {
        if (!file) {
            alert('Please select an image');
            return null;
        }

        // Validate file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only JPG, PNG, and WebP images allowed');
            return null;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Maximum 5MB');
            return null;
        }

        // Upload to Supabase
        const fileName = Date.now() + '_' + file.name.replace(/[^a-z0-9.]/gi, '_');
        
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file);

        if (error) {
            console.error('Upload error:', error);
            alert('Error uploading image: ' + error.message);
            return null;
        }

        // Get public URL
        const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${data.path}`;
        console.log('✅ Image uploaded:', imageUrl);
        return imageUrl;

    } catch (error) {
        console.error('Error:', error);
        alert('Error uploading image');
        return null;
    }
}

// ========== ADD NEW PRODUCT WITH IMAGE ==========
async function addNewProduct() {
    const name = document.getElementById('adminName').value.trim();
    const brand = document.getElementById('adminBrand').value;
    const scale = document.getElementById('adminScale').value;
    const category = document.getElementById('adminCategory').value;
    const price = parseInt(document.getElementById('adminPrice').value);
    const description = document.getElementById('adminDescription').value.trim();
    const inStock = document.getElementById('adminInStock').checked;
    const onSale = document.getElementById('adminOnSale').checked;
    const salePrice = onSale ? parseInt(document.getElementById('adminSalePrice').value) : null;
    const imageFile = document.getElementById('productImage').files[0];

    if (!name || !brand || !scale || !category || !price) {
        alert('Please fill all required fields');
        return;
    }

    const button = event.target;
    button.disabled = true;
    button.textContent = 'Adding...';

    try {
        // Upload image
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadImageToSupabase(imageFile);
            if (!imageUrl) {
                button.disabled = false;
                button.textContent = 'Add Product';
                return;
            }
        }

        // Create product object
        const newProduct = {
            name,
            brand,
            scale,
            category,
            price,
            description,
            image_url: imageUrl,
            in_stock: inStock,
            on_sale: onSale,
            sale_price: salePrice,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Save to Supabase
        const { data, error } = await supabase
            .from('products')
            .insert([newProduct])
            .select();

        if (error) {
            console.error('Insert error:', error);
            alert('Error adding product: ' + error.message);
            button.disabled = false;
            button.textContent = 'Add Product';
            return;
        }

        // Add to local products array
        products.push(data[0]);
        
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
        document.getElementById('productImage').value = '';

        renderAdminTable();
        renderProducts();
        renderFeaturedProducts();
        alert('✅ Product added successfully!');
        
        // Switch to products tab
        document.getElementById('adminProducts').style.display = 'block';
        document.getElementById('adminAdd').style.display = 'none';

    } catch (error) {
        console.error('Error:', error);
        alert('Error adding product');
    } finally {
        button.disabled = false;
        button.textContent = 'Add Product';
    }
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
