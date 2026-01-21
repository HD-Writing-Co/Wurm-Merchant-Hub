const { createClient } = supabase;
const client = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

const authForm = document.getElementById('auth-form');
const authMsg = document.getElementById('auth-msg');

// Handle Login
document.getElementById('btn-login').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
        authMsg.className = "mt-4 text-center text-red-500 text-sm";
        authMsg.innerText = error.message;
    } else {
        window.location.href = 'dashboard.html'; // Redirect to your new dashboard
    }
});

// Handle Signup
document.getElementById('btn-signup').addEventListener('click', async (e) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await client.auth.signUp({ email, password });

    if (error) {
        authMsg.className = "mt-4 text-center text-red-500 text-sm";
        authMsg.innerText = error.message;
    } else {
        authMsg.className = "mt-4 text-center text-green-500 text-sm";
        authMsg.innerText = "Check your email for a confirmation link!";
    }
});