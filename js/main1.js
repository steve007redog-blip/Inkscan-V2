// ======================================================
//  GLOBAL STATE FOR JOB COMPLETION
// ======================================================
let isJobCompleted = false;

// ======================================================
//  AUTO‑FILL TODAY'S DATE (NZ FORMAT)
// ======================================================
window.addEventListener("load", () => {
    const dateField = document.getElementById("dateInput");
    if (!dateField) return;

    const today = new Date();
    const formatted = today.toLocaleDateString("en-NZ");
    dateField.value = formatted;
});


// ======================================================
//  LOAD INK CODES FROM inkcodes.json
// ======================================================
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


// ======================================================
//  AUTOCOMPLETE SETUP (CLEAN + FIXED)
// ======================================================
function setupAutocomplete() {
    const list = document.getElementById("autocomplete-list");

    inkInput.addEventListener("input", function () {
        if (inkInput.readOnly) return;

        const value = this.value.trim().toLowerCase();
        list.innerHTML = "";

        if (!value) return;

        // Filter only codes that START with the typed value
        const matches = inkCodes.filter(code =>
            code.toLowerCase().startsWith(value)
        );

        // Auto‑select only when EXACTLY one match
        if (matches.length === 1) {
            lockInkFieldAfterSelect(matches[0]);
            list.innerHTML = "";
            return;
        }

        // Show dropdown list
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

    // Close list when clicking outside
    document.addEventListener("click", (e) => {
        if (e.target !== inkInput) list.innerHTML = "";
    });
}


// ======================================================
//  LOCK INK FIELD AFTER SELECTION
// ======================================================
function lockInkFieldAfterSelect(selectedValue) {
    inkInput.value = selectedValue;
    inkInput.readOnly = true;
    editInkBtn.style.display = "block"; // Show edit button
}


// ======================================================
//  UNLOCK/EDIT INK FIELD
// ======================================================
editInkBtn.addEventListener("click", function () {
    inkInput.readOnly = false;
    inkInput.value = "";
    editInkBtn.style.display = "none";
    inkInput.focus();
});


// ======================================================
//  UNLOCK WHEN CLEARED
// ======================================================
inkInput.addEventListener("input", () => {
    if (inkInput.value === "") {
        inkInput.readOnly = false;
        editInkBtn.style.display = "none";
    }
});


// ======================================================
//  VALIDATE ON BLUR
// ======================================================
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


// ======================================================
//  FIELD NAVIGATION + ADD ROW LOGIC
// ======================================================

// Ink Code → Batch Code
$("#InkCodeInput").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        $("#BatchCode").focus();
    }
});

// Batch Code → Weight
$("#BatchCode").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        $("#Weight").focus();
    }
});

// Weight → Add Row
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


// ======================================================
//  SAVE & CONTINUE (INDIVIDUAL ENTRIES CSV)
// ======================================================
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


// ======================================================
//  COMPLETE/FINISH JOB (TOTALS ONLY)
// ======================================================
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

    // Ask for confirmation
    var confirm = window.confirm("Complete job and export totals only? This will lock the form for new entries.");
    if (!confirm) return;

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
        csv += `${totals[ink].date},${totals[ink].job},${ink},${totals[ink].weight},"${batchList}"\n`;
    }

    var jobNo = $("#JobNo").val();
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, jobNo + "_totals.csv");

    // Lock the form and disable inputs
    isJobCompleted = true;
    disableForm();
    showCompletionBanner();

    alert("Job completed! Totals exported. Form is now locked.");
});


// ======================================================
//  DISABLE FORM AFTER JOB COMPLETION
// ======================================================
function disableForm() {
    $("#dateInput").prop("disabled", true);
    $("#JobNo").prop("disabled", true);
    $("#InkCodeInput").prop("disabled", true);
    $("#BatchCode").prop("disabled", true);
    $("#Weight").prop("disabled", true);
    $("#btn-save-continue").prop("disabled", true);
    $("#btn-complete-job").prop("disabled", true);
    $("#fileSelect").prop("disabled", true);
    editInkBtn.prop("disabled", true);
}


// ======================================================
//  ENABLE FORM FOR NEW JOB
// ======================================================
function enableForm() {
    $("#dateInput").prop("disabled", false);
    $("#JobNo").prop("disabled", false);
    $("#InkCodeInput").prop("disabled", false);
    $("#BatchCode").prop("disabled", false);
    $("#Weight").prop("disabled", false);
    $("#btn-save-continue").prop("disabled", false);
    $("#btn-complete-job").prop("disabled", false);
    $("#fileSelect").prop("disabled", false);
    editInkBtn.prop("disabled", false);
    editInkBtn.style.display = "none";
}


// ======================================================
//  SHOW COMPLETION BANNER
// ======================================================
function showCompletionBanner() {
    const banner = document.getElementById("jobCompletedBanner");
    banner.classList.add("show");
}


// ======================================================
//  HIDE COMPLETION BANNER
// ======================================================
function hideCompletionBanner() {
    const banner = document.getElementById("jobCompletedBanner");
    banner.classList.remove("show");
}


// ======================================================
//  TABLE + FILE FUNCTIONS
// ======================================================
function loadCsvFile() {
    var clear = confirm("Loading a file will clear the current table. Continue?");
    if (clear) {
        ClearTable();
        if (fileElem) fileElem.click();
    }
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.trim().split('\n');
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse CSV line (handle quoted fields)
            const cols = parseCSVLine(line);
            
            if (cols.length >= 5) {
                addRow(
                    "scansBody",
                    cols[0].trim(),  // date
                    cols[1].trim(),  // job number
                    cols[2].trim(),  // ink code
                    cols[3].trim(),  // batch code
                    cols[4].trim()   // weight
                );
            }
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    document.getElementById("fileElem").value = "";
}

function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function addRow(tBodyID, rDate, rJobNo, rInkCode, rBatchCode, rWeight) {
    var body = document.getElementById(tBodyID);
    var row = body.insertRow(0);
    row.insertCell(0).innerHTML = rDate;
    row.insertCell(1).innerHTML = rJobNo;
    row.insertCell(2).innerHTML = rInkCode;
    row.insertCell(3).innerHTML = rBatchCode;
    row.insertCell(4).innerHTML = rWeight || "";
}

function ClearTable() {
    document.getElementById("scansBody").innerHTML = "";
    isJobCompleted = false;
    enableForm();
    hideCompletionBanner();
    
    // Reset form fields
    const today = new Date();
    const formatted = today.toLocaleDateString("en-NZ");
    $("#dateInput").val(formatted);
    $("#JobNo").val("");
    $("#InkCodeInput").val("").prop("readonly", false);
    $("#BatchCode").val("");
    $("#Weight").val("");
    editInkBtn.style.display = "none";
}

$("#btn-clear").click(ClearTable);