const fileSelect = document.getElementById("fileSelect"),
      fileElem = document.getElementById("fileElem");

// ======================================================
//  LOAD INK CODES FROM inkcodes.json (GitHub)
// ======================================================
let inkCodes = [];

fetch("js/inkcodes.json")
    .then(response => response.json())
    .then(data => {
        inkCodes = data;
        console.log("Ink codes loaded:", inkCodes);
    })
    .catch(err => console.error("Error loading inkcodes.json:", err));

// ======================================================
//  AUTOCOMPLETE LOGIC (C3-B)
//  - Only autocomplete when EXACTLY ONE match exists
// ======================================================
function findUniqueMatch(prefix) {
    if (!prefix) return null;

    const lower = prefix.toLowerCase();
    const matches = inkCodes.filter(code =>
        code.toLowerCase().startsWith(lower)
    );

    return matches.length === 1 ? matches[0] : null;
}

// ======================================================
//  AUTO POPULATE DATE
// ======================================================
window.addEventListener("DOMContentLoaded", function () {

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    document.getElementById("date").value = dd + "/" + mm + "/" + yyyy;

});

// ======================================================
//  INK CODE INPUT — AUTOCOMPLETE + ENTER → Batch Code
// ======================================================
$("#InkCodeInput").on("input", function () {
    const typed = $(this).val().trim();
    const match = findUniqueMatch(typed);

    if (match) {
        $(this).val(match);
    }
});

$("#InkCodeInput").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        $("#BatchCode").focus();
    }
});

// ======================================================
//  BATCH CODE FIELD — ENTER → Weight
// ======================================================
$("#BatchCode").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        $("#Weight").focus();
    }
});

// ======================================================
//  WEIGHT FIELD — ENTER → Add Row
// ======================================================
$("#Weight").on("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();

        const inkCode = $("#InkCodeInput").val().trim();
        const batch = $("#BatchCode").val().trim();
        const weight = $("#Weight").val().trim();

        if (inkCode !== "" && weight !== "") {

            addRow(
                "scansBody",
                $("#date").val(),
                $("#JobNo").val(),
                inkCode,
                batch,
                weight
            );

            $("#InkCodeInput").val("");
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
function loadCsvFile(e) {
    var clear = confirm("loading a file will clear the current table. Do you want to continue?");
    if (clear == true){
        ClearTable();
        if (fileElem) {
            fileElem.click();
        }
    }
}

function addRow(tBodyID, rDate, rJobNo, rInkCode, rBatchCode, rWeight ) {
    var body = document.getElementById(tBodyID);
    var row = body.insertRow(0);
    row.insertCell(0).innerHTML = rDate;
    row.insertCell(1).innerHTML = rJobNo;
    row.insertCell(2).innerHTML = rInkCode;
    row.insertCell(3).innerHTML = rBatchCode;
    row.insertCell(4).innerHTML = rWeight;
}

function ClearTable(){
    document.getElementById("scansBody").innerHTML = "";
}

$("#btn-clear").click(ClearTable);
