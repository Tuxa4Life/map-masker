import { createCanvas } from 'canvas'
import { buildings, getCorners } from './dataFunctions.js'
import fs from 'fs'

const height = 8640
const width = 15360
const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')

ctx.fillStyle = 'white'
ctx.fillRect(0, 0, width, height)

const minLon = getCorners(buildings, Math.min, 'lon');
const maxLat = getCorners(buildings, Math.max, 'lat');

const scaleX = width / (getCorners(buildings, Math.max, 'lon') - minLon)
const scaleY = height / (maxLat - getCorners(buildings, Math.min, 'lat'))
const scale = Math.min(scaleX, scaleY)

const drawCircle = (lon, lat, radius) => {
    const x = (lon - minLon) * scale;
    const y = (maxLat - lat) * scale;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
}

buildings.forEach(building => {
    const { lon, lat } = building.center
    drawCircle(lon, lat, 1)
})

fs.writeFileSync('Points.png', canvas.toBuffer('image/png'))
console.log(' === File created === ')