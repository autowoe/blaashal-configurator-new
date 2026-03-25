import "@/index.css"

import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { ProjectList, ProjectListLoader } from "@/pages/ProjectList";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/pages/AppLayout";
import { Error } from "./pages/Error";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    handle: { breadcrumb: "Home" },
    children: [
      {
        path: "/projects",
        element: <ProjectList />,
        loader: ProjectListLoader,
        handle: { breadcrumb: "Projecten" },
      },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <TooltipProvider>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </TooltipProvider>
)
