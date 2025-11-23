import axios from "axios";
//just for testing purpose
const Axios = axios.create({
  //   baseURL: "http://localhost:5000/api/v1",
  //   baseURL:"https://jadibotti-backend.vercel.app/api/v1",
  baseURL: "http://localhost:5000/api",

  withCredentials: true,
});

export default Axios;