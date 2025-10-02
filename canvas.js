import { createCanvas } from 'canvas'
import { buildings, getCorners } from './dataFunctions.js'
import fs from 'fs'

const height = 8640
const width = 15360
const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')

ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)

const minLon = getCorners(buildings, Math.min, 'lon')
const maxLat = getCorners(buildings, Math.max, 'lat')

const scaleX = width / (getCorners(buildings, Math.max, 'lon') - minLon)
const scaleY = height / (maxLat - getCorners(buildings, Math.min, 'lat'))
const scale = Math.min(scaleX, scaleY)

const drawBuilding = (nodes) => {
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

const drawBuildings = () => {
    console.log(' === Creating file === ')

    const buildings = JSON.parse(fs.readFileSync('./data/nodes.json', 'utf-8'))
    buildings.forEach(building => drawBuilding(building.nodes))
}


drawBuildings()
fs.writeFileSync('./outputs/Buildings.png', canvas.toBuffer('image/png'))
console.log(' === File created === ')