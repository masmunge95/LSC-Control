# ⚡ LSC Studio (Light Strip Controller)

An offline-first, native Android and Progressive Web controller designed to simultaneously orchestrate disparate Bluetooth Low Energy (BLE) RGB LED strips (**ELK-BLEDOM** and **LEDDMX-03**) in unified harmony.

Built with **React 19**, **Capacitor 8**, **Tailwind CSS v4**, and native Android BLE GATT protocols.

---

## 🌟 Key Features

- **Multi-Protocol Hardware Abstraction**: Simultaneously controls physical strips using completely different communication standards without third-party hubs or cloud gateways.
- **Hardware Diode & Pin Calibration**:
  - **Pin Ordering**: Real-time switching between `RGB`, `GRB`, and `BRG` sequences.
  - **Red-Blue Quadrant Balancing**: Custom diode attenuation and boost to eliminate overpowering blue light in purples, magentas, and violets on ELK-BLEDOM strips.
  - **Warm Cozy (2700K) Amber Tuning**: Diode compensation delivering true incandescent warmth.
- **Color Studio**:
  - Interactive **360° Color Wheel** with touch/pointer tracking.
  - Continuous **Rainbow Spectrum Slider**.
  - Direct **Hex Code Input (`#RRGGBB`)** with real-time bidirectional binding.
  - Curated architectural and ambient presets.
- **Synchronized Groups**: Group multiple physical strips across different protocols into single rooms/zones for instant unison color, brightness, effect, and power commands.
- **Automated Offline Schedules**: Create and edit automated power on/off timers targeting single strips, groups, or all lights. Runs locally via IndexedDB with zero cloud dependency.
- **Non-Destructive Identify**: Flashes targeted strips with a 2-cycle visual pulse (Bright White $\leftrightarrow$ Off) and seamlessly restores the previous color or running pattern.
- **Zero Cloud & Zero Telemetry**: Offline-first local persistence powered by IndexedDB. Fast, private, and works without an internet connection.

---

## 📡 Reverse-Engineered Hardware Protocols

### 1. ELK-BLEDOM (`0x7E` Framing)
- **Primary Service UUID**: `0000fff0-0000-1000-8000-00805f9b34fb` (or `0xfff0`)
- **Characteristic UUID**: `0000fff3-0000-1000-8000-00805f9b34fb` (or `0xffe1`)
- **Framing Structure (9 Bytes)**:
  - Header: `0x7E`
  - Tail: `0xEF`
  - Power: `[0x7E, 0x00, 0x04, (0x01 | 0x00), 0x00, 0x00, 0x00, 0x00, 0xEF]`
  - RGB Color: `[0x7E, 0x00, 0x05, 0x03, R, G, B, 0x00, 0xEF]`
  - Brightness: `[0x7E, 0x00, 0x01, pct, 0x00, 0x00, 0x00, 0x00, 0xEF]`
  - Effects: `[0x7E, 0x00, 0x03, effectId, speed, 0x00, 0x00, 0x00, 0xEF]`

### 2. LEDDMX-03 (`0x7B FF` Framing)
- **Primary Service UUID**: `0000ffe0-0000-1000-8000-00805f9b34fb` (or `0xffe0`)
- **Characteristic UUID**: `0000ffe1-0000-1000-8000-00805f9b34fb`
- **Framing Structure (9 Bytes)**:
  - Header: `0x7B 0xFF`
  - Tail: `0xBF`
  - Power: `[0x7B, 0xFF, 0x04, (0x01 | 0x00), 0xFF, 0xFF, 0xFF, 0xFF, 0xBF]`
  - RGB Color: `[0x7B, 0xFF, 0x07, R, G, B, 0x00, 0xFF, 0xBF]`
  - Brightness: `[0x7B, 0xFF, 0x01, (pct * 32 / 100), pct, 0x00, 0xFF, 0xFF, 0xBF]` *(Uses internal 0–32 hardware register)*
  - Effects: `[0x7B, 0xFF, 0x03, effectId, speed32, 0x00, 0xFF, 0xFF, 0xBF]`

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Lucide Icons
- **Build Tool**: Vite 8 with Tailwind CSS v4
- **Mobile Container**: Capacitor 8 Native Android Platform
- **BLE Engine**: `@capacitor-community/bluetooth-le` + Web Bluetooth API fallback
- **Storage**: Browser IndexedDB (`lsc_control_db`)
- **Target OS**: Android 8.0+ (API 26+) through Android 14+ (API 34+)

---

## 📂 Project Structure

```text
lsc-control/ 
├── android/ # Native Android studio project (Capacitor) 
│ └── app/src/main/ 
│ ├── AndroidManifest.xml# Unrestricted BLE & Fine Location permissions 
│ └── res/ # Android drawables and app icons 
├── src/ 
│ ├── bluetooth/ 
│ │ ├── bleManager.ts # Multi-device GATT manager & diode balancing 
│ │ └── protocols/ 
│ │ ├── elkBledom.ts # 0x7E Protocol Driver 
│ │ └── ledDmx.ts # 0x7B Protocol Driver 
│ ├── components/ 
│ │ ├── control/ # Color Wheel, Sliders, Hex input, Presets 
│ │ ├── devices/ # Device Cards, Pin calibration, Add modal 
│ │ ├── effects/ # Dynamic animations & pattern panel
│ │ ├── groups/ # Group list, Schedule list & Modals 
│ │ └── layout/ # Bottom navigation, Responsive drawer 
│ ├── context/ 
│ │ └── DeviceContext.tsx # Central state, BLE hooks, Background scheduler 
│ ├── storage/ 
│ │ └── db.ts # IndexedDB local storage engine 
│ └── types/ # TypeScript interfaces (device, bluetooth, etc.) 
├── capacitor.config.ts # Capacitor app configuration 
└── package.json
```


---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **JDK**: Eclipse Temurin OpenJDK 21 (required for Gradle 8.x / Capacitor 8)
- **Android SDK**: Command-line tools or Android Studio (API 34/35)

### Installation

```powershell
# Clone the repository
git clone <repository-url>
cd lsc-control

# Install dependencies
npm install
```

### Local Development (Web)

```powershell
# Run with Vite dev server (requires Chrome/Edge for Web Bluetooth)
npm run dev
```

### 📱 Building the Native Android App

#### 1. Debug APK (Quick Testing)

```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Output: android/app/build/outputs/apk/debug/app-debug.apk

#### 2. Production Release APK (Signed)

Generate your release keystore (first time only):

```powershell
keytool -genkey -v -keystore android/app/lsc-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lsc-key
```

> [!NOTE] Save your password and keystore alias securely. Never commit *.jks files to version control.

Compile the release binary:

```powershell
cd android
.\gradlew.bat assembleRelease
```

Output: android/app/build/outputs/apk/release/app-release.apk

---

## 📄 License & Disclaimer

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

> > [!WARNING]
> **Disclaimer**: This is an independent, open-source project and is not affiliated with, endorsed by, or associated with the manufacturers of ELK-BLEDOM, LEDDMX, or their respective companion applications. All reverse-engineered protocol implementations are provided for interoperability purposes under fair use.