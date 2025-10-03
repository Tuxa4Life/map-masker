# 🗺️ OSM City Map Renderer

This tool fetches building data from **OpenStreetMap (OSM)** for selected cities and generates a **high-resolution black-and-white city map image**.
It is designed for research, visualization, and creative uses such as urban analysis, procedural content generation, or map-based artwork.

---

## 🚀 Features

* Fetches **building footprints** from OpenStreetMap via the **Overpass API**.
* Includes a **city selector** with pre-defined Georgian cities.
* Generates **16K resolution PNG maps** (15,360 × 8,640).
* Exports both **raw JSON building data** and **rendered map images**.
* Automatically handles bounding boxes and scaling.

---

## 📂 Project Structure

```
.
├── index.js             # Main function to use the tool
├── citySelect.js        # Interactive CLI to choose a city
├── osmDataProcessor.js  # Fetches & processes building data from OSM
├── canvas.js            # Renders city maps as PNG images
├── data/                # Stores fetched building data
└── output/              # Stores generated city map images
```

---

## ⚙️ How It Works

1. **Select a city**

   * Uses `inquirer` to let you choose a city from a predefined list of Georgian cities.
   * Each city has an **OSM relation ID** for fetching data.

2. **Fetch building data**

   * Uses the Overpass API to query all buildings within the city boundary.
   * Saves processed building data (`id`, `nodes`, `levels`) into `data/buildings.json`.

3. **Render the city map**

   * Loads the building data and calculates the bounding box.
   * Scales coordinates to fit a high-resolution canvas.
   * Draws all building polygons in black on a white background.
   * Saves the final image as `output/<city>.png`.

---

## 🛠️ Installation

Make sure you have **Node.js (>=18)** installed.

```bash
git clone https://github.com/Tuxa4Life/map-masker.git
cd map-masker
npm install
```

Required dependencies:

* `axios` – API requests
* `inquirer` – Interactive CLI
* `canvas` – Rendering engine
* `fs/promises`, `path` – File handling

Install them with:

```bash
npm install axios inquirer canvas
```

---

## ▶️ Usage

Run the workflow step by step:

```bash
node index.js
```

This opens inquirer

```
Select a city:
❯ Tbilisi
  Rustavi
  Kutaisi
...
```
Follow the prompt and see the magic

---

## 📊 Example Output

* **Data file:** `data/buildings.json`

```json
[
  {
    "id": 59594299,
    "nodes": [
      { "lat": 41.5798505, "lon": 44.9535176 },
      { "lat": 41.5798600, "lon": 44.9535300 }
    ],
    "levels": 2
  }
]
```

* **Image file:** `output/Tbilisi.png`
  A high-resolution **black buildings on white canvas** map.
  
![Rustavi Map](https://raw.githubusercontent.com/Tuxa4Life/map-masker/main/output/Template.png)

---

## ⚠️ Notes & Limitations

* Overpass API queries can be slow or fail with **504 Gateway Timeout** for large areas. Increase the timeout in `osmDataProcessor.js` if needed.
* Output images are very large (16K resolution) and may require substantial RAM/VRAM.
* Currently only supports **Georgian cities**, but you can easily add others by modifying `CITY_IDS` in `citySelect.js`.
* Get city IDs from official OSM website.

---


