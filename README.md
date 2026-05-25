# CDBL Moisture Capture: MC-7825G Serial Link Mobile App

This project is a premium hybrid mobile application designed to capture moisture readings from the **DIGITAL GRAIN MOISTURE METER MC7825G** via RS232 (over USB OTG), compute averages and statistics over 6 readings, and upload the verified results directly to **SAP** with a single click.

---

## 🔌 Hardware Connection Guide

To establish serial communication between the **MC7825G moisture meter** and your **Android smartphone**, connect them using the following hardware chain:

```
[MC7825G Moisture Meter]
          │
          ▼  (3.5mm Stereo jack connector on meter side)
[3.5mm to DB9 Female Serial Cable] (Original Meter cable)
          │
          ▼  (DB9 Male connector)
[USB to RS232 (DB9) Adapter] (Featuring FTDI, PL2303, or CH340 chip)
          │
          ▼  (USB-A Male connector)
[USB OTG Adapter] (USB-A Female to USB-C or Micro-USB Male, matching your phone)
          │
          ▼  (Charging/Data Port)
[Android Smartphone]
```

### Cable Pinout Mapping
If you are custom-wiring or verifying your 3.5mm-to-DB9 cable, follow this configuration:
*   **3.5mm Stereo Plug Tip** (TxD from meter) ➔ **DB9 Female Pin 2** (RxD of computer/adapter)
*   **3.5mm Stereo Plug Ring** (RxD to meter) ➔ **DB9 Female Pin 3** (TxD of computer/adapter)
*   **3.5mm Stereo Plug Sleeve** (GND) ➔ **DB9 Female Pin 5** (GND)

---

## 💻 Testing Serial Communication using a Laptop

If you do not have the physical meter on hand, or want to perform end-to-end integration tests, you can connect your laptop directly to the phone running the APK to simulate serial input:

```
[Laptop USB Port] ── [USB-Serial Adapter 1] ── (TX) ──➔── (RX) ── [USB-Serial Adapter 2] ── [OTG Adapter] ── [Android Phone]
                                            ── (GND) ─── (GND) ──
```

### Connection Instructions:
1. Connect a USB-to-Serial adapter to your laptop.
2. Connect a second USB-to-Serial adapter to your Android phone via a **USB OTG Adapter**.
3. Crossover wire the serial pins back-to-back:
   * **Laptop TX** Pin ➔ **Phone RX** Pin
   * **Laptop GND** Pin ➔ **Phone GND** Pin
4. Start the local server on your laptop, navigate to `http://localhost:8000/laptop-sender.html` in Chrome/Edge, select your COM port, and start transmitting moisture readings.

---

## 📱 App UI Features

1.  **Device Connection Card**: Allows selecting the Baud rate (default `9600`) and toggling the link to the serial plugin.
2.  **6-Sample Grid**: Visualizes sample slots. Slots automatically capture incoming serial values one-by-one, with green/blue visual active states, or allow manual entry (pencil icon) via keyboard.
3.  **Real-Time Gauge & Stats**: Updates standard deviation, minimum, maximum, and average moisture percentages in a premium radial dial gauge that changes colors based on material health (Dry/Warning/Wet).
4.  **SAP REST Integration**: Configure gateway URLs and material types in an expandable sub-card. Send the averaged reading to SAP with a single click.
5.  **Laptop Testing Link**: Top menu bar links directly to the **Laptop Serial Sender** tool for easy test executions.

---

## 🛠️ Local Development & Testing

Since the Android SDK is not installed on this machine, you can run the app locally in your browser for testing and verification using the built-in **Serial Simulator**:

1.  Start the local Python verification server (already running on port `8000` on your system):
    ```powershell
    python -m http.server 8000 --directory "www"
    ```
2.  Open your browser and navigate to: `http://localhost:8000`
3.  Click the **Simulate Input** button to emulate incoming data streams from the MC7825G moisture meter. Verify:
    *   The 6 slots fill sequentially with mock moisture values.
    *   The dial gauge changes values and shifts colors dynamically.
    *   The statistics update instantly.
    *   The **Send to SAP** button activates once 6 readings are present.
    *   Clicking **Send to SAP** renders the JSON payload and triggers the API request.

---

## 🚀 How to Build the APK (Cloud Compilation)

We have configured a **GitHub Actions CI/CD Workflow** to compile the `.apk` package in the cloud, removing the need for a local Android SDK setup.

1.  Initialize Git in this directory, commit all files, and push to your GitHub repo:
    ```powershell
    git add .
    git commit -m "Configure laptop test platform and name to CDBL Moisture Capture"
    git push origin main
    ```
2.  Navigate to the **Actions** tab on your GitHub repository.
3.  You will see the **Build Android APK** workflow running.
4.  Once completed, click on the workflow run and download the **`moisture-capture-debug-apk`** artifact, containing the installable `app-debug.apk` file!

