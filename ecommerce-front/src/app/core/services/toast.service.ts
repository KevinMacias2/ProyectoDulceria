import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  private toastIdCounter = 0;

  get toasts$(): Observable<Toast> {
    return this.toastSubject.asObservable();
  }

  show(message: string, type: ToastType = 'info', duration: number = 3000): void {
    const toast: Toast = {
      id: this.toastIdCounter++,
      message,
      type,
      duration
    };
    this.toastSubject.next(toast);
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }
}

