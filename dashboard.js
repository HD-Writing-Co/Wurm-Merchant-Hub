const { createClient } = supabase;

// 1. Configuration - Ensure these match your Supabase settings
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

/**
 * INIT: Runs when the page loads
 */
async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
    
    // Redirect if not logged in
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Check if Profile exists
    const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // If no profile or character name, show the setup overlay
    if (!profile || !profile.character_name) {
        document.getElementById('setup-overlay').classList.remove('hidden');
    } else {
        document.getElementById('merchant-welcome').innerText = `Logged in as ${profile.character_name} (${profile.server_name})`;
        loadMyItems(user.id);
    }
}

/**
 * LOGOUT: Attached to the window so the HTML button can find it
 */
window.signOut = async function() {
    console.log("Attempting logout...");
    const { error } = await client.auth.signOut();
    if (error) {
        console.error("Logout error:", error.message);
    } else {
        window.location.replace('index.html');
    }
};

/**
 * DELETE: Removes an item from the database
 */
window.deleteItem = async function(itemId) {
    if (confirm("Are you sure you want to remove this listing?")) {
        const { error } = await client
            .from('products')
            .delete()
            .eq('id', itemId);

        if (error) {
            alert("Error deleting: " + error.message);
        } else {
            window.location.reload();
        }
    }
};

/**
 * PROFILE SETUP: Saves character info for new sellers
 */
document.getElementById('profile-setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await client.auth.getUser();
    
    const charName = document.getElementById('setup-char').value;
    const serverName = document.getElementById('setup-server').value;

    const { error } = await client.from('profiles').upsert({
        id: user.id,
        character_name: charName,
        server_name: serverName
    });

    if (error) alert("Setup failed: " + error.message);
    else window.location.reload();
});

/**
 * ADD ITEM: Handles the listing form
 */
document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Adding item...");
    
    const { data: { user } } = await client.auth.getUser();
    
    const newItem = {
        user_id: user.id,
        name: document.getElementById('item-name').value,
        category: document.getElementById('item-cat').value,
        base_ql: parseInt(document.getElementById('item-ql').value),
        price_display: document.getElementById('item-price').value
    };

    const { error } = await client
        .from('products')
        .insert([newItem]);

    if (error) {
        alert("Error adding item: " + error.message);
    } else {
        alert("Item listed successfully!");
        e.target.reset();
        loadMyItems(user.id); // Refresh the list without reloading
    }
});

/**
 * LOAD ITEMS: Fetches only the logged-in user's products
 */
async function loadMyItems(userId) {
    const { data, error } = await client
        .from('products')
        .select('*')
        .eq('user_id', userId);

    const container = document.getElementById('my-inventory');
    
    if (error) {
        container.innerHTML = "Error loading inventory.";
        return;
    }

    if (data.length === 0) {
        container.innerHTML = "You haven't listed anything yet.";
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
            <div>
                <span class="text-white font-bold">${item.name}</span>
                <span class="text-yellow-600 ml-2">${item.base_ql} QL</span>
                <p class="text-[10px] text-stone-500 uppercase">${item.category}</p>
            </div>
            <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    
    // Re-run Lucide to show the trash icons
    lucide.createIcons();
}

// Start the dashboard
initDashboard();