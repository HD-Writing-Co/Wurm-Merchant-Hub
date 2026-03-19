const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

let allProducts = [];

function getCategoryImage(category) {
    const images = {
        'Carpentry': 'https://img.icons8.com/color/96/hammer.png',
        'Mining': 'https://img.icons8.com/color/96/pickax.png',
        'Digging': 'https://img.icons8.com/color/96/shovel.png',
        'Smithing': 'https://img.icons8.com/color/96/anvil.png',
        'Bulk': 'https://img.icons8.com/color/96/package.png'
    };
    return images[category] || 'https://img.icons8.com/color/96/box.png';
}

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
        lucide.createIcons();
    }
}

async function loadInventory() {
    const { data, error } = await client
        .from('products')
        .select('*, profiles:seller_id (character_name, server_name, last_seen)');
    
    if (!error) {
        allProducts = data;
        renderGrid(data);
    }
}

function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = products.map(item => {
        let price = `${item.price_g}g ${item.price_s}s ${item.price_c}c`;
        
        // Online Status Calculation (Seen in last 5 minutes)
        const lastSeen = new Date(item.profiles?.last_seen);
        const isOnline = (new Date() - lastSeen) < 300000;
        const statusDot = isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-stone-800';

        return `
            <div class="wurm-card overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/40 flex flex-col">
                <div class="h-24 bg-stone-800/20 flex items-center justify-center border-b border-stone-800/50 opacity-50">
                    <img src="${getCategoryImage(item.category)}" class="w-12 h-12 grayscale">
                </div>
                <div class="p-6">
                    <div class="flex justify-between mb-4">
                        <span class="text-[9px] font-black uppercase text-yellow-600 tracking-widest">${item.category}</span>
                        <span class="text-[9px] text-stone-500 uppercase font-bold">${item.profiles?.server_name || 'Cadence'}</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-6">${item.item_name}</h3>
                    
                    <div class="grid grid-cols-2 gap-3 mb-6">
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold">Stock</p>
                            <p class="text-xs font-mono text-stone-300">${item.quantity || '∞'}</p>
                        </div>
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold">Quality</p>
                            <p class="text-xs font-mono text-yellow-600">${item.base_ql || 'Bulk'}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-end border-t border-white/5 pt-4">
                        <div class="text-xl font-black text-white">${price}</div>
                        <button onclick="copyWurmCommand('${item.profiles?.character_name}', '${item.item_name}', '${price}', '${item.profiles?.server_name}')" 
                                class="p-3 bg-stone-800 hover:bg-yellow-600 text-stone-500 hover:text-black rounded-xl transition-all">
                            <i data-lucide="message-square" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <div class="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                        <a href="merchant.html?id=${item.seller_id}" class="text-[10px] text-stone-500 font-bold uppercase hover:text-white transition-colors underline">
                            Merchant: ${item.profiles?.character_name || 'Nefig'}
                        </a>
                        <div class="w-2.5 h-2.5 rounded-full ${statusDot}"></div>
                    </div>
                </div>
            </div>`;
    }).join('');
    lucide.createIcons();
}

window.copyWurmCommand = (seller, item, price, server) => {
    navigator.clipboard.writeText(\`/tell \${seller} wtb \${item} for \${price} on \${server}\`);
    alert("Copied to clipboard!");
};

document.addEventListener('DOMContentLoaded', () => { 
    checkUser(); 
    loadInventory(); 
});