# Photobooth App

Welcome to the Photobooth App, a web-based application that allows users to capture, upload, and customize photos into a photo strip layout using their webcam or local images. This project provides a fun and interactive way to create photo strips with stickers, text overlays, and customizable layouts, ideal for events, parties, or personal use.

## Overview

The Photobooth App uses React for its frontend, enabling users to:
- Capture photos using their webcam.
- Upload multiple photos from their device.
- Preview and select photos to add to a customizable photo strip.
- Add stickers, text, shapes, and icons to enhance photos.
- Reorder photos within the strip and remove them as needed.
- Download the final photo strip as a PNG image.

The app features a clean, user-friendly interface with custom CSS styling, supporting both full (6x18") and half (3x9") strip sizes, multiple layouts, and drag-and-drop functionality for photo arrangement.

## Features

- **Webcam Capture**: Use your webcam to capture photos directly in the app.
- **Photo Upload**: Upload multiple photos via a button or drag-and-drop in the preview area.
- **Preview Photos**: View and manage up to 10 preview photos before adding them to the strip, with options to select, deselect, or delete.
- **Photo Strip Customization**:
  - Choose between full (6x18") or half (3x9") strip sizes.
  - Select from various layouts (e.g., grid or vertical arrangements).
  - Customize frame color, background image, and text overlay.
- **Stickers and Annotations**:
  - Add images, text, shapes (circles, squares, triangles, polygons, lines), and icons as stickers.
  - Drag, resize, rotate, and reorder stickers with snap-to-grid functionality.
  - Bring stickers to the front or send them to the back.
- **Undo/Redo**: Use keyboard shortcuts (Ctrl+Z/Y or Cmd+Z/Y) to undo or redo sticker changes.
- **Download**: Export the finalized photo strip as a PNG image.

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v16 or later recommended)
- **npm** (comes with Node.js)
- A modern web browser with webcam access (e.g., Chrome, Firefox, Edge)

## Installation

Follow these steps to set up and run the Photobooth App locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/photobooth-app.git
   cd photobooth-app
   ```

2. **Install Dependencies**:
   Run the following command to install the required packages:
   ```bash
   npm install
   ```

   Ensure the following dependencies are installed (check `package.json`):
   - `react`
   - `react-dom`
   - `react-beautiful-dnd`
   - `react-draggable`
   - `react-resizable`
   - `@fortawesome/react-fontawesome`
   - `uuid`
   - `html2canvas`

3. **Run the Development Server**:
   Start the app in development mode:
   ```bash
   npm start
   ```

   Open your browser and navigate to `http://localhost:3000` to view the app.

## Usage

1. **Grant Camera Permissions**:
   - When you first load the app, allow camera access to use the webcam capture feature.

2. **Capture or Upload Photos**:
   - Use the camera feed to capture photos by clicking the capture button (white circle).
   - Upload photos via the "Upload Photos" button in the controls or by dropping images into the preview photos area (up to 10 photos).

3. **Preview and Add to Strip**:
   - Preview photos appear below the camera feed. Click a preview photo to add it to the strip (a check icon indicates selection).
   - Delete preview photos using the trash icon in the corner.
   - The dashed border square in the preview area allows clicking or dropping images to upload, hiding when the 10-photo limit is reached.

4. **Customize the Photo Strip**:
   - Select strip size (full or half) and layout from the controls.
   - Adjust frame color, add a background image, or add text overlays.
   - Add stickers (images, text, shapes, icons) and manipulate them (drag, resize, rotate, reorder).

5. **Reorder and Remove Photos**:
   - Drag and drop photos within the strip to reorder them.
   - Use the "Remove" button on each photo in the strip to delete it.

6. **Download the Strip**:
   - Click the "Done" button to download the finalized photo strip as a PNG image.

7. **Keyboard Shortcuts**:
   - `Ctrl+Z` or `Cmd+Z`: Undo sticker changes.
   - `Ctrl+Y` or `Cmd+Y`: Redo sticker changes.
   - `Alt+ArrowUp`: Duplicate the selected sticker with a slight offset.

## Project Structure

```
photobooth-app/
├── src/
│   ├── components/
│   │   ├── CameraFeed.tsx
│   │   ├── FrameControls.tsx
│   │   ├── PhotoStrip.tsx
│   │   └── StickerDraggable.tsx (if applicable, for sticker dragging)
│   ├── constants.ts
│   ├── App.tsx
│   └── App.css
├── package.json
└── README.md
```

## Contributing

We welcome contributions to enhance the Photobooth App! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add your commit message here"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request on GitHub, describing your changes and their purpose.

Please ensure your code follows the project’s coding style and includes appropriate tests or documentation.

## License

TBD

## Contact

For questions or feedback, please open an issue on GitHub or contact the project maintainer at [minhhieu.eng2@gmail.com].