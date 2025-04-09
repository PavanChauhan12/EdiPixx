// File: login.js
const loginContainer = document.getElementById('login-container');
const signupContainer = document.getElementById('signup-container');
const switchToSignup = document.getElementById('switch-to-signup');
const switchToLogin = document.getElementById('switch-to-login');

let users = JSON.parse(localStorage.getItem('users')) || [];

// Show login form by default
loginContainer.classList.add('active');

// Switch to signup form
switchToSignup.addEventListener('click', () => {
    loginContainer.classList.remove('active');
    signupContainer.classList.add('active');
    clearMessages();
});

// Switch to login form
switchToLogin.addEventListener('click', () => {
    signupContainer.classList.remove('active');
    loginContainer.classList.add('active');
    clearMessages();
});

// Utility function to show message
function showMessage(containerId, message, isError = false) {
    const container = document.getElementById(containerId);
    container.textContent = message;
    container.style.color = isError ? 'red' : 'var(--primary)';
}

// Utility function to clear both messages
function clearMessages() {
    document.getElementById('login-message').textContent = '';
    document.getElementById('signup-message').textContent = '';
}

// Handle signup
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    const signupMessage = 'signup-message';

    // Check if user already exists
    if (users.find(user => user.email === email)) {
        showMessage(signupMessage, 'User already exists!', true);
        return;
    }

    // Save user to local storage
    users.push({ email, password });
    localStorage.setItem('users', JSON.stringify(users));
    showMessage(signupMessage, 'Signup successful! You can now log in.');

    // Switch to login after a short delay
    setTimeout(() => {
        signupContainer.classList.remove('active');
        loginContainer.classList.add('active');
        clearMessages();
    }, 1000);
});

// Handle login
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    const loginMessage = 'login-message';

    // Check user credentials
    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        showMessage(loginMessage, 'Login successful!');

        // Redirect to your main project page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        showMessage(loginMessage, 'Invalid email or password!', true);
    }
});
