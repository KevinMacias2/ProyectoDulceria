import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast, ToastType } from '../../../core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();
  
  toasts: Toast[] = [];

  ngOnInit(): void {
    this.toastService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toast => {
        this.toasts.push(toast);
        const duration = toast.duration || 3000;
        setTimeout(() => {
          this.removeToast(toast.id);
        }, duration);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  getToastClass(type: ToastType): string {
    const baseClass = 'toast';
    switch (type) {
      case 'success':
        return `${baseClass} toast-success`;
      case 'error':
        return `${baseClass} toast-error`;
      case 'warning':
        return `${baseClass} toast-warning`;
      case 'info':
        return `${baseClass} toast-info`;
      default:
        return baseClass;
    }
  }

  getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }
}

