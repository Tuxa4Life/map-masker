import axios from 'axios'
import inquirer from 'inquirer'
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt'

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt)

/**
 * Fetches country names and their alpha-2 codes
 * @returns {Object: {country: alpha2_code }} - Country name and its Alpha 2 Code
 */
const fetchCountries = async () => {
    try {
        const res = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2')

        const countryCodes = {}
        res.data.forEach((c) => {
            countryCodes[c.name.common.toLowerCase()] = c.cca2
        })

        return countryCodes
    } catch (err) {
        console.error(`=== Error fetching countries. Error code: ${err.status}`)
        return {}
    }
}

/**
 * Fetches major cities and their OSM relation IDs for a given country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'GE', 'US', 'FR')
 * @param {number} minPopulation - Minimum population threshold (default: 1000)
 * @returns {Promise<Object>} Object mapping city names to city data {name, nameLocal, id, population}
 */
const fetchCities = async (countryCode, minPopulation = 1000) => {
    console.log(`=== Fetching cities for country: ${countryCode} ===`)
    const getEnglishName = (tags) => tags['name:en'] || tags['int_name'] || tags['name:latin'] || tags['official_name:en'] || tags['name']

    const query = `
        [out:json][timeout:60];
        area["ISO3166-1"="${countryCode}"]->.country;
        (
            relation["place"~"city|town"]["population"](area.country);
        );
        out tags;
    `

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query, { headers: { 'Content-Type': 'text/plain' } })

        const cities = response.data.elements
            .filter((e) => {
                const pop = parseInt(e.tags?.population || 0)
                return pop >= minPopulation && e.tags?.name
            })
            .map((e) => ({
                name: getEnglishName(e.tags),
                nameLocal: e.tags.name,
                id: e.id,
                population: parseInt(e.tags.population || 0),
                type: e.type,
            }))
            .sort((a, b) => b.population - a.population)

        console.log(`> Found ${cities.length} cities`)
        
        const cityMap = {}
        cities.forEach((city) => {
            cityMap[city.name.toLowerCase()] = city
        })
        
        return cityMap
    } catch (err) {
        console.error(`=== Error fetching cities: ${err.message} ===`)
        return {}
    }
}

/**
 * Logs out interactive country select menu
 * @returns {String: "Country Code"} - Country's alpha-2 code
 */
const selectCountry = async () => {
    const countries = await fetchCountries()
    const choiceCountries = Object.keys(countries).map((country) => ({
        name: country.charAt(0).toUpperCase() + country.slice(1),
        value: countries[country],
    }))

    const answer = await inquirer.prompt([
        {
            type: 'autocomplete',
            name: 'country',
            message: 'Type to search for a country:',
            source: async (_answersSoFar, input) => {
                input = input || ''
                return choiceCountries.filter((c) => c.name.toLowerCase().includes(input.toLowerCase()))
            },
        },
    ])

    return answer.country
}

/**
 * Logs out interactive city select menu
 * @returns {Object: {city: String, cityId: Number}} - City name and its OSM ID
 */
const selectCity = async () => {
    const selectedCountryCode = await selectCountry()
    const city_ids = await fetchCities(selectedCountryCode)

    const cities = Object.keys(city_ids).map((cityKey) => ({
        name: city_ids[cityKey].name,
        value: cityKey,
    }))

    const answer = await inquirer.prompt([
        {
            type: 'autocomplete',
            name: 'city',
            message: 'Type to search for a city:',
            source: async (_answersSoFar, input) => {
                input = input || ''
                return cities.filter((c) => c.name.toLowerCase().includes(input.toLowerCase()))
            },
        },
    ])

    const selectedCity = answer.city
    const cityData = city_ids[selectedCity]

    return { city: cityData.name, id: cityData.id }
}

export { selectCity }