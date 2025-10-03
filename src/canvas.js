import { createCanvas } from 'canvas'
import fs from 'fs/promises'
import path from 'path'

const CANVAS_WIDTH = 15360
const CANVAS_HEIGHT = 8640
const OUTPUT_DIR = '../output'
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Map.png')

/**
 * Calculates bounding box from building geometries
 * @param {Array} buildings - Array of building objects with nodes
 * @returns {Object} Bounding box {minLon, maxLon, minLat, maxLat}
 */
const getBoundingBox = (buildings) => {
    let minLon = Infinity, maxLon = -Infinity
    let minLat = Infinity, maxLat = -Infinity

    for (const building of buildings) {
        for (const node of building.nodes) {
            minLon = Math.min(minLon, node.lon)
            maxLon = Math.max(maxLon, node.lon)
            minLat = Math.min(minLat, node.lat)
            maxLat = Math.max(maxLat, node.lat)
        }
    }

    return { minLon, maxLon, minLat, maxLat }
}

/**
 * Draws a single building polygon on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} nodes - Building geometry nodes
 * @param {number} minLon - Minimum longitude
 * @param {number} maxLat - Maximum latitude
 * @param {number} scale - Scale factor
 */
const drawBuilding = (ctx, nodes, minLon, maxLat, scale) => {
    if (!nodes || nodes.length === 0) return

    ctx.beginPath()
    
    const firstNode = nodes[0]
    ctx.moveTo((firstNode.lon - minLon) * scale, (maxLat - firstNode.lat) * scale)

    for (let i = 1; i < nodes.length; i++) {
        const x = (nodes[i].lon - minLon) * scale
        const y = (maxLat - nodes[i].lat) * scale
        ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fill()
}

/**
 * Generates a city map image from building data
 * @param {Array} buildings - Array of buildings from fetchAndProcessBuildings
 * @returns {Promise<void>}
 */
const generateCityImage = async (buildings) => {
    if (!buildings || buildings.length === 0) {
        console.warn('=== No buildings to render ===')
        return
    }

    console.log(`=== Creating image from ${buildings.length} buildings ===`)

    const { minLon, maxLon, minLat, maxLat } = getBoundingBox(buildings)

    const scaleX = CANVAS_WIDTH / (maxLon - minLon)
    const scaleY = CANVAS_HEIGHT / (maxLat - minLat)
    const scale = Math.min(scaleX, scaleY)

    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = 'black'
    buildings.forEach(building => {
        drawBuilding(ctx, building.nodes, minLon, maxLat, scale)
    })

    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    await fs.writeFile(OUTPUT_FILE, canvas.toBuffer('image/png'))
    
    console.log(`=== Image saved to ${OUTPUT_FILE} ===`)
}

export { generateCityImage }