/**
 * Cliente Socket.IO singleton. Mantém uma conexão única para o app inteiro,
 * com gerenciamento de salas e canais pessoais.
 *
 * Por que singleton?
 *   - Telas montam/desmontam várias vezes; criar/fechar conexão a cada vez
 *     causa thrashing e atrasos visíveis no primeiro carregamento da sala.
 *   - O badge global de não lidas depende do canal pessoal estar sempre
 *     conectado em background, mesmo sem tela de chat aberta.
 *
 * Uso:
 *   import { chatSocket } from "@/lib/chatSocket";
 *   chatSocket.connect();
 *   chatSocket.joinComoCliente(usuarioId);
 *   chatSocket.joinPedido(pedidoId);
 *   chatSocket.on("mensagem:nova", (m) => ...);
 *   chatSocket.off("mensagem:nova", handler);
 */

import { io, Socket } from "socket.io-client";

const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) || "http://localhost:3001";

class ChatSocketManager {
  private socket: Socket | null = null;
  private salasAtivas = new Set<number>();
  private canaisPessoais: { tipo: "cliente" | "feirante"; id: string }[] = [];

  /** Garante uma conexão; idempotente. */
  connect() {
    if (this.socket?.connected) return;
    if (this.socket) {
      this.socket.connect();
      return;
    }
    this.socket = io(API_BASE, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    // Reentra em todas as salas/canais ao reconectar.
    this.socket.on("connect", () => {
      console.log("[chatSocket] conectado:", this.socket?.id);
      this.salasAtivas.forEach((id) =>
        this.socket?.emit("join:pedido", id),
      );
      this.canaisPessoais.forEach((c) =>
        this.socket?.emit(`join:${c.tipo}`, c.id),
      );
    });
    this.socket.on("disconnect", (reason) => {
      console.log("[chatSocket] desconectado:", reason);
    });
    this.socket.on("connect_error", (err) => {
      console.warn("[chatSocket] erro de conexão:", err.message);
    });
  }

  /** Fecha conexão (use no logout). */
  disconnect() {
    this.salasAtivas.clear();
    this.canaisPessoais = [];
    this.socket?.disconnect();
    this.socket = null;
  }

  joinPedido(pedidoId: number) {
    this.connect();
    this.salasAtivas.add(pedidoId);
    this.socket?.emit("join:pedido", pedidoId);
  }

  leavePedido(pedidoId: number) {
    this.salasAtivas.delete(pedidoId);
    this.socket?.emit("leave:pedido", pedidoId);
  }

  joinComoCliente(usuarioId: string) {
    this.connect();
    // Substitui canal existente — usuário só pode ser um por vez.
    this.canaisPessoais = this.canaisPessoais.filter((c) => c.tipo !== "cliente");
    this.canaisPessoais.push({ tipo: "cliente", id: usuarioId });
    this.socket?.emit("join:cliente", usuarioId);
  }

  joinComoFeirante(feiranteId: number | string) {
    this.connect();
    this.canaisPessoais = this.canaisPessoais.filter((c) => c.tipo !== "feirante");
    this.canaisPessoais.push({ tipo: "feirante", id: String(feiranteId) });
    this.socket?.emit("join:feirante", feiranteId);
  }

  on(evento: string, handler: (...args: any[]) => void) {
    this.connect();
    this.socket?.on(evento, handler);
  }

  off(evento: string, handler: (...args: any[]) => void) {
    this.socket?.off(evento, handler);
  }
}

export const chatSocket = new ChatSocketManager();
