
import {
    getCurrentSession,
    signOut,
    listenToAuthChanges
} from "./auth.js";

const authNav = document.getElementById("authNav");

// Create a navigation link.
function createLink(text, href, className) {
    const link = document.createElement("a");
    link.textContent = text;
    link.href = href;
    link.className = className;
    return link;
}

// Display buttons for logged-out users.
function showLoggedOutButtons() {
    authNav.replaceChildren();

    authNav.appendChild(
        createLink("Sign In", "login.html",
            "auth-nav-button signin-button")
    );

    authNav.appendChild(
        createLink("Sign Up", "signup.html",
            "auth-nav-button signup-button")
    );
}

// Display buttons for logged-in users.
function showLoggedInButtons() {
    authNav.replaceChildren();

    authNav.appendChild(
        createLink("My Account", "account.html",
            "auth-nav-button signin-button")
    );

    const logoutButton = document.createElement("button");

    logoutButton.textContent = "Logout";
    logoutButton.type = "button";
    logoutButton.className =
        "auth-nav-button signup-button";

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        try {
            await signOut();
            showLoggedOutButtons();
        } catch (error) {
            console.error("Logout error:", error);
            alert(error.message || "Unable to log out.");

            logoutButton.disabled = false;
            logoutButton.textContent = "Logout";
        }
    });

    authNav.appendChild(logoutButton);
}

// Check the current login session.
async function updateAuthNavigation() {
    try {
        const session = await getCurrentSession();

        if (session) {
            showLoggedInButtons();
        } else {
            showLoggedOutButtons();
        }
    } catch (error) {
        console.error("Authentication check failed:", error);
        showLoggedOutButtons();
    }
}

// Listen for login/logout changes.
updateAuthNavigation();

listenToAuthChanges((event, session) => {
    if (session) {
        showLoggedInButtons();
    } else {
        showLoggedOutButtons();
    }
});
