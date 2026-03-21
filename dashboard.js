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

    // Auto-fix for legacy items
    await client
        .from('products')
        .update({ seller_id: user.id })
        .eq('user_id', user.id)
        .is('seller_id', null);
    
    loadProfile(user.id);
    loadMyItems(user.id);
}

// PROFILE MANAGEMENT
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
        updated_at: new Date()
    });
    if (error) alert(error.message);
    else alert("Profile updated!");
};

// LISTING LOGIC
window.startEdit = async (itemId) => {
    const { data, error } = await client.from('products').select('*').eq('id', itemId).single();
    if (error) return;

    document.getElementById('edit-item-id').value = data.id;
    document.getElementById('item-name').value = data.item_name;
    document.getElementById('item-cat').value = data.category;
    document.getElementById('item-ql').value = data.base_ql || '';
    document.getElementById('item-qty').value = data.quantity || '';
    document.getElementById('item-rarity').value = data.rarity || 'Common';
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
    document.getElementById('form-title').innerText = "Add New Inventory";
    document.getElementById('submit-btn').innerText = "List Item on Hub";
    document.getElementById('cancel-edit').classList.add('hidden');
};

async function loadMyItems(userId) {
    const { data } = await client
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
        
    const container = document.getElementById('my-inventory');
    
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => {
            // Determine rarity color for the dashboard list
            let rarColor = "text-[#d4af37]"; // Common/Gold
            if (item.rarity === 'Fantastic') rarColor = "text-[#ec4899]";
            else if (item.rarity === 'Supreme') rarColor = "text-[#0ea5e9]";
            else if (item.rarity === 'Rare') rarColor = "text-[#3b82f6]";

            return `
            <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800 mb-2">
                <div>
                    <span class="text-white font-bold">${item.item_name}</span>
                    <span class="${rarColor} ml-2 font-black uppercase text-[10px] tracking-tighter">
                        ${item.rarity || 'Common'} • ${item.base_ql || 'Bulk'} QL
                    </span>
                    <p class="text-[10px] text-stone-500 uppercase mt-1">
                        Stock: ${item.quantity || 'N/A'} • ${item.price_g}g ${item.price_s}s ${item.price_c}c
                    </p>
                </div>
                <div class="flex gap-4">
                    <button onclick="startEdit(${item.id})" class="text-stone-400 hover:text-white text-[10px] font-black uppercase">Edit</button>
                    <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 text-[10px] font-black uppercase">Remove</button>
                </div>
            </div>`;
        }).join('');
    } else {
        container.innerHTML = "<p class='text-stone-600 italic text-center py-6 text-xs'>No active listings.</p>";
    }
}

initDashboard();