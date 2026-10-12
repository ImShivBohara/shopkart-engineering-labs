const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

export const registerCustomer = async (customerData) => {
  const response = await fetch(`${API_URL}/customers/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(customerData)
  });
  return response;
};

export const loginCustomer = async (credentials) => {
  const response = await fetch(`${API_URL}/customers/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });
  return response;
};

export const getCurrentCustomer = async () => {
  const response = await fetch(`${API_URL}/customers/me`, {
    method: "GET",
    credentials: "include"
  });
  return response;
};

export const logoutCustomer = async () => {
  const response = await fetch(`${API_URL}/customers/logout`, {
    method: "POST",
    credentials: "include"
  });
  return response;
};

export const getProducts = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_URL}/products${queryString}`, {
    method: "GET"
  });
  return response;
};

export const getProductById = async (id) => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "GET"
  });
  return response;
};

export const getCategories = async () => {
  const response = await fetch(`${API_URL}/products/categories`, {
    method: "GET"
  });
  return response;
};

export const addToWishlist = async (productId) => {
  const response = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: "POST",
    credentials: "include"
  });
  return response;
};

export const getWishlist = async () => {
  const response = await fetch(`${API_URL}/wishlist`, {
    method: "GET",
    credentials: "include"
  });
  return response;
};

export const removeFromWishlist = async (productId) => {
  const response = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: "DELETE",
    credentials: "include"
  });
  return response;
};

export const addToCart = async (productId) => {
  const response = await fetch(`${API_URL}/cart/${productId}`, {
    method: "POST",
    credentials: "include"
  });
  return response;
};

export const getCart = async () => {
  const response = await fetch(`${API_URL}/cart`, {
    method: "GET",
    credentials: "include"
  });
  return response;
};

export const updateCartQuantity = async (productId, quantity) => {
  const response = await fetch(`${API_URL}/cart/${productId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ quantity })
  });
  return response;
};

export const removeFromCart = async (productId) => {
  const response = await fetch(`${API_URL}/cart/${productId}`, {
    method: "DELETE",
    credentials: "include"
  });
  return response;
};

export const createPaymentOrder = async (shippingAddress) => {
  const response = await fetch(`${API_URL}/orders/create-payment-order`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ shippingAddress })
  });
  return response;
};

export const verifyPayment = async (paymentData) => {
  const response = await fetch(`${API_URL}/orders/verify-payment`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(paymentData)
  });
  return response;
};

export const getOrders = async () => {
  const response = await fetch(`${API_URL}/orders`, {
    method: "GET",
    credentials: "include"
  });
  return response;
};

export const getOrderById = async (orderId) => {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "GET",
    credentials: "include"
  });
  return response;
};


