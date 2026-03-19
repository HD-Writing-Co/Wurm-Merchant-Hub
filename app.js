const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'your_supabase_key';
const client = createClient(_url, _key);

let allProducts = [];

async function loadInventory() {
    const { data, error } = await client
        .from('products')
        .select('*, profiles:seller_id (character_name, server_name)');

    if (!error) {
        allProducts = data;
        updateMarketStats(data);
        renderGrid(data);
    }
}

// Function to update the "Stats" in the header
function updateMarketStats(products) {
    const itemsEl = document.getElementById('stat-items');
    const sellersEl = document.getElementById('stat-sellers');
    if(itemsEl) itemsEl.innerText = products.length;
    if(sellersEl) {
        const uniqueSellers = [...new Set(products.map(p => p.seller_id))].length;
        sellersEl.innerText = uniqueSellers;
    }
}

// Global Filter (Search + Category + Server)
window.runFilters = () => {
    const search = document.getElementById('search-input').value.toLowerCase();
    const server = document.getElementById('filter-server').value;
    
    const filtered = allProducts.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(search);
        const matchesServer = server === 'all' || item.profiles?.server_name === server;
        return matchesSearch && matchesServer;
    });

    renderGrid(filtered);
};

// The "Copy Command" logic
window.copyWurmCommand = (seller, item, price, server) => {
    const command = `/tell ${seller} wtb ${item} for ${price} on ${server}`;
    navigator.clipboard.writeText(command);
    alert("Message copied! Paste it in Wurm chat.");
};

function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    products.forEach(item => {
        const seller = item.profiles?.character_name || 'Unknown';
        const server = item.profiles?.server_name || 'Cadence';
        const price = `${item.price_g}g ${item.price_s}s ${item.price_c}c`;

        grid.innerHTML += `
            <div class="wurm-card p-0 rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden flex flex-col">
                <div class="h-24 bg-stone-800/50 flex items-center justify-center relative border-b border-stone-800">
                    <span class="absolute top-3 left-3 text-[9px] font-black uppercase tracking-tighter text-yellow-600 bg-black/50 px-2 py-0.5 rounded border border-yellow-900/30">${item.category}</span>
                    <i data-lucide="package" class="w-8 h-8 text-stone-700"></i>
                </div>

                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg font-bold text-white">${item.item_name}</h3>
                        <span class="text-[10px] text-stone-500 font-bold uppercase">${server}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold">In Stock</p>
                            <p class="text-xs font-mono text-stone-300">${item.quantity || '∞'}</p>
                        </div>
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold">Min Order</p>
                            <p class="text-xs font-mono text-stone-300">${item.min_order || 1}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-end border-t border-white/5 pt-4">
                        <div>
                            <p class="text-[9px] uppercase text-stone-600 font-bold mb-1">Price</p>
                            <div class="text-xl font-black text-yellow-500">${price}</div>
                        </div>
                        <button onclick="copyWurmCommand('${seller}', '${item.item_name}', '${price}', '${server}')" 
                                class="p-3 bg-stone-800 hover:bg-yellow-600 text-stone-500 hover:text-black rounded-xl transition-all shadow-lg">
                            <i data-lucide="message-square" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>

                <div class="px-6 py-3 bg-black/20 border-t border-stone-800 flex justify-between items-center">
                    <span class="text-[10px] text-stone-500 uppercase font-bold">Merchant: <span class="text-stone-300">${seller}</span></span>
                    <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                </div>
            </div>`;
    });
    if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => { loadInventory(); });