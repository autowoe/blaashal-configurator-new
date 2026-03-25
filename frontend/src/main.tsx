import "@/index.css"

import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { ProjectList } from "@/pages/ProjectList";
import { ProjectListLoader } from "@/loaders/project-list-loader";
import { RootLoader } from "@/loaders/root-loader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/pages/AppLayout";
import { Error } from "./pages/Error";

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    handle: { breadcrumb: "Home" },
    loader: RootLoader,
    children: [
      {
        id: "projects",
        path: "/projects",
        loader: ProjectListLoader,
        element: <ProjectList />,
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
