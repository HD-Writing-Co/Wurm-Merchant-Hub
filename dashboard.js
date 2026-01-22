const { createClient } = supabase;
const client = createClient('YOUR_URL', 'YOUR_KEY');

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
    
    if (data.length === 0) {
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

async function signOut() {
    await client.auth.signOut();
    window.location.href = 'index.html';
}

initDashboard();