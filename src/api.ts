export interface Listing {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  seller: string;
  location?: string;
  isSold?: boolean;
  ownerId?: number;
  purchaseStatus?: 'pending' | 'confirmed' | 'cancelled' | null;
  purchaseBuyerId?: number | null;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  created_at?: string;
  items_sold_count?: number;
  average_rating?: number;
  rating_count?: string | number;
  location?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Array<{ path: string; msg: string; value?: any }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorBody: string;
    let errorData: any;
    try {
      errorBody = await response.text();
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { error: errorBody || `Request to ${path} failed with status ${response.status}` };
    }
    
    const errorMessage = errorData.error || errorData.message || 'Request failed';
    const details = errorData.details || [];
    throw new ApiError(errorMessage, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getListings(params?: {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  includeSold?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.q) queryParams.append('q', params.q);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params?.location) queryParams.append('location', params.location);
  if (params?.includeSold !== undefined) queryParams.append('includeSold', params.includeSold.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  const query = queryParams.toString();
  return request<Listing[]>(`/listings${query ? `?${query}` : ''}`);
}

export function createListing(payload: {
  title: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  seller?: string;
}) {
  return request<Listing>('/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateListing(id: number, payload: {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  image?: string;
  location?: string;
}) {
  return request<Listing>(`/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteListing(id: number) {
  return request<void>(`/listings/${id}`, { method: 'DELETE' });
}

export function getWishlist() {
  return request<number[]>('/wishlist');
}

export function addToWishlist(listingId: number) {
  return request<void>(`/wishlist/${listingId}`, { method: 'POST' });
}

export function removeFromWishlist(listingId: number) {
  return request<void>(`/wishlist/${listingId}`, { method: 'DELETE' });
}

export interface Purchase {
  id: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedAt?: string;
  listing: Listing;
  sellerName?: string;
  sellerEmail?: string;
}

export interface UserSearchResult {
  id: number;
  email: string;
  name?: string;
}

export function markListingSold(listingId: number, buyerId: number) {
  return request<{ listing: Listing; purchase: Purchase; message: string }>(`/listings/${listingId}/mark-sold`, {
    method: 'POST',
    body: JSON.stringify({ buyer_id: buyerId }),
  });
}

export function getPurchases() {
  return request<Purchase[]>('/purchases');
}

export function confirmPurchase(purchaseId: number, rating: number) {
  return request<{ message: string }>(`/purchases/${purchaseId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });
}

export function cancelPurchase(purchaseId: number) {
  return request<{ message: string }>(`/purchases/${purchaseId}/cancel`, {
    method: 'POST',
  });
}

export function searchUsers(query: string) {
  return request<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`);
}

export function contactSeller(listingId: number) {
  return request<{ listingId: number; sellerId: number; sellerEmail: string; mailto: string }>(
    `/listings/${listingId}/contact`,
    { method: 'POST' }
  );
}

export function getUser(userId: number) {
  return request<User>(`/users/${userId}`);
}

export function getUserListings(userId: number, sold?: boolean) {
  const query = sold !== undefined ? `?sold=${sold}` : '';
  return request<Listing[]>(`/users/${userId}/listings${query}`);
}

export function rateUser(userId: number, listingId: number, rating: number, comment?: string) {
  return request<{ userId: number; average_rating: number; rating_count: string | number; items_sold_count: number }>(
    `/users/${userId}/ratings`,
    {
      method: 'POST',
      body: JSON.stringify({ rating, listing_id: listingId, comment }),
    }
  );
}

export function updateUserProfile(userId: number, updates: { location?: string; name?: string }) {
  return request<User>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function signup(payload: { email: string; password: string; name?: string }) {
  return request<User>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
}

export function login(payload: { email: string; password: string }) {
  return request<User>('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' });
}

export function me() {
  return request<User>('/auth/me');
}

