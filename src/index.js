import fs from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fetchBuildings } from './osmDataProcessor.js'
import { generateCityImage } from './canvas.js'
import { selectCity } from './citySelect.js'

const DATA_FILE = path.join('../data', 'buildings.json')
const { city, id } = selectCity()

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
            buildings = await fetchBuildings(id)
            
            if (!buildings || buildings.length === 0) {
                console.error('=== Failed to fetch buildings, aborting ===')
                process.exit(1)
            }
        }

        const fileName = city.charAt(0).toUpperCase() + city.slice(1)
        await generateCityImage(buildings, fileName)
        console.log('=== Process completed successfully ===')
        fs.rm(DATA_FILE)

    } catch (error) {
        console.error('=== Fatal error ===')
        console.error(error.message)
        process.exit(1)
    }
}

main()