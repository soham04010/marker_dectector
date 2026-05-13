# Custom Marker Detection App

A high-performance Android native application built with React Native that accesses the device camera to identify, verify, and isolate a custom visual marker (similar to a QR code) in real-time.

## Features

* **Real-Time Camera Feed:** Renders a high-quality live camera feed using Expo Camera.
* **Instant Detection:** Identifies the correct custom marker in under 3000ms using a highly optimized JavaScript perceptual feature extraction engine.
* **Orientation Invariant:** Mathematically robust against rotation; detects markers accurately whether they are scanned upright, sideways, or upside down.
* **Accuracy & Validation:** Uses Normalized Cross-Correlation (NCC) to differentiate between correct and incorrect shapes, preventing false positives.
* **Batch Processing:** Automatically captures and processes 20 valid markers from 20 different frames, then navigates to a results screen.
* **Fully Offline:** Reference markers are bundled directly into the application, ensuring 100% reliability without relying on external file systems or network requests.

## Tech Stack

* **Framework:** React Native / Expo
* **Camera:** `expo-camera`
* **Image Processing:** Pure TypeScript / JavaScript (No heavy C++ OpenCV dependencies)
* **Image Manipulation:** `expo-image-manipulator`, `jpeg-js`

## Prerequisites

Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or newer)
* npm or yarn
* [Expo CLI](https://docs.expo.dev/more/expo-cli/)
* Android Studio (for emulator testing) or the Expo Go app on your physical Android device.

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd MarkerDetector
