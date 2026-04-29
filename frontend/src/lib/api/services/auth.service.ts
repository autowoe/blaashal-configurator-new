import { apiFetchJson } from "@/lib/api/client";
import type { User } from "@/lib/types/user";

export interface LoginResponse {
    detail: string;
    user: User;
}
export type MeResponse = User;
export interface MessageResponse {
    detail: string;
}

export async function fetchCsrf(): Promise<MessageResponse> {
    return apiFetchJson<MessageResponse>("/auth/csrf/");
}

export async function login(params: {
    email: string;
    password: string;
}): Promise<LoginResponse> {
    await fetchCsrf();

    return apiFetchJson<LoginResponse>("/auth/login/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
}

export async function logout(): Promise<MessageResponse> {
    return apiFetchJson<MessageResponse>("/auth/logout/", {
        method: "POST",
    });
}

export async function getMe(): Promise<MeResponse | null> {
    try {
        return await apiFetchJson<MeResponse>("/auth/me/");
    } catch (error) {
        if (error instanceof Response && [401, 403].includes(error.status)) {
            return null;
        }
        throw error;
    }
}