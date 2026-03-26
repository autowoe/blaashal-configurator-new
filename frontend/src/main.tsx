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
import { Error } from "@/pages/Error";
import { ProjectDetailLoader } from "@/loaders/project-detail-loader";
import type { Project } from "@/lib/types/project";
import { ProjectDetail } from "@/pages/ProjectDetail";

const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    handle: { breadcrumb: "Dashboard" },
    loader: RootLoader,
    children: [
      {
        id: "projects_parent",
        path: "/projects",
        handle: { breadcrumb: "Projecten" },
        children: [
          {
            index: true,
            loader: ProjectListLoader,
            element: <ProjectList />,
          },
          {
            id: "project_detail",
            path: ":id",
            loader: ProjectDetailLoader,
            element: <ProjectDetail />,
            handle: { breadcrumb: (data: Project) => data.name }
          }
        ]
      }
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
