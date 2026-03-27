import { ToastContainer } from "react-toastify";
import { useTheme } from "@/components/theme-provider";

export function ThemedToastContainer() {
    const { theme } = useTheme();

    return (
        <ToastContainer
            position="top-right"
            theme={theme === "dark" ? "dark" : "light"}
        />
    );
}