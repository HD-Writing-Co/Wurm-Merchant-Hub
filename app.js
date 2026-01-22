const { createClient } = supabase;

// --- CONFIGURATION ---
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

/**
 * Fetches all products from the Supabase 'products' table.
 */
async function loadInventory() {
    const { data, error } = await client
        .from('products')
        .select('*');

    if (error) {
        console.error("Error fetching inventory:", error.message);
        return;
    }

    renderGrid(data);
}

/**
 * Renders the product cards into the inventory-grid.
 * @param {Array} products - Array of product objects from the database.
 */
function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    
    // Clear placeholders and "Loading" text before showing real items
    grid.innerHTML = ''; 

    if (!products || products.length === 0) {
        grid.innerHTML = '<p class="text-stone-500 italic col-span-full text-center">No items currently listed on the Hub.</p>';
        return;
    }

    products.forEach(item => {
        // 1. Build the Wurm Currency Display String
        let priceParts = [];
        if (item.price_g > 0) priceParts.push(`${item.price_g}g`);
        if (item.price_s > 0) priceParts.push(`${item.price_s}s`);
        if (item.price_c > 0) priceParts.push(`${item.price_c}c`);
        if (item.price_i > 0) priceParts.push(`${item.price_i}i`);
        
        const finalPriceLabel = priceParts.length > 0 ? priceParts.join(' ') : "Offer";

        // 2. Set Name Color based on Rarity
        let nameColor = "text-stone-200"; // Default (Common)
        if (item.rarity === 'Rare') nameColor = "text-blue-400";
        if (item.rarity === 'Supreme') nameColor = "text-pink-500";
        if (item.rarity === 'Fantastic') nameColor = "text-green-400";

        // 3. Select Icon based on Category
        let iconName = 'package';
        const cat = (item.category || '').toLowerCase();
        if (cat.includes('mining')) iconName = 'pickaxe';
        if (cat.includes('smithing')) iconName = 'hammer';
        if (cat.includes('carpentry')) iconName = 'log-in'; // or custom icon
        if (cat.includes('digging')) iconName = 'shovel';

        // 4. Construct the Card HTML
        const card = `
            <div class="wurm-card p-6 rounded-xl relative group overflow-hidden border border-stone-800 bg-stone-900/40">
                <i data-lucide="${iconName}" class="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5"></i>
                
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

        grid.innerHTML += card;
    });

    // Re-initialize Lucide icons for the newly injected HTML
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', loadInventory);