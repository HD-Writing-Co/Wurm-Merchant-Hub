const { createClient } = supabase;

// --- CONFIGURATION ---
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

/**
 * Checks for an active session and restores the sleek Merchant Portal look
 */
async function checkUser() {
    const { data: { user } } = await client.auth.getUser();
    const navContainer = document.getElementById('nav-auth');
    
    if (user && navContainer) {
        // We inject the original HTML structure you liked, 
        // but customized for a logged-in state.
        navContainer.innerHTML = `
            <a href="dashboard.html" class="block p-4 rounded-xl bg-stone-900 border border-stone-800 mb-8 mt-auto hover:border-yellow-700/50 transition-all">
                <p class="text-[10px] text-stone-600 font-bold uppercase mb-2">Merchant Portal</p>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-yellow-900/20 border border-yellow-700/50 flex items-center justify-center">
                        <i data-lucide="layout-dashboard" class="w-5 h-5 text-yellow-500"></i>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-stone-200">Dashboard</div>
                        <div class="text-[10px] text-stone-500 italic truncate w-32">${user.email}</div>
                    </div>
                </div>
            </a>
        `;
        // Refresh icons since we just injected a new one
        if (window.lucide) lucide.createIcons();
    }
}

async function loadInventory() {
    const { data, error } = await client.from('products').select('*');
    if (error) {
        console.error("Error fetching inventory:", error.message);
        return;
    }
    renderGrid(data);
}

function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    if (!products || products.length === 0) {
        grid.innerHTML = '<p class="text-stone-500 italic col-span-full text-center">No items currently listed on the Hub.</p>';
        return;
    }

    products.forEach(item => {
        let priceParts = [];
        if (item.price_g > 0) priceParts.push(`${item.price_g}g`);
        if (item.price_s > 0) priceParts.push(`${item.price_s}s`);
        if (item.price_c > 0) priceParts.push(`${item.price_c}c`);
        if (item.price_i > 0) priceParts.push(`${item.price_i}i`);
        
        const finalPriceLabel = priceParts.length > 0 ? priceParts.join(' ') : "Offer";

        let nameColor = "text-stone-200"; 
        if (item.rarity === 'Rare') nameColor = "text-blue-400";
        if (item.rarity === 'Supreme') nameColor = "text-pink-500";
        if (item.rarity === 'Fantastic') nameColor = "text-green-400";

        grid.innerHTML += `
            <div class="wurm-card p-6 rounded-xl relative group overflow-hidden border border-stone-800 bg-stone-900/40">
                <div class="relative z-10">
                    <span class="text-[10px] uppercase text-yellow-600 font-bold tracking-widest">${item.category || 'Misc'}</span>
                    <h3 class="text-xl font-semibold mt-1 ${nameColor}">${item.item_name}</h3>
                    <div class="mt-8 flex justify-between items-end">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-stone-500 uppercase font-medium">Price</span>
                            <div class="text-xl font-bold text-white tracking-tight">${finalPriceLabel}</div>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-[10px] uppercase text-stone-500 font-medium mb-1">${item.rarity || 'Common'}</span>
                            <div class="bg-black/60 px-3 py-1 rounded text-xs border border-yellow-900/50 text-yellow-500 font-mono">
                                ${item.base_ql} QL
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    if (window.lucide) lucide.createIcons();
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    checkUser();
    loadInventory();
});