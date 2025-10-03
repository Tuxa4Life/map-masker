import { createCanvas } from 'canvas'
import fs from 'fs'

const height = 8640
const width = 15360
const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')

ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)

const getCoordinateCorners = (arr, mathFunc, type) => {
    let output = arr[0].center[type]
    for (let i = 0; i < arr.length; i++) {
        output = mathFunc(output, arr[i].center[type])
    }

    return output
}

const drawBuilding = (nodes, minLon, maxLat, scale) => {
    ctx.beginPath()
    ctx.moveTo((nodes[0].lon - minLon) * scale, (maxLat - nodes[0].lat) * scale)

    nodes.forEach((node) => {
        const { lon, lat } = node
        const x = (lon - minLon) * scale
        const y = (maxLat - lat) * scale

        ctx.lineTo(x, y)
    })
    ctx.closePath()

    ctx.fillStyle = 'black'
    ctx.fill()
}

const generateCityImage = (buildings, nodes) => {
    const minLon = getCoordinateCorners(buildings, Math.min, 'lon')
    const maxLat = getCoordinateCorners(buildings, Math.max, 'lat')

    const scaleX = width / (getCoordinateCorners(buildings, Math.max, 'lon') - minLon)
    const scaleY = height / (maxLat - getCoordinateCorners(buildings, Math.min, 'lat'))
    const scale = Math.min(scaleX, scaleY)

    console.log(' === Creating image === ')
    nodes.forEach((building) => drawBuilding(building.nodes, minLon, maxLat, scale))

    if (!fs.existsSync('../output')) {
        fs.mkdirSync('../output', { recursive: true })
    }
    fs.writeFileSync('../output/Buildings.png', canvas.toBuffer('image/png'))
    console.log(' === File created === ')
}

export { generateCityImage }
