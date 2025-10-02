import axios from 'axios'
import fs from 'fs'

const cities = {
    rustaviId: 5997314,
}

const fetchBuildings = async (cityId) => {
    const areaId = 3600000000 + cityId

    const query = `
        [out:json][timeout:50];
        (
            way["building"](area:${areaId});
            relation["building"](area:${areaId});
        );
        out center;
    `

    console.log('=== Fetching buildings ===')
    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
            headers: { 'Content-Type': 'text/plain' },
        })

        const result = response.data.elements
        fs.writeFileSync('./data/buildings.json', JSON.stringify(result, null, 2))
        console.log('> Created file: buildings.json')
        console.log('=== Building Fetch complete ===')
    } catch (err) {
        console.log(`=== Error fetching buildings. Error code: ${err.status} ===`)
    }
}

const fetchNode = async (buildingId) => {
    const query = `
        [out:json];
        way(${buildingId});
        (._;>;);
        out body;
    `

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
            headers: { 'Content-Type': 'text/plain' },
        })

        if (!response.data.elements) console.log('Some error happened on building ', buildingId)
        return response.data.elements || []
    } catch (err) {
        console.log(`=== Error fetching building '${buildingId}'. Error code: ${err.status} ===`)
        return []
    }
}

const fetchNodes = async (buildings) => {
    const output = []
    const erroredIds = []

    try {
        for (let i = 0; i < buildings.length; i++) {
            const building = buildings[i]

            const nodeData = await fetchNode(building.id)
            if (!nodeData.length) {
                erroredIds.push(building.id)
                continue
            }

            const lastItem = nodeData[nodeData.length - 1]

            const nodes = []
            for (let j = 0; j < lastItem.nodes.length; j++) {
                const node_id = lastItem.nodes[j]
                const { id, lat, lon } = nodeData.find((e) => e.id === node_id)
                nodes.push({ id, lat, lon })
            }

            const building_output = { id: lastItem.id, nodes }
            output.push(building_output)

            console.log('> Finished fetching building:', building.id, `(${i + 1}/${buildings.length})`)
        }

        fs.writeFileSync('./data/nodes.json', JSON.stringify(output, null, 2))
        fs.writeFileSync('./data/errors.json', JSON.stringify(erroredIds, null, 2))

        console.log('> Created file: nodes.json')
        console.log('=== Nodes fetch complete ===')
    } catch (err) {
        console.log(` === Error creating nodes file === `)
        console.error(err)
    }
}
const buildings = JSON.parse(fs.readFileSync('./buildings.json', 'utf-8'))

fetchNodes(buildings)

export { fetchBuildings, fetchNodes }
