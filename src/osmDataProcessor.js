import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = '../data'
const OUTPUT_FILE = path.join(DATA_DIR, 'buildings.json')
const DEFAULT_BUILDING_LEVELS = 2
const OVERPASS_TIMEOUT = 360

/**
 * Fetches and processes building data from OpenStreetMap via Overpass API
 * @param {number} cityId - OSM city ID
 * @returns {Promise<Array>} Processed building data
 */
const fetchBuildings = async (cityId) => {
    console.log('=== Fetching buildings ===')
    
    const areaId = 3600000000 + cityId
    const query = `
        [out:json][timeout:${OVERPASS_TIMEOUT}];
        (
            way["building"](area:${areaId});
        );
        out body geom;
    `

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, { 
                headers: { 'Content-Type': 'text/plain' } 
            }
        )

        console.log(`> Fetched ${response.data.elements.length} buildings`)
        const processedBuildings = response.data.elements.map(element => ({
            id: element.id,
            nodes: element.geometry,
            levels: element.tags?.['building:levels'] ?? DEFAULT_BUILDING_LEVELS
        }))

        await fs.mkdir(DATA_DIR, { recursive: true })
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(processedBuildings, null, 2))
        
        console.log(`> Saved ${processedBuildings.length} buildings to ${OUTPUT_FILE}`)
        console.log('=== Processing complete ===')

        return processedBuildings

    } catch (err) {
        console.error(`=== Error: ${err.message} (Status: ${err.response?.status ?? 'N/A'}) ===`)
        return []
    }
}

export { fetchBuildings } 