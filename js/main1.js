/* ======================================================
   GLOBAL STATE FOR JOB COMPLETION
====================================================== */
let isJobCompleted = false;
let isCsvLoading = false;   // STRICT LOADER LOCK

/* ======================================================
   DISABLE FORM
====================================================== */
function disableForm() {
    $("#dateInput").prop("disabled", true);
    $("#JobNo").prop("disabled", true);
    $("#InkCodeInput").prop("disabled", true);
    $("#BatchCode").prop("disabled", true);
    $("#Weight").prop("disabled", true);
    $("#btn-save-continue").prop("disabled", true);
    $("#btn-complete-job").prop("disabled", true);
    $("#fileSelect").prop("disabled", true);
    $(editInkBtn).prop("disabled", true);
}

/* ======================================================
   ENABLE FORM FOR NEW JOB
====================================================== */
function enableForm() {
    $("#dateInput").prop("disabled", false);
    $("#JobNo").prop("disabled", false);
    $("#InkCodeInput").prop("disabled", false);
    $("#BatchCode").prop("disabled", false);
    $("#Weight").prop("disabled", false);
    $("#btn-save-continue").prop("disabled", false);
    $("#btn-complete-job").prop("disabled", false);
    $("#fileSelect").prop("disabled", false);
    $(editInkBtn).prop("disabled", false);
    editInkBtn.style.display = "none";
}

/* ======================================================
   SHOW COMPLETION BANNER
====================================================== */
function showCompletionBanner() {
    const banner = document.getElementById("jobCompletedBanner");
    banner.classList.add("show");
}

/* ======================================================
   HIDE COMPLETION BANNER
====================================================== */
function hideCompletionBanner() {
    const banner = document.getElementById("jobCompletedBanner");
    banner.classList.remove("show");
}

/* ======================================================
   STRICT CSV LOADER — SAFE, SINGLE EXECUTION
====================================================== */
function loadCsvFile() {
    console.log("loadCsvFile called");

    if (isCsvLoading) {
        alert("A CSV file is already being processed. Please wait.");
        return;
    }

    const clear = confirm("Loading a file will clear the current table. Continue?");
    if (!clear) return;

    console.log("User confirmed, clearing table");
    ClearTable();

    console.log("Triggering file input click");
    document.getElementById("fileElem").click();
}

function handleFiles(files) {
    console.log("handleFiles called with", files.length, "files");

    if (isCsvLoading) {
        console.log("CSV load blocked — already loading");
        return;
    }

    if (files.length === 0) {
        console.log("No files selected");
        return;
    }

    isCsvLoading = true;  // LOCK ENGAGED

    const file = files[0];
    console.log("Processing file:", file.name);
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const csv = e.target.result;
            const lines = csv.trim().split("\n");

            console.log("CSV has", lines.length, "lines");

            if (lines.length < 2) {
                alert("CSV file is empty or invalid.");
                return;
            }

            let rowsAdded = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const cols = parseCSVLine(line);
                console.log("Row", i, "parsed columns:", cols);

                if (cols.length >= 5) {
                    addRow(
                        "scansBody",
                        cols[0].trim(),
                        cols[1].trim(),
                        cols[2].trim(),
                        cols[3].trim(),
                        cols[4].trim()
                    );
                    rowsAdded++;
                }
            }

            console.log("Loaded", rowsAdded, "rows from CSV");

            alert(
                rowsAdded > 0
                    ? "Successfully loaded " + rowsAdded + " entries from CSV!"
                    : "No valid data rows found in CSV file."
            );
        } catch (error) {
            console.error("Error loading CSV:", error);
            alert("Error loading CSV file: " + error.message);
        } finally {
            document.getElementById("fileElem").value = "";
            isCsvLoading = false; // UNLOCK
        }
    };

    reader.onerror = function () {
        console.error("FileReader error");
        alert("Error reading file");
        document.getElementById("fileElem").value = "";
        isCsvLoading = false; // UNLOCK
    };

    reader.readAsText(file);
}

/* ======================================================
   CSV LINE PARSER
====================================================== */
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
        } else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current);

    return result.map((col) => {
        col = col.trim();
        if (col.startsWith('"') && col.endsWith('"')) {
            col = col.slice(1, -1);
        }
        return col;
    });
}

/* ======================================================
   ADD ROW TO TABLE
====================================================== */
function addRow(tBodyID, rDate, rJobNo, rInkCode, rBatchCode, rWeight) {
    const body = document.getElementById(tBodyID);
    const row = body.insertRow(0);
    row.insertCell(0).innerHTML = rDate;
    row.insertCell(1).innerHTML = rJobNo;
    row.insertCell(2).innerHTML = rInkCode;
    row.insertCell(3).innerHTML = rBatchCode;
    row.insertCell(4).innerHTML = rWeight || "";
}

/* ======================================================
   CLEAR TABLE + RESET FORM
====================================================== */
function ClearTable() {
    console.log("Clearing table");
    document.getElementById("scansBody").innerHTML = "";
    isJobCompleted = false;
    enableForm();
    hideCompletionBanner();

    const today = new Date();
    const formatted = today.toLocaleDateString("en-NZ");
    $("#dateInput").val(formatted);
    $("#JobNo").val("");
    $("#InkCodeInput").val("").prop("readonly", false);
    $("#BatchCode").val("");
    $("#Weight").val("");
    editInkBtn.style.display = "none";
}

/* ======================================================
   EVENT LISTENERS
====================================================== */
$("#fileSelect").click(loadCsvFile);
$("#btn-clear").click(ClearTable);

$("#fileElem").change(function () {
    console.log("File input changed");
    handleFiles(this.files);
});
