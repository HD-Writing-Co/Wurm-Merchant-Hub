const { createClient } = supabase;

const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }

    // using maybeSingle prevents the 406 error if your profile doesn't exist yet
    const { data: profile } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();

    if (!profile || !profile.character_name) {
        const overlay = document.getElementById('setup-overlay');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        const welcome = document.getElementById('merchant-welcome');
        if (welcome) welcome.innerText = `Logged in as ${profile.character_name}`;
        loadMyItems(user.id);
    }
}

window.signOut = async () => { await client.auth.signOut(); window.location.replace('index.html'); };

// Corrected Add Item Logic
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    
    // IDs now match dashboard.html exactly: new-item-name, new-item-cat, new-item-ql
    const newItem = {
        user_id: user.id,
        item_name: document.getElementById('new-item-name').value, 
        category: document.getElementById('new-item-cat').value,
        base_ql: parseInt(document.getElementById('new-item-ql').value),
        price_display: "Offer"
    };

    const { error } = await client.from('products').insert([newItem]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Item added successfully!");
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
                </div>
                <button onclick="deleteItem(${item.id})" class="text-red-900">Remove</button>
            </div>`).join('');
    } else {
        container.innerHTML = "<p class='text-stone-600 italic'>No active listings.</p>";
    }
}

initDashboard();