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

    // maybeSingle() prevents the 406 error if no profile is found
    const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    // If no character name set, we could show a setup overlay, 
    // but for now we will just load the inventory.
    loadMyItems(user.id);
}

window.signOut = async function() {
    await client.auth.signOut();
    window.location.replace('index.html');
};

window.deleteItem = async function(itemId) {
    if (confirm("Remove this listing from the Hub?")) {
        const { error } = await client.from('products').delete().eq('id', itemId);
        if (error) alert("Error: " + error.message);
        else window.location.reload();
    }
};

// --- ADD ITEM HANDLER ---
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameEl = document.getElementById('item-name');
    const catEl = document.getElementById('item-cat');
    const qlEl = document.getElementById('item-ql');
    const priceEl = document.getElementById('item-price');

    // Safety check: if any are missing, stop and alert
    if (!nameEl || !catEl || !qlEl || !priceEl) {
        console.error("One or more form elements are missing from the HTML.");
        return;
    }

    const { data: { user } } = await client.auth.getUser();
    
    const newItem = {
        user_id: user.id,
        item_name: nameEl.value, 
        category: catEl.value,
        base_ql: parseInt(qlEl.value),
        price_display: priceEl.value
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
    const { data, error } = await client
        .from('products')
        .select('*')
        .eq('user_id', userId);

    const container = document.getElementById('my-inventory');
    
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                <div>
                    <span class="text-white font-bold">${item.item_name}</span>
                    <span class="text-yellow-600 ml-2">${item.base_ql} QL</span>
                    <p class="text-[10px] text-stone-500">${item.category} • ${item.price_display}</p>
                </div>
                <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 text-xs font-bold uppercase tracking-tighter transition-colors">
                    Remove
                </button>
            </div>
        `).join('');
    } else {
        container.innerHTML = "<p class='text-stone-600 italic'>You have no active listings.</p>";
    }
}

initDashboard();