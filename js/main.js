// ===============================
// Auto‑fill today's date (NZ format)
// ===============================
window.addEventListener("load", () => {
    const dateField = document.getElementById("dateInput");
    if (!dateField) return;

    const today = new Date();
    const formatted = today.toLocaleDateString("en-NZ");
    dateField.value = formatted;
});


// ===============================
// Load ink codes from inkcodes.json
// ===============================
let inkCodes = [];
const inkInput = document.getElementById("InkCodeInput");

fetch("js/inkcodes.json")
    .then(response => response.json())
    .then(data => {
        inkCodes = data;
        setupAutocomplete();
    })
    .catch(err => console.error("Error loading ink codes:", err));


// ===============================
// Autocomplete Setup
// ===============================
function setupAutocomplete() {
    const list = document.getElementById("autocomplete-list");

    inkInput.addEventListener("input", function () {
        // If field is locked, ignore typing
        if (inkInput.readOnly) return;

        const value = this.value.trim().toLowerCase();
        list.innerHTML = "";

        if (!value) return;

        const matches = inkCodes.filter(code =>
            code.toLowerCase().includes(value)
        );

        // ⭐ AUTO‑SELECT WHEN EXACTLY ONE MATCH
        if (matches.length === 1) {
            lockInkFieldAfterSelect(matches[0]);
            list.innerHTML = "";
            return;
        }

        // Otherwise show dropdown list
        matches.forEach(match => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.textContent = match;

            // Use mousedown so blur doesn't fire first
            item.addEventListener("mousedown", () => {
                lockInkFieldAfterSelect(match);
                list.innerHTML = "";
            });

            list.appendChild(item);
        });
    });

    // Close list when clicking outside
    document.addEventListener("click", (e) => {
        if (e.target !== inkInput) list.innerHTML = "";
    });
}


// ===============================
// Lock field after selecting a valid code
// ===============================
function lockInkFieldAfterSelect(selectedValue) {
    inkInput.value = selectedValue;
    inkInput.readOnly = true;   // prevent typing after selection
}


// ===============================
// Unlock typing when field is cleared
// ===============================
inkInput.addEventListener("input", () => {
    if (inkInput.value === "") {
        inkInput.readOnly = false;
    }
});


// ===============================
// Validate on blur (safety net)
// ===============================
inkInput.addEventListener("blur", () => {
    const value = inkInput.value.trim();

    if (value === "") {
        inkInput.readOnly = false;
        return;
    }

    const isValid = inkCodes.includes(value);

    if (!isValid) {
        alert("Invalid ink code. Please select from the list.");
        inkInput.value = "";
        inkInput.readOnly = false;
    }
});
