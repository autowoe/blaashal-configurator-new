import { redirect } from "react-router";
import { getMe } from "@/lib/api/services/auth.service";

export async function LoginLoader() {
    try {
        const user = await getMe();
        if (user) {
            return redirect("/dashboard");
        }
    } catch { return null }

    return null;
}