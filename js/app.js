// ========== CONFIGURATION ==========
const SUPABASE_URL = 'https://fxwdnjgecqswhypelmet.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4d2RuamdlY3Fzd2h5cGVsbWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQ5MTEyOSwiZXhwIjoyMDc3MDY3MTI5fQ.yMClkljE0XeBVBM4xobYlrwNcy69ROgSlm8RLIJYCCs'; // Replace with your key
const BUCKET_NAME = 'product-images';

// Telegram
const TELEGRAM_BOT_TOKEN = '8291385334:AAFJUkSVHfMw2VoXSHJvke1Ho9KEpswlDMw';
const TELEGRAM_CHAT_ID = '5616171390';

// EmailJS
const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';

// Admin
const ADMIN_EMAIL = 'your-email@toykoo.in';
const ADMIN_PASSWORD = 'toykoo123'; // ⚠️ CHANGE THIS!
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

// Initialize Supabase
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Global State
let products = [];
let cart = [];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Loaded - Starting initialization...');
    init();
    checkAdminSession();
});

async function init() {
    try {
        console.log('🔄 Initializing app...');
        loadCart();
        updateCartCount();
        
        await fetchProductsFromSupabase();
        renderFeaturedProducts();
        renderProducts();
        renderAdminTable();
        
        console.log('✅ App initialized successfully');
        console.log('📊 Total products:', products.length);
    } catch (error) {
        console.error('❌ Init error:', error);
        initializeDefaultProducts();
        renderFeaturedProducts();
        renderProducts();
    }
}

// ========== AUTHENTICATION ==========
function isAdminLoggedIn() {
    return sessionStorage.getItem('adminSession') === 'true';
}

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('loginError');
    
    if (!password) {
        errorMsg.textContent = '❌ Please enter password';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminSession', 'true');
        sessionStorage.setItem('adminLoginTime', Date.now());
        document.getElementById('adminPassword').value = '';
        errorMsg.style.display = 'none';
        showAdminPanel();
    } else {
        errorMsg.textContent = '❌ Incorrect password';
        errorMsg.style.display = 'block';
        document.getElementById('adminPassword').value = '';
    }
}

function showAdminPanel() {
    document.getElementById('adminLogin').classList.remove('active');
    document.getElementById('admin').classList.add('active');
    renderAdminTable();
    console.log('✅ Admin logged in');
    window.scrollTo(0, 0);
}

function adminLogout() {
    sessionStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminLoginTime');
    document.getElementById('admin').classList.remove('active');
    document.getElementById('adminLogin').classList.add('active');
    document.getElementById('adminPassword').value = '';
    alert('Logged out successfully');
    console.log('❌ Admin logged out');
    window.scrollTo(0, 0);
}

function checkAdminSession() {
    if (isAdminLoggedIn()) {
        const loginTime = parseInt(sessionStorage.getItem('adminLoginTime'));
        if (Date.now() - loginTime > SESSION_TIMEOUT) {
            adminLogout();
            alert('Session expired');
        }
    }
}

// ========== NAVIGATION ==========
function showSection(id) {
    if (id === 'admin' && !isAdminLoggedIn()) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('adminLogin').classList.add('active');
        window.scrollTo(0, 0);
        return;
    }
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id === 'shop') renderProducts();
    if (id === 'cart') renderCart();
    if (id === 'checkout') renderCheckoutSummary();
    
    window.scrollTo(0, 0);
}

// ========== FETCH PRODUCTS ==========
async function fetchProductsFromSupabase() {
    try {
        console.log('🔄 Fetching from Supabase...');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error:', error);
            initializeDefaultProducts();
            return;
        }

        if (data && data.length > 0) {
            products = data;
            console.log(`✅ Loaded ${products.length} products`);
        } else {
            console.log('No products found, using defaults');
            initializeDefaultProducts();
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        initializeDefaultProducts();
    }
}

// ========== DEFAULT PRODUCTS ==========
function initializeDefaultProducts() {
    products = [
        {
            id: 1, name: "Ferrari 488", brand: "Hot Wheels", scale: "1:18",
            category: "Sports", price: 2500, image_url: null,
            in_stock: true, on_sale: true, sale_price: 1999
        },
        {
            id: 2, name: "BMW M3", brand: "Majorette", scale: "1:24",
            category: "Sports", price: 1500, image_url: null,
            in_stock: true, on_sale: false, sale_price: null
        },
        {
            id: 3, name: "Ford Mustang", brand: "Bburago", scale: "1:43",
            category: "Classic", price: 800, image_url: null,
            in_stock: true, on_sale: true, sale_price: 599
        }
    ];
}

// ========== RENDER PRODUCTS ==========
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
                ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; background: #f0f0f0;">` : '<div style="display:flex; align-items:center; justify-content:center; font-size:3rem;">🚗</div>'}
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
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No featured products</p>';
        return;
    }
    
    grid.innerHTML = featured.map(p => `
        <div class="product-card">
            <div class="product-image">
                ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; background: #f0f0f0;">` : '<div style="display:flex; align-items:center; justify-content:center; font-size:3rem;">🚗</div>'}
                ${p.on_sale ? '<div class="product-badge">SALE</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${p.brand}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-details">${p.scale} • ${p.category}</div>
                <div class="product-price">
                    ${p.on_sale ? `<span class="original">₹${p.price}</span>₹${p.sale_price}` : `₹${p.price}`}
                </div>
                <button class="btn" onclick="addToCart(${p.id}); showSection('shop')">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// ========== FILTERING ==========
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

// ========== CART ==========
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
    localStorage.setItem('toykoo_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('toykoo_cart');
    cart = saved ? JSON.parse(saved) : [];
}

function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length;
}

function renderCart() {
    const content = document.getElementById('cartContent');
    
    if (cart.length === 0) {
        content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div><p>Your cart is empty</p><button class="btn" style="max-width: 200px; margin-top: 1rem;" onclick="showSection(\'shop\')">Continue Shopping</button></div>';
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.on_sale ? item.sale_price : item.price), 0);

    content.innerHTML = `
        <table class="cart-table">
            <thead><tr><th>Product</th><th>Scale</th><th>Price</th><th>Action</th></tr></thead>
            <tbody>${cart.map((item, idx) => `<tr><td>${item.name} (${item.brand})</td><td>${item.scale}</td><td>₹${item.on_sale ? item.sale_price : item.price}</td><td><button class="remove-btn" onclick="removeFromCart(${idx})">Remove</button></td></tr>`).join('')}</tbody>
        </table>
        <div class="summary" style="margin-top: 1.5rem;">
            <div class="summary-total">
                <span>Total:</span>
                <span>₹${total}</span>
            </div>
        </div>
        <button class="btn" style="margin-top: 1.5rem; max-width: 300px;" onclick="showSection('checkout')">Proceed to Checkout</button>
        <button class="btn btn-secondary" style="margin-top: 1rem; max-width: 300px;" onclick="showSection('shop')">Continue Shopping</button>
    `;
}

// ========== CHECKOUT ==========
function renderCheckoutSummary() {
    const summary = document.getElementById('checkoutSummary');
    const total = cart.reduce((sum, item) => sum + (item.on_sale ? item.sale_price : item.price), 0);

    summary.innerHTML = `
        <h3>Order Summary</h3>
        ${cart.map(item => `<div class="summary-item"><span>${item.name} (${item.scale})</span><span>₹${item.on_sale ? item.sale_price : item.price}</span></div>`).join('')}
        <div class="summary-total" style="margin-top: 1rem;"><span>Total:</span><span>₹${total}</span></div>
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

    const orderData = {
        name, phone, address, total,
        items: cart,
        orderTime: new Date().toLocaleString('en-IN'),
        orderId: 'ORD-' + Date.now()
    };

    const button = event.target;
    button.disabled = true;
    button.textContent = 'Processing...';

    Promise.all([
        sendOrderToTelegram(orderData),
        sendOrderEmail(orderData)
    ]).then(() => {
        alert('✅ Order submitted!\nAdmin notified via Telegram & Email');
        cart = [];
        saveCart();
        updateCartCount();
        document.getElementById('checkoutName').value = '';
        document.getElementById('checkoutPhone').value = '';
        document.getElementById('checkoutAddress').value = '';
        button.disabled = false;
        button.textContent = 'Confirm Order';
        setTimeout(() => showSection('home'), 1500);
    }).catch(error => {
        console.error('Error:', error);
        alert('⚠️ Order received but notification failed');
        button.disabled = false;
        button.textContent = 'Confirm Order';
    });
}

// ========== NOTIFICATIONS ==========
// ========== FIXED TELEGRAM NOTIFICATION ==========
async function sendOrderToTelegram(orderData) {
    try {
        console.log('📤 Sending to Telegram...');
        console.log('Bot Token:', TELEGRAM_BOT_TOKEN ? 'Set' : 'Not Set');
        console.log('Chat ID:', TELEGRAM_CHAT_ID ? 'Set' : 'Not Set');
        
        // Check if credentials are properly configured
        if (TELEGRAM_BOT_TOKEN.includes('YOUR_') || TELEGRAM_CHAT_ID.includes('YOUR_')) {
            console.warn('⚠️ Telegram credentials not configured');
            return false;
        }
        
        const itemsList = orderData.items
            .map(item => `• ${item.name} (${item.scale}) - ₹${item.on_sale ? item.sale_price : item.price}`)
            .join('\n');
        
        const message = `🛒 <b>NEW ORDER</b>\n\n` +
            `Order ID: <code>${orderData.orderId}</code>\n` +
            `Customer: <b>${orderData.name}</b>\n` +
            `Phone: <b>${orderData.phone}</b>\n` +
            `Address: ${orderData.address}\n\n` +
            `<b>Items:</b>\n${itemsList}\n\n` +
            `<b>Total: ₹${orderData.total}</b>\n` +
            `Time: ${orderData.orderTime}`;
        
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: TELEGRAM_CHAT_ID, 
                text: message, 
                parse_mode: 'HTML' 
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Telegram notification sent successfully');
            return true;
        } else {
            console.error('❌ Telegram API error:', result.description);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Telegram fetch error:', error);
        return false;
    }
}

async function sendOrderEmail(orderData) {
    try {
        if (!EMAILJS_PUBLIC_KEY.includes('YOUR_') && typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            const itemsList = orderData.items.map(item => `${item.name} (${item.scale}) - ₹${item.on_sale ? item.sale_price : item.price}`).join('\n');
            
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                to_email: ADMIN_EMAIL,
                order_id: orderData.orderId,
                customer_name: orderData.name,
                customer_phone: orderData.phone,
                customer_address: orderData.address,
                items_list: itemsList,
                total_amount: orderData.total,
                order_time: orderData.orderTime
            });
        }
    } catch (error) {
        console.error('Email error:', error);
    }
    return true;
}

// ========== ADMIN ==========
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
            <td>${p.id}</td><td>${p.name}</td><td>${p.brand}</td><td>${p.scale}</td>
            <td><input type="number" value="${p.price}" min="0" step="10" onchange="updatePrice(${p.id}, this.value)"></td>
            <td><input type="number" value="${p.sale_price || ''}" min="0" step="10" placeholder="N/A" onchange="updateSalePrice(${p.id}, this.value)"></td>
            <td><input type="checkbox" ${p.in_stock ? 'checked' : ''} onchange="toggleStock(${p.id})"></td>
            <td><input type="checkbox" ${p.on_sale ? 'checked' : ''} onchange="toggleSale(${p.id})"></td>
            <td><button class="remove-btn" onclick="deleteProduct(${p.id})">Delete</button></td>
        </tr>
    `).join('');
}

function toggleStock(id) {
    const p = products.find(x => x.id === id);
    if (p) { p.in_stock = !p.in_stock; renderProducts(); renderFeaturedProducts(); }
}

function toggleSale(id) {
    const p = products.find(x => x.id === id);
    if (p) { p.on_sale = !p.on_sale; renderProducts(); renderFeaturedProducts(); }
}

function updatePrice(id, price) {
    const p = products.find(x => x.id === id);
    if (p) { p.price = parseInt(price) || 0; renderProducts(); renderFeaturedProducts(); }
}

function updateSalePrice(id, price) {
    const p = products.find(x => x.id === id);
    if (p) { p.sale_price = price ? parseInt(price) : null; renderProducts(); renderFeaturedProducts(); }
}

function deleteProduct(id) {
    if (confirm('Delete this product?')) {
        products = products.filter(p => p.id !== id);
        renderAdminTable();
        renderProducts();
        renderFeaturedProducts();
    }
}

async function addNewProduct() {
    const name = document.getElementById('adminName').value.trim();
    const brand = document.getElementById('adminBrand').value;
    const scale = document.getElementById('adminScale').value;
    const category = document.getElementById('adminCategory').value;
    const price = parseInt(document.getElementById('adminPrice').value);
    const inStock = document.getElementById('adminInStock').checked;
    const onSale = document.getElementById('adminOnSale').checked;
    const salePrice = onSale ? parseInt(document.getElementById('adminSalePrice').value) : null;
    const imageFile = document.getElementById('productImage').files[0];

    if (!name || !brand || !scale || !category || !price) {
        alert('Please fill required fields');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Adding...';

    try {
        let imageUrl = null;
        if (imageFile) {
            const fileName = `${Date.now()}_${imageFile.name.replace(/[^a-z0-9.]/gi, '_')}`;
            const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, imageFile);
            
            if (error) {
                alert('Image upload failed: ' + error.message);
                btn.disabled = false;
                btn.textContent = 'Add Product';
                return;
            }
            
            imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
        }

        const { error } = await supabase.from('products').insert([{
            name, brand, scale, category, price,
            image_url: imageUrl,
            in_stock: inStock,
            on_sale: onSale,
            sale_price: salePrice,
            created_at: new Date().toISOString()
        }]);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('✅ Product added!');
            document.getElementById('adminName').value = '';
            document.getElementById('adminBrand').value = '';
            document.getElementById('adminScale').value = '';
            document.getElementById('adminCategory').value = '';
            document.getElementById('adminPrice').value = '';
            document.getElementById('adminInStock').checked = true;
            document.getElementById('adminOnSale').checked = false;
            document.getElementById('adminSalePrice').value = '';
            document.getElementById('productImage').value = '';
            
            await fetchProductsFromSupabase();
            renderAdminTable();
            renderProducts();
            renderFeaturedProducts();
        }
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Product';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const saleCheckbox = document.getElementById('adminOnSale');
    if (saleCheckbox) {
        saleCheckbox.addEventListener('change', function() {
            document.getElementById('salePriceGroup').style.display = this.checked ? 'block' : 'none';
        });
    }
});
