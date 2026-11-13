
import {
    signUp,
    signIn,
    getCurrentSession
} from "./auth.js";

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const statusMessage = document.getElementById("authMessage");

function showMessage(message, type = "error") {
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.className = "auth-message " + type;
}

function setLoading(button, loading, normalText) {
    button.disabled = loading;
    button.textContent = loading ? "Please wait..." : normalText;
}

// Redirect if the user is already logged in.
async function checkExistingSession() {
    try {
        const session = await getCurrentSession();

        if (session) {
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Session check failed:", error);
    }
}

checkExistingSession();

// SIGNUP
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("signupEmail").value.trim();

        const password =
            document.getElementById("signupPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const button = signupForm.querySelector("button");

        if (!fullName || !email || !password || !confirmPassword) {
            showMessage("Please fill in all fields.");
            return;
        }

        if (password.length < 8) {
            showMessage("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }

        setLoading(button, true, "Create Account");

        try {
            const data = await signUp(fullName, email, password);

            if (data.session) {
                showMessage("Account created successfully!", "success");

                window.location.href = "index.html";
            } else {
                showMessage(
                    "Account created! Please check your email and confirm your account before logging in.",
                    "success"
                );

                signupForm.reset();
            }

        } catch (error) {
            showMessage(error.message);
        } finally {
            setLoading(button, false, "Create Account");
        }
    });
}

// LOGIN
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const button = loginForm.querySelector("button");

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        setLoading(button, true, "Login");

        try {
            await signIn(email, password);

            showMessage("Login successful!", "success");

            window.location.href = "index.html";

        } catch (error) {
            showMessage(error.message);
        } finally {
            setLoading(button, false, "Login");
        }
    });
}
