# Photo Booth 📸

A native-feeling iPhone web app and PWA for taking 4-shot vertical photobooth strips.

## Features

- **Front-Camera First**: Fullscreen live camera preview optimized for phones with front-facing camera mirror preview.
- **4-Shot Sequence**: Tap the shutter button for a 3-2-1 countdown, xenon flash, and automatic 4-shot burst capture with audio sound effects (Web Audio API).
- **Vertical Photo Strip**: Stacks the 4 photos into a classic vertical film strip with a white border, customizable frame themes (Classic White, Midnight Black, Vintage Cream, Pastel Pink), photo filters (Normal, B&W Film, Warm 90s, Cool Y2K), and timestamp.
- **iOS Share Sheet & Save to Photos**: On iPhone, tapping "Save Strip" opens the native share sheet so you can tap "Save Image" to place it straight into Apple Photos. On laptops/desktops, it downloads the PNG file directly.
- **Installable PWA**: Includes web app manifest (`display: standalone`), touch icons, and iOS meta tags for full-screen standalone mode without the Safari URL bar.
- **iPhone Safe Areas**: Full support for `viewport-fit=cover` and `env(safe-area-inset-*)` ensuring UI never collides with the notch, Dynamic Island, or home indicator.
- **Permission Recovery**: Friendly iOS-style troubleshooting guide if camera access is denied.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

To test on your iPhone on the same Wi-Fi network, open the network URL displayed in the terminal (e.g. `http://<your-ip>:3000`).
