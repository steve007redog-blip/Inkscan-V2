/* ======================================================
   GLOBAL STATE
====================================================== */
let isJobCompleted = false;

/* ======================================================
   AUTO-FILL TODAY'S DATE (NZ FORMAT)
====================================================== */
window.addEventListener("load", () => {
    const dateField = document.getElementById("dateInput");
    if (!dateField) return;

    const today = new Date();
    dateField.value = today.toLocaleDateString("en-NZ");
});

/* ======================================================
   LOAD INK CODES FROM inkcodes.json
====================================================== */
let inkCodes = [];
const inkInput = document.getElementById("InkCodeInput");
const editInkBtn = document.getElementById("editInkBtn");

fetch("js/inkcodes.json")
    .then(response => response.json())
    .then(data => {
        inkCodes = data;
        setupAutocomplete();
    })
    .catch(err => console.error("Error loading ink codes:", err));

/* ======================================================
   AUTOCOMPLETE SETUP
====================================================== */
function setupAutocomplete() {
    const list = document.getElementById("autocomplete-list");

    inkInput.addEventListener("input", function () {
        if (inkInput.readOnly) return;

        const value = this.value.trim().toLowerCase();
        list.innerHTML = "";

        if (!value) return;

        const matches = inkCodes.filter(code =>
            code.toLowerCase().startsWith(value)
        );

        // If exactly one match, auto-select it
        if (matches.length === 1) {
            lockInkFieldAfterSelect(matches[0]);
            list.innerHTML = "";
            return;
        }

        // Build dropdown list
        matches.forEach(match => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.textContent = match;

            item.addEventListener("mousedown", () => {
                lockInkFieldAfterSelect(match);
                list.innerHTML = "";
            });

            list.appendChild(item);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (e.target !== inkInput) list.innerHTML = "";
    });
}

/* ======================================================
   LOCK INK FIELD AFTER SELECTION
====================================================== */
function lockInkFieldAfterSelect(selectedValue) {
    inkInput.value = selectedValue;
    inkInput.readOnly = true;
    editInkBtn.style.display = "block";
}

/* ======================================================
   UNLOCK INK FIELD
====================================================== */
editInkBtn.addEventListener("click", function () {
    inkInput.readOnly = false;
    inkInput.value = "";
    editInkBtn.style.display = "none";
    inkInput.focus();
});

/* ======================================================
   UNLOCK WHEN CLEARED
====================================================== */
inkInput.addEventListener("input", () => {
    if (inkInput.value === "") {
        inkInput.readOnly = false;
        editInkBtn.style.display = "none";
    }
});

/* ======================================================
   VALIDATE ON BLUR
====================================================== */
inkInput.addEventListener("blur", () => {
    const value = inkInput.value.trim();

    if (value === "") {
        inkInput.readOnly = false;
        editInkBtn.style.display = "none";
        return;
    }

    const isValid = inkCodes.includes(value);

    if (!isValid) {
        alert("Invalid ink code. Please select from the list.");
        inkInput.value = "";
        inkInput.readOnly = false;
        editInkBtn.style.display = "none";
    }
});

/* ======================================================
   FIELD NAVIGATION + ADD ROW LOGIC
====================================================== */
$("#InkCodeInput").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        $("#BatchCode").focus();
    }
});

$("#BatchCode").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        $("#Weight").focus();
    }
});

$("#Weight").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();

        const inkCode = $("#InkCodeInput").val().trim();
        const batch = $("#BatchCode").val().trim();
        const weight = $("#Weight").val().trim();

        if (inkCode !== "" && weight !== "") {
            addRow(
                "scansBody",
                $("#dateInput").val(),
                $("#JobNo").val(),
                inkCode,
                batch,
                weight
            );

            // Reset fields
            $("#InkCodeInput").val("").prop("readonly", false);
            editInkBtn.style.display = "none";
            $("#BatchCode").val("");
            $("#Weight").val("");

            $("#InkCodeInput").focus();
        }
    }
});

/* ======================================================
   SAVE & CONTINUE (INDIVIDUAL ENTRIES CSV)
====================================================== */
$("#btn-save-continue").click(function () {
    if (isJobCompleted) {
        alert("Job is completed. Clear the form or start a new job.");
        return;
    }

    var rows = $("#scansBody tr");

    if (rows.length === 0) {
        alert("No entries to save. Add some ink records first.");
        return;
    }

    var csv = "Date,Job Number,Ink Code,Batch Code,Weight\n";

    rows.each(function () {
        var cols = $(this).find("td");

        var date = $(cols[0]).text();
        var job = $(cols[1]).text();
        var ink = $(cols[2]).text();
        var batch = $(cols[3]).text().trim();
        var weight = $(cols[4]).text();

        csv += `${date},${job},${ink},"${batch}",${weight}\n`;
    });

    var jobNo = $("#JobNo").val();
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, jobNo + "_entries.csv");

    alert("Saved! You can continue adding more entries or load this CSV later.");
});

/* ======================================================
   COMPLETE JOB (TOTALS ONLY)
====================================================== */
$("#btn-complete-job").click(function () {
    if (isJobCompleted) {
        alert("Job is already completed.");
        return;
    }

    var rows = $("#scansBody tr");

    if (rows.length === 0) {
        alert("No entries to export. Add some ink records first.");
        return;
    }

    var confirmFinish =
