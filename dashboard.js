const { createClient } = supabase;
const client = createClient('YOUR_URL', 'YOUR_KEY');

// Check if user is logged in on page load
async function checkUser() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
        window.location.href = 'login.html'; // Redirect if not logged in
    } else {
        loadMyItems(user.id);
    }
}

async function loadMyItems(userId) {
    const { data } = await client
        .from('products')
        .select('*')
        .eq('user_id', userId); // Only fetch items belonging to the logged-in user

    const list = document.getElementById('my-inventory');
    list.innerHTML = data.map(item => `
        <div class="flex justify-between bg-stone-800 p-4 rounded border border-stone-700">
            <span>${item.name} (${item.base_ql} QL)</span>
            <button onclick="deleteItem(${item.id})" class="text-red-500 text-xs">Remove</button>
        </div>
    `).join('');
}

async function signOut() {
    await client.auth.signOut();
    window.location.href = 'index.html';
}

checkUser();