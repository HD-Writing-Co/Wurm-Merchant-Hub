const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

let allProducts = [];

// 1. AUTH CHECK: Updates the sidebar based on login status
async function checkUser() {
    const { data: { user } } = await client.auth.getUser();
    const navContainer = document.getElementById('nav-auth');
    if (user && navContainer) {
        navContainer.innerHTML = `
            <a href="dashboard.html" class="block p-4 rounded-xl bg-stone-900 border border-stone-800 hover:border-yellow-700/50 transition-all">
                <p class="text-[10px] text-stone-600 font-bold uppercase mb-2">Merchant Portal</p>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-yellow-900/20 border border-yellow-700/50 flex items-center justify-center">
                        <i data-lucide="layout-dashboard" class="w-5 h-5 text-yellow-500"></i>
                    </div>
                    <div><div class="text-sm font-bold text-stone-200">Dashboard</div></div>
                </div>
            </a>`;
        if (window.lucide) lucide.createIcons();
    }
}

// 2. DATA LOADING: Fetches products and joined profile data
async function loadInventory() {
    const { data, error } = await client
        .from('products')
        .select('*, profiles:seller_id (character_name, server_name)');
    
    if (!error) {
        allProducts = data;
        updateStats(data);
        renderGrid(data);
    } else {
        console.error("Database Error:", error.message);
        document.getElementById('inventory-grid').innerHTML = `<p class="text-red-500 text-center col-span-full">Error loading items: ${error.message}</p>`;
    }
}

// 3. MARKET STATS: Calculates unique sellers and total items
function updateStats(products) {
    const itemStat = document.getElementById('stat-items');
    const sellerStat = document.getElementById('stat-sellers');
    
    if (itemStat) itemStat.innerText = products.length;
    if (sellerStat) {
        const uniqueSellers = [...new Set(products.map(p => p.seller_id))].length;
        sellerStat.innerText = uniqueSellers;
    }
}

// 4. FILTERING: Handles both text search and server dropdown
window.runFilters = () => {
    const search = document.getElementById('search-bar').value.toLowerCase();
    const server = document.getElementById('filter-server').value;
    
    const filtered = allProducts.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(search);
        const matchesServer = server === 'all' || (item.profiles?.server_name === server);
        return matchesSearch && matchesServer;
    });

    renderGrid(filtered);
};

// 5. UTILITY: The Copy Command for Wurm Chat
window.copyWurmCommand = (seller, item, price, server) => {
    const command = `/tell ${seller} wtb ${item} for ${price} on ${server}`;
    navigator.clipboard.writeText(command).then(() => {
        alert("Command copied to clipboard! Paste it into your Wurm chat.");
    });
};

// 6. RENDER: Builds the unique Wurm Hub product cards
function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    if (products.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-stone-600 italic">No matching items found in the Hub.</div>`;
        return;
    }

    products.forEach(item => {
        // Price Formatting
        let priceParts = [];
        if (item.price_g > 0) priceParts.push(`${item.price_g}g`);
        if (item.price_s > 0) priceParts.push(`${item.price_s}s`);
        if (item.price_c > 0) priceParts.push(`${item.price_c}c`);
        if (item.price_i > 0) priceParts.push(`${item.price_i}i`);
        const finalPrice = priceParts.length > 0 ? priceParts.join(' ') : "Offer";
        
        const qlDisplay = item.base_ql ? `${item.base_ql} QL` : "Bulk";
        const sellerName = item.profiles?.character_name || 'Unknown';
        const serverName = item.profiles?.server_name || 'Cadence';

        grid.innerHTML += `
            <div class="wurm-card overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/40 flex flex-col">
                <div class="h-24 bg-stone-800/30 flex items-center justify-center relative border-b border-stone-800">
                    <span class="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest text-yellow-600 bg-black/60 px-2 py-0.5 rounded border border-yellow-900/30">
                        ${item.category}
                    </span>
                    <span class="absolute top-3 right-3 text-[9px] font-bold text-stone-500 uppercase">
                        ${serverName}
                    </span>
                    <i data-lucide="package" class="w-8 h-8 text-stone-700"></i>
                </div>

                <div class="p-6 flex-grow">
                    <h3 class="text-xl font-bold text-white mb-4 truncate">${item.item_name}</h3>

                    <div class="grid grid-cols-2 gap-3 mb-6">
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold mb-1">In Stock</p>
                            <p class="text-xs font-mono text-stone-300">${item.quantity || '∞'}</p>
                        </div>
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold mb-1">Quality</p>
                            <p class="text-xs font-mono text-yellow-600">${qlDisplay}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-end border-t border-white/5 pt-4">
                        <div>
                            <p class="text-[9px] uppercase text-stone-600 font-bold mb-1">Asking Price</p>
                            <div class="text-xl font-black text-white">${finalPrice}</div>
                        </div>
                        <button onclick="copyWurmCommand('${sellerName}', '${item.item_name}', '${finalPrice}', '${serverName}')" 
                                class="p-3 bg-stone-800 hover:bg-yellow-600 text-stone-500 hover:text-black rounded-xl transition-all shadow-lg"
                                title="Copy /tell command">
                            <i data-lucide="message-square" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <div class="px-6 py-3 bg-black/20 border-t border-stone-800 flex justify-between items-center text-[10px]">
                    <span class="text-stone-500 font-bold uppercase tracking-tighter">
                        Merchant: <span class="text-stone-300 underline cursor-pointer" onclick="window.location.href='merchant.html?id=${item.seller_id}'">${sellerName}</span>
                    </span>
                    <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                </div>
            </div>`;
    });
    if (window.lucide) lucide.createIcons();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => { 
    checkUser(); 
    loadInventory(); 
});