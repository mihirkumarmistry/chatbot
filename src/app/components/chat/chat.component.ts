import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatWebsocketService } from '../../services/chat-websocket.service';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  // Signals for reactive state management
  messages = signal<Message[]>([]);
  isTyping = signal(false);
  isOnline = signal(true);
  isRecording = signal(false);
  isDarkTheme = signal(false);

  currentMessage = '';

  quickSuggestions = [
    'How can you help me?',
    'What time is check-in?',
    'Can I cancel my reservation for free?',
    'Do you allow pets?',
    'Is parking available?',
    'How much is the security deposit?',
  ];

  // Computed properties
  messageCount = computed(() => this.messages().length - 1);

  constructor(private websocket: ChatWebsocketService) { }

  ngOnInit() {
    this.websocket.connect();

    this.websocket.getMessages().subscribe(botReply => {
      this.isTyping.set(false);
      this.messages.update(messages => {
        const filtered = messages.filter(m => !m.isTyping);
        return [...filtered, {
          id: this.generateId(),
          content: botReply,
          isUser: false,
          timestamp: new Date()
        }];
      });

      this.scrollToBottom();
    });

    this.addWelcomeMessage();
    this.simulateOnlineStatus();
  }

  addWelcomeMessage() {
    const welcomeMessages = [
      'Hello! I\'m your AI assistant. I\'m here to help with questions, creative projects, coding, or just to have a great conversation! What can I do for you today? 🤖',
      'Hi there! Welcome to our chat. I\'m ready to assist you with a wide variety of topics. Whether you need help, want to learn something new, or just feel like chatting, I\'m all ears! What\'s on your mind?',
      'Greetings! I\'m excited to meet you. I can help with everything from answering questions and explaining concepts to creative writing and problem-solving. How can I make your day better?'
    ];

    const welcomeMessage: Message = {
      id: this.generateId(),
      content: welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)],
      isUser: false,
      timestamp: new Date()
    };
    this.messages.update(messages => [...messages, welcomeMessage]);
  }

  sendMessage(message?: string) {
    const messageText = message || this.currentMessage.trim();
    if (!messageText || this.isTyping()) return;

    // Add user message
    const userMessage: Message = {
      id: this.generateId(),
      content: messageText,
      isUser: true,
      timestamp: new Date()
    };

    this.messages.update(messages => [...messages, userMessage]);
    this.currentMessage = '';
    this.scrollToBottom();

    // Simulate bot typing
    this.simulateBotResponse(messageText);
  }

  simulateBotResponse(userMessage: string): void {
    this.isTyping.set(true);

    const typingMessage: Message = {
      id: this.generateId(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    this.messages.update(messages => [...messages, typingMessage]);
    this.scrollToBottom();

    this.websocket.sendMessage(userMessage);
  }

  clearChat() {
    this.messages.set([]);
    this.addWelcomeMessage();
  }

  toggleTheme() {
    this.isDarkTheme.update(theme => !theme);
    document.body.classList.toggle('dark-theme', this.isDarkTheme());
  }

  exportChat() {
    const chatData = this.messages().map(msg => ({
      timestamp: msg.timestamp.toISOString(),
      sender: msg.isUser ? 'User' : 'AI Assistant',
      message: msg.content
    }));

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  formatMessage(content: string): string {
    // Enhanced formatting with line breaks and basic markdown-like formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  simulateOnlineStatus() {
    // Simulate occasional offline status (5% chance every 30 seconds)
    setInterval(() => {
      if (Math.random() < 0.05) {
        this.isOnline.set(false);
        setTimeout(() => this.isOnline.set(true), 1000 + Math.random() * 2000);
      }
    }, 30000);
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
