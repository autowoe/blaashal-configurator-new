import { NavLink, Outlet } from "react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@base-ui/react"
import { useBreadcrumbs } from "@/hooks/use-breadcrumb"

export const AppLayout = () => {
    const breadcrumbs = useBreadcrumbs()

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbs.map((match, i) => {
                                    const isLast = i === breadcrumbs.length - 1
                                    const label = (match.handle as any).breadcrumb
                                    console.log(label)
                                    console.log(match.pathname)

                                    return (
                                        <BreadcrumbItem key={match.id}>
                                            {isLast ? (
                                                <BreadcrumbPage>{label}</BreadcrumbPage>
                                            ) : (
                                                <>
                                                    <NavLink
                                                        to={match.pathname}
                                                        className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        {label}
                                                    </NavLink>
                                                    <BreadcrumbSeparator />
                                                </>
                                            )}
                                        </BreadcrumbItem>
                                    )
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </header>
                    <main className="flex-1 p-6 overflow-y-auto">
                        <Outlet />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}