const { createClient } = supabase;

// 1. Configuration
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

/**
 * INIT: Verify session and profile
 */
async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.character_name) {
        const overlay = document.getElementById('setup-overlay');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        const welcomeEl = document.getElementById('merchant-welcome');
        if (welcomeEl) welcomeEl.innerText = `Logged in as ${profile.character_name} (${profile.server_name})`;
        loadMyItems(user.id);
    }
}

/**
 * GLOBAL FUNCTIONS
 */
window.signOut = async function() {
    await client.auth.signOut();
    window.location.replace('index.html');
};

window.deleteItem = async function(itemId) {
    if (confirm("Remove this listing?")) {
        const { error } = await client.from('products').delete().eq('id', itemId);
        if (error) alert("Error: " + error.message);
        else window.location.reload();
    }
};

/**
 * FORM LISTENERS
 */
const profileForm = document.getElementById('profile-setup-form');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { data: { user } } = await client.auth.getUser();
        
        const { error } = await client.from('profiles').upsert({
            id: user.id,
            character_name: document.getElementById('setup-char').value,
            server_name: document.getElementById('setup-server').value
        });

        if (error) alert("Setup failed!");
        else window.location.reload();
    });
}

document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    
    // We must use 'new-item-...' to match your dashboard.html
    const newItem = {
        user_id: user.id,
        item_name: document.getElementById('new-item-name').value, 
        category: document.getElementById('new-item-cat').value,
        base_ql: parseInt(document.getElementById('new-item-ql').value),
        price_display: "Offer" // We will add a price input to your HTML tomorrow!
    };

    const { error } = await client.from('products').insert([newItem]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Item added to the Hub!");
        e.target.reset();
        loadMyItems(user.id);
    }
});

async function loadMyItems(userId) {
    const { data, error } = await client.from('products').select('*').eq('user_id', userId);
    const container = document.getElementById('my-inventory');
    
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                <div>
                    <span class="text-white font-bold">${item.item_name}</span>
                    <span class="text-yellow-600 ml-2">${item.base_ql} QL</span>
                    <p class="text-xs text-stone-500 italic">${item.price_display || 'Offer'}</p>
                </div>
                <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 transition-colors">
                    Remove
                </button>
            </div>
        `).join('');
    } else {
        container.innerHTML = "<p class='text-stone-600 italic'>No active listings.</p>";
    }
}

initDashboard();