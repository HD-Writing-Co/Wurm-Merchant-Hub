// 1. Setup Connection (Ensure you use your real URL and Key here)
const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

// 2. Fetch and Display Data with Modern Card Design
async function loadInventory() {
    const { data, error } = await client
        .from('merchant_inventory') // Pulling from the VIEW we created
        .select('*');

    if (error) {
        console.error("Error fetching inventory:", error);
        return;
    }

    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; // Clear the "spirit woods" loading text

    data.forEach(item => {
        // Logic to pick a background icon based on category
        let iconName = 'package';
        if (item.category?.includes('Smithing')) iconName = 'anvil';
        if (item.category?.includes('Carpentry')) iconName = 'hammer';
        if (item.category?.includes('Farming')) iconName = 'wheat';
        if (item.category?.includes('Tailoring')) iconName = 'scissors';

        const card = `
            <div class="wurm-card p-6 rounded-xl relative group overflow-hidden shadow-2xl">
                <i data-lucide="${iconName}" class="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"></i>
                
                <div class="flex items-start justify-between relative z-10">
                    <div>
                        <span class="text-[10px] uppercase text-yellow-600 font-bold tracking-widest">${item.category || 'General'}</span>
                        <h3 class="text-xl font-semibold text-stone-200">${item.item_name}</h3>
                        <p class="text-stone-500 text-sm italic">${item.material || 'Standard'}</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-stone-900 px-3 py-1 rounded-md text-xs font-bold border border-yellow-800 text-yellow-500">
                            ${item.base_ql} QL
                        </div>
                        ${item.rarity !== 'Common' ? `<div class="mt-2 text-[10px] uppercase tracking-tighter text-purple-400 font-bold">${item.rarity}</div>` : ''}
                    </div>
                </div>

                <div class="mt-12 flex justify-between items-end relative z-10">
                    <div class="text-2xl font-light text-white">${item.price_display || 'Offer'}</div>
                    <button class="bg-yellow-700/10 border border-yellow-700/50 text-yellow-500 px-4 py-1 rounded text-xs hover:bg-yellow-700 hover:text-black transition font-bold uppercase">Details</button>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });

    // CRITICAL: This line makes the icons appear after the cards are created
    lucide.createIcons();
}

// 3. Handle the Order Form Submission
const orderForm = document.getElementById('order-form');
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error } = await client.from('order_requests').insert([{
            customer_name: document.getElementById('cust-name').value,
            item_name: document.getElementById('item-req').value,
            category_id: 1 // Link this to a real ID if needed later
        }]);

        if (error) alert("Order failed!");
        else {
            alert("Order sent to the Hub!");
            orderForm.reset();
        }
    });
}

// Start the app
loadInventory();