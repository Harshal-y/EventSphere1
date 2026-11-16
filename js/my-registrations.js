
import { supabase } from "./supabase.js";

// Page elements
const registrationsList = document.getElementById("registrationsList");
const registrationsMessage = document.getElementById("registrationsMessage");
const refreshButton = document.getElementById("refreshRegistrationsButton");

// Get current logged-in user
async function getLoggedInUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = "login.html";
        return null;
    }

    return data.user;
}

// Format dates for display
function formatDate(dateValue) {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Display messages
function showMessage(message) {
    registrationsMessage.textContent = message;
}

// Safely create text elements
function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

// Load registrations
async function loadRegistrations() {
    registrationsList.replaceChildren();
    showMessage("Loading your registrations...");

    const user = await getLoggedInUser();

    if (!user) return;

    const { data, error } = await supabase
        .from("registrations")
        .select(`
            id,
            event_id,
            user_id,
            attendee_name,
            attendee_email,
            status,
            registered_at,
            events (
                id,
                title,
                description,
                category,
                venue,
                city,
                start_at,
                end_at,
                image_url,
                ticket_price,
                currency,
                status
            )
        `)
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false });

    if (error) {
        console.error("Registration loading error:", error);
        showMessage("Could not load registrations. Please try again.");
        return;
    }

    if (!data || data.length === 0) {
        showMessage("You haven't registered for any events yet.");
        return;
    }

    showMessage(`You have ${data.length} registration(s).`);

    data.forEach(registration => {
        const event = Array.isArray(registration.events)
            ? registration.events[0]
            : registration.events;

        const card = document.createElement("div");
        card.className = "registration-card";

        const title = createTextElement(
            "h3",
            "registration-title",
            event?.title || "Event details unavailable"
        );

        const status = createTextElement(
            "p",
            "registration-status",
            `Status: ${registration.status}`
        );

        status.classList.add(
            registration.status === "confirmed"
                ? "status-confirmed"
                : "status-cancelled"
        );

        card.appendChild(title);
        card.appendChild(status);

        if (event) {
            card.appendChild(createTextElement(
                "p",
                "registration-detail",
                `Category: ${event.category || "Not specified"}`
            ));

            card.appendChild(createTextElement(
                "p",
                "registration-detail",
                `Venue: ${[event.venue, event.city].filter(Boolean).join(", ") || "Not specified"}`
            ));

            card.appendChild(createTextElement(
                "p",
                "registration-detail",
                `Event Date: ${formatDate(event.start_at)}`
            ));

            card.appendChild(createTextElement(
                "p",
                "registration-detail",
                `Registration Date: ${formatDate(registration.registered_at)}`
            ));

            if (event.ticket_price !== null && event.ticket_price !== undefined) {
                card.appendChild(createTextElement(
                    "p",
                    "registration-detail",
                    `Ticket Price: ${event.currency || ""}${event.ticket_price}`
                ));
            }
        } else {
            card.appendChild(createTextElement(
                "p",
                "registration-detail",
                "Event details are currently unavailable."
            ));
        }

        // Telegram community access
        if (registration.status === "confirmed" && event) {
            const telegramButton = document.createElement("button");
            telegramButton.type = "button";
            telegramButton.className = "auth-button";
            telegramButton.textContent = "Get Telegram Community Link";

            telegramButton.addEventListener("click", async () => {
                telegramButton.disabled = true;
                telegramButton.textContent = "Getting link...";

                try {
                    const { data: telegramUrl, error: telegramError } =
                        await supabase.rpc("get_event_telegram_link", {
                            p_event_id: registration.event_id
                        });

                    if (telegramError) throw telegramError;

                    const url = new URL(telegramUrl);

                    if (url.protocol !== "https:" ||
                        url.hostname !== "t.me") {
                        throw new Error("Invalid Telegram link.");
                    }

                    window.open(url.href, "_blank", "noopener,noreferrer");

                } catch (error) {
                    console.error("Telegram link error:", error);
                    alert("Telegram community link is not available right now.");
                } finally {
                    telegramButton.disabled = false;
                    telegramButton.textContent = "Get Telegram Community Link";
                }
            });

            card.appendChild(telegramButton);
        }

        // Cancellation for upcoming confirmed registrations
        const eventIsUpcoming =
            event?.start_at &&
            new Date(event.start_at).getTime() > Date.now();

        if (
            registration.status === "confirmed" &&
            eventIsUpcoming
        ) {
            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.className = "auth-button cancel-registration-button";
            cancelButton.textContent = "Cancel Registration";

            cancelButton.addEventListener("click", async () => {
                const confirmed = window.confirm(
                    `Are you sure you want to cancel your registration for "${event.title}"?`
                );

                if (!confirmed) return;

                cancelButton.disabled = true;
                cancelButton.textContent = "Cancelling...";

                try {
                    const { data: result, error: cancelError } =
                        await supabase.rpc("cancel_event_registration", {
                            p_event_id: registration.event_id
                        });

                    if (cancelError) throw cancelError;

                    if (!result?.success) {
                        throw new Error(
                            result?.message || "Cancellation failed."
                        );
                    }

                    alert(result.message || "Registration cancelled successfully.");

                    await loadRegistrations();

                } catch (error) {
                    console.error("Cancellation error:", error);
                    alert(error.message || "Could not cancel registration.");

                    cancelButton.disabled = false;
                    cancelButton.textContent = "Cancel Registration";
                }
            });

            card.appendChild(cancelButton);
        }

        registrationsList.appendChild(card);
    });
}

// Refresh button
refreshButton.addEventListener("click", loadRegistrations);

// Load registrations when page opens
loadRegistrations();
