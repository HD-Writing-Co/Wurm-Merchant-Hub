const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

let allProducts = [];

// Category Image Mapper
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

async function loadInventory() {
    const grid = document.getElementById('inventory-grid');
    
    // We query 'products' and join 'profiles' using the seller_id column
    const { data, error } = await client
        .from('products')
        .select(`
            *,
            profiles (
                character_name,
                server_name,
                last_seen
            )
        `);
    
    if (error) {
        console.error("Hub Connection Error:", error);
        grid.innerHTML = `<div class="col-span-full text-center text-red-500 font-bold uppercase tracking-widest p-20 border border-red-900/20 rounded-xl bg-red-900/5">Connection Failed: ${error.message}</div>`;
        return;
    }

    if (data && data.length > 0) {
        allProducts = data;
        renderGrid(data);
    } else {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-stone-600 italic">No active listings found in the Hub.</div>`;
    }
}

function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = products.map(item => {
        // Price Formatting Logic
        let priceParts = [];
        if (item.price_g > 0) priceParts.push(`${item.price_g}g`);
        if (item.price_s > 0) priceParts.push(`${item.price_s}s`);
        if (item.price_c > 0) priceParts.push(`${item.price_c}c`);
        const finalPrice = priceParts.length > 0 ? priceParts.join(' ') : "Offer";
        
        // Online Status (Green dot if active within 5 mins)
        const lastSeen = item.profiles?.last_seen ? new Date(item.profiles.last_seen) : null;
        const isOnline = lastSeen && (new Date() - lastSeen) < 300000;
        const statusDot = isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-stone-800';

        return `
            <div class="wurm-card overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/40 flex flex-col relative">
                <div class="h-24 bg-stone-800/20 flex items-center justify-center border-b border-stone-800/50 opacity-40">
                    <img src="${getCategoryImage(item.category)}" class="w-12 h-12 grayscale">
                </div>

                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <span class="text-[9px] font-black uppercase text-yellow-600 tracking-widest">${item.category}</span>
                        <span class="text-[9px] text-stone-500 uppercase font-bold">${item.profiles?.server_name || 'Unknown'}</span>
                    </div>
                    
                    <h3 class="text-xl font-bold text-white mb-6 leading-tight">${item.item_name}</h3>
                    
                    <div class="grid grid-cols-2 gap-3 mb-6">
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold mb-1">Stock</p>
                            <p class="text-xs font-mono text-stone-300">${item.quantity || '∞'}</p>
                        </div>
                        <div class="bg-black/30 p-2 rounded-lg border border-stone-800/50">
                            <p class="text-[8px] uppercase text-stone-600 font-bold mb-1">Quality</p>
                            <p class="text-xs font-mono text-yellow-600">${item.base_ql ? item.base_ql + ' QL' : 'Bulk'}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-end border-t border-white/5 pt-4">
                        <div>
                            <p class="text-[8px] uppercase text-stone-600 font-bold mb-1">Asking Price</p>
                            <div class="text-xl font-black text-white tracking-tighter">${finalPrice}</div>
                        </div>
                        <button onclick="copyWurmCommand('${item.profiles?.character_name}', '${item.item_name}', '${finalPrice}', '${item.profiles?.server_name}')" 
                                class="p-3 bg-stone-800 hover:bg-yellow-600 text-stone-500 hover:text-black rounded-xl transition-all">
                            <i data-lucide="message-square" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <div class="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                        <a href="merchant.html?id=${item.seller_id}" class="text-[10px] text-stone-500 font-bold uppercase hover:text-white transition-colors underline decoration-stone-800 underline-offset-4">
                            Merchant: ${item.profiles?.character_name || 'View Profile'}
                        </a>
                        <div class="w-2.5 h-2.5 rounded-full ${statusDot}"></div>
                    </div>
                </div>
            </div>`;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
}

window.copyWurmCommand = (seller, item, price, server) => {
    const cmd = `/tell ${seller} wtb ${item} for ${price} on ${server}`;
    navigator.clipboard.writeText(cmd).then(() => alert("Command copied!"));
};

document.addEventListener('DOMContentLoaded', loadInventory);