import axios from "axios"

const axiosClient = axios.create({
    baseURL:'https://ciaan-backend-atrr.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default axiosClient;
