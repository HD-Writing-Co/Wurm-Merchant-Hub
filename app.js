const { createClient } = supabase;

const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

let allProducts = []; 

async function loadInventory() {
    // Session Check to update sidebar
    const { data: { user } } = await client.auth.getUser();
    if (user) {
        const authLink = document.querySelector('a[href="login.html"]');
        if (authLink) {
            authLink.href = 'dashboard.html';
            const label = authLink.querySelector('.text-sm');
            if (label) label.innerText = 'Dashboard';
        }
    }

    // Pulling from the main products table
    const { data, error } = await client.from('products').select('*');

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    allProducts = data; 
    renderGrid(allProducts);
}

function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    products.forEach(item => {
        let icon = 'package';
        if (item.category?.includes('Mining')) icon = 'pickaxe';
        if (item.category?.includes('Carpentry')) icon = 'hammer';

        const card = `
            <div class="wurm-card p-6 rounded-xl relative group overflow-hidden">
                <i data-lucide="${icon}" class="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5"></i>
                <div class="relative z-10">
                    <span class="text-[10px] uppercase text-yellow-600 font-bold">${item.category}</span>
                    <h3 class="text-xl font-semibold text-stone-200">${item.item_name || 'Unknown Item'}</h3>
                    <div class="mt-4 flex justify-between items-end">
                        <div class="text-2xl font-light text-white">${item.price_display || 'Offer'}</div>
                        <div class="bg-stone-900 px-3 py-1 rounded text-xs border border-yellow-800 text-yellow-500">${item.base_ql} QL</div>
                    </div>
                </div>
            </div>`;
        grid.innerHTML += card;
    });
    lucide.createIcons();
}

loadInventory();