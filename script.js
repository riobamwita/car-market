import { supabase } from "./supabase.js";

let vehicles = [];
let updateMoreCars = null;
let filterActive = false;

document.addEventListener("DOMContentLoaded", async () => {

    setupMoreCars();

    await loadVehicles();

    setupVehicleSearch();

    restoreFilters();
    restoreSelectedVehicle();

});

async function loadVehicles() {

    try {

        const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        vehicles = data || [];

        populateFilters();

        renderVehicles();

    } catch (error) {

        console.error("Error loading vehicles:", error);

    }

}

function renderVehicles(list = vehicles) {

    const grid = document.getElementById("carsGrid");

    if (!grid) return;

    grid.innerHTML = "";

    list.forEach(vehicle => {

        const card = document.createElement("a");

        card.href = `vehicles.html?id=${vehicle.id}`;
        card.className = "vehicle-card";

        card.dataset.id = vehicle.id;
        card.dataset.brand = vehicle.brand || "";
        card.dataset.type = vehicle.type || "";
        card.dataset.fuel = vehicle.fuel || "";
        card.dataset.year = vehicle.year || "";
        card.dataset.deal = vehicle.deal || "";

        card.addEventListener("click", () => {

            sessionStorage.setItem(
                "selectedVehicle",
                vehicle.id
            );

        });

        card.innerHTML = `
        ${
vehicle.hero_image
? `<img src="${vehicle.hero_image}" alt="${vehicle.title}">`
: `<div class="vehicle-image-placeholder"></div>`
}
        <div class="vehicle-info">

        <h3>${vehicle.short_title || vehicle.title}</h3>

        <p>${vehicle.deal}</p>

        <div class="vehicle-bottom">
        <small>
            ${vehicle.year} • ${vehicle.type}
        </small>

        <span class="vehicle-price">
    ${
vehicle.price != null
        ? `<span class="currency">KES</span> ${Number(vehicle.price).toLocaleString()}`
        : "—"
    }
</span>
        </div>

        </div>
        `;

        grid.appendChild(card);

    });

    if (typeof updateMoreCars === "function") {
        updateMoreCars();
    }

    document
    .querySelectorAll(".vehicle-card")
    .forEach((card, index) => {

        card.classList.toggle(
            "hidden",
            index >= 8
        );

    });

if (typeof updateMoreCars === "function") {
    updateMoreCars();
}

}

function populateFilters() {

    fillSelect(
        "brandFilter",
        [...new Set(vehicles.map(v => v.brand))]
    );

    fillSelect(
        "carTypeFilter",
        [...new Set(vehicles.map(v => v.type))]
    );

    fillSelect(
        "dealFilter",
        [...new Set(vehicles.map(v => v.deal))]
    );

    fillSelect(
        "fuelFilter",
        [...new Set(vehicles.map(v => v.fuel))]
    );

    fillSelect(
        "yearFilter",
        [...new Set(vehicles.map(v => v.year))]
            .sort((a, b) => b - a)
    );

}

function fillSelect(id, values) {

    const select = document.getElementById(id);

    if (!select) return;

    const firstOption = select.options[0];

    select.innerHTML = "";

    select.appendChild(firstOption);

    values.forEach(value => {

        const option = document.createElement("option");

        option.value = value;
        option.textContent = value;

        select.appendChild(option);

    });

}

function setupVehicleSearch() {

    const searchBtn = document.getElementById("carSearchBtn");
    const clearBtn = document.getElementById("carClearBtn");
    const searchInput = document.getElementById("globalSearch");

    if (!searchBtn || !clearBtn || !searchInput) return;

    function performSearch() {

    const query = searchInput.value.trim().toLowerCase();

    const brand = document.getElementById("brandFilter").value;
    const type = document.getElementById("carTypeFilter").value;
    const fuel = document.getElementById("fuelFilter").value;
    const year = document.getElementById("yearFilter").value;
    const deal = document.getElementById("dealFilter").value;

    filterActive =
        query ||
        brand ||
        type ||
        fuel ||
        year ||
        deal;

    const filtered = vehicles.filter(vehicle => {

        const search =
        `
        ${vehicle.title}
        ${vehicle.short_title}
        ${vehicle.brand}
        ${vehicle.model}
        ${vehicle.type}
        ${vehicle.location}
        ${vehicle.description}
        `
        .toLowerCase();

        return (
            (!query || search.includes(query)) &&
            (!brand || vehicle.brand === brand) &&
            (!type || vehicle.type === type) &&
            (!fuel || vehicle.fuel === fuel) &&
            (!year || String(vehicle.year) === year) &&
            (!deal || vehicle.deal === deal)
        );

    });

    renderVehicles(filtered);

    document.getElementById("noResults").style.display =
        filtered.length ? "none" : "block";

    updateMoreCars?.();

}

    searchBtn.addEventListener("click", performSearch);

    searchInput.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {

            e.preventDefault();
            performSearch();

        }

    });

    let searchTimeout;

    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {

            performSearch();

        }, 300);

    });

    document
        .querySelectorAll("#filterPanel select")
        .forEach(select => {

            select.addEventListener("change", () => {

                performSearch();

            });

        });

    clearBtn.addEventListener("click", () => {

    document
        .querySelectorAll("#filterPanel select")
        .forEach(select => {
            select.value = "";
        });

    searchInput.value = "";

    resetCards();

    toggleNoResults(true);

    filterActive = false;

    sessionStorage.removeItem("vehicleFilters");
    sessionStorage.removeItem(
    "MoreCarsExpanded"
);

    document
        .getElementById("filterPanel")
        ?.classList.remove("active");

    const moreCarsBtn =
        document.getElementById("moreCarsBtn");

    if (moreCarsBtn) {
        moreCarsBtn.textContent = "All Cars";
    }

    if (typeof updateMoreCars === "function") {
        updateMoreCars();
    }

    clearBtn.style.display = "none";

});

}

function resetCards() {

    document
        .querySelectorAll(".vehicle-card")
        .forEach(card => {

            card.style.display = "";
            card.classList.remove("hidden");

        });

}

function toggleNoResults(found) {

    const box = document.getElementById("noResults");

    if (!box) return;

    box.style.display = found ? "none" : "block";

}

function setupMoreCars() {

    const btn = document.getElementById("moreCarsBtn");

    if (!btn) return;

    let expanded =
    sessionStorage.getItem(
        "moreCarsExpanded"
    ) === "true";

    function limit() {

        const width = window.innerWidth;

        if (width <= 768) return 4;
        if (width <= 1200) return 6;

        return 8;

    }

    function update() {

    const cards = [
        ...document.querySelectorAll(".vehicle-card")
    ].filter(card => card.style.display !== "none");

    console.log(
        "Expanded:",
        expanded,
        "Cards:",
        cards.length
    );

    if (filterActive) {

            cards.forEach(card => {

                card.classList.remove("hidden");

            });

            btn.style.display = "none";
            btn.textContent = "All Cars";

            return;

        }

        cards.forEach((card, index) => {

            card.classList.toggle(
                "hidden",
                !expanded && index >= limit()
            );

        });

        btn.style.display =
            cards.length > limit()
                ? "block"
                : "none";

        btn.textContent =
            expanded
                ? "View Less"
                : "All Cars";

    }

    updateMoreCars = update;

    btn.addEventListener("click", () => {

    console.log("More Cars clicked");

    expanded = !expanded;

    sessionStorage.setItem(
        "moreCarsExpanded",
        expanded
    );

    update();

});

    update();

    window.addEventListener("resize", update);

}

function restoreFilters() {

    const saved =
        sessionStorage.getItem("vehicleFilters");

    if (!saved) return;

    const filters = JSON.parse(saved);

    const searchInput =
        document.getElementById("globalSearch");

    if (searchInput) {

        searchInput.value =
            filters.searchText || "";

    }

    document.getElementById("brandFilter").value =
        filters.brand || "";

    document.getElementById("carTypeFilter").value =
        filters.type || "";

    document.getElementById("dealFilter").value =
        filters.deal || "";

    document.getElementById("fuelFilter").value =
        filters.fuel || "";

    document.getElementById("yearFilter").value =
        filters.year || "";

    setTimeout(() => {

        document
            .getElementById("carSearchBtn")
            ?.click();

    }, 100);

}

function restoreSelectedVehicle() {

    const selectedVehicle = sessionStorage.getItem(
        "selectedVehicle"
    );

    if (!selectedVehicle) return;

    setTimeout(() => {

        const card = document.querySelector(
            `[data-id="${selectedVehicle}"]`
        );

        if (!card) return;

        card.scrollIntoView({
            behavior: "auto",
            block: "center"
        });

    }, 300);

}

document.addEventListener("DOMContentLoaded", () => {

    const menuToggle =
        document.getElementById("menuToggle");

    const navMenu =
        document.getElementById("navMenu");

    menuToggle?.addEventListener("click", () => {

        navMenu.classList.toggle("active");

        menuToggle.textContent =
            navMenu.classList.contains("active")
                ? "✕"
                : "☰";

    });

    document
        .querySelectorAll("#navMenu a")
        .forEach(link => {

            link.addEventListener("click", () => {

                navMenu.classList.remove("active");

                menuToggle.textContent = "☰";

            });

        });

});

document.addEventListener("DOMContentLoaded", () => {

    const hero =
        document.querySelector(".hero");

    if (!hero) return;

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        hero.classList.add("hero-ready");
                        observer.disconnect();

                    }

                });

            },
            {
                threshold: 0.2
            }
        );

    observer.observe(hero);

});

document.addEventListener("DOMContentLoaded", () => {

    const filterToggle =
        document.getElementById("filterToggle");

    const filterPanel =
        document.getElementById("filterPanel");

    filterToggle?.addEventListener("click", () => {

        filterPanel?.classList.toggle("active");

    });

});

document.addEventListener("click", (e) => {

    const navMenu = document.getElementById("navMenu");
    const menuToggle = document.getElementById("menuToggle");

    if(!navMenu || !menuToggle) return;


    const clickedInsideMenu = navMenu.contains(e.target);
    const clickedToggle = menuToggle.contains(e.target);


    if (!clickedInsideMenu && !clickedToggle) {

        navMenu.classList.remove("active");
        menuToggle.textContent = "☰";

    }

});

document.addEventListener("DOMContentLoaded", () => {

    const accountBtn =
        document.getElementById("accountBtn");

    const accountMenu =
        document.getElementById("accountMenu");

    const popup =
        document.getElementById("maintenancePopup");

    if (!accountBtn || !accountMenu || !popup) return;

    accountBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        accountMenu.classList.toggle("active");

    });

    accountMenu.addEventListener("click", (e) => {

        const link = e.target.closest("a");

        if (link) {

            e.preventDefault();

            accountMenu.classList.remove("active");

            popup.classList.add("show");

            setTimeout(() => {

                popup.classList.remove("show");

            }, 2000);
        }

        e.stopPropagation();

    });

    document.addEventListener("click", () => {

        accountMenu.classList.remove("active");

    });

});

const navbar = document.querySelector(".navbar");


window.addEventListener("scroll", ()=>{

    if(window.scrollY > 50){

        navbar.classList.add("scrolled");

    }else{

        navbar.classList.remove("scrolled");

    }

});

document.getElementById("shareBtn").addEventListener("click", async function (e) {
    e.preventDefault();

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Josam Auto",
                text: "Check out Josam Auto!",
                url: window.location.href
            });
        } catch (err) {
            console.log("Share cancelled");
        }
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    }
});