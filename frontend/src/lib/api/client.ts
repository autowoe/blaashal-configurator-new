const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(";").shift() ?? null;
    }
    return null;
}

type ApiFetchOptions = RequestInit & {
    headers?: HeadersInit;
};

export async function apiFetch(
    path: string,
    options: ApiFetchOptions = {}
): Promise<Response> {
    const method = (options.method ?? "GET").toUpperCase();

    const headers = new Headers(options.headers ?? {});
    headers.set("Accept", "application/json");

    const hasBody = options.body != null;
    if (hasBody && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const isUnsafeMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (isUnsafeMethod) {
        const csrfToken = getCookie("csrftoken");
        if (csrfToken) {
            headers.set("X-CSRFToken", csrfToken);
        }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        method,
        headers,
        credentials: "include",
    });

    return response;
}

export async function apiFetchJson<T>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const response = await apiFetch(path, options);

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    const data: unknown = isJson ? await response.json() : null;

    if (!response.ok) {
        const errorMessage =
            typeof data === "object" &&
                data !== null &&
                "detail" in data &&
                typeof (data as { detail?: unknown }).detail === "string"
                ? (data as { detail: string }).detail
                : "Request failed";

        throw new Response(errorMessage, { status: response.status });
    }

    return data as T;
}