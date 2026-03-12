const { createClient } = supabase;

// --- CONFIGURATION ---
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { 
        window.location.href = 'login.html'; 
        return; 
    }
    loadProfile(user.id);
    loadMyItems(user.id);
}

// --- PROFILE LOGIC ---
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
    const updates = {
        id: user.id,
        character_name: document.getElementById('char-name').value,
        server_name: document.getElementById('char-server').value,
        bio: document.getElementById('char-bio').value,
        updated_at: new Date()
    };

    const { error } = await client.from('profiles').upsert(updates);
    if (error) alert(error.message);
    else alert("Profile updated successfully!");
};

// --- AUTH LOGIC ---
window.signOut = async () => { 
    await client.auth.signOut(); 
    window.location.replace('index.html'); 
};

// --- EDIT LOGIC ---
window.startEdit = async (itemId) => {
    const { data, error } = await client.from('products').select('*').eq('id', itemId).single();
    if (error) return;

    // Fill the hidden ID field so the form knows we are UPDATING, not CREATING
    document.getElementById('edit-item-id').value = data.id;
    
    // Fill the visible fields
    document.getElementById('item-name').value = data.item_name;
    document.getElementById('item-cat').value = data.category;
    document.getElementById('item-ql').value = data.base_ql || '';
    document.getElementById('item-rarity').value = data.rarity;
    document.getElementById('item-qty').value = data.quantity || '';
    document.getElementById('item-bulk').value = data.bulk_deal || '';
    document.getElementById('price-g').value = data.price_g;
    document.getElementById('price-s').value = data.price_s;
    document.getElementById('price-c').value = data.price_c;
    document.getElementById('price-i').value = data.price_i;

    // Change UI state
    document.getElementById('form-title').innerText = "Edit Listing";
    document.getElementById('submit-btn').innerText = "Update Listing";
    document.getElementById('cancel-edit').classList.remove('hidden');
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = () => {
    document.getElementById('add-item-form').reset();
    document.getElementById('edit-item-id').value = "";
    document.getElementById('form-title').innerText = "Add New Inventory";
    document.getElementById('submit-btn').innerText = "List Item";
    document.getElementById('cancel-edit').classList.add('hidden');
};

window.deleteItem = async (itemId) => {
    if (confirm("Permanently remove this listing?")) {
        const { error } = await client.from('products').delete().eq('id', itemId);
        if (error) alert("Error: " + error.message);
        else {
            const { data: { user } } = await client.auth.getUser();
            loadMyItems(user.id);
        }
    }
};

// --- FORM SUBMISSION (Add & Update) ---
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    const editId = document.getElementById('edit-item-id').value;

    const itemData = {
        user_id: user.id,
        seller_id: user.id,
        item_name: document.getElementById('item-name').value,
        category: document.getElementById('item-cat').value,
        base_ql: document.getElementById('item-ql').value ? parseInt(document.getElementById('item-ql').value) : null,
        rarity: document.getElementById('item-rarity').value,
        quantity: document.getElementById('item-qty').value,
        bulk_deal: document.getElementById('item-bulk').value,
        price_g: parseInt(document.getElementById('price-g').value) || 0,
        price_s: parseInt(document.getElementById('price-s').value) || 0,
        price_c: parseInt(document.getElementById('price-c').value) || 0,
        price_i: parseInt(document.getElementById('price-i').value) || 0
    };

    let result;
    if (editId) {
        // Update existing row
        result = await client.from('products').update(itemData).eq('id', editId);
    } else {
        // Insert new row
        result = await client.from('products').insert([itemData]);
    }

    if (result.error) {
        alert("Error saving: " + result.error.message);
    } else {
        alert("Listing saved!");
        resetForm();
        loadMyItems(user.id);
    }
});

// --- LISTING DISPLAY ---
async function loadMyItems(userId) {
    const { data } = await client.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('my-inventory');
    
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => {
            const p = `${item.price_g}g ${item.price_s}s ${item.price_c}c ${item.price_i}i`;
            const qlText = item.base_ql ? `${item.base_ql} QL` : 'Bulk';
            
            return `
            <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-white font-bold">${item.item_name}</span>
                        <span class="text-yellow-600 text-[10px] font-mono">${qlText}</span>
                    </div>
                    <p class="text-[10px] text-stone-500 uppercase tracking-tight">${item.category} • ${p}</p>
                    ${item.quantity ? `<p class="text-[10px] text-stone-400 mt-1">Stock: ${item.quantity}</p>` : ''}
                </div>
                <div class="flex gap-4">
                    <button onclick="startEdit(${item.id})" class="text-yellow-700 hover:text-yellow-500 text-xs font-bold uppercase transition-all">Edit</button>
                    <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 text-xs font-bold uppercase transition-all">Remove</button>
                </div>
            </div>`;
        }).join('');
    } else {
        container.innerHTML = "<p class='text-stone-600 italic text-center py-10'>No items listed yet.</p>";
    }
}

// Start everything
initDashboard();