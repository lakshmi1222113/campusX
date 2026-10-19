
import { apiRequest } from "./api";

export function getListings({ search = "", categoryId = "" } = {}) {
  const params = new URLSearchParams();

  if (search.trim()) params.set("search", search.trim());
  if (categoryId) params.set("categoryId", categoryId);

  return apiRequest(`/listings?${params.toString()}`);
}

export function getListingById(id) {
  return apiRequest(`/listings/${id}`);
}

export function createListing(listingData) {
  // Use FormData when the user selects an image file.
  if (listingData.imageFile) {
    const formData = new FormData();

    formData.append("title", listingData.title);
    formData.append("description", listingData.description);
    formData.append("price", String(listingData.price));
    formData.append("condition", listingData.condition);
    formData.append("categoryId", listingData.categoryId);
    formData.append("image", listingData.imageFile);

    return apiRequest("/listings", {
      method: "POST",
      body: formData,
    });
  }

  // Preserve the existing JSON-based listing creation flow.
  return apiRequest("/listings", {
    method: "POST",
    body: JSON.stringify(listingData),
  });
}
