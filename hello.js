let outputBox1 = document.getElementById("outputBox1");
let historyList = document.getElementById("historyList");
let recoverHistoryBtn = document.getElementById("recoverHistory");

let history = [];
let historyIndex = -1;
let deletedHistory = [];

// ✅ Ensure outputBox1 is focused when the page loads
window.onload = function () {
    outputBox1.focus();
};

// ✅ Append value at cursor position with operator check
function appendValue(value) {
    let startPos = outputBox1.selectionStart;
    let endPos = outputBox1.selectionEnd;
    let text = outputBox1.value;

    let lastChar = text.slice(startPos - 1, startPos);
    let operators = "+-*/%";

    if (operators.includes(value) && operators.includes(lastChar)) {
        return; // Prevent adding multiple operators
    }

    outputBox1.value = text.slice(0, startPos) + value + text.slice(endPos);
    outputBox1.setSelectionRange(startPos + value.length, startPos + value.length);
    outputBox1.focus();
}

// ✅ Clear display
function clearDisplay() {
    outputBox1.value = "";
}

// ✅ Calculate result
function calculateResult() {
    try {
        let expression = outputBox1.value.trim();

        // Replace percentage (e.g., 50%) with its decimal equivalent
        expression = expression.replace(/(\d+)%/g, "($1/100)");

        // Handle modulo operation (e.g., 10 mod 3 -> 10 % 3)
        expression = expression.replace(/\bmod\b/g, "%");

        let result = Function('"use strict"; return (' + expression + ')')();
        addToHistory(`${expression} = ${result}`);

        outputBox1.value = result.toString(); // Ensure result is a string for further operations
        outputBox1.setSelectionRange(outputBox1.value.length, outputBox1.value.length); // Move cursor to the end
        outputBox1.focus();
    } catch {
        outputBox1.value = "Error";
    }
}

// ✅ Calculate square of the current value
function calculateSquare() {
    try {
        let value = parseFloat(outputBox1.value.trim());
        if (!isNaN(value)) {
            let result = value * value;
            outputBox1.value = result.toString();
            outputBox1.setSelectionRange(outputBox1.value.length, outputBox1.value.length); // Move cursor to the end
            outputBox1.focus();
        } else {
            outputBox1.value = "Error";
        }
    } catch {
        outputBox1.value = "Error";
    }
}

// ✅ Handle keyboard input
document.addEventListener("keydown", function (event) {
    let key = event.key;

    if ("0123456789/*-+.%()".includes(key)) {
        appendValue(key);
        event.preventDefault(); // Prevent default browser behavior
    } else if (key === "Enter") {
        event.preventDefault();
        calculateResult();
    } else if (key === "Backspace") {
        event.preventDefault();
        handleBackspace();
    } else if (key === "Delete") {
        clearDisplay();
    }
});

// ✅ Fix: Backspace deletes a single character correctly
function handleBackspace() {
    let startPos = outputBox1.selectionStart;
    let endPos = outputBox1.selectionEnd;
    let text = outputBox1.value;

    if (startPos === endPos) { 
        if (startPos > 0) {
            outputBox1.value = text.slice(0, startPos - 1) + text.slice(endPos);
            outputBox1.setSelectionRange(startPos - 1, startPos - 1);
        }
    } else {
        outputBox1.value = text.slice(0, startPos) + text.slice(endPos);
        outputBox1.setSelectionRange(startPos, startPos);
    }
}

// ✅ Fix: Clicking history does not duplicate values
function addToHistory(entry) {
    history.unshift(entry);
    historyIndex = 0;

    const listItem = document.createElement('li');
    listItem.textContent = entry;

    // Add 'x' button to remove the entry
    const removeButton = document.createElement('button');
    removeButton.textContent = 'x';
    removeButton.style.marginLeft = '10px';
    removeButton.style.cursor = 'pointer';
    removeButton.onclick = function () {
        const index = history.indexOf(entry);
        if (index > -1) {
            deletedHistory.push(history.splice(index, 1)[0]); // Save removed entry to deletedHistory
        }
        listItem.remove(); // Remove from UI
        recoverHistoryBtn.disabled = false; // Enable Recover Button
    };

    listItem.appendChild(removeButton);

    listItem.onclick = function (event) {
        if (event.target !== removeButton) { // Prevent 'x' button click from triggering this
            outputBox1.value = "";
            setTimeout(() => {
                outputBox1.value = entry.split("=")[0].trim(); // Recover the calculation
                outputBox1.focus();
            }, 0);
        }
    };

    historyList.prepend(listItem);

    // Add tooltip to "Clear History" button if history is not empty
    document.getElementById("clearHistory").setAttribute("data-tooltip", "Clear all history");
}

// ✅ Clear history
function clearHistory() {
    if (history.length === 0) {
        document.getElementById("clearHistory").removeAttribute("data-tooltip"); // Remove tooltip if history is blank
        return;
    }

    let confirmDelete = confirm("Are you sure?");
    if (confirmDelete) {
        deletedHistory = [...history];  // Save deleted history
        history = [];
        historyIndex = -1;
        historyList.innerHTML = "";
        outputBox1.value = "";

        recoverHistoryBtn.disabled = false; // Enable Recover Button
        document.getElementById("clearHistory").removeAttribute("data-tooltip"); // Remove tooltip after clearing
    }
}

// ✅ Recover recent history
function recoverHistory() {
    if (deletedHistory.length > 0) {
        history = [...deletedHistory];
        historyIndex = 0;
        deletedHistory = [];
        recoverHistoryBtn.disabled = true; // Disable button after recovery

        // Restore history in UI
        historyList.innerHTML = "";
        history.forEach(entry => {
            let listItem = document.createElement('li');
            listItem.textContent = entry;

            // Add 'x' button to remove the entry
            const removeButton = document.createElement('button');
            removeButton.textContent = 'x';
            removeButton.style.marginLeft = '10px';
            removeButton.style.cursor = 'pointer';
            removeButton.onclick = function () {
                const index = history.indexOf(entry);
                if (index > -1) {
                    deletedHistory.push(history.splice(index, 1)[0]); // Save removed entry to deletedHistory
                }
                listItem.remove(); // Remove from UI
                recoverHistoryBtn.disabled = false; // Enable Recover Button
            };

            listItem.appendChild(removeButton);

            // Set onclick handler to add the calculation to outputBox1
            listItem.onclick = function (event) {
                if (event.target !== removeButton) { // Prevent 'x' button click from triggering this
                    outputBox1.value = "";
                    setTimeout(() => {
                        outputBox1.value = entry.split("=")[0].trim();
                        outputBox1.focus();
                    }, 0);
                }
            };

            historyList.appendChild(listItem);
        });
    }
}

// ✅ Navigate to previous calculation
function prevValue() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        outputBox1.value = history[historyIndex].split("=")[0].trim();
        outputBox1.focus();
    }
}

// ✅ Navigate to next calculation
function nextValue() {
    if (historyIndex > 0) {
        historyIndex--;
        outputBox1.value = history[historyIndex].split("=")[0].trim();
    } else if (historyIndex === 0) {
        outputBox1.value = "";
    }
    outputBox1.focus();
}

// ✅ Move cursor left
function moveCursorLeft() {
    let position = outputBox1.selectionStart;
    outputBox1.setSelectionRange(position - 1, position - 1);
    outputBox1.focus();
}

// ✅ Move cursor right
function moveCursorRight() {
    let position = outputBox1.selectionStart;
    outputBox1.setSelectionRange(position + 1, position + 1);
    outputBox1.focus();
}

// ✅ Restrict input to allowed characters
const allowedChars = /^[0-9+\-*/%.() ]*$/;

outputBox1.addEventListener("input", function () {
    if (!allowedChars.test(outputBox1.value)) {
        outputBox1.value = outputBox1.value.replace(/[^0-9+\-*/%.() ]/g, ""); 
    }
});

// ✅ Prevent pasting invalid characters
outputBox1.addEventListener("paste", function (event) {
    let pasteData = (event.clipboardData || window.clipboardData).getData("text");
    if (!allowedChars.test(pasteData)) {
        event.preventDefault();
    }
});
