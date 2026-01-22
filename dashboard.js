const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }
    loadMyItems(user.id);
}

window.signOut = async () => { await client.auth.signOut(); window.location.replace('index.html'); };

document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    
    // Mapping HTML inputs to your database columns
    const newItem = {
        user_id: user.id,
        item_name: document.getElementById('item-name').value, 
        category: document.getElementById('item-cat').value,
        base_ql: parseInt(document.getElementById('item-ql').value),
        price_g: parseInt(document.getElementById('price-g').value) || 0,
        price_s: parseInt(document.getElementById('price-s').value) || 0,
        price_c: parseInt(document.getElementById('price-c').value) || 0,
        price_i: parseInt(document.getElementById('price-i').value) || 0
    };

    const { error } = await client.from('products').insert([newItem]);

    if (error) {
        alert("Error saving: " + error.message);
    } else {
        alert("Success! Item is now live.");
        e.target.reset();
        loadMyItems(user.id);
    }
});

async function loadMyItems(userId) {
    const { data } = await client.from('products').select('*').eq('user_id', userId);
    const container = document.getElementById('my-inventory');
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                <div>
                    <span class="text-white font-bold">${item.item_name}</span>
                    <span class="text-yellow-600 ml-2">${item.base_ql} QL</span>
                    <p class="text-[10px] text-stone-500">${item.category} • ${item.price_g}g ${item.price_s}s ${item.price_c}c</p>
                </div>
            </div>`).join('');
    } else {
        container.innerHTML = "<p class='text-stone-600 italic'>No active listings.</p>";
    }
}

initDashboard();