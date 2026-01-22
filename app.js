const { createClient } = supabase;

// 1. Setup Connection
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

let allProducts = []; 

// 2. Main Function to Load and Render Cards
async function loadInventory() {
    // Session Check: Update "Sign In" to "Dashboard" if logged in
    const { data: { user } } = await client.auth.getUser();
    if (user) {
        const authLink = document.querySelector('a[href="login.html"]');
        if (authLink) {
            authLink.href = 'dashboard.html';
            const textEl = authLink.querySelector('.text-sm');
            const subTextEl = authLink.querySelector('.text-\\[10px\\]');
            if (textEl) textEl.innerText = 'Dashboard';
            if (subTextEl) subTextEl.innerText = 'Logged In';
        }
    }

    // Pull from 'products' table instead of the view
    const { data, error } = await client
        .from('products')
        .select('*');

    if (error) {
        console.error("Error fetching inventory:", error);
        return;
    }

    allProducts = data; 
    renderGrid(allProducts);
}

// 3. Render Function
function renderGrid(products) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = ''; 

    if (products.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-10 text-center text-stone-500 italic">No matching items found...</div>';
        return;
    }

    products.forEach(item => {
        let iconName = 'package';
        if (item.category?.includes('Mining')) iconName = 'pickaxe';
        if (item.category?.includes('Carpentry')) iconName = 'hammer';
        if (item.category?.includes('Digging')) iconName = 'shovels';

        const card = `
            <div class="wurm-card p-6 rounded-xl relative group overflow-hidden">
                <i data-lucide="${iconName}" class="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"></i>
                
                <div class="flex items-start justify-between relative z-10">
                    <div>
                        <span class="text-[10px] uppercase text-yellow-600 font-bold tracking-widest">${item.category}</span>
                        <h3 class="text-xl font-semibold text-stone-200">${item.item_name}</h3>
                        <p class="text-stone-500 text-sm italic">${item.material || 'Standard'}</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-stone-900 px-3 py-1 rounded-md text-xs font-bold border border-yellow-800 text-yellow-500">
                            ${item.base_ql} QL
                        </div>
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

    lucide.createIcons();
}

// 4. Filtering Logic
window.filterCategory = (category) => {
    if (category === 'All') {
        renderGrid(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderGrid(filtered);
    }
};

// 5. Search Logic
document.getElementById('search-bar').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.item_name.toLowerCase().includes(term) || 
        p.category?.toLowerCase().includes(term)
    );
    renderGrid(filtered);
});

loadInventory();