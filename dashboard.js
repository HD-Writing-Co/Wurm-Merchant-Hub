const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

/**
 * 1. INITIALIZATION & HEARTBEAT
 */
async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { 
        window.location.href = 'login.html'; 
        return; 
    }
    
    loadProfile(user.id);
    loadMyItems(user.id);
    
    // Start the Online Status Heartbeat
    updateOnlineStatus(user.id);
    setInterval(() => updateOnlineStatus(user.id), 30000); // Every 30 seconds
}

// Updates the 'last_seen' timestamp so the green dot shows on index.html
async function updateOnlineStatus(userId) {
    await client
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
}

/**
 * 2. PROFILE MANAGEMENT
 */
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
        last_seen: new Date().toISOString() // Set active on save
    });
    
    if (error) alert("Profile Error: " + error.message);
    else alert("Profile updated! Your listings will now show you as Online.");
};

window.signOut = async () => { 
    await client.auth.signOut(); 
    window.location.replace('index.html'); 
};

/**
 * 3. LISTING LOGIC (EDIT/ADD)
 */
window.startEdit = async (itemId) => {
    const { data, error } = await client.from('products').select('*').eq('id', itemId).single();
    if (error) return;

    // Fill form with existing data
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

    // Update UI state
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

window.deleteItem = async (itemId) => {
    if (confirm("Remove this listing from the Hub?")) {
        const { error } = await client.from('products').delete().eq('id', itemId);
        if (error) alert(error.message);
        else {
            const { data: { user } } = await client.auth.getUser();
            loadMyItems(user.id);
        }
    }
};

// Handle Form Submission
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    const editId = document.getElementById('edit-item-id').value;
    
    const itemData = {
        seller_id: user.id,
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

    let result;
    if (editId) {
        result = await client.from('products').update(itemData).eq('id', editId);
    } else {
        result = await client.from('products').insert([itemData]);
    }

    if (result.error) {
        alert("Submission Error: " + result.error.message);
    } else {
        alert(editId ? "Listing updated!" : "Success! Item is now live on the Hub.");
        resetForm();
        loadMyItems(user.id);
    }
});

/**
 * 4. VIEW LOADERS
 */
async function loadMyItems(userId) {
    const { data } = await client
        .from('products')
        .select('*')
        .eq('seller_id', userId); // Changed from user_id to seller_id for consistency
    
    const container = document.getElementById('my-inventory');
    
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="flex justify-between items-center bg-stone-900/50 p-6 rounded-xl border border-stone-800 mb-3 hover:border-stone-700 transition-all">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-white font-bold text-lg">${item.item_name}</span>
                        <span class="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded uppercase font-black">${item.rarity}</span>
                    </div>
                    <div class="flex items-center gap-4">
                         <p class="text-[11px] text-yellow-600 font-bold uppercase tracking-wider">
                            ${item.base_ql || 'Bulk'} QL ${item.quantity ? '• Stock: ' + item.quantity : ''}
                        </p>
                        <p class="text-[11px] text-stone-500 uppercase">
                            ${item.category} • ${item.price_g}g ${item.price_s}s ${item.price_c}c
                        </p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button onclick="startEdit(${item.id})" class="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white text-xs font-bold uppercase transition-colors">Edit</button>
                    <button onclick="deleteItem(${item.id})" class="px-4 py-2 rounded-lg bg-red-900/20 text-red-900 hover:bg-red-900/40 hover:text-red-500 text-xs font-bold uppercase transition-colors">Remove</button>
                </div>
            </div>`).join('');
    } else {
        container.innerHTML = `
            <div class="text-center py-12 bg-stone-900/30 border border-dashed border-stone-800 rounded-xl">
                <p class='text-stone-600 italic'>You don't have any active listings on the Hub.</p>
            </div>`;
    }
}

// Run on page load
initDashboard();