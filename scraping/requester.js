import axios from 'axios'

export const makeRequest = async (url) => {
    await new Promise((res) => setTimeout(res, 5000))
    let response;
    try {
        response = await axios.get(url)
    }
    catch (error) {
        console.error("Could not make request", error.toJSON())
        throw new Error("Could not make request")
    }
    return response
}