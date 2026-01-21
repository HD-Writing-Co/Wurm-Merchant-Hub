const { createClient } = supabase;
const client = createClient('YOUR_URL', 'YOUR_KEY');

async function loadInventory() {
    const { data, error } = await client.from('merchant_inventory').select('*');
    if (error) return;

    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; // Clear grid

    data.forEach(item => {
        const itemIcon = item.category === 'Smithing' ? 'shield' : 'package'; // Logic to pick icon

const card = `
    <div class="wurm-card p-6 rounded-xl relative group">
        <i data-lucide="${itemIcon}" class="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5 pointer-events-none"></i>
        
        <div class="flex items-start justify-between">
            <div>
                <span class="text-[10px] uppercase text-yellow-600 font-bold tracking-widest">${item.category}</span>
                <h3 class="text-xl font-semibold text-stone-200">${item.item_name}</h3>
            </div>
            <div class="text-right">
                <div class="text-xs text-stone-500">${item.rarity}</div>
                <div class="text-yellow-500 font-bold">${item.base_ql} QL</div>
            </div>
        </div>

        <div class="mt-8 flex justify-between items-end">
            <div class="text-2xl font-light text-white">${item.price_display}</div>
            <button class="bg-yellow-700/10 border border-yellow-700/50 text-yellow-500 px-4 py-1 rounded text-xs hover:bg-yellow-700 hover:text-black transition">View Details</button>
        </div>
    </div>
`;
        grid.innerHTML += card;
    });
}

loadInventory();