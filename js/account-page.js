
import {
    getCurrentUser,
    getCurrentSession,
    signOut
} from "./auth.js";

const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountId = document.getElementById("accountId");
const accountStatus = document.getElementById("accountStatus");
const accountMessage = document.getElementById("accountMessage");
const logoutButton = document.getElementById("logoutButton");

function showMessage(message, type = "error") {
    accountMessage.textContent = message;
    accountMessage.className = `auth-message ${type}`;
}

// Check login session and load account.
async function loadAccount() {
    try {
        // First check whether a session exists.
        const session = await getCurrentSession();

        // No session means the visitor is logged out.
        if (!session) {
            window.location.replace("login.html");
            return;
        }

        // Retrieve the authenticated user.
        const user = await getCurrentUser();

        if (!user) {
            window.location.replace("login.html");
            return;
        }

        accountName.textContent =
            user.user_metadata?.full_name || "EventSphere User";

        accountEmail.textContent = user.email || "Not available";
        accountId.textContent = user.id;

        accountStatus.textContent = user.email_confirmed_at
            ? "Email Verified"
            : "Email Verification Pending";

        showMessage("Your account loaded successfully.", "success");

    } catch (error) {
        console.error("Account loading error:", error);

        // Authentication session is missing or invalid.
        if (
            error.name === "AuthSessionMissingError" ||
            error.message?.toLowerCase().includes("auth session missing")
        ) {
            window.location.replace("login.html");
            return;
        }

        showMessage(error.message || "Unable to load account details.");
    }
}

// Sign out.
logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Signing Out...";

    try {
        await signOut();
        window.location.replace("login.html");

    } catch (error) {
        console.error("Sign out error:", error);

        showMessage(error.message || "Unable to sign out.");

        logoutButton.disabled = false;
        logoutButton.textContent = "Sign Out";
    }
});

// Start.
loadAccount();
