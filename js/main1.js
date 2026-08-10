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

        if (matches.length === 1) {
            lockInkFieldAfterSelect(matches[0]);
            list.innerHTML = "";
            return;
        }

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

            $("#InkCodeInput").val("").prop("readonly", false);
            editInkBtn.style.display = "none";
            $("#BatchCode").val("");
            $("#Weight").val("");

            $("#InkCodeInput").focus();
        }
    }
});
/* ======================================================
   ⭐ NUMBERS‑ONLY FILTER FOR WEIGHT FIELD
====================================================== */
const weightField = document.getElementById("Weight");
if (weightField) {
    weightField.addEventListener("input", () => {
        weightField.value = weightField.value.replace(/[^0-9]/g, "");
    });
}

/* ======================================================
   ADD ROW TO TABLE
====================================================== */
function addRow(tableId, date, job, ink, batch, weight) {
    var table = document.getElementById(tableId);
    var row = table.insertRow();

    row.insertCell(0).innerText = date;
    row.insertCell(1).innerText = job;
    row.insertCell(2).innerText = ink;
    row.insertCell(3).innerText = batch;
    row.insertCell(4).innerText = weight;
}

/* ======================================================
   CLEAR TABLE
====================================================== */
function ClearTable() {
    var table = document.getElementById("scansBody");
    while (table.rows.length > 0) {
        table.deleteRow(0);
    }
}

/* ======================================================
   ⭐ FIX #1 — FULL RESET AFTER FINISH JOB
====================================================== */
function resetJob() {
    isJobCompleted = false;

    document.querySelectorAll("input, button").forEach(el => {
        el.disabled = false;
    });

    const banner = document.getElementById("jobCompletedBanner");
    if (banner) banner.style.display = "none";

    document.getElementById("JobNo").value = "";
    document.getElementById("InkCodeInput").value = "";
    document.getElementById("BatchCode").value = "";
    document.getElementById("Weight").value = "";
    document.getElementById("InkCodeInput").readOnly = false;

    ClearTable();
}

/* ======================================================
   ⭐ FIX #2 — SAFE CSV PARSER
====================================================== */
function parseCSVLine(line) {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

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

        csv += `"${date}",${job},${ink},"${batch}",${weight}\n`;
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

    var confirmFinish = window.confirm("Complete job and export totals only? This will lock the form for new entries.");
    if (!confirmFinish) return;

    var totals = {};

    rows.each(function () {
        var cols = $(this).find("td");

        var date = $(cols[0]).text();
        var job = $(cols[1]).text();
        var ink = $(cols[2]).text();
        var batch = $(cols[3]).text().trim();
        var weight = parseFloat($(cols[4]).text());

        if (!totals[ink]) {
            totals[ink] = {
                date: date,
                job: job,
                weight: 0,
                batches: new Set()
            };
        }

        totals[ink].weight += weight;

        if (batch !== "") {
            totals[ink].batches.add(batch);
        }
    });

    var csv = "Date,Job Number,Ink Code,Total Weight,Batch Codes Used\n";

    for (var ink in totals) {
        let batchList = Array.from(totals[ink].batches).join(", ");
        csv += `"${totals[ink].date}",${totals[ink].job},${ink},${totals[ink].weight},"${batchList}"\n`;
    }

    var jobNo = $("#JobNo").val();
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, jobNo + "_totals.csv");

    isJobCompleted = true;
    disableForm();
    showCompletionBanner();

    alert("Job completed! Totals exported. Form is now locked.");
});

/* ======================================================
   DISABLE FORM
====================================================== */
function disableForm() {
    document.querySelectorAll("input, button").forEach(el => {
        if (el.id !== "btn-clear") el.disabled = true;
    });
}
/* ======================================================
   ENABLE FORM
====================================================== */
function enableForm() {
    document.querySelectorAll("input, button").forEach(el => {
        el.disabled = false;
    });
}

/* ======================================================
   SHOW COMPLETION BANNER
====================================================== */
function showCompletionBanner() {
    const banner = document.getElementById("jobCompletedBanner");
    if (banner) banner.style.display = "block";
}

/* ======================================================
   CSV LOADER — WITH FIELD CLEARING (Option A)
====================================================== */
function loadCsvFile() {
    document.getElementById("InkCodeInput").value = "";
    document.getElementById("BatchCode").value = "";
    document.getElementById("Weight").value = "";
    document.getElementById("InkCodeInput").readOnly = false;

    document.getElementById("fileElem").click();
}

function handleFiles(files) {
    if (!files || files.length === 0) {
        alert("No file selected.");
        return;
    }

    const file = files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const text = e.target.result;
        parseCsvAndLoadRows(text);
    };

    reader.onerror = function () {
        alert("Error reading file.");
    };

    reader.readAsText(file);
}

function parseCsvAndLoadRows(csvText) {
    ClearTable();

    const lines = csvText.split(/\r?\n/);
    let firstJobNumber = "";

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") continue;

        const parts = parseCSVLine(line);
        if (parts.length < 5) continue;

        const date = parts[0];
        const job = parts[1];
        const ink = parts[2];
        const batch = parts[3];
        const weight = parts[4];

        if (!firstJobNumber) firstJobNumber = job;

        addRow("scansBody", date, job, ink, batch, weight);
    }

    if (firstJobNumber) {
        document.getElementById("JobNo").value = firstJobNumber;
    }

    alert("CSV loaded successfully!");
}
