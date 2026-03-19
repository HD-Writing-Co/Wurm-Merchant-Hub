const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }
    
    loadProfile(user.id);
    loadMyItems(user.id);
    
    // Start Heartbeat for Online Status
    updateOnlineStatus(user.id);
    setInterval(() => updateOnlineStatus(user.id), 30000);
}

async function updateOnlineStatus(userId) {
    await client
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
}

// PROFILE
async function loadProfile(userId) {
    const { data } = await client.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        document.getElementById('char-name').value = data.character_name || '';
        document.getElementById('char-server').value = data.server_name || 'Cadence';
        document.getElementById('char-bio').value = data.bio || '';
    }
}

window.saveProfile = async () => {
    const { data: { user } } = await client.auth.getUser();
    const { error } = await client.from('profiles').upsert({
        id: user.id,
        character_name: document.getElementById('char-name').value,
        server_name: document.getElementById('char-server').value,
        bio: document.getElementById('char-bio').value,
        last_seen: new Date().toISOString()
    });
    if (error) alert(error.message);
    else alert("Profile updated!");
};

window.signOut = async () => { await client.auth.signOut(); window.location.replace('index.html'); };

// LISTING LOGIC
window.startEdit = async (itemId) => {
    const { data, error } = await client.from('products').select('*').eq('id', itemId).single();
    if (error) return;

    document.getElementById('edit-item-id').value = data.id;
    document.getElementById('item-name').value = data.item_name;
    document.getElementById('item-cat').value = data.category;
    document.getElementById('item-ql').value = data.base_ql || '';
    document.getElementById('item-qty').value = data.quantity || '';
    document.getElementById('item-rarity').value = data.rarity;
    document.getElementById('price-g').value = data.price_g;
    document.getElementById('price-s').value = data.price_s;
    document.getElementById('price-c').value = data.price_c;
    document.getElementById('price-i').value = data.price_i;

    document.getElementById('form-title').innerText = "Edit Listing";
    document.getElementById('submit-btn').innerText = "Update Listing";
    document.getElementById('cancel-edit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = () => {
    document.getElementById('add-item-form').reset();
    document.getElementById('edit-item-id').value = "";
    document.getElementById('form-title').innerText = "Add New Inventory";
    document.getElementById('submit-btn').innerText = "List Item on Hub";
    document.getElementById('cancel-edit').classList.add('hidden');
};

document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    const editId = document.getElementById('edit-item-id').value;
    
    const itemData = {
        seller_id: user.id, // Primary key for joins
        user_id: user.id,   // Backup key
        item_name: document.getElementById('item-name').value, 
        category: document.getElementById('item-cat').value,
        base_ql: parseInt(document.getElementById('item-ql').value) || null,
        quantity: document.getElementById('item-qty').value || null,
        rarity: document.getElementById('item-rarity').value,
        price_g: parseInt(document.getElementById('price-g').value) || 0,
        price_s: parseInt(document.getElementById('price-s').value) || 0,
        price_c: parseInt(document.getElementById('price-c').value) || 0,
        price_i: parseInt(document.getElementById('price-i').value) || 0
    };

    let result = editId 
        ? await client.from('products').update(itemData).eq('id', editId)
        : await client.from('products').insert([itemData]);

    if (result.error) alert(result.error.message);
    else {
        alert(editId ? "Listing updated!" : "Success! Item is now live.");
        resetForm();
        loadMyItems(user.id);
    }
});

async function loadMyItems(userId) {
    const { data } = await client.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('my-inventory');
    
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800 mb-2">
                <div>
                    <span class="text-white font-bold">${item.item_name}</span>
                    <span class="text-yellow-600 ml-2">${item.base_ql || 'Bulk'} QL</span>
                    <p class="text-[10px] text-stone-500 uppercase">${item.category} • ${item.price_g}g ${item.price_s}s</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="startEdit(${item.id})" class="text-stone-400 hover:text-white text-xs font-bold uppercase">Edit</button>
                    <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 text-xs font-bold uppercase">Remove</button>
                </div>
            </div>`).join('');
    } else {
        container.innerHTML = "<p class='text-stone-600 italic text-center py-6'>No active listings.</p>";
    }
}

initDashboard();