import "@/index.css"

import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router";

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
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { DashboardLoader } from "@/loaders/dashboard-loader";
import { LoginLoader } from "@/loaders/login-loader";
import type { ComponentPrice, ConfigurationType, ExistingConfiguration } from "@/lib/types/configuration";
import { ThemedToastContainer } from "@/components/themed-toast-container";
import { OrganizationList } from "@/pages/OrganizationList";
import { OrganizationListLoader } from "@/loaders/organization-list-loader";
import { ReferenceImages } from "@/pages/ReferenceImages";
import { ReferenceImagesLoader } from "@/loaders/reference-images-loader";
import { Kennisbank } from "@/pages/Kennisbank";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
    errorElement: <Error />,
    loader: LoginLoader
  },
  {
    id: "root",
    loader: RootLoader,
    shouldRevalidate: () => true,
    element: <AppLayout />,
    errorElement: <Error />,
    children: [
      {
        id: "dashboard",
        path: "/dashboard",
        handle: { breadcrumb: "Dashboard" },
        loader: DashboardLoader,
        element: <Dashboard />,
      },
      {
        id: "organizations",
        path: "/organizations",
        handle: { breadcrumb: "Organisaties" },
        loader: OrganizationListLoader,
        element: <OrganizationList />,
      },
      {
        id: "reference_images",
        path: "/reference-images",
        handle: { breadcrumb: "Referentie afbeeldingen" },
        loader: ReferenceImagesLoader,
        element: <ReferenceImages />,
      },
      {
        id: "kennisbank",
        path: "/kennisbank",
        handle: { breadcrumb: "Kennisbank" },
        element: <Kennisbank />,
      },
      {
        id: "projects_parent",
        path: "/projects",
        handle: { breadcrumb: "Projecten" },
        children: [
          {
            index: true,
            id: "project_list",
            loader: ProjectListLoader,
            element: <ProjectList />,
          },
          {
            id: "project_detail",
            path: ":id",
            loader: ProjectDetailLoader,
            element: <ProjectDetail />,
            handle: {
              breadcrumb: (data: {
                project: Project
                types: ConfigurationType[]
                components: ComponentPrice[]
                existingConfig: ExistingConfiguration | null
                activeTypeId: string | null
              }) => data.project.name,
            },
          },
        ],
      },
    ],
  },
])


createRoot(document.getElementById("root")!).render(
  <TooltipProvider>
    <ThemeProvider>
      <ThemedToastContainer />
      <RouterProvider router={router} />
    </ThemeProvider>
  </TooltipProvider>
)
