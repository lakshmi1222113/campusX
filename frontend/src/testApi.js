import { apiRequest } from "./services/api";

apiRequest("/health")
  .then((data) => {
    console.log("CampusX API connected:", data);
  })
  .catch((error) => {
    console.error("API connection failed:", error.message);
  });
