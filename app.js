
import { supabase } from "./js/supabase.js";


/* DOM ELEMENTS */

const eventGrid = document.getElementById("eventGrid");

const searchInput = document.getElementById("searchInput");

const categoryFilter = document.getElementById("categoryFilter");

const registerDialog = document.getElementById("registerDialog");

const registrationForm = document.getElementById("registrationForm");

const closeDialog = document.getElementById("closeDialog");

const registrationResult = document.getElementById("registrationResult");

const modalEventTitle = document.getElementById("modalEventTitle");

const eventIdInput = document.getElementById("eventId");


/* GLOBAL EVENT DATA */

let allEvents = [];


/* ESCAPE HTML TO PREVENT HTML INJECTION */

function safe(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#39;"

    })[char]);

}


/* FORMAT DATE */

function formatDate(value) {

    if (!value) {

        return "Date to be announced";

    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {

        return "Date to be announced";

    }

    return new Intl.DateTimeFormat("en-IN", {

        dateStyle: "medium",

        timeStyle: "short"

    }).format(date);

}


/* FORMAT PRICE */

function formatPrice(price) {

    const amount = Number(price || 0);

    if (amount === 0) {

        return "Free";

    }

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 2

    }).format(amount);

}


/* RENDER EVENT CARDS */

function renderEvents() {

    const search = searchInput.value.trim().toLowerCase();

    const selectedCategory = categoryFilter.value;

    const filteredEvents = allEvents.filter(event => {

        const searchableText = [

            event.title,

            event.description,

            event.category,

            event.venue,

            event.city

        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(search);

        const matchesCategory =

            selectedCategory === "all" ||

            event.category === selectedCategory;

        return matchesSearch && matchesCategory;

    });


    /* NO EVENTS FOUND */

    if (filteredEvents.length === 0) {

        eventGrid.innerHTML = `

            <div class="empty-state">

                <h3>No events found</h3>

                <p>Try another search or category.</p>

            </div>

        `;

        return;

    }


    /* GENERATE EVENT CARDS */

    eventGrid.innerHTML = filteredEvents.map(event => {

        const image = event.imageUrl

            ? `

                <img

                    class="event-image"

                    src="${safe(event.imageUrl)}"

                    alt="${safe(event.title)} poster"

                    loading="lazy"

                >

            `

            : `

                <div class="event-placeholder">

                    EVENTSPHERE

                </div>

            `;


        return `

            <article class="event-card">

                <div class="event-image-wrap">

                    ${image}

                    <span class="category-pill">

                        ${safe(event.category)}

                    </span>

                </div>


                <div class="event-body">

                    <p class="event-date">

                        ${safe(formatDate(event.eventDate))}

                    </p>


                    <h3>

                        ${safe(event.title)}

                    </h3>


                    <p class="event-description">

                        ${safe(event.description)}

                    </p>


                    <div class="event-meta">

                        <span>

                            ${safe(event.venue)},

                            ${safe(event.city)}

                        </span>


                        <span class="event-price">

                            ${safe(formatPrice(event.price))}

                        </span>

                    </div>


                    <button

                        class="register-button"

                        type="button"

                        data-event-id="${safe(event.id)}"

                    >

                        View & Register

                    </button>

                </div>

            </article>

        `;

    }).join("");

}


/* LOAD PUBLISHED EVENTS FROM SUPABASE */

async function loadEvents() {

    eventGrid.innerHTML = `

        <div class="loading">

            Loading events...

        </div>

    `;


    try {

        const { data, error } = await supabase

            .from("events")

            .select(`

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

                capacity,

                status

            `)

            .eq("status", "published")

            .order("start_at", { ascending: true });


        if (error) {

            throw error;

        }


        /* MAP SUPABASE DATA TO FRONTEND FORMAT */

        allEvents = (data || []).map(event => ({

            id: event.id,

            title: event.title,

            description: event.description,

            category: event.category,

            venue: event.venue,

            city: event.city,

            eventDate: event.start_at,

            imageUrl: event.image_url,

            price: event.ticket_price,

            currency: event.currency,

            endAt: event.end_at,

            capacity: event.capacity

        }));


        /* POPULATE CATEGORY DROPDOWN */

        const categories = [

            ...new Set(

                allEvents

                    .map(event => event.category)

                    .filter(Boolean)

            )

        ].sort();


        categoryFilter.innerHTML = `

            <option value="all">All Categories</option>

            ${categories.map(category => `

                <option value="${safe(category)}">

                    ${safe(category)}

                </option>

            `).join("")}

        `;


        renderEvents();


    } catch (error) {

        console.error("Supabase event loading error:", error);


        eventGrid.innerHTML = `

            <div class="empty-state">

                <h3>Unable to load events</h3>

                <p>${safe(error.message)}</p>

                <p>Please check your Supabase connection and permissions.</p>

            </div>

        `;

    }

}


/* OPEN REGISTRATION MODAL */

eventGrid.addEventListener("click", event => {

    const button = event.target.closest("[data-event-id]");

    if (!button) {

        return;

    }


    const selectedEvent = allEvents.find(

        item => String(item.id) === button.dataset.eventId

    );


    if (!selectedEvent) {

        return;

    }


    eventIdInput.value = selectedEvent.id;

    modalEventTitle.textContent = selectedEvent.title;


    registrationForm.reset();


    registrationResult.innerHTML = "";

    registrationResult.className = "result-message";

    registrationResult.hidden = true;


    registerDialog.showModal();

});


/* CLOSE REGISTRATION MODAL */

closeDialog.addEventListener("click", () => {

    registerDialog.close();

});


registerDialog.addEventListener("click", event => {

    if (event.target === registerDialog) {

        registerDialog.close();

    }

});


/* SHOW REGISTRATION RESULT */

function showRegistrationResult(message, type) {

    registrationResult.textContent = message;

    registrationResult.className = `result-message ${type}`;

    registrationResult.hidden = false;

}


/* REGISTER FOR EVENT */

/*
   TEMPORARY EXISTING SPRING BOOT REGISTRATION.

   We will replace this with Supabase RPC:
   register_for_event(p_event_id)

   Do not use this old handler for the GitHub Pages
   version once the Supabase registration migration is complete.
*/

registrationForm.addEventListener("submit", async event => {

    event.preventDefault();


    const attendeeName = document

        .getElementById("attendeeName")

        .value.trim();


    const email = document

        .getElementById("attendeeEmail")

        .value.trim();


    const eventId = eventIdInput.value;


    if (!attendeeName || !email || !eventId) {

        showRegistrationResult(

            "Please complete all registration fields.",

            "error"

        );

        return;

    }


    const submitButton = registrationForm.querySelector(

        'button[type="submit"]'

    );


    submitButton.disabled = true;

    submitButton.textContent = "Registering...";


    try {

        const response = await fetch(

            `/api/registrations`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    eventId,

                    attendeeName,

                    email

                })

            }

        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(

                result.message ||

                "Registration failed. Please try again."

            );

        }


        showRegistrationResult(

            result.message,

            "success"

        );


        /* DISPLAY TELEGRAM INVITE AFTER SUCCESSFUL REGISTRATION */

        if (result.telegramInviteLink) {

            const link = document.createElement("a");

            link.href = result.telegramInviteLink;

            link.target = "_blank";

            link.rel = "noopener noreferrer";

            link.className = "telegram-link";

            link.textContent = "Join Event Telegram Community";


            registrationResult.appendChild(

                document.createElement("br")

            );

            registrationResult.appendChild(link);

        }


        registrationForm.reset();


    } catch (error) {

        showRegistrationResult(

            error.message,

            "error"

        );

    } finally {

        submitButton.disabled = false;

        submitButton.textContent = "Confirm Registration";

    }

});


/* SEARCH */

searchInput.addEventListener("input", renderEvents);


/* CATEGORY FILTER */

categoryFilter.addEventListener("change", renderEvents);


/* INITIALIZE WEBSITE */

loadEvents();
