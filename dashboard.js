const { createClient } = supabase;
const client = createClient('https://gjftmhvteylhtlwcouwg.supabase.co', ''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k');

async function initDashboard() {
    const { data: { user } } = await client.auth.getUser();
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

    if (!profile || !profile.character_name) {
        document.getElementById('setup-overlay').classList.remove('hidden');
    } else {
        document.getElementById('merchant-welcome').innerText = `Logged in as ${profile.character_name} (${profile.server_name})`;
        loadMyItems(user.id);
    }
}

// Global Sign Out function so the HTML button can find it
window.signOut = async function() {
    await client.auth.signOut();
    window.location.replace('index.html');
};

// Handle Profile Setup
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

    if (error) alert("Setup failed!");
    else window.location.reload();
});

async function loadMyItems(userId) {
    const { data } = await client.from('products').select('*').eq('user_id', userId);
    const container = document.getElementById('my-inventory');
    
    if (!data || data.length === 0) {
        container.innerHTML = "You haven't listed anything yet.";
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
            <div>
                <span class="text-white font-bold">${item.name}</span>
                <span class="text-yellow-600 ml-2">${item.base_ql} QL</span>
            </div>
            <button onclick="deleteItem(${item.id})" class="text-red-900 hover:text-red-500 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

// Function to handle item deletion
window.deleteItem = async function(itemId) {
    if (confirm("Are you sure you want to remove this listing?")) {
        const { error } = await client.from('products').delete().eq('id', itemId);
        if (error) alert("Error deleting item");
        else window.location.reload();
    }
};

initDashboard();