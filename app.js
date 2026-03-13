const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function checkUser() {
    const { data: { user } } = await client.auth.getUser();
    const navContainer = document.getElementById('nav-auth');
    if (user && navContainer) {
        navContainer.innerHTML = `
            <a href="dashboard.html" class="block p-4 rounded-xl bg-stone-900 border border-stone-800 mb-8 mt-auto hover:border-yellow-700/50 transition-all">
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

async function loadInventory() {
    const { data, error } = await client.from('products').select('*, profiles:seller_id (character_name, server_name)').order('created_at', { ascending: false });
    if (!error) renderGrid(data);
}

function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    products.forEach(item => {
        let priceParts = [];
        if (item.price_g > 0) priceParts.push(`${item.price_g}g`);
        if (item.price_s > 0) priceParts.push(`${item.price_s}s`);
        if (item.price_c > 0) priceParts.push(`${item.price_c}c`);
        if (item.price_i > 0) priceParts.push(`${item.price_i}i`);
        const finalPrice = priceParts.length > 0 ? priceParts.join(' ') : "Offer";
        
        const qlDisplay = item.base_ql ? `${item.base_ql} QL` : "Bulk";
        
        // Repositioned Quantity Badge: Moved out of the absolute top-right to prevent overlap
        const qtyBadge = item.quantity ? `<div class="mt-2 inline-block bg-stone-800 px-2 py-0.5 rounded text-[9px] font-bold text-stone-300 border border-stone-700 uppercase">Stock: ${item.quantity}</div>` : '';
        
        const bulkTag = item.bulk_deal ? `<div class="mt-2 inline-flex items-center gap-1 bg-green-900/30 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded border border-green-800/50"><i data-lucide="tag" class="w-3 h-3"></i> ${item.bulk_deal}</div>` : '';

        grid.innerHTML += `
            <div onclick="window.location.href='merchant.html?id=${item.seller_id}'" class="wurm-card p-6 rounded-xl relative cursor-pointer border border-stone-800 bg-stone-900/40 hover:border-yellow-700/30 transition-all shadow-lg flex flex-col justify-between">
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] uppercase text-yellow-600 font-bold tracking-widest bg-yellow-900/10 px-2 py-0.5 rounded border border-yellow-900/20">${item.category}</span>
                        <span class="text-[9px] text-stone-500 font-bold uppercase bg-stone-900/80 px-2 py-0.5 rounded border border-stone-800">${item.profiles?.server_name || 'Unknown'}</span>
                    </div>
                    
                    <h3 class="text-xl font-semibold text-stone-200 leading-tight">${item.item_name}</h3>
                    
                    ${qtyBadge}
                    ${bulkTag}

                    <div class="mt-4 border-t border-white/5 pt-3">
                        <span class="text-[10px] text-stone-400">Merchant: <span class="text-stone-200">${item.profiles?.character_name || 'Unknown'}</span></span>
                    </div>
                </div>

                <div class="mt-6 flex justify-between items-end">
                    <div class="text-xl font-bold text-white tracking-tight">${finalPrice}</div>
                    <div class="bg-black/60 px-3 py-1 rounded text-xs border border-yellow-900/50 text-yellow-500 font-mono font-bold">${qlDisplay}</div>
                </div>
            </div>`;
    });
    if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => { 
    checkUser(); 
    loadInventory(); 
});