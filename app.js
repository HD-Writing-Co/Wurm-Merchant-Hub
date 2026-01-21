const { createClient } = supabase;
const client = createClient('YOUR_URL', 'YOUR_KEY');

async function loadInventory() {
    const { data, error } = await client.from('merchant_inventory').select('*');
    if (error) return;

    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; // Clear grid

    data.forEach(item => {
        const card = `
            <div class="wurm-card p-6 rounded-xl shadow-2xl relative overflow-hidden">
                <div class="absolute top-2 right-2 bg-stone-900 px-3 py-1 rounded-md text-xs font-bold border border-yellow-800">
                    ${item.base_ql} QL
                </div>
                
                <h3 class="text-xl font-bold mb-1">${item.item_name}</h3>
                <p class="text-stone-500 text-sm mb-4 italic">${item.material || 'Standard Material'}</p>
                
                <div class="flex justify-between items-center mt-6">
                    <span class="text-lg font-mono gold-text">${item.price_display || 'Negotiable'}</span>
                    <button class="bg-stone-700 hover:bg-stone-600 px-4 py-1 rounded text-xs uppercase font-bold">Details</button>
                </div>
                
                ${item.rarity !== 'Common' ? `<div class="mt-2 text-xs uppercase tracking-widest text-purple-400 font-bold">${item.rarity}</div>` : ''}
            </div>
        `;
        grid.innerHTML += card;
    });
}

loadInventory();