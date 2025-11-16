declare module 'ws' {
  import { EventEmitter } from 'node:events';

  export type RawData = string | Buffer | ArrayBuffer | Buffer[];

  export interface WebSocketServerOptions {
    port?: number;
  }

  export class WebSocket extends EventEmitter {
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;
    readyState: number;
    send(data: string | Buffer | ArrayBuffer | Buffer[], cb?: (err?: Error) => void): void;
    close(code?: number, data?: string): void;
    on(event: 'message', listener: (data: RawData, isBinary: boolean) => void): this;
    on(event: 'open', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  export class WebSocketServer extends EventEmitter {
    constructor(options?: WebSocketServerOptions);
    on(event: 'connection', listener: (socket: WebSocket) => void): this;
  }
}
