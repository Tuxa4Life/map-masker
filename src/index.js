import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fetchBuildings } from './osmDataProcessor.js'
import { generateCityImage } from './canvas.js'

// TODO: add inquirer for interactive city selection
const CITY_IDS = {
    tbilisi: 1996871,
    rustavi: 5997314
}

const DATA_FILE = path.join('../data', 'buildings.json')
const SELECTED_CITY = 'rustavi'

const main = async () => {
    try {
        let buildings

        if (existsSync(DATA_FILE)) {
            console.log('=== Loading existing building data ===')
            const fileContent = await fs.readFile(DATA_FILE, 'utf-8')
            buildings = JSON.parse(fileContent)
            console.log(`> Loaded ${buildings.length} buildings from cache`)
        } else {
            console.log('=== No cached data found, fetching from OSM ===')
            buildings = await fetchBuildings(CITY_IDS[SELECTED_CITY])
            
            if (!buildings || buildings.length === 0) {
                console.error('=== Failed to fetch buildings, aborting ===')
                process.exit(1)
            }
        }

        await generateCityImage(buildings)
        console.log('=== Process completed successfully ===')

    } catch (error) {
        console.error('=== Fatal error ===')
        console.error(error.message)
        process.exit(1)
    }
}

main()