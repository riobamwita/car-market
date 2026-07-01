import { supabase } from "./supabase.js";

let vehicleData = null;
let galleryImages = [];
let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
    setupBackButton();
    setupLightbox();
    setupInquiryForm();
    await loadVehicle();
});

async function loadVehicle() {

    try {

        const params = new URLSearchParams(window.location.search);
        const vehicleId = params.get("id");

        if (!vehicleId) {

            document.getElementById("vehicleTitle").textContent =
                "Invalid Vehicle";

            return;

        }

        const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", vehicleId)
            .single();

        if (error || !data) {

            console.error(error);

            document.getElementById("vehicleTitle").textContent =
                "Vehicle Not Found";

            return;

        }

        vehicleData = data;

        populateVehicle();

    } catch (error) {

        console.error(error);

        document.getElementById("vehicleTitle").textContent =
            "Failed To Load Vehicle";

    }

}

function populateVehicle() {

    document.getElementById("vehicleTitle").textContent =
        vehicleData.title;

    document.getElementById("vehiclePrice").textContent =
        vehicleData.price != null
            ? `KES ${Number(vehicleData.price).toLocaleString()}`
            : "—";

    document.getElementById("description").textContent =
        vehicleData.description || "";

    const heroMeta =
        document.getElementById("heroMeta");

    heroMeta.innerHTML = "";

    if (vehicleData.year) {

        heroMeta.innerHTML += `
        <span>
            <i class="fa-solid fa-calendar"></i>
            ${vehicleData.year}
        </span>`;
    }

    if (vehicleData.brand) {

        heroMeta.innerHTML += `
        <span>
            <i class="fa-solid fa-car"></i>
            ${vehicleData.brand}
        </span>`;
    }

    if (vehicleData.type) {

        heroMeta.innerHTML += `
        <span>
            <i class="fa-solid fa-car-side"></i>
            ${vehicleData.type}
        </span>`;
    }

    if (vehicleData.fuel) {

        heroMeta.innerHTML += `
        <span>
            <i class="fa-solid fa-gas-pump"></i>
            ${vehicleData.fuel}
        </span>`;
    }

    if (vehicleData.transmission) {

        heroMeta.innerHTML += `
        <span>
            <i class="fa-solid fa-gears"></i>
            ${vehicleData.transmission}
        </span>`;
    }

    if (vehicleData.deal) {

        heroMeta.innerHTML += `
        <span>
            <i class="fa-solid fa-tag"></i>
            ${vehicleData.deal}
        </span>`;
    }

    loadFeatures();

    loadGallery();

}

function loadFeatures() {

    const features =
        document.getElementById("features");

    features.innerHTML = "";

    // Vehicle specifications
    const specs = [

        ["Brand", vehicleData.brand],
        ["Model", vehicleData.model],
        ["Year", vehicleData.year],
        ["Fuel", vehicleData.fuel],
        ["Transmission", vehicleData.transmission],
        ["Mileage", vehicleData.mileage],
        ["Engine", vehicleData.engine],
        ["Drivetrain", vehicleData.drivetrain],
        ["Exterior Color", vehicleData.exterior_color],
        ["Interior Color", vehicleData.interior_color],
        ["Location", vehicleData.location]

    ];

    specs.forEach(([label, value]) => {

        if (!value) return;

        const li = document.createElement("li");

        li.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <strong>${label}:</strong> ${value}
        `;

        features.appendChild(li);

    });

    // Custom features from the database
    (vehicleData.features || []).forEach(feature => {

        if (!feature) return;

        const li = document.createElement("li");

        li.innerHTML = `
            <i class="fa-solid fa-star"></i>
            ${feature}
        `;

        features.appendChild(li);

    });

}

function loadGallery() {

    const gallery = document.getElementById("gallery");

    gallery.innerHTML = "";

    galleryImages = [
        vehicleData.hero_image,
        ...(Array.isArray(vehicleData.gallery)
            ? vehicleData.gallery
            : [])
    ].filter(Boolean);

    if (!galleryImages.length) return;

    const hero = document.createElement("img");
    hero.src = galleryImages[0];
    hero.className = "gallery-main";
    hero.onclick = () => openLightbox(0);

    gallery.appendChild(hero);

    const stack = document.createElement("div");
    stack.className = "gallery-stack";

    galleryImages.slice(1,4).forEach((src,index)=>{

        const wrapper = document.createElement("div");
        wrapper.className="stack-item";

        const img=document.createElement("img");
        img.src=src;

        wrapper.appendChild(img);

        wrapper.onclick=()=>openLightbox(index+1);

        stack.appendChild(wrapper);

    });

    if(galleryImages.length>4){

        const overlay=document.createElement("div");

        overlay.className="gallery-overlay";

        overlay.innerHTML=`+${galleryImages.length-4}`;

        stack.lastElementChild.appendChild(overlay);

        stack.lastElementChild.onclick=()=>openLightbox(3);

    }

    gallery.appendChild(stack);

}

function resetZoom() {
    document
        .querySelectorAll(".lightbox-gallery img")
        .forEach(img => img.classList.remove("zoomed"));
}

function setupLightbox(){

    const lightbox =
        document.getElementById("lightbox");

    document
    .querySelector(".close-lightbox")
    .addEventListener(
        "click",
        closeLightbox
    );


    document
    .querySelector(".lightbox-next")
    .addEventListener(
        "click",
        nextImage
    );


    document
    .querySelector(".lightbox-prev")
    .addEventListener(
        "click",
        previousImage
    );


    lightbox.addEventListener("click", e=>{

        if(e.target === lightbox){
            closeLightbox();
        }

    });


    document.addEventListener(
        "keydown",
        e=>{

            if(!lightbox.classList.contains("show"))
            return;


            if(e.key==="ArrowRight")
                nextImage();


            if(e.key==="ArrowLeft")
                previousImage();


            if(e.key==="Escape")
                closeLightbox();

        }
    );

}

function openLightbox(index){

    currentIndex=index;


    const lightbox =
    document.getElementById("lightbox");


    const gallery =
    lightbox.querySelector(".lightbox-gallery");


    gallery.innerHTML="";


    galleryImages.forEach((src, i) => {

    const img = document.createElement("img");

    img.src = src;

    img.addEventListener("click", (e) => {

        img.classList.toggle("zoomed");

    });

    gallery.appendChild(img);
});



    lightbox.classList.add("show");


    requestAnimationFrame(()=>{

        gallery.scrollLeft =
        index * gallery.clientWidth;

    });


    updateCounter();


    gallery.onscroll = () => {

    resetZoom();

    currentIndex = Math.round(
        gallery.scrollLeft / gallery.clientWidth
    );

    updateCounter();
};


}

function updateLightbox() {

    resetZoom();

    const gallery =
        document.querySelector(".lightbox-gallery");

    gallery.scrollTo({
        left: currentIndex * gallery.clientWidth,
        behavior: "smooth"
    });

    updateCounter();
}


function nextImage(){

    if(currentIndex < galleryImages.length - 1){

        currentIndex++;

    }

    updateLightbox();

}


function previousImage(){

    if(currentIndex > 0){

        currentIndex--;

    }

    updateLightbox();

}

function closeLightbox(){

    resetZoom();

    document
        .getElementById("lightbox")
        .classList.remove("show");

}

function updateCounter() {

    document.querySelector(
        ".lightbox-counter"
    ).textContent =
        `${currentIndex + 1} / ${galleryImages.length}`;
}

function setupInquiryForm() {

    const form =
        document.querySelector(".contact-form");

    if (!form) return;

    form.addEventListener("submit", e => {

        e.preventDefault();

        alert(
            "Thank you. Your inquiry has been received."
        );

        form.reset();
    });
}

function setupBackButton() {

    const btn = document.getElementById("backBtn");

    if (!btn) return;

    btn.addEventListener("click", () => {

        if (history.length > 1) {
            history.back();
        } else {
            window.location.href = "index.html?return=true";
        }

    });

}

document.addEventListener("DOMContentLoaded",()=>{


    const saveBtn =
    document.getElementById("saveCarBtn");


    const popup =
    document.getElementById("savePopup");



    if(!saveBtn || !popup) return;



    saveBtn.addEventListener("click",()=>{


        popup.classList.add("show");



        setTimeout(()=>{


            popup.classList.remove("show");


        },2500);



    });


});