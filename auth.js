const { createClient } = supabase;
const client = createClient('https://gjftmhvteylhtlwcouwg.supabase.co', ''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k');

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