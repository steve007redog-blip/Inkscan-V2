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
}


// ======================================================
//  UNLOCK WHEN CLEARED
// ======================================================
inkInput.addEventListener("input", () => {
    if (inkInput.value === "") {
        inkInput.readOnly = false;
    }
});


// ======================================================
//  VALIDATE ON BLUR
// ======================================================
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
            $("#BatchCode").val("");
            $("#Weight").val("");

            $("#InkCodeInput").focus();
        }
    }
});


// ======================================================
//  SAVE TO CSV WITH GROUPED TOTALS
// ======================================================
$("#btn-save").click(function () {
    var rows = $("#scansBody tr");
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
    saveAs(blob, jobNo + ".csv");
});


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
                    cols[0].trim(), // date
                    cols[1].trim(), // job number
                    cols[2].trim(), // ink code
                    cols[4].trim()  // batch codes used
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
    row.insertCell(4).innerHTML = rWeight || ""; // Weight defaults to empty for loaded files
}

function ClearTable() {
    document.getElementById("scansBody").innerHTML = "";
}

$("#btn-clear").click(ClearTable);
