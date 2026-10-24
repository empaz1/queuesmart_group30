//this connects with login_screen.html and server_backend.js
document.addEventListener("DOMContentLoaded",() => {
    const loginView = document.getElementById("login-view");
    const registerView = document.getElementById("register-view");
    const viewSwitches = document.querySelectorAll(".view-switch");

    const BASE_URL = "http://localhost:3000";

//the switch between register and login
    viewSwitches.forEach(btn => {
        btn.addEventListener("click", (event) => {
            if(event.target.dataset.view == "register") {
                loginView.hidden = true;
                registerView.hidden = false;  
            } else {
                registerView.hidden = true;
                loginView.hidden = false;
            }
        });
    });

//register screen
    const registerForm = document.querySelector("#register-view form");
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirm = document.getElementById("confirm-password").value;

        if (password !== confirm) {
            return alert("Passwords do not match ");
        }
        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`,{
                method: "POST",
                headers: {"Content-Type": "application/json" }, 
                body: JSON.stringify({username: email, password, role: "User"}) 
            });
            const data = await response.json();

            if (response.ok) {
                alert("Account is created! ");
                document.querySelector('.view-switch[data-view="login"]').click();
            } else {
                alert(data.error || "Registration error. Please try again.")
            }
        } catch (error) {
            alert("Error connecting to backend.");
    }
    
});

//login screen
    const loginForm = document.querySelector("#login-view form");
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`,{
                method: "POST",
                headers: {"Content-Type": "application/json" }, 
                body: JSON.stringify({ username: email, password }) 
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("role", data.role);
                alert("Login successful!")

                if (data.role === "Administrator"){
                    window.location.href = "admin_dashboard.html";
                } else {
                    window.location.href = "user_dashboard.html";
                }
            } else {
                alert(data.error || "Login error. Please try again.")
            }
        } catch (error) {
            alert("Error connecting to backend.");
        }
    });
});