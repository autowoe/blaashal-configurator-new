import type { Dashboard as DashboardType } from "@/lib/types/generic"
import { useLoaderData, useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { statusConfig } from "@/components/tables/projects/status-config"
import { RiFolderLine, RiCheckLine, RiTimeLine, RiArchiveLine } from "@remixicon/react"

export const Dashboard = () => {
    const dashboard = useLoaderData() as DashboardType
    const navigate = useNavigate()

    const stats = [
        { label: "Totaal projecten", value: dashboard.project_count, icon: RiFolderLine },
        { label: "Geaccepteerd", value: dashboard.accepted_count, icon: RiCheckLine },
        { label: "In behandeling", value: dashboard.pending_count, icon: RiTimeLine },
        { label: "Afgerond", value: dashboard.done_count, icon: RiArchiveLine },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon }) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {label}
                            </CardTitle>
                            <Icon className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <span className="text-3xl font-bold">{value}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recente projecten</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead>Organisatie</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dashboard.recent_projects.map((project) => (
                                <TableRow
                                    key={project.id}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                >
                                    <TableCell className="font-medium">{project.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {project.organization.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={statusConfig[project.status].variant}
                                            className={statusConfig[project.status].className}
                                        >
                                            {statusConfig[project.status].label}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}