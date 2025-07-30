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
      "Welcome to Embassy Suites Niagara Falls – Fallsview! 🌊 I'm your virtual assistant, here to help you with hotel amenities, booking policies, dining options, and anything else you need during your stay.",
      "Hi there! 👋 Looking for details about check-in times, breakfast, parking, or nearby attractions? I'm your Embassy Suites chatbot – here to make your visit smooth and enjoyable!",
      "Greetings from Embassy Suites Niagara Falls! 🏨 Whether you’re planning your stay, exploring our dining services, or have questions about our suites, I'm here to help you every step of the way."
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
