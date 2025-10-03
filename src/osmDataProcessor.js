import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'

/**
 * Fetches major cities and their OSM relation IDs for a given country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'GE', 'US', 'FR')
 * @param {number} minPopulation - Minimum population threshold (default: 50000)
 * @returns {Promise<Array>} Array of {name, id, population} objects
 */
const fetchCities = async (countryCode, minPopulation = 1000) => {
    console.log(`=== Fetching cities for country: ${countryCode} ===`)

    const query = `
        [out:json][timeout:60];
        area["ISO3166-1"="${countryCode}"]->.country;
        (
            relation["place"~"city|town"]["population"](area.country);
        );
        out body;
    `

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, { headers: { 'Content-Type': 'text/plain' } })

        const cities = response.data.elements
            .filter((e) => {
                const pop = parseInt(e.tags?.population || 0)
                return pop >= minPopulation && e.tags?.name
            })
            .map((e) => ({
                name: e.tags.name,
                id: e.id,
                population: parseInt(e.tags.population || 0),
                type: e.type,
            }))
            .sort((a, b) => b.population - a.population)

        console.log(`> Found ${cities.length} cities`)
        return cities
    } catch (err) {
        console.error(`=== Error fetching cities: ${err.message} ===`)
        return []
    }
}

const DATA_DIR = '../data'
const OUTPUT_FILE = path.join(DATA_DIR, 'buildings.json')
const DEFAULT_BUILDING_LEVELS = 2
const OVERPASS_TIMEOUT = 500 // Increase this if error 504 shows when fetching

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
            headers: { 'Content-Type': 'text/plain' },
        })

        console.log(`> Fetched ${response.data.elements.length} buildings`)
        const processedBuildings = response.data.elements.map((element) => ({
            id: element.id,
            nodes: element.geometry,
            levels: element.tags?.['building:levels'] ?? DEFAULT_BUILDING_LEVELS,
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
