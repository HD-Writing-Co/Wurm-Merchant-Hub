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

// --- INBOX / FORUM MANAGEMENT ---

async function loadInquiries(userId) {
    const { data, error } = await client
        .from('inquiries')
        .select('*')
        .eq('seller_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

    const inbox = document.getElementById('merchant-inbox');
    if (!inbox) return;

    if (!data || data.length === 0) {
        inbox.innerHTML = `<p class="text-stone-700 italic text-xs py-12 text-center">No active inquiries at this time.</p>`;
        return;
    }

    inbox.innerHTML = data.map(msg => `
        <div class="forum-post p-6 mb-2 rounded-r-2xl border-b border-stone-900/50 hover:bg-stone-900/20 transition-all">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-yellow-600 font-black text-xs">
                        ${msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <span class="text-white font-black text-[11px] uppercase tracking-widest">${msg.sender_name}</span>
                        <p class="text-stone-600 text-[9px] font-medium">${new Date(msg.created_at).toLocaleString()}</p>
                    </div>
                </div>
                <span class="bg-yellow-600/10 text-yellow-600 text-[8px] font-black px-2 py-1 rounded uppercase">Inquiry</span>
            </div>
            <div class="pl-11">
                <p class="text-stone-500 text-[10px] uppercase font-bold mb-1">Subject: ${msg.item_name}</p>
                <p class="text-stone-300 text-sm leading-relaxed border-t border-stone-900/50 pt-3 mt-2">
                    ${msg.message}
                </p>
            </div>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

// --- PROFILE MANAGEMENT ---

async function loadProfile(userId) {
    const { data } = await client.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        if(document.getElementById('char-name')) document.getElementById('char-name').value = data.character_name || '';
        if(document.getElementById('char-server')) document.getElementById('char-server').value = data.server_name || 'Cadence';
        if(document.getElementById('char-bio')) document.getElementById('char-bio').value = data.bio || '';
        if(document.getElementById('discord-id')) document.getElementById('discord-id').value = data.discord_id || '';
    }
}

window.saveProfile = async () => {
    const { data: { user } } = await client.auth.getUser();
    
    const payload = {
        id: user.id,
        character_name: document.getElementById('char-name').value,
        server_name: document.getElementById('char-server').value,
        bio: document.getElementById('char-bio').value,
        discord_id: document.getElementById('discord-id').value 
    };

    const { error } = await client.from('profiles').upsert(payload);
    alert(error ? error.message : "Profile settings updated!");
};

// --- INVENTORY MANAGEMENT ---

window.handleFormSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    const itemId = document.getElementById('edit-item-id').value;

    const payload = {
        seller_id: user.id,
        item_name: document.getElementById('item-name').value,
        category: document.getElementById('item-cat').value,
        rarity: document.getElementById('item-rarity').value,
        base_ql: parseFloat(document.getElementById('item-ql').value) || 0,
        quantity: parseInt(document.getElementById('item-qty').value) || 1,
        price_g: parseInt(document.getElementById('price-g').value) || 0,
        price_s: parseInt(document.getElementById('price-s').value) || 0,
        price_c: parseInt(document.getElementById('price-c').value) || 0,
        price_i: parseInt(document.getElementById('price-i').value) || 0
    };

    const { error } = itemId 
        ? await client.from('products').update(payload).eq('id', itemId)
        : await client.from('products').insert([payload]);

    if (!error) { 
        resetForm(); 
        loadMyItems(user.id); 
    } else {
        alert(error.message);
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
    document.getElementById('price-i').value = data.price_i || 0;

    document.getElementById('form-title').innerText = "Edit Listing";
    document.getElementById('submit-btn').innerText = "Update Listing";
    document.getElementById('cancel-edit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function loadMyItems(userId) {
    const { data } = await client.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('my-inventory');
    if (!container) return;
    
    container.innerHTML = (data || []).map(item => {
        let rarColor = "text-[#d4af37]";
        if (item.rarity === 'Fantastic') rarColor = "text-[#ec4899]";
        else if (item.rarity === 'Supreme') rarColor = "text-[#0ea5e9]";
        else if (item.rarity === 'Rare') rarColor = "text-[#3b82f6]";

        // Format price string to include iron if present
        let priceStr = `${item.price_g}g ${item.price_s}s ${item.price_c}c`;
        if (item.price_i > 0) priceStr += ` ${item.price_i}i`;

        return `
        <div class="flex justify-between items-center bg-stone-900/40 p-5 rounded-2xl border border-stone-900 hover:border-stone-700 transition-all">
            <div>
                <span class="text-white font-bold text-sm">${item.item_name}</span>
                <span class="${rarColor} ml-2 font-black uppercase text-[9px] tracking-tighter">${item.rarity || 'Common'} • QL ${item.base_ql}</span>
                <p class="text-[9px] text-stone-500 uppercase mt-1">Stock: ${item.quantity} • ${priceStr}</p>
            </div>
            <div class="flex gap-4">
                <button onclick="startEdit(${item.id})" class="text-stone-400 hover:text-white text-[9px] font-black uppercase tracking-widest">Edit</button>
                <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 text-[9px] font-black uppercase tracking-widest">Remove</button>
            </div>
        </div>`;
    }).join('') || "<p class='text-stone-700 italic text-center py-10 text-xs'>No active listings.</p>";
}

window.resetForm = () => {
    document.getElementById('add-item-form').reset();
    document.getElementById('edit-item-id').value = "";
    document.getElementById('form-title').innerText = "Add New Listing";
    document.getElementById('submit-btn').innerText = "List Item on Hub";
    document.getElementById('cancel-edit').classList.add('hidden');
};

window.deleteItem = async (itemId) => {
    if (confirm("Remove this listing?")) {
        const { error } = await client.from('products').delete().eq('id', itemId);
        if (!error) {
            const { data: { user } } = await client.auth.getUser();
            loadMyItems(user.id);
        } else {
            alert(error.message);
        }
    }
};

window.signOut = async () => { 
    await client.auth.signOut(); 
    window.location.href = 'login.html'; 
};

// Start
initDashboard();