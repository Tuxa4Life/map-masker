import { fetchBuildings, fetchNodes, retryErrors } from './osmDataProcessor'
import { generateCityImage } from './canvas'

const city_ids = {
    rustavi: 5997314,
}

const buildings = await fetchBuildings(city_ids.rustavi)
const nodes = await fetchNodes(buildings)
retryErrors() // Optional

generateCityImage(buildings, nodes)