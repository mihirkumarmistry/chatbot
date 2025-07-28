import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChatWebsocketService {
    private socket!: WebSocket;
    private messageSubject = new Subject<string>();

    connect(): void {
        this.socket = new WebSocket('ws://127.0.0.1:8765');

        this.socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.messageSubject.next(data.message);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }

    sendMessage(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ "message": message }));
        } else {
            console.warn('WebSocket is not open');
        }
    }

    getMessages(): Observable<string> {
        return this.messageSubject.asObservable();
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
        }
    }
}
