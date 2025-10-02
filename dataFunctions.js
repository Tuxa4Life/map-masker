import fs from 'fs'

const buildings = JSON.parse(fs.readFileSync('./data/buildings.json', 'utf-8'))

const getCorners = (arr, mathFunc, type) => {
    let output = arr[0].center[type]
    for (let i = 0; i < arr.length; i++) {
        output = mathFunc(output, arr[i].center[type])
    }

    return output
}

export { buildings, getCorners }