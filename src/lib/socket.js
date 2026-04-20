import { io } from "socket.io-client";
import { tokenStorage } from "@/lib/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";
let socket = null;
export function connectSocket() {
    const token = tokenStorage.getAccess();
    if (socket?.connected)
        return socket;
    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
    });
    socket.on("connect", () => {
        console.log("[Socket] Connected:", socket?.id);
    });
    socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
    });
    socket.on("connect_error", (err) => {
        console.warn("[Socket] Connection error:", err.message);
    });
    return socket;
}
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
export function getSocket() {
    return socket;
}
export function subscribeToProject(projectId) {
    socket?.emit("subscribe:project", { projectId });
}
export function unsubscribeFromProject(projectId) {
    socket?.emit("unsubscribe:project", { projectId });
}
// ── Typed event subscriptions ─────────────────────────────────────────────────
export function onNotification(callback) {
    socket?.on("notification", callback);
    return () => socket?.off("notification", callback);
}
export function onFinanceUpdated(callback) {
    socket?.on("finance.updated", callback);
    return () => socket?.off("finance.updated", callback);
}
export function onTaskStatus(callback) {
    socket?.on("task.status", callback);
    return () => socket?.off("task.status", callback);
}
export function onProjectProgress(callback) {
    socket?.on("project.progress", callback);
    return () => socket?.off("project.progress", callback);
}
export function onInvoiceCreated(callback) {
    socket?.on("invoice.created", callback);
    return () => socket?.off("invoice.created", callback);
}
export function onBudgetAlert(callback) {
    socket?.on("budget.alert", callback);
    return () => socket?.off("budget.alert", callback);
}
