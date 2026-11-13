
import { supabase } from "./supabase.js";

// Create a new user account.
export async function signUp(fullName, email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
            data: {
                full_name: fullName.trim()
            }
        }
    });

    if (error) throw error;

    return data;
}

// Log in an existing user.
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
    });

    if (error) throw error;

    return data;
}

// Log out the current user.
export async function signOut() {
    const { data, error } = await supabase.auth.signOut();

    if (error) throw error;

    return data;
}

// Get the current login session.
export async function getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
}

// Get the currently logged-in user.
export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return data.user;
}

// Listen for authentication changes.
export function listenToAuthChanges(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}
