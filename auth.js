const { createClient } = supabase;

// 1. Double check these match your dashboard exactly
const _url = 'https://gjftmhvteylhtlwcouwg.supabase.co';
const _key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnRtaHZ0ZXlsaHRsd2NvdXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTg5MDUsImV4cCI6MjA4NDQ5NDkwNX0.SBELcOhXZrm8fWHTaC1Ujjo-ZL7qUelFjxs7hmWGY5k';
const client = createClient(_url, _key);

const authMsg = document.getElementById('auth-msg');

// HANDLE LOGIN
document.getElementById('btn-login').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("Login button clicked"); // Debug check
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
        authMsg.innerText = error.message;
        authMsg.style.color = "red";
    } else {
        window.location.href = 'dashboard.html';
    }
});

// HANDLE SIGNUP
document.getElementById('btn-signup').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log("Signup button clicked"); // Debug check
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    const { data, error } = await client.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: window.location.origin + '/dashboard.html'
        }
    });

    if (error) {
        authMsg.innerText = error.message;
        authMsg.style.color = "red";
    } else {
        authMsg.innerText = "Success! Check your email for a confirmation link.";
        authMsg.style.color = "#d4af37"; // Gold color
    }
});