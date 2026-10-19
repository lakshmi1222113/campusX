import { apiRequest } from "./api";

export function getWantedItems() {
  return apiRequest("/wanted-items");
}

export function createWantedItem(itemData, token) {
  return apiRequest("/wanted-items", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(itemData),
  });
}

export function updateWantedItem(itemId, itemData, token) {
  return apiRequest(`/wanted-items/${itemId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(itemData),
  });
}

export function deleteWantedItem(itemId, token) {
  return apiRequest(`/wanted-items/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
