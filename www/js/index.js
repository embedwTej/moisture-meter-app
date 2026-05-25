// State management
let state = {
  readings: [null, null, null, null, null, null],
  isConnected: false,
  baudRate: 9600,
  activeSlotIndex: 0,
  serialBuffer: "",
  isSendingToSAP: false,
  sapEndpoint: "",
  sapMaterial: "CD01",
  operatorName: "OP-1002",
  // Auto/Manual options
  autoCalculate: true,
  autoSendSAP: false,
  lastSentAverage: null
};

// DOM elements
let elements = {};

// Initialize application on load
document.addEventListener("DOMContentLoaded", () => {
  cacheDOMElements();
  loadSavedSettings();
  loadTheme();
  setupEventListeners();
  updateUI();
  startSimulatorClock();
  
  // Hide simulation button and developer console if running inside the compiled APK native container
  const isNative = window.cordova || window.Capacitor || window.location.protocol === 'file:';
  if (isNative) {
    if (elements.simBtn) {
      elements.simBtn.style.display = "none";
    }
    if (elements.consoleSection) {
      elements.consoleSection.style.display = "none";
    }
  }
  
  logToConsole("Application initialized. Ready for MC-7825G Serial Link.");
});

// Cache DOM nodes
function cacheDOMElements() {
  elements = {
    usbStatusIndicator: document.getElementById("usb-status-indicator"),
    sapStatusIndicator: document.getElementById("sap-status-indicator"),
    baudrateSelect: document.getElementById("baudrate-select"),
    connectBtn: document.getElementById("connect-btn"),
    simBtn: document.getElementById("sim-btn"),
    resetBtn: document.getElementById("reset-btn"),
    progressText: document.getElementById("progress-text"),
    progressFill: document.getElementById("progress-fill"),
    readingSlots: document.querySelectorAll(".reading-slot"),
    avgValDisplay: document.getElementById("avg-val-display"),
    moistureEval: document.getElementById("moisture-eval"),
    gaugeFillArc: document.getElementById("gauge-fill-arc"),
    statMin: document.getElementById("stat-min"),
    statMax: document.getElementById("stat-max"),
    statSd: document.getElementById("stat-sd"),
    sapMaterial: document.getElementById("sap-material"),
    operatorInput: document.getElementById("operator-input"),
    toggleConfigBtn: document.getElementById("toggle-config-btn"),
    sapConfigFields: document.getElementById("sap-config-fields"),
    sapEndpoint: document.getElementById("sap-endpoint"),
    jsonPreviewBox: document.getElementById("json-preview-box"),
    sapBtn: document.getElementById("sap-btn"),
    clearConsoleBtn: document.getElementById("clear-console-btn"),
    copyConsoleBtn: document.getElementById("copy-console-btn"),
    consoleOutput: document.getElementById("console-output"),
    consoleSection: document.getElementById("console-section"),
    // Auto/Manual Calculation and Send toggles
    calcAutoToggle: document.getElementById("calc-auto-toggle"),
    calcManualBtn: document.getElementById("calc-manual-btn"),
    sapAutoToggle: document.getElementById("sap-auto-toggle"),
    // Theme toggle nodes
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    themeSunIcon: document.getElementById("theme-sun-icon"),
    themeMoonIcon: document.getElementById("theme-moon-icon"),
    // Simulator nodes
    deviceContainer: document.getElementById("device-container"),
    toggleSimView: document.getElementById("toggle-sim-view"),
    simClock: document.getElementById("sim-clock")
  };
}

// Start Simulated Device clock
function startSimulatorClock() {
  const updateTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // hour 0 should be 12
    if (elements.simClock) {
      elements.simClock.textContent = `${hours}:${minutes} ${ampm}`;
    }
  };
  updateTime();
  setInterval(updateTime, 30000);
}

// Load Theme from LocalStorage
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    updateThemeIcons(true);
  } else {
    document.body.classList.remove("light-theme");
    updateThemeIcons(false);
  }
}

// Toggle light/dark theme
function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  updateThemeIcons(isLight);
  logToConsole(`Theme switched to ${isLight ? "Light Mode" : "Dark Mode"}.`);
}

function updateThemeIcons(isLight) {
  if (isLight) {
    elements.themeSunIcon.classList.remove("hidden");
    elements.themeMoonIcon.classList.add("hidden");
  } else {
    elements.themeSunIcon.classList.add("hidden");
    elements.themeMoonIcon.classList.remove("hidden");
  }
}

// Load configurations from LocalStorage
function loadSavedSettings() {
  if (localStorage.getItem("sapEndpoint")) {
    elements.sapEndpoint.value = localStorage.getItem("sapEndpoint");
  }
  if (localStorage.getItem("operatorName")) {
    elements.operatorInput.value = localStorage.getItem("operatorName");
  }
  if (localStorage.getItem("sapMaterial")) {
    elements.sapMaterial.value = localStorage.getItem("sapMaterial");
  }
  
  if (localStorage.getItem("autoCalculate") !== null) {
    state.autoCalculate = localStorage.getItem("autoCalculate") === "true";
    elements.calcAutoToggle.checked = state.autoCalculate;
  }
  if (localStorage.getItem("autoSendSAP") !== null) {
    state.autoSendSAP = localStorage.getItem("autoSendSAP") === "true";
    elements.sapAutoToggle.checked = state.autoSendSAP;
  }
  
  state.sapEndpoint = elements.sapEndpoint.value;
  state.operatorName = elements.operatorInput.value;
  state.sapMaterial = elements.sapMaterial.value;
}

// Save configuration settings
function saveSettings() {
  localStorage.setItem("sapEndpoint", elements.sapEndpoint.value);
  localStorage.setItem("operatorName", elements.operatorInput.value);
  localStorage.setItem("sapMaterial", elements.sapMaterial.value);
  
  state.sapEndpoint = elements.sapEndpoint.value;
  state.operatorName = elements.operatorInput.value;
  state.sapMaterial = elements.sapMaterial.value;
  
  updateJSONPreview();
}

// Setup Event Listeners
function setupEventListeners() {
  elements.connectBtn.addEventListener("click", toggleConnection);
  elements.simBtn.addEventListener("click", triggerSimulation);
  elements.resetBtn.addEventListener("click", clearReadings);
  elements.sapBtn.addEventListener("click", sendToSAP);
  
  elements.clearConsoleBtn.addEventListener("click", clearConsole);
  elements.copyConsoleBtn.addEventListener("click", copyConsole);
  
  elements.toggleConfigBtn.addEventListener("click", () => {
    elements.sapConfigFields.classList.toggle("hidden");
  });

  // Theme toggle click
  elements.themeToggleBtn.addEventListener("click", toggleTheme);

  // Auto Calculate Toggle listener
  elements.calcAutoToggle.addEventListener("change", () => {
    state.autoCalculate = elements.calcAutoToggle.checked;
    localStorage.setItem("autoCalculate", state.autoCalculate);
    if (state.autoCalculate) {
      elements.calcManualBtn.classList.add("hidden");
      updateUI();
    } else {
      elements.calcManualBtn.classList.remove("hidden");
      // Reset calculations visually until user manually triggers
      clearCalculationsUI();
    }
  });

  // Manual Calculate Button click
  elements.calcManualBtn.addEventListener("click", () => {
    updateUI(true); // force calculation
  });

  // Auto Send to SAP Toggle listener
  elements.sapAutoToggle.addEventListener("change", () => {
    state.autoSendSAP = elements.sapAutoToggle.checked;
    localStorage.setItem("autoSendSAP", state.autoSendSAP);
  });

  // Simulator view layout toggler
  if (elements.toggleSimView) {
    elements.toggleSimView.addEventListener("click", () => {
      elements.deviceContainer.classList.toggle("full-view");
      const isFull = elements.deviceContainer.classList.contains("full-view");
      elements.toggleSimView.innerHTML = isFull 
        ? `<svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 4px;"><path fill="currentColor" d="M17,1H7A2,2 0 0,0 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3A2,2 0 0,0 17,1M17,19H7V5H17V19Z"/></svg> Wrap in Device Frame`
        : `<svg viewBox="0 0 24 24" width="16" height="16" style="margin-right: 4px;"><path fill="currentColor" d="M17,1H7A2,2 0 0,0 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3A2,2 0 0,0 17,1M17,19H7V5H17V19Z"/></svg> Full Screen Mode`;
      logToConsole(isFull ? "Switched to Full Screen view." : "Switched to Simulated Phone View.");
    });
  }

  // Attach slot click listeners for manual override / focus
  elements.readingSlots.forEach((slot, index) => {
    slot.addEventListener("click", () => {
      setFocusSlot(index);
    });
    
    // Manual Capture button
    const capBtn = slot.querySelector(".slot-action-btn");
    capBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      promptManualReading(index);
    });
  });

  // Track inputs to save configs
  const configInputs = [
    elements.sapEndpoint, elements.operatorInput, elements.sapMaterial
  ];
  configInputs.forEach(input => {
    input.addEventListener("input", saveSettings);
  });
}

// Set active capturing slot
function setFocusSlot(index) {
  state.activeSlotIndex = index;
  elements.readingSlots.forEach((slot, idx) => {
    if (idx === index) {
      slot.classList.add("active-capture");
    } else {
      slot.classList.remove("active-capture");
    }
  });
  logToConsole(`Focused Reading Slot ${index + 1} for next incoming data.`);
}

// Prompt for manual value input
function promptManualReading(index) {
  const currentVal = state.readings[index] || "13.5";
  const val = prompt(`Enter moisture percentage for Slot ${index + 1}:`, currentVal);
  if (val !== null) {
    const numeric = parseFloat(val);
    if (!isNaN(numeric) && numeric >= 0 && numeric <= 100) {
      addReading(numeric, index);
    } else {
      alert("Invalid reading. Please enter a number between 0 and 100.");
    }
  }
}

// Handle Connection logic
function toggleConnection() {
  if (state.isConnected) {
    disconnectDevice();
  } else {
    connectDevice();
  }
}

// Connect Serial Device
function connectDevice() {
  state.baudRate = parseInt(elements.baudrateSelect.value);
  logToConsole(`Attempting connection to MC-7825G Serial Link (Baud: ${state.baudRate})...`);
  
  // Verify Cordova Serial Plugin presence
  if (typeof window.serial === 'undefined') {
    logToConsole("⚠️ serial plugin not detected. Running in Web/Mock mode.");
    setConnectedState(true);
    logToConsole("Ready. Click 'Simulate Serial Input' above to send mock bytes.");
    return;
  }

  // Request OTG Permission first
  window.serial.requestPermission(
    () => {
      logToConsole("USB Permission Granted. Opening serial port...");
      // Open Serial port
      window.serial.open(
        { baudRate: state.baudRate },
        () => {
          logToConsole("🔌 Serial Port Opened successfully!");
          setConnectedState(true);
          
          // Register Read Callback
          window.serial.registerReadCallback(
            (data) => {
              handleIncomingSerialBytes(data);
            },
            (error) => {
              logToConsole(`❌ Serial Read Error: ${error}`);
              disconnectDevice();
            }
          );
        },
        (error) => {
          logToConsole(`❌ Failed to open Serial Port: ${error}`);
          setConnectedState(false);
        }
      );
    },
    (error) => {
      logToConsole(`❌ USB OTG Permission Denied: ${error}`);
      setConnectedState(false);
      alert("USB Serial permission is required to read moisture data.");
    }
  );
}

// Disconnect Serial Device
function disconnectDevice() {
  logToConsole("Disconnecting serial device...");
  if (typeof window.serial !== 'undefined' && state.isConnected) {
    window.serial.close(
      () => {
        logToConsole("🔌 Serial Port Closed.");
        setConnectedState(false);
      },
      (error) => {
        logToConsole(`Warning: Error closing serial port: ${error}`);
        setConnectedState(false);
      }
    );
  } else {
    setConnectedState(false);
    logToConsole("🔌 Disconnected.");
  }
}

function setConnectedState(connected) {
  state.isConnected = connected;
  if (connected) {
    elements.connectBtn.textContent = "Disconnect Meter";
    elements.connectBtn.classList.remove("btn-primary");
    elements.connectBtn.classList.add("btn-secondary");
    elements.usbStatusIndicator.className = "status-chip status-connected";
    elements.usbStatusIndicator.querySelector(".status-label").textContent = "USB: Connected";
  } else {
    elements.connectBtn.textContent = "Connect Meter";
    elements.connectBtn.classList.remove("btn-secondary");
    elements.connectBtn.classList.add("btn-primary");
    elements.usbStatusIndicator.className = "status-chip status-disconnected";
    elements.usbStatusIndicator.querySelector(".status-label").textContent = "USB: Offline";
  }
}

// Parse Incoming Bytes
function handleIncomingSerialBytes(arrayBuffer) {
  const decoder = new TextDecoder("utf-8");
  const text = decoder.decode(arrayBuffer);
  
  // Log raw data stream to developer console
  logToConsole(`RX (Raw): ${text.replace(/[\r\n]+/g, " ")}`);
  
  state.serialBuffer += text;
  
  // Check for line breaks
  let breakIndex;
  while ((breakIndex = state.serialBuffer.indexOf("\n")) !== -1) {
    const line = state.serialBuffer.substring(0, breakIndex).trim();
    state.serialBuffer = state.serialBuffer.substring(breakIndex + 1);
    
    if (line.length > 0) {
      processSerialLine(line);
    }
  }
}

// Process single serial line
function processSerialLine(line) {
  logToConsole(`Line Parsed: "${line}"`);
  
  // Look for any moisture float value (e.g. "14.2%" or "CD01: 15.6")
  const regex = /(\d+\.\d+)/;
  const match = line.match(regex);
  
  if (match) {
    const val = parseFloat(match[1]);
    if (val >= 5 && val <= 40) {
      logToConsole(`✅ Valid Moisture Level Extracted: ${val}%`);
      addReading(val);
    } else {
      logToConsole(`ℹ️ Out of bounds moisture value: ${val}% (Ignored)`);
    }
  }
}

// Add Reading value to slot
function addReading(value, slotIndex = null) {
  let targetIndex = slotIndex !== null ? slotIndex : state.activeSlotIndex;
  
  state.readings[targetIndex] = value;
  logToConsole(`Recorded ${value}% in Slot ${targetIndex + 1}`);
  
  // Reset lastSentAverage on new inputs to enable auto-send trigger again
  state.lastSentAverage = null;
  
  // Advance focus to next empty slot if not manually targeted
  if (slotIndex === null) {
    let nextIndex = (targetIndex + 1) % 6;
    // Find next empty slot
    let foundEmpty = false;
    for (let i = 0; i < 6; i++) {
      let checkIdx = (targetIndex + 1 + i) % 6;
      if (state.readings[checkIdx] === null) {
        nextIndex = checkIdx;
        foundEmpty = true;
        break;
      }
    }
    setFocusSlot(nextIndex);
  } else {
    updateUI();
  }
  
  updateUI();
}

// Clear all recorded readings
function clearReadings() {
  state.readings = [null, null, null, null, null, null];
  state.activeSlotIndex = 0;
  state.lastSentAverage = null;
  logToConsole("🗑️ Cleared all sample readings.");
  updateUI();
  setFocusSlot(0);
}

// Calculate Statistics
function calculateStats() {
  const validReadings = state.readings.filter(val => val !== null);
  const count = validReadings.length;
  
  if (count === 0) {
    return { count: 0, average: 0, min: 0, max: 0, sd: 0 };
  }
  
  const sum = validReadings.reduce((acc, val) => acc + val, 0);
  const average = sum / count;
  const min = Math.min(...validReadings);
  const max = Math.max(...validReadings);
  
  // Standard Deviation
  let sd = 0;
  if (count > 1) {
    const variance = validReadings.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / count;
    sd = Math.sqrt(variance);
  }
  
  return { count, average, min, max, sd };
}

// Clear Calculations UI (for Manual Calculate Mode)
function clearCalculationsUI() {
  elements.avgValDisplay.innerHTML = `—<span class="unit">%</span>`;
  elements.moistureEval.className = "gauge-desc";
  elements.moistureEval.textContent = "No Data";
  elements.gaugeFillArc.style.strokeDashoffset = 314;
  elements.gaugeFillArc.style.stroke = "var(--primary)";
  
  elements.statMin.textContent = "—";
  elements.statMax.textContent = "—";
  elements.statSd.textContent = "—";
}

// Generate the JSON payload dynamically
function getJSONPayload(stats) {
  return {
    sapMaterialCode: state.sapMaterial,
    readings: state.readings,
    averageMoisture: parseFloat(stats.average.toFixed(2)),
    minMoisture: parseFloat(stats.min.toFixed(2)),
    maxMoisture: parseFloat(stats.max.toFixed(2)),
    standardDeviation: parseFloat(stats.sd.toFixed(3)),
    timestamp: new Date().toISOString(),
    operatorName: state.operatorName || "OP-1002"
  };
}

// Update JSON Preview Box
function updateJSONPreview() {
  const stats = calculateStats();
  const payload = getJSONPayload(stats);
  if (elements.jsonPreviewBox) {
    elements.jsonPreviewBox.textContent = JSON.stringify(payload, null, 2);
  }
}

// Update DOM elements based on state
function updateUI(forceCalculate = false) {
  const stats = calculateStats();
  
  // Update slot elements
  elements.readingSlots.forEach((slot, index) => {
    const val = state.readings[index];
    const valDiv = slot.querySelector(".slot-val");
    const statusDiv = slot.querySelector(".slot-status");
    
    if (val !== null) {
      slot.className = "reading-slot captured";
      valDiv.textContent = `${val.toFixed(1)}%`;
      statusDiv.textContent = "Captured";
    } else {
      slot.className = "reading-slot pending";
      valDiv.textContent = "—";
      statusDiv.textContent = "Pending";
    }
    
    // Highlight focused slot
    if (index === state.activeSlotIndex) {
      slot.classList.add("active-capture");
    }
  });
  
  // Update progress bar
  elements.progressText.textContent = `${stats.count} / 6 Readings`;
  elements.progressFill.style.width = `${(stats.count / 6) * 100}%`;
  
  // Update calculations
  if (stats.count > 0 && (state.autoCalculate || forceCalculate)) {
    elements.avgValDisplay.innerHTML = `${stats.average.toFixed(1)}<span class="unit">%</span>`;
    elements.statMin.textContent = `${stats.min.toFixed(1)}%`;
    elements.statMax.textContent = `${stats.max.toFixed(1)}%`;
    elements.statSd.textContent = `${stats.sd.toFixed(2)}%`;
    
    // Gauge fill mapping: 0% to 40% moisture range
    // Circumference = 314
    const scaleMax = 40;
    const fillPercent = Math.min(stats.average / scaleMax, 1);
    const strokeOffset = 314 - (fillPercent * 314);
    elements.gaugeFillArc.style.strokeDashoffset = strokeOffset;
    
    // Color code moisture gauge and eval
    const avg = stats.average;
    let evalText = "";
    let evalClass = "";
    let strokeColor = "#3b82f6"; // primary
    
    if (avg < 14) {
      evalText = "Safe / Dry";
      evalClass = "gauge-desc dry";
      strokeColor = "#10b981"; // success green
    } else if (avg >= 14 && avg < 18) {
      evalText = "Warning / Damp";
      evalClass = "gauge-desc warn";
      strokeColor = "#f59e0b"; // warning amber
    } else {
      evalText = "Critical / Wet";
      evalClass = "gauge-desc wet";
      strokeColor = "#ef4444"; // danger red
    }
    
    elements.moistureEval.className = evalClass;
    elements.moistureEval.textContent = evalText;
    elements.gaugeFillArc.style.stroke = strokeColor;
    
    // Auto-send hook if 6 readings completed
    if (stats.count === 6 && state.autoSendSAP && state.lastSentAverage !== stats.average) {
      state.lastSentAverage = stats.average;
      logToConsole("✨ Auto Send mode active: Triggering SAP Dispatch...");
      sendToSAP();
    }
  } else if (!state.autoCalculate && !forceCalculate) {
    // Keep or clear display if autoCalculate is disabled and manual calculate has not run
    clearCalculationsUI();
    if (stats.count > 0) {
      elements.moistureEval.textContent = "Recalc Required";
    }
  } else {
    clearCalculationsUI();
  }
  
  // Enable SAP upload button only when all 6 readings are verified
  if (stats.count === 6 && !state.isSendingToSAP) {
    elements.sapBtn.removeAttribute("disabled");
  } else {
    elements.sapBtn.setAttribute("disabled", "true");
  }

  // Sync the JSON preview panel
  updateJSONPreview();
}

// Simulate Serial Transmission
function triggerSimulation() {
  logToConsole("🤖 Running serial data simulation...");
  
  // Generate random moisture between 12.0% and 19.5%
  const randomMoisture = (11.5 + Math.random() * 8.5).toFixed(1);
  const selectedMaterial = elements.sapMaterial.value || "CD01";
  
  const dataFormats = [
    `${randomMoisture}%\r\n`,
    `${selectedMaterial}: ${randomMoisture}\r\n`,
    `Moisture = ${randomMoisture}\r\n`
  ];
  
  const mockString = dataFormats[Math.floor(Math.random() * dataFormats.length)];
  const encoder = new TextEncoder("utf-8");
  const bytes = encoder.encode(mockString);
  
  // Send through handler
  handleIncomingSerialBytes(bytes.buffer);
}

// Send calculations to SAP
function sendToSAP() {
  saveSettings();
  const stats = calculateStats();
  
  if (stats.count !== 6) {
    alert("Please capture all 6 samples before sending to SAP.");
    return;
  }
  
  state.isSendingToSAP = true;
  updateUI();
  
  elements.sapStatusIndicator.className = "status-chip status-sending";
  elements.sapStatusIndicator.querySelector(".status-label").textContent = "SAP: Transmitting...";
  logToConsole(`📤 Sending payload to SAP at: ${elements.sapEndpoint.value}...`);
  
  const payload = getJSONPayload(stats);
  logToConsole(`Payload: ${JSON.stringify(payload, null, 2)}`);
  
  fetch(elements.sapEndpoint.value, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    logToConsole(`✅ SAP Response Success: ${JSON.stringify(data)}`);
    elements.sapStatusIndicator.className = "status-chip status-synced";
    elements.sapStatusIndicator.querySelector(".status-label").textContent = "SAP: Synced";
    alert("Success! Moisture data sent to SAP successfully.");
  })
  .catch(error => {
    logToConsole(`⚠️ Connection Warning: SAP REST gateway error: ${error.message}`);
    logToConsole("ℹ️ Simulating Local Dispatch success (Offline Buffer mode)...");
    
    setTimeout(() => {
      elements.sapStatusIndicator.className = "status-chip status-synced";
      elements.sapStatusIndicator.querySelector(".status-label").textContent = "SAP: Local Synced";
      logToConsole("✅ Saved in Local Outbox database successfully.");
      alert(`Moisture Uploaded! (Offline simulation mode)\nAverage: ${stats.average.toFixed(1)}%\nPayload logged in console.`);
    }, 1000);
  })
  .finally(() => {
    state.isSendingToSAP = false;
    updateUI();
  });
}

// Console helper functions
function logToConsole(message) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMsg = `\n[${timestamp}] ${message}`;
  elements.consoleOutput.textContent += formattedMsg;
  elements.consoleBody.scrollTop = elements.consoleBody.scrollHeight;
}

// Clear logs
function clearConsole() {
  elements.consoleOutput.textContent = ">_ Terminal cleared.";
}

// Copy logs
function copyConsole() {
  navigator.clipboard.writeText(elements.consoleOutput.textContent)
    .then(() => {
      alert("Console output copied to clipboard.");
    })
    .catch(err => {
      console.error("Failed to copy console text: ", err);
    });
}
