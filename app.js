const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function loadInventory() {
    const { data, error } = await client.from('products').select('*');
    if (!error) renderGrid(data);
}

function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    products.forEach(item => {
        // Build the Wurm Currency Display
        let p = "";
        if (item.price_g > 0) p += `${item.price_g}g `;
        if (item.price_s > 0) p += `${item.price_s}s `;
        if (item.price_c > 0) p += `${item.price_c}c `;
        if (item.price_i > 0) p += `${item.price_i}i `;
        if (p === "") p = "Offer";

        let icon = item.category?.includes('Mining') ? 'pickaxe' : 'package';

        grid.innerHTML += `
            <div class="wurm-card p-6 rounded-xl relative overflow-hidden">
                <i data-lucide="${icon}" class="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5"></i>
                <div class="relative z-10">
                    <span class="text-[10px] uppercase text-yellow-600 font-bold">${item.category}</span>
                    <h3 class="text-xl font-semibold text-stone-200">${item.item_name}</h3>
                    <div class="mt-8 flex justify-between items-end">
                        <div class="text-xl font-bold text-white">${p}</div>
                        <div class="bg-stone-900 px-3 py-1 rounded text-xs border border-yellow-800 text-yellow-500">${item.base_ql} QL</div>
                    </div>
                </div>
            </div>`;
    });
    lucide.createIcons();
}

loadInventory();