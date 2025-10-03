import axios from 'axios'
import fs from 'fs'

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

        const result = response.data.elements.filter(e => e.type !== 'relation')

        if (!fs.existsSync('../data')) {
            fs.mkdirSync('../data', { recursive: true })
        }

        fs.writeFileSync('../data/buildings.json', JSON.stringify(result, null, 2))
        console.log('> Created file: buildings.json')
        console.log('=== Building Fetch complete ===')

        return result
    } catch (err) {
        console.log(`=== Error fetching buildings. Error code: ${err.status}. Please try again ===`)
        return []
    }
}

const fetchNodesBatch = async (buildingIds, batchSize = 100) => {
    const batches = []
    for (let i = 0; i < buildingIds.length; i += batchSize) {
        batches.push(buildingIds.slice(i, i + batchSize))
    }

    const allResults = []

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`> Processing batch ${i + 1}/${batches.length}`)

        const wayIds = batch.map((id) => `way(${id});`).join('\n            ')
        const query = `
            [out:json][timeout:180];
            (
                ${wayIds}
            );
            (._;>;);
            out body;
        `

        try {
            const response = await axios.post('https://overpass-api.de/api/interpreter', query, {
                headers: { 'Content-Type': 'text/plain' },
            })

            allResults.push(...(response.data.elements || []))
            if (i < batches.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
            }
        } catch (err) {
            console.log(`=== Error fetching batch ${i + 1}. Error code: ${err.status} ===`)
        }
    }

    return allResults
}

const processNodes = (buildings, nodeData) => {
    const output = []
    const erroredIds = []

    const nodeMap = new Map()
    const wayMap = new Map()

    nodeData.forEach((element) => {
        if (element.type === 'node') {
            nodeMap.set(element.id, element)
        } else if (element.type === 'way') {
            wayMap.set(element.id, element)
        }
    })

    buildings.forEach((building) => {
        const way = wayMap.get(building.id)

        if (!way || !way.nodes) {
            erroredIds.push(building.id)
            return
        }

        const nodes = []
        for (const nodeId of way.nodes) {
            const node = nodeMap.get(nodeId)
            if (node) {
                nodes.push({ id: node.id, lat: node.lat, lon: node.lon })
            }
        }

        if (nodes.length > 0) {
            output.push({ id: way.id, nodes })
        } else {
            erroredIds.push(building.id)
        }
    })

    return { output, erroredIds }
}

const fetchNodes = async (buildings) => {
    console.log('=== Fetching nodes (optimized batch mode) ===')

    try {
        const buildingIds = buildings.map((b) => b.id)

        const nodeData = await fetchNodesBatch(buildingIds)

        const { output, erroredIds } = processNodes(buildings, nodeData)

        fs.writeFileSync('../data/nodes.json', JSON.stringify(output, null, 2))
        fs.writeFileSync('../data/errors.json', JSON.stringify(erroredIds, null, 2))

        console.log('> Created file: nodes.json')
        console.log(`> Processed ${output.length} buildings successfully`)
        console.log(`> ${erroredIds.length} buildings had errors`)
        console.log('=== Nodes fetch complete ===')
    } catch (err) {
        console.log(` === Error creating nodes file === `)
        console.error(err)
    }
}

const retryErrors = async (maxRetries = 3) => {
    console.log('=== Retrying errored buildings ===')

    try {
        const erroredIds = JSON.parse(fs.readFileSync('../data/errors.json', 'utf-8'))
        const existingNodes = JSON.parse(fs.readFileSync('../data/nodes.json', 'utf-8'))

        if (erroredIds.length === 0) {
            console.log('> No errors to retry!')
            return
        }

        console.log(`> Found ${erroredIds.length} errored buildings to retry`)

        let remainingErrors = [...erroredIds]
        let retryCount = 0

        while (remainingErrors.length > 0 && retryCount < maxRetries) {
            retryCount++
            console.log(`\n> Retry attempt ${retryCount}/${maxRetries} for ${remainingErrors.length} buildings`)

            const buildingsToRetry = remainingErrors.map((id) => ({ id }))
            const nodeData = await fetchNodesBatch(remainingErrors, 20)

            const { output, erroredIds: newErrors } = processNodes(buildingsToRetry, nodeData)

            existingNodes.push(...output)

            console.log(`> Successfully recovered ${output.length} buildings`)
            console.log(`> Still failing: ${newErrors.length} buildings`)

            remainingErrors = newErrors

            if (remainingErrors.length > 0 && retryCount < maxRetries) {
                console.log('> Waiting 3 seconds before next retry...')
                await new Promise((resolve) => setTimeout(resolve, 3000))
            }
        }

        if (!fs.existsSync('../data')) {
            fs.mkdirSync('../data', { recursive: true })
        }

        fs.writeFileSync('../data/nodes.json', JSON.stringify(existingNodes, null, 2))
        fs.writeFileSync('../data/errors.json', JSON.stringify(remainingErrors, null, 2))

        console.log('\n=== Retry complete ===')
        console.log(`> Total buildings in nodes.json: ${existingNodes.length}`)
        console.log(`> Remaining errors: ${remainingErrors.length}`)

        if (remainingErrors.length > 0) {
            console.log('> Some buildings still failed after all retries')
            console.log('> They might be invalid IDs or relation types.')
        }
    } catch (err) {
        console.log('=== Error during retry process ===')
        console.error(err)
    }
}

const fullErrorClear = async () => {
    let errors = JSON.parse(fs.readFileSync('../data/errors.json', 'utf-8'))
    while (errors.length) {
        await retryErrors(1)
        errors = JSON.parse(fs.readFileSync('../data/errors.json', 'utf-8'))
    }

    fs.rmSync('../data/errors.json')
}

export { fetchBuildings, fetchNodes, retryErrors, fullErrorClear }
