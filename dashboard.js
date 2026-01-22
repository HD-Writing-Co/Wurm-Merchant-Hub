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

    const { data: profile, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // maybeSingle() prevents the 406 error if no profile exists yet

    if (error) console.error("Profile fetch error:", error);

    if (!profile || !profile.character_name) {
        const overlay = document.getElementById('setup-overlay');
        if (overlay) overlay.classList.remove('hidden');
    } else {
        const welcome = document.getElementById('merchant-welcome');
        if (welcome) welcome.innerText = `Logged in as ${profile.character_name}`;
        loadMyItems(user.id);
    }
}

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

// ADD ITEM FORM HANDLER
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    
    // COLLECT DATA: Mapping HTML IDs (new-item-name) to Database Columns (item_name)
    const newItem = {
        user_id: user.id,
        item_name: document.getElementById('new-item-name').value, // Corrected ID
        category: document.getElementById('new-item-cat').value,   // Corrected ID
        base_ql: parseInt(document.getElementById('new-item-ql').value), // Corrected ID
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
    const { data, error } = await client.from('products').select('*').eq('user_id', userId);
    const container = document.getElementById('my-inventory');
    
    if (data && data.length > 0) {
        container.innerHTML = data.map(item => `
            <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                <div>
                    <span class="text-white font-bold">${item.item_name}</span> 
                    <span class="text-yellow-600 ml-2">${item.base_ql} QL</span>
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