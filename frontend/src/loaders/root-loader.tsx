import { redirect, type LoaderFunctionArgs } from "react-router"

import { getMe } from "@/lib/api/services/auth.service";
import { getProjects } from "@/lib/api/services/projects.service";

export interface RootLoaderData {
    projects: Awaited<ReturnType<typeof getProjects>>["results"];
}

export const RootLoader = async ({ request }: LoaderFunctionArgs) => {
    const me = await getMe()
    console.log(me)
    if (!me) {
        const url = new URL(request.url)
        if (url.pathname !== "/") {
            throw redirect("/?reason=session_expired");
        }
    }

    const data = await getProjects({
        page: 1,
        pageSize: 10,
        ordering: "name",
    });

    return {
        projects: data.results,
    };
}