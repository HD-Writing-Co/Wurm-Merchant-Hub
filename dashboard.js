const { createClient } = supabase;
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // --- LIVE STATUS PULSE ---
    // Updates your 'updated_at' timestamp so the merchant page shows you as "Online"
    await client.from('profiles').update({ updated_at: new Date() }).eq('id', user.id);

    // --- CRITICAL AUTO-FIX ---
    // Links legacy items to your merchant ID if they are missing the seller_id
    await client
        .from('products')
        .update({ seller_id: user.id })
        .eq('user_id', user.id)
        .is('seller_id', null);
    
    loadProfile(user.id);
    loadMyItems(user.id);
    loadMessages(user.id);
}

// PROFILE MANAGEMENT
async function loadProfile(userId) {
    const { data } = await client.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        // Mapping DB fields to the dashboard.html IDs
        if(document.getElementById('prof_name')) document.getElementById('prof_name').value = data.character_name || '';
        if(document.getElementById('prof_server')) document.getElementById('prof_server').value = data.server_name || 'Cadence';
        if(document.getElementById('prof_bio')) document.getElementById('prof_bio').value = data.bio || '';
        
        // Support for old ID names if still present in HTML
        if(document.getElementById('char-name')) document.getElementById('char-name').value = data.character_name || '';
        if(document.getElementById('char-server')) document.getElementById('char-server').value = data.server_name || 'Cadence';
        if(document.getElementById('char-bio')) document.getElementById('char-bio').value = data.bio || '';
    }
}

window.updateProfile = async () => {
    const { data: { user } } = await client.auth.getUser();
    const name = document.getElementById('prof_name')?.value || document.getElementById('char-name')?.value;
    const server = document.getElementById('prof_server')?.value || document.getElementById('char-server')?.value;
    const bio = document.getElementById('prof_bio')?.value || document.getElementById('char-bio')?.value;

    const { error } = await client.from('profiles').upsert({
        id: user.id,
        character_name: name,
        server_name: server,
        bio: bio,
        updated_at: new Date()
    });

    if (error) alert(error.message);
    else alert("Profile updated! Your status is now 'Online'.");
};

// INQUIRY MANAGEMENT
async function loadMessages(userId) {
    const { data } = await client.from('inquiries').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('message-container');
    const countBadge = document.getElementById('msg-count');

    if (!data || data.length === 0) {
        if(container) container.innerHTML = `<p class="text-stone-700 italic text-sm">No new messages.</p>`;
        if(countBadge) countBadge.innerText = "0 New";
        return;
    }

    if(countBadge) countBadge.innerText = `${data.length} Total`;
    if(container) {
        container.innerHTML = data.map(msg => `
            <div class="p-4 rounded-xl message-pill flex justify-between items-start group mb-3">
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-xs font-bold text-yellow-600 uppercase tracking-tighter">${msg.sender_name}</span>
                        <span class="text-[9px] text-stone-600 font-mono">${new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="text-stone-300 text-sm leading-relaxed whitespace-pre-line">${msg.message}</p>
                </div>
                <button onclick="deleteMessage('${msg.id}')" class="ml-4 p-2 text-stone-700 hover:text-red-500 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

window.deleteMessage = async (id) => {
    if (confirm('Permanently delete this inquiry?')) {
        const { error } = await client.from('inquiries').delete().eq('id', id);
        if (!error) {
            const { data: { user } } = await client.auth.getUser();
            loadMessages(user.id);
        } else {
            alert("Delete failed: " + error.message);
        }
    }
};

// LISTING LOGIC
async function loadMyItems(userId) {
    const { data } = await client
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
        
    const container = document.getElementById('my-listings') || document.getElementById('my-inventory');
    
    if (!data || data.length === 0) {
        container.innerHTML = "<p class='text-stone-600 italic text-center py-6'>No active listings.</p>";
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="p-5 bg-[#111] border border-stone-900 rounded-2xl flex justify-between items-center group hover:border-stone-700 transition-all mb-3">
            <div class="flex gap-4 items-center">
                <div class="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center text-stone-600"><i data-lucide="package" class="w-5 h-5"></i></div>
                <div>
                    <p class="text-white font-bold mb-1">${item.item_name} <span class="text-yellow-600 text-[10px] ml-2 font-mono">QL ${item.base_ql}</span></p>
                    <div class="flex gap-2 text-[9px] font-black uppercase text-stone-600">
                        <span>${item.category}</span> • <span>Qty: ${item.quantity}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-right mr-4 font-mono text-xs">
                    ${item.price_g > 0 ? `<span class="text-yellow-500">${item.price_g}g</span>` : ''}
                    ${item.price_s > 0 ? `<span class="text-stone-300 ml-1">${item.price_s}s</span>` : ''}
                    ${item.price_c > 0 ? `<span class="text-orange-600 ml-1">${item.price_c}c</span>` : ''}
                </div>
                <div class="flex gap-2">
                    <button onclick="editProduct(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="p-2 text-stone-600 hover:text-blue-400"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="deleteProduct('${item.id}')" class="p-2 text-stone-600 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>`).join('');
    lucide.createIcons();
}

window.editProduct = (item) => {
    document.getElementById('form-container').classList.add('edit-mode');
    document.getElementById('form-title').innerText = "Edit Listing";
    document.getElementById('submit-btn').innerText = "Update Listing";
    document.getElementById('cancel-edit').classList.remove('hidden');
    
    document.getElementById('edit-id').value = item.id;
    document.getElementById('item_name').value = item.item_name;
    document.getElementById('category').value = item.category;
    document.getElementById('base_ql').value = item.base_ql;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('price_g').value = item.price_g;
    document.getElementById('price_s').value = item.price_s;
    document.getElementById('price_c').value = item.price_c;
    document.getElementById('price_i').value = item.price_i || 0;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = () => {
    document.getElementById('product-form').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('form-container').classList.remove('edit-mode');
    document.getElementById('form-title').innerText = "Add New Listing";
    document.getElementById('submit-btn').innerText = "Post Listing";
    document.getElementById('cancel-edit').classList.add('hidden');
};

document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    const editId = document.getElementById('edit-id').value;
    
    const itemData = {
        item_name: document.getElementById('item_name').value,
        category: document.getElementById('category').value,
        base_ql: parseFloat(document.getElementById('base_ql').value),
        quantity: document.getElementById('quantity').value,
        price_g: parseInt(document.getElementById('price_g').value) || 0,
        price_s: parseInt(document.getElementById('price_s').value) || 0,
        price_c: parseInt(document.getElementById('price_c').value) || 0,
        price_i: parseInt(document.getElementById('price_i').value) || 0,
        seller_id: user.id,
        user_id: user.id
    };

    if (editId) await client.from('products').update(itemData).eq('id', editId);
    else await client.from('products').insert([itemData]);

    resetForm();
    loadMyItems(user.id);
};

window.deleteProduct = async (id) => {
    if (confirm('Remove this listing?')) {
        await client.from('products').delete().eq('id', id);
        const { data: { user } } = await client.auth.getUser();
        loadMyItems(user.id);
    }
};

window.handleLogout = async () => { 
    await client.auth.signOut(); 
    window.location.href = 'index.html'; 
};

document.addEventListener('DOMContentLoaded', initDashboard);