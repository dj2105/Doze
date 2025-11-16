import type { ClientToServerMessage, GameState, PlayerId, ServerToClientMessage } from '@shared/types/game';

type Listener = (state: GameState) => void;
type BannerListener = ServerToClientMessage & { type: 'BANNER' };

export class GameClient {
  private socket?: WebSocket;
  private stateListeners = new Set<Listener>();
  private bannerListeners: ((payload: BannerListener['payload']) => void)[] = [];
  private pendingPromises: Record<string, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = {};
  private messageCounter = 0;

  constructor(private url: string) {}

  async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.socket = new WebSocket(this.url);
    await new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }
      this.socket.onopen = () => resolve();
      this.socket.onerror = (event) => reject(event);
      this.socket.onmessage = (event) => this.handleMessage(event.data);
      this.socket.onclose = () => {
        this.socket = undefined;
      };
    });
  }

  onState(listener: Listener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onBanner(listener: (payload: BannerListener['payload']) => void) {
    this.bannerListeners.push(listener);
    return () => {
      this.bannerListeners = this.bannerListeners.filter((l) => l !== listener);
    };
  }

  createGame(packType: 'placeholder' | 'random' | 'specific', testing: boolean, specificFile?: string) {
    return this.sendWithAck({
      type: 'CREATE_GAME',
      payload: { packType, testing, specificFile }
    });
  }

  joinGame(gameId: string, player: PlayerId) {
    return this.sendWithAck({
      type: 'JOIN_GAME',
      payload: { gameId, player }
    });
  }

  sendQuestion(gameId: string, player: PlayerId) {
    this.send({
      type: 'SEND_QUESTION',
      payload: { gameId, player }
    });
  }

  answerQuestion(gameId: string, player: PlayerId, questionId: string, answer: string) {
    this.send({
      type: 'ANSWER_QUESTION',
      payload: { gameId, player, questionId, answer }
    });
  }

  sync(gameId: string, player: PlayerId) {
    this.send({
      type: 'SYNC_REQUEST',
      payload: { gameId, player }
    });
  }

  private send(message: ClientToServerMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Socket not connected');
    }
    this.socket.send(JSON.stringify(message));
  }

  private async sendWithAck(message: ClientToServerMessage) {
    await this.connect();
    const id = `${Date.now()}-${++this.messageCounter}`;
    const promise = new Promise((resolve, reject) => {
      this.pendingPromises[id] = { resolve, reject };
      setTimeout(() => {
        if (this.pendingPromises[id]) {
          this.pendingPromises[id].reject(new Error('Request timed out'));
          delete this.pendingPromises[id];
        }
      }, 5000);
    });
    this.send({ ...message, payload: { ...message.payload, _requestId: id } } as ClientToServerMessage & {
      payload: Record<string, unknown> & { _requestId: string };
    });
    return promise;
  }

  private handleMessage(raw: string) {
    const message = JSON.parse(raw) as ServerToClientMessage & { payload?: { _requestId?: string } };

    if (message.payload?._requestId) {
      const key = message.payload._requestId;
      const pending = this.pendingPromises[key];
      if (pending) {
        pending.resolve(message.payload);
        delete this.pendingPromises[key];
      }
    }

    switch (message.type) {
      case 'GAME_CREATED':
      case 'GAME_JOINED':
      case 'STATE_UPDATE':
        this.stateListeners.forEach((listener) => listener(message.payload.state));
        break;
      case 'BANNER':
        this.bannerListeners.forEach((listener) => listener(message.payload));
        break;
      case 'ERROR':
        console.error(message.payload.message);
        break;
    }
  }
}

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001';
export const gameClient = new GameClient(WS_URL);
