import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { API_CONFIG } from "../config/api";
import type { User, AuthResponse, Product, ApiError } from "../types/api";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: "/",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized error
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>(API_CONFIG.AUTH.LOGIN, {
      identifier,
      password,
    });
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    return response.data;
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    address: string;
    password: string;
    otp: string;
  }): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>(
      API_CONFIG.AUTH.REGISTER,
      data
    );
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    return response.data;
  }

  async sendRegistrationOtp(
    email: string
  ): Promise<{ message: string; email: string }> {
    const response = await this.api.post<{ message: string; email: string }>(
      API_CONFIG.AUTH.SEND_OTP,
      { email }
    );
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post(API_CONFIG.AUTH.LOGOUT);
    localStorage.removeItem("token");
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    await this.api.post("/api/auth/reset-password", {
      email,
      otp,
      newPassword,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await this.api.post("/api/auth/forgot-password", { email });
  }

  // Product APIs
  async getProducts(): Promise<Product[]> {
    const response = await this.api.get<Product[]>(API_CONFIG.PRODUCTS.LIST);
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.api.get<Product>(
      API_CONFIG.PRODUCTS.DETAIL(id)
    );
    return response.data;
  }

  async createProduct(
    data: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> {
    const response = await this.api.post<Product>(
      API_CONFIG.PRODUCTS.CREATE,
      data
    );
    return response.data;
  }

  async updateProduct(
    id: string,
    data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
  ): Promise<Product> {
    const response = await this.api.put<Product>(
      API_CONFIG.PRODUCTS.UPDATE(id),
      data
    );
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.api.delete(API_CONFIG.PRODUCTS.DELETE(id));
  }

  // Gateway APIs
  async checkHealth(): Promise<{ status: string }> {
    const response = await this.api.get<{ status: string }>(
      API_CONFIG.GATEWAY.HEALTH
    );
    return response.data;
  }
}

export const apiService = new ApiService();
