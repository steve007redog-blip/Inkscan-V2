# Inkscan‑V2

A lightweight, fast, browser‑based ink‑batch scanning tool designed for print‑room and ink‑store workflows. Runs entirely offline, works on any device, and supports barcode scanning via camera or handheld scanners.

## ✨ Features
- Instant barcode scanning using device camera or USB/Bluetooth scanners
- Batch capture workflow for recording ink usage
- Ink code lookup via inkcodes.json
- Offline‑first PWA (installable on Android, iOS, Windows, macOS)
- Local caching for fast performance
- Simple, clean UI optimised for tablets and touchscreens
- No backend required — everything runs client‑side

## 📁 Project Structure
Inkscan-V2/
│
├── css/               (Stylesheets)
├── img/               (Icons and images)
├── js/                (JavaScript logic)
│   ├── main.js        (Core app logic)
│   └── inkcodes.json  (Ink code lookup table)
│
├── index.htm          (Main scanning interface)
├── manage.htm         (Batch management screen)
├── manifest.json      (PWA manifest)
├── sw.js              (Service worker for offline support)
├── favicon.ico        (App icon)
└── README.md          (This file)

## 📦 How to Use
1. Open index.htm in a browser
2. Allow camera access (if using camera scanning)
3. Scan ink batch barcodes
4. The app will:
   - decode the barcode
   - match the ink code
   - record the batch
   - store it locally
5. Use the Manage screen (manage.htm) to view or export batches

## 📱 Install as a PWA
### Android / Chrome
- Open the app
- Tap the ⋮ menu
- Select “Add to Home screen”

### iPhone / iPad
- Open in Safari
- Tap Share
- Tap “Add to Home Screen”

### Windows / macOS
- Open in Chrome or Edge
- Click the Install App icon in the address bar

## 🔧 Editing / Customising
### Ink codes
Edit js/inkcodes.json to add or update ink types.

### Styles
Edit css/styles.css to change layout, colours, spacing, etc.

### Logic
All main behaviour is in js/main.js.

## 🚀 Deployment
You can host this anywhere:
- GitHub Pages
- Local intranet
- Shared network drive
- Any static web server

### GitHub Pages setup
1. Go to Settings → Pages
2. Select “Deploy from branch”
3. Choose “main” and “/root”
4. Save

Your app will appear at:
https://<your-username>.github.io/Inkscan-V2/

## 📄 License
Internal use only (or add your preferred license here).

## 📝 Notes
- No backend or database required
- Works fully offline after first load
- Designed for print‑room workflow efficiency
- Optimised for tablets used in production environments
