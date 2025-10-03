import inquirer from 'inquirer'

const CITY_IDS = {
    tbilisi: 1996871,
    rustavi: 5997314,
    kutaisi: 8742174,
    mtskheta: 8374155,
    borjomi: 17409709,
    zugdidi: 8374200,
    telavi: 8374133,
    akhalkalaki: 16929994,
    surami: 17639369,
    tsnori: 18377596,
    dmanisi: 17403257,
    sighnaghi: 16768135,
}
/**
 * Logs out interactive city select menu
 * @returns {Object: {city: String, cityId: Number}} - City name and its OSM ID
*/
const selectCity = async () => {
    const cities = Object.keys(CITY_IDS).map((city) => ({
        name: city.charAt(0).toUpperCase() + city.slice(1),
        value: city,
    }))

    const answer = await inquirer.prompt([
        {
            type: 'list',
            name: 'city',
            message: 'Select a city:',
            choices: cities,
            loop: false,
        },
    ])

    const selectedCity = answer.city
    const cityId = CITY_IDS[selectedCity]

    console.log(`\nYou selected: ${selectedCity}`)

    return { city: selectedCity, id: cityId }
}

export { selectCity }