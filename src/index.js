import fs from 'fs'
import { fetchBuildings, fetchNodes, retryErrors } from './osmDataProcessor.js'
import { generateCityImage } from './canvas.js'

const city_ids = {
    rustavi: 5997314,
}

if (!fs.existsSync('../data/buildings.json')) {
    await fetchBuildings(city_ids.rustavi)
}

if (!fs.existsSync('../data/nodes.json')) {
    const _buildings = JSON.parse(fs.readFileSync('../data/buildings.json', 'utf-8'))
    await fetchNodes(_buildings)
    await retryErrors() // Optional
}

const buildings = JSON.parse(fs.readFileSync('../data/buildings.json', 'utf-8'))
const nodes = JSON.parse(fs.readFileSync('../data/nodes.json', 'utf-8'))

generateCityImage(buildings, nodes)
