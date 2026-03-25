import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"

export const Error = () => {
    const error = useRouteError()
    const navigate = useNavigate()

    const title = isRouteErrorResponse(error)
        ? error.status === 404 ? "Niet gevonden" : "Er ging iets mis"
        : "Onverwachte fout"

    const message = isRouteErrorResponse(error)
        ? error.status === 404 ? "Deze pagina bestaat niet." : error.data
        : "Probeer het later opnieuw."

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 text-center">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
                Ga terug
            </Button>
        </div>
    )
}