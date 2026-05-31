// ===============================
// Load ink codes from inkcodes.json
// ===============================
let inkCodes = [];
const inkInput = document.getElementById("inkCodeInput");

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
    const autocompleteList = document.getElementById("autocomplete-list");

    inkInput.addEventListener("input", function () {
        const value = this.value.trim().toLowerCase();

        // If field is locked, ignore typing
        if (inkInput.readOnly) return;

        autocompleteList.innerHTML = "";

        if (value === "") return;

        const matches = inkCodes.filter(code =>
            code.toLowerCase().includes(value)
        );

        matches.forEach(match => {
            const item = document.createElement("div");
            item.classList.add("autocomplete-item");
            item.textContent = match;

            item.addEventListener("click", () => {
                lockInkFieldAfterSelect(match);
                autocompleteList.innerHTML = "";
            });

            autocompleteList.appendChild(item);
        });
    });

    // Close list when clicking outside
    document.addEventListener("click", function (e) {
        if (e.target !== inkInput) {
            autocompleteList.innerHTML = "";
        }
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
