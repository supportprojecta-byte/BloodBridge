// BloodBridge - Core Application Logic

// Global State
let currentUser = null;
let allDonors = [];
let mapInstance = null;
let mapMarker = null;
let currentMapTarget = 'donor';
let selectedMapCoords = { lat: 23.0225, lng: 72.5714 };

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    loadDonorsFromStorage();
    initAuth();
    populateCountries('donor');
    populateCountries('receiver');
    updateDonorCountDisplay();

    // Direct Login Interface on first visit (User Prompt: "pela j aavta j ak interface aavshe je direct login karshe")
    if (!currentUser) {
        setTimeout(() => {
            openLoginModal();
        }, 400);
    }
});

/* ==================== 1. STORAGE & DONOR DATA ==================== */
function loadDonorsFromStorage() {
    const stored = localStorage.getItem('bloodbridge_donors');
    if (stored) {
        try {
            allDonors = JSON.parse(stored);
        } catch (e) {
            allDonors = [...INITIAL_DONORS];
        }
    } else {
        allDonors = [...INITIAL_DONORS];
        saveDonorsToStorage();
    }
}

function saveDonorsToStorage() {
    localStorage.setItem('bloodbridge_donors', JSON.stringify(allDonors));
    updateDonorCountDisplay();
}

function updateDonorCountDisplay() {
    const el = document.getElementById('statDonorCount');
    if (el) {
        el.innerText = `${allDonors.length}+`;
    }
}

/* ==================== 2. AUTHENTICATION (LOGIN POPUP) ==================== */
function initAuth() {
    const session = localStorage.getItem('bloodbridge_user');
    if (session) {
        try {
            currentUser = JSON.parse(session);
        } catch (e) {
            currentUser = null;
        }
    }
    renderAuthStatus();
}

function renderAuthStatus() {
    const container = document.getElementById('authStatusContainer');
    if (!container) return;

    if (currentUser) {
        container.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="hidden sm:flex flex-col text-right">
                    <span class="text-xs font-bold text-gray-900">${currentUser.name}</span>
                    <span class="text-[10px] font-bold text-blood-main">${currentUser.bloodGroup}</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-red-100 border-2 border-red-300 text-blood-main font-bold flex items-center justify-center text-sm shadow-sm">
                    ${currentUser.name.charAt(0).toUpperCase()}
                </div>
                <button onclick="handleLogout()" title="Log out" class="text-xs text-gray-400 hover:text-red-600 p-1.5 transition-colors">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <button onclick="openLoginModal()" class="btn-blood-primary text-xs py-2 px-4 shadow-none">
                <i class="fa-solid fa-user"></i> Log In / Sign Up
            </button>
        `;
    }
}

function openLoginModal(isMandatoryNotice = false) {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (isMandatoryNotice) {
            // Highlight notice that login is mandatory to register
            const note = modal.querySelector('p.text-gray-500');
            if (note) {
                note.innerHTML = '<span class="text-red-600 font-bold">Registration or search requires login. Please fill the details below to proceed.</span>';
            }
        }
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function handleLoginSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('loginName').value.trim();
    const age = parseInt(document.getElementById('loginAge').value, 10);
    const gender = document.getElementById('loginGender').value;
    const mobile = document.getElementById('loginMobile').value.trim();
    const bloodGroup = document.getElementById('loginBloodGroup').value;

    const ageError = document.getElementById('loginAgeError');

    // Age validation: Must be 18 or above (User prompt: "age must be 18 ke tena thi vadhare hovi joiye")
    if (isNaN(age) || age < 18) {
        ageError.classList.remove('hidden');
        document.getElementById('loginAge').focus();
        return;
    } else {
        ageError.classList.add('hidden');
    }

    currentUser = {
        name,
        age,
        gender,
        mobile,
        bloodGroup
    };

    localStorage.setItem('bloodbridge_user', JSON.stringify(currentUser));
    renderAuthStatus();
    closeLoginModal();

    // If donor form is open, pre-fill it
    prefillDonorFormWithUser();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('bloodbridge_user');
    renderAuthStatus();
    hideDonorForm();
    hideReceiverForm();
}

/* ==================== 3. BOX CLICKS (DONOR VS RECEIVER) ==================== */
// User prompt: "jo tame log in nai karyu hoi to tamne pachu login nu pop-up aavshe and pachi thi tame as a donor ke receiver tarike register kari sako chho"
function handleDonorBoxClick() {
    if (!currentUser) {
        openLoginModal(true);
        return;
    }
    showDonorForm();
}

function handleReceiverBoxClick() {
    if (!currentUser) {
        openLoginModal(true);
        return;
    }
    showReceiverForm();
}

function showDonorForm() {
    hideReceiverForm();
    const section = document.getElementById('donorFormSection');
    section.classList.remove('hidden');
    prefillDonorFormWithUser();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideDonorForm() {
    const section = document.getElementById('donorFormSection');
    section.classList.add('hidden');
}

function showReceiverForm() {
    hideDonorForm();
    const section = document.getElementById('receiverFormSection');
    section.classList.remove('hidden');
    prefillReceiverFormWithUser();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideReceiverForm() {
    const section = document.getElementById('receiverFormSection');
    section.classList.add('hidden');
}

function prefillDonorFormWithUser() {
    if (!currentUser) return;
    const nameInput = document.getElementById('donorName');
    const genderSelect = document.getElementById('donorGender');
    const ageInput = document.getElementById('donorAge');
    const bgSelect = document.getElementById('donorBloodGroup');
    const contactInput = document.getElementById('donorContact');

    if (nameInput && !nameInput.value) nameInput.value = currentUser.name;
    if (genderSelect && !genderSelect.value) genderSelect.value = currentUser.gender;
    if (ageInput && !ageInput.value) ageInput.value = currentUser.age;
    if (bgSelect && !bgSelect.value) bgSelect.value = currentUser.bloodGroup;
    if (contactInput && !contactInput.value) contactInput.value = currentUser.mobile;
}

function prefillReceiverFormWithUser() {
    if (!currentUser) return;
    const nameInput = document.getElementById('receiverName');
    if (nameInput && !nameInput.value) nameInput.value = currentUser.name;
}

/* ==================== 4. DYNAMIC CONDITIONAL BRACKETS (DISEASE, PH, GENETIC) ==================== */
function toggleDiseaseBox() {
    const select = document.getElementById('donorDiseaseSelect');
    const wrapper = document.getElementById('diseaseDescWrapper');
    const input = document.getElementById('donorDiseaseDetails');

    if (select.value === 'Yes') {
        wrapper.classList.remove('hidden');
        input.setAttribute('required', 'true');
        input.focus();
    } else {
        wrapper.classList.add('hidden');
        input.removeAttribute('required');
        input.value = '';
    }
}

function togglePHBox() {
    const select = document.getElementById('donorPHSelect');
    const wrapper = document.getElementById('phDescWrapper');
    const input = document.getElementById('donorPHDetails');

    if (select.value === 'Yes') {
        wrapper.classList.remove('hidden');
        input.setAttribute('required', 'true');
        input.focus();
    } else {
        wrapper.classList.add('hidden');
        input.removeAttribute('required');
        input.value = '';
    }
}

function toggleGeneticBox() {
    const select = document.getElementById('donorGeneticSelect');
    const wrapper = document.getElementById('geneticDescWrapper');
    const input = document.getElementById('donorGeneticDetails');

    if (select.value === 'Yes') {
        wrapper.classList.remove('hidden');
        input.setAttribute('required', 'true');
        input.focus();
    } else {
        wrapper.classList.add('hidden');
        input.removeAttribute('required');
        input.value = '';
    }
}

/* ==================== 5. ASCENDING LOCATION CASCADING DROPDOWNS ==================== */
function populateCountries(prefix) {
    const countrySelect = document.getElementById(`${prefix}Country`);
    if (!countrySelect) return;

    // Ascending sort of countries
    const countries = Object.keys(LOCATION_DATA).sort((a, b) => a.localeCompare(b));
    countrySelect.innerHTML = `<option value="" disabled selected>Select Country</option>`;
    countries.forEach(country => {
        countrySelect.innerHTML += `<option value="${country}">${country}</option>`;
    });

    // Default to India for convenience
    if (countries.includes('India')) {
        countrySelect.value = 'India';
        handleCountryChange(prefix);
    }
}

function handleCountryChange(prefix) {
    const country = document.getElementById(`${prefix}Country`).value;
    const stateSelect = document.getElementById(`${prefix}State`);
    const districtSelect = document.getElementById(`${prefix}District`);
    const talukaSelect = document.getElementById(`${prefix}TalukaCity`);

    stateSelect.innerHTML = `<option value="" disabled selected>Select State</option>`;
    districtSelect.innerHTML = `<option value="" disabled selected>Select District</option>`;
    districtSelect.disabled = true;

    if (prefix === 'receiver') {
        talukaSelect.innerHTML = `<option value="" selected>All Talukas / Cities</option>`;
    } else {
        talukaSelect.innerHTML = `<option value="" disabled selected>Select Taluka/City</option>`;
    }
    talukaSelect.disabled = true;

    if (country && LOCATION_DATA[country]) {
        stateSelect.disabled = false;
        // Ascending sort of States
        const states = Object.keys(LOCATION_DATA[country]).sort((a, b) => a.localeCompare(b));
        states.forEach(st => {
            stateSelect.innerHTML += `<option value="${st}">${st}</option>`;
        });

        // Default to Gujarat if available
        if (states.includes('Gujarat')) {
            stateSelect.value = 'Gujarat';
            handleStateChange(prefix);
        }
    } else {
        stateSelect.disabled = true;
    }
}

function handleStateChange(prefix) {
    const country = document.getElementById(`${prefix}Country`).value;
    const state = document.getElementById(`${prefix}State`).value;
    const districtSelect = document.getElementById(`${prefix}District`);
    const talukaSelect = document.getElementById(`${prefix}TalukaCity`);

    districtSelect.innerHTML = `<option value="" disabled selected>Select District</option>`;
    if (prefix === 'receiver') {
        talukaSelect.innerHTML = `<option value="" selected>All Talukas / Cities</option>`;
    } else {
        talukaSelect.innerHTML = `<option value="" disabled selected>Select Taluka/City</option>`;
    }
    talukaSelect.disabled = true;

    if (country && state && LOCATION_DATA[country] && LOCATION_DATA[country][state]) {
        districtSelect.disabled = false;
        // Ascending sort of Districts
        const districts = Object.keys(LOCATION_DATA[country][state]).sort((a, b) => a.localeCompare(b));
        districts.forEach(dst => {
            districtSelect.innerHTML += `<option value="${dst}">${dst}</option>`;
        });
    } else {
        districtSelect.disabled = true;
    }
}

function handleDistrictChange(prefix) {
    const country = document.getElementById(`${prefix}Country`).value;
    const state = document.getElementById(`${prefix}State`).value;
    const district = document.getElementById(`${prefix}District`).value;
    const talukaSelect = document.getElementById(`${prefix}TalukaCity`);

    if (prefix === 'receiver') {
        talukaSelect.innerHTML = `<option value="" selected>All Talukas / Cities</option>`;
    } else {
        talukaSelect.innerHTML = `<option value="" disabled selected>Select Taluka/City</option>`;
    }

    if (country && state && district && LOCATION_DATA[country][state][district]) {
        talukaSelect.disabled = false;
        // Ascending sort of Talukas / Cities
        const talukas = [...LOCATION_DATA[country][state][district]].sort((a, b) => a.localeCompare(b));
        talukas.forEach(tlk => {
            talukaSelect.innerHTML += `<option value="${tlk}">${tlk}</option>`;
        });
    } else {
        if (prefix !== 'receiver') {
            talukaSelect.disabled = true;
        }
    }
}

/* ==================== 6. LEAFLET INTERACTIVE MAP PICKER ==================== */
function openMapModal(target) {
    currentMapTarget = target;
    const modal = document.getElementById('mapModal');
    modal.classList.remove('hidden');

    setTimeout(() => {
        if (!mapInstance) {
            // Initialize Leaflet Map centered around Gujarat
            mapInstance = L.map('mapContainer').setView([23.0225, 72.5714], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance);

            mapMarker = L.marker([23.0225, 72.5714], { draggable: true }).addTo(mapInstance);

            mapMarker.on('dragend', function (e) {
                const pos = mapMarker.getLatLng();
                updateCoordsDisplay(pos.lat, pos.lng);
            });

            mapInstance.on('click', function (e) {
                mapMarker.setLatLng(e.latlng);
                updateCoordsDisplay(e.latlng.lat, e.latlng.lng);
            });
        } else {
            mapInstance.invalidateSize();
        }
    }, 200);
}

function updateCoordsDisplay(lat, lng) {
    selectedMapCoords = { lat: lat.toFixed(4), lng: lng.toFixed(4) };
    const el = document.getElementById('mapSelectedCoords');
    if (el) {
        el.innerText = `${selectedMapCoords.lat}, ${selectedMapCoords.lng}`;
    }
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.add('hidden');
}

function confirmMapLocation() {
    closeMapModal();
    // Default country & state to India & Gujarat if not set
    const prefix = currentMapTarget;
    const countrySelect = document.getElementById(`${prefix}Country`);
    const stateSelect = document.getElementById(`${prefix}State`);

    if (countrySelect && !countrySelect.value) {
        countrySelect.value = 'India';
        handleCountryChange(prefix);
    }
    if (stateSelect && !stateSelect.value) {
        stateSelect.value = 'Gujarat';
        handleStateChange(prefix);
    }
}

/* ==================== 7. DONOR SUBMISSION & CELEBRATION & EXCEL SAVE ==================== */
function handleDonorSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('donorName').value.trim();
    const gender = document.getElementById('donorGender').value;
    const age = parseInt(document.getElementById('donorAge').value, 10);
    const bloodGroup = document.getElementById('donorBloodGroup').value;
    const contact = document.getElementById('donorContact').value.trim();

    const hasDisease = document.getElementById('donorDiseaseSelect').value;
    const diseaseDetails = hasDisease === 'Yes' ? document.getElementById('donorDiseaseDetails').value.trim() : 'None';

    const hasPH = document.getElementById('donorPHSelect').value;
    const phDetails = hasPH === 'Yes' ? document.getElementById('donorPHDetails').value.trim() : 'None';

    const hasGenetic = document.getElementById('donorGeneticSelect').value;
    const geneticDetails = hasGenetic === 'Yes' ? document.getElementById('donorGeneticDetails').value.trim() : 'None';

    const country = document.getElementById('donorCountry').value;
    const state = document.getElementById('donorState').value;
    const district = document.getElementById('donorDistrict').value;
    const cityTaluka = document.getElementById('donorTalukaCity').value;
    const description = document.getElementById('donorDescription').value.trim() || 'No description provided';

    // Age validation check
    const ageError = document.getElementById('donorAgeError');
    if (isNaN(age) || age < 18) {
        ageError.classList.remove('hidden');
        document.getElementById('donorAge').focus();
        return;
    } else {
        ageError.classList.add('hidden');
    }

    const bloodGroupLabels = {
        "A+": "A+ ( A Positive )",
        "A-": "A- ( A Negative )",
        "B+": "B+ ( B Positive )",
        "B-": "B- ( B Negative )",
        "AB+": "AB+ ( AB Positive )",
        "AB-": "AB- ( AB Negative )",
        "O+": "O+ ( O Positive )",
        "O-": "O- ( O Negative )"
    };

    const newDonor = {
        id: `BB-${Date.now().toString().slice(-4)}`,
        name,
        gender,
        age,
        contact: `+91 ${contact}`,
        bloodGroup,
        bloodGroupLabel: bloodGroupLabels[bloodGroup] || bloodGroup,
        hasDisease,
        diseaseDetails,
        hasPH,
        phDetails,
        hasGeneticDisease: hasGenetic,
        geneticDiseaseDetails: geneticDetails,
        country,
        state,
        district,
        cityTaluka,
        description,
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // Prepend new donor so it appears first
    allDonors.unshift(newDonor);
    saveDonorsToStorage();

    // Trigger celebration confetti (User prompt: "thodak celebration ni effect aavshe")
    triggerConfetti();

    // Open celebration modal (User prompt: "niche a message aashe ke thanks for the connacting with the BloodBriedge")
    openCelebrationModal();

    // Save and export to Excel file automatically (User prompt: "pachi tenu name ak excel file ma save thyy jashe")
    saveSingleDonorToExcel(newDonor);

    // Reset Form
    document.getElementById('donorForm').reset();
    hideDonorForm();
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => {
            confetti({
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 250);
    }
}

function openCelebrationModal() {
    const modal = document.getElementById('celebrationModal');
    modal.classList.remove('hidden');
}

function closeCelebrationModal() {
    const modal = document.getElementById('celebrationModal');
    modal.classList.add('hidden');
    // Also scroll down to results so user can see list
    showAllDonors();
}

/* ==================== 8. EXCEL EXPORT (SHEETJS) ==================== */
function generateExcelFromDonors(donorsArray, filename = "BloodBridge_Donors.xlsx") {
    if (!donorsArray || donorsArray.length === 0) {
        alert("No donor records to export.");
        return;
    }

    const excelRows = donorsArray.map((d, index) => ({
        "Sr No": index + 1,
        "Donor ID": d.id,
        "Full Name": d.name,
        "Gender": d.gender,
        "Age": d.age,
        "Contact Number": d.contact,
        "Blood Group": d.bloodGroupLabel || d.bloodGroup,
        "Disease Status": d.hasDisease,
        "Disease Details": d.diseaseDetails,
        "Physical Handicap (PH)": d.hasPH,
        "PH Details": d.phDetails,
        "Genetic Disease": d.hasGeneticDisease,
        "Genetic Details": d.geneticDiseaseDetails,
        "Taluka / City": d.cityTaluka,
        "District": d.district,
        "State": d.state,
        "Country": d.country,
        "Full Location": `${d.cityTaluka}, ${d.district}, ${d.state}, ${d.country}`,
        "Description": d.description,
        "Registration Date": d.registeredAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Donors");

    // Auto-fit column widths
    const maxProps = Object.keys(excelRows[0]);
    worksheet["!cols"] = maxProps.map(col => ({ wch: Math.max(col.length + 3, 14) }));

    XLSX.writeFile(workbook, filename);
}

function saveSingleDonorToExcel(donor) {
    // Generate a dedicated donor registry excel file
    generateExcelFromDonors([donor], `BloodBridge_Registration_${donor.name.replace(/\s+/g, '_')}.xlsx`);
}

function downloadAllDonorsExcel() {
    generateExcelFromDonors(allDonors, "BloodBridge_All_Donors.xlsx");
}

let lastFilteredDonors = [];
function downloadFilteredExcel() {
    generateExcelFromDonors(lastFilteredDonors.length ? lastFilteredDonors : allDonors, "BloodBridge_Matching_Donors.xlsx");
}

/* ==================== 9. RECEIVER SEARCH & MATCHING ==================== */
function handleReceiverSearch(event) {
    event.preventDefault();

    const receiverName = document.getElementById('receiverName').value.trim();
    const bloodGroup = document.getElementById('receiverBloodGroup').value;
    const country = document.getElementById('receiverCountry').value;
    const state = document.getElementById('receiverState').value;
    const district = document.getElementById('receiverDistrict').value;
    const talukaCity = document.getElementById('receiverTalukaCity').value;

    // Filter Donors by Blood Group and District as requested by user:
    // "only tena district na tena blood group na j donor nu list tema dekhashe"
    const matched = allDonors.filter(donor => {
        const bgMatches = donor.bloodGroup === bloodGroup;
        const districtMatches = donor.district && donor.district.toLowerCase() === district.toLowerCase();

        // If taluka was specified, we can match it or give priority, but district is mandatory
        if (talukaCity && talukaCity !== "") {
            return bgMatches && districtMatches && (donor.cityTaluka.toLowerCase() === talukaCity.toLowerCase());
        }

        return bgMatches && districtMatches;
    });

    lastFilteredDonors = matched;
    renderDonorResults(matched, `Matching blood group <strong>${bloodGroup}</strong> in <strong>${district}</strong> district.`);
}

function showAllDonors() {
    lastFilteredDonors = allDonors;
    renderDonorResults(allDonors, `Showing all <strong>${allDonors.length}</strong> registered donors across all districts.`);
}

function renderDonorResults(donors, summaryHtml) {
    const section = document.getElementById('resultsSection');
    const tbody = document.getElementById('donorTableBody');
    const noResultsAlert = document.getElementById('noResultsAlert');
    const summaryText = document.getElementById('resultsSummaryText');

    section.classList.remove('hidden');
    summaryText.innerHTML = summaryHtml;
    tbody.innerHTML = '';

    if (donors.length === 0) {
        noResultsAlert.classList.remove('hidden');
    } else {
        noResultsAlert.classList.add('hidden');

        donors.forEach(donor => {
            const tr = document.createElement('tr');

            // Disease display
            const diseaseBadge = donor.hasDisease === 'Yes'
                ? `<span class="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Yes: ${donor.diseaseDetails}</span>`
                : `<span class="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">None</span>`;

            // PH display
            const phBadge = donor.hasPH === 'Yes'
                ? `<span class="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Yes: ${donor.phDetails}</span>`
                : `<span class="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">None</span>`;

            // Genetic disease display
            const geneticBadge = donor.hasGeneticDisease === 'Yes'
                ? `<span class="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Yes: ${donor.geneticDiseaseDetails}</span>`
                : `<span class="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">None</span>`;

            // Full location as requested: "city ke taluka pachi district hashe and pachi state and tena pachi country hashe"
            const fullLocation = `${donor.cityTaluka}, ${donor.district}, ${donor.state}, ${donor.country}`;

            tr.innerHTML = `
                <td>
                    <div class="font-bold text-gray-900">${donor.name}</div>
                    <div class="text-[10px] text-gray-400 font-mono">ID: ${donor.id}</div>
                </td>
                <td><span class="text-xs text-gray-700 font-medium">${donor.gender}</span></td>
                <td><span class="text-xs font-bold text-gray-800">${donor.age} yrs</span></td>
                <td>
                    <div class="font-mono text-xs font-bold text-gray-900">${donor.contact}</div>
                    <div class="mt-1 flex items-center gap-1.5">
                        <a href="tel:${donor.contact.replace(/\s+/g, '')}" class="text-[10px] bg-red-100 text-blood-main px-2 py-0.5 rounded font-bold hover:bg-red-200 transition-colors inline-flex items-center gap-1">
                            <i class="fa-solid fa-phone"></i> Call
                        </a>
                        <a href="https://wa.me/${donor.contact.replace(/[^0-9]/g, '')}" target="_blank" class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold hover:bg-emerald-200 transition-colors inline-flex items-center gap-1">
                            <i class="fa-brands fa-whatsapp"></i> Chat
                        </a>
                    </div>
                </td>
                <td>
                    <span class="blood-badge text-xs">
                        <i class="fa-solid fa-droplet text-red-600"></i> ${donor.bloodGroupLabel || donor.bloodGroup}
                    </span>
                </td>
                <td>${diseaseBadge}</td>
                <td>${phBadge}</td>
                <td>${geneticBadge}</td>
                <td>
                    <div class="text-xs text-gray-800 font-semibold flex items-start gap-1">
                        <i class="fa-solid fa-location-dot text-blood-main text-[11px] mt-0.5"></i>
                        <span>${fullLocation}</span>
                    </div>
                </td>
                <td>
                    <span class="text-xs text-gray-600 italic block max-w-xs truncate" title="${donor.description}">
                        ${donor.description || 'N/A'}
                    </span>
                </td>
                <td>
                    <button onclick="contactDonorDirect('${donor.name}', '${donor.contact}')" class="btn-blood-primary text-xs py-1.5 px-3 whitespace-nowrap shadow-none">
                        Connect
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Smooth scroll down to results section as requested: "pachi tenu desktop thoduk sroll thyy jashe and pachi tene ak list dekhadshe"
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function contactDonorDirect(name, phone) {
    alert(`Connecting you directly with Donor: ${name}\nPhone: ${phone}\n\nPlease mention you found them through BloodBridge.`);
}
