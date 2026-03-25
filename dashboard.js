const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }
    loadProfile(user.id);
    loadMyItems(user.id);
    loadInquiries(user.id);
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
        bio: document.getElementById('char-bio').value
    });
    alert(error ? error.message : "Profile updated!");
};

// INVENTORY
window.handleFormSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    const itemId = document.getElementById('edit-item-id').value;
    const payload = {
        seller_id: user.id,
        item_name: document.getElementById('item-name').value,
        category: document.getElementById('item-cat').value,
        rarity: document.getElementById('item-rarity').value,
        base_ql: parseInt(document.getElementById('item-ql').value) || 0,
        quantity: parseInt(document.getElementById('item-qty').value) || 1,
        price_g: parseInt(document.getElementById('price-g').value) || 0,
        price_s: parseInt(document.getElementById('price-s').value) || 0,
        price_c: parseInt(document.getElementById('price-c').value) || 0
    };

    const { error } = itemId 
        ? await client.from('products').update(payload).eq('id', itemId)
        : await client.from('products').insert([payload]);

    if (!error) { resetForm(); loadMyItems(user.id); }
    else alert(error.message);
};

window.deleteItem = async (itemId) => {
    if (confirm("Remove this listing?")) {
        const { error } = await client.from('products').delete().eq('id', itemId);
        if (!error) { const { data: { user } } = await client.auth.getUser(); loadMyItems(user.id); }
    }
};

window.startEdit = async (itemId) => {
    const { data } = await client.from('products').select('*').eq('id', itemId).single();
    if (!data) return;
    document.getElementById('edit-item-id').value = data.id;
    document.getElementById('item-name').value = data.item_name;
    document.getElementById('item-cat').value = data.category;
    document.getElementById('item-rarity').value = data.rarity || 'Common';
    document.getElementById('item-ql').value = data.base_ql;
    document.getElementById('item-qty').value = data.quantity;
    document.getElementById('price-g').value = data.price_g;
    document.getElementById('price-s').value = data.price_s;
    document.getElementById('price-c').value = data.price_c;
    document.getElementById('form-title').innerText = "Edit Listing";
    document.getElementById('submit-btn').innerText = "Update Listing";
    document.getElementById('cancel-edit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = () => {
    document.getElementById('add-item-form').reset();
    document.getElementById('edit-item-id').value = "";
    document.getElementById('form-title').innerText = "Add New Listing";
    document.getElementById('submit-btn').innerText = "List Item on Hub";
    document.getElementById('cancel-edit').classList.add('hidden');
};

async function loadMyItems(userId) {
    const { data } = await client.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('my-inventory');
    container.innerHTML = (data || []).map(item => {
        const rar = (item.rarity || 'Common').toLowerCase();
        const rarColor = rar === 'fantastic' ? 'text-[#ec4899]' : rar === 'supreme' ? 'text-[#0ea5e9]' : rar === 'rare' ? 'text-[#3b82f6]' : 'text-[#d4af37]';
        return `
        <div class="flex justify-between items-center bg-stone-900/40 p-5 rounded-2xl border border-stone-900">
            <div>
                <span class="text-white font-bold text-sm">${item.item_name}</span>
                <span class="${rarColor} ml-2 font-black uppercase text-[9px] tracking-tighter">${item.rarity || 'Common'} • QL ${item.base_ql}</span>
                <p class="text-[9px] text-stone-500 uppercase mt-1">${item.quantity}x • ${item.price_g}g ${item.price_s}s ${item.price_c}c</p>
            </div>
            <div class="flex gap-4">
                <button onclick="startEdit(${item.id})" class="text-stone-400 hover:text-white text-[9px] font-black uppercase">Edit</button>
                <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 text-[9px] font-black uppercase">Remove</button>
            </div>
        </div>`;
    }).join('') || "<p class='text-stone-700 italic py-6 text-xs'>No active listings.</p>";
}

// INQUIRIES
async function loadInquiries(userId) {
    const { data } = await client.from('inquiries').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('my-messages');
    container.innerHTML = (data || []).map(msg => `
        <div class="bg-stone-900/40 p-5 rounded-2xl border border-stone-800">
            <div class="flex justify-between mb-2">
                <span class="text-yellow-600 text-[10px] font-black uppercase tracking-widest">From: ${msg.sender_name}</span>
                <button onclick="deleteInquiry(${msg.id})" class="text-red-900 hover:text-red-500 text-[9px] font-black uppercase">Dismiss</button>
            </div>
            <p class="text-stone-400 text-[11px] leading-relaxed italic">"${msg.message}"</p>
        </div>
    `).join('') || "<p class='text-stone-700 italic py-6 text-xs'>No messages received.</p>";
}

window.deleteInquiry = async (id) => {
    const { error } = await client.from('inquiries').delete().eq('id', id);
    if (!error) { const { data: { user } } = await client.auth.getUser(); loadInquiries(user.id); }
};

window.signOut = async () => { await client.auth.signOut(); window.location.href = 'login.html'; };
initDashboard();