import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [class.skeleton-shimmer]="true">
      @if (type === 'card') {
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
            <div class="skeleton-button"></div>
          </div>
        </div>
      }
      
      @if (type === 'text') {
        <div class="skeleton-text" [style.width.%]="width"></div>
      }
      
      @if (type === 'image') {
        <div class="skeleton-image" [style.height.px]="height"></div>
      }
      
      @if (type === 'button') {
        <div class="skeleton-button" [style.width.px]="width"></div>
      }
      
      @if (type === 'circle') {
        <div class="skeleton-circle" [style.width.px]="width" [style.height.px]="height"></div>
      }
    </div>
  `,
  styles: [`
    .skeleton-container {
      animation: skeleton-loading 1.5s infinite;
    }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .skeleton-card {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .skeleton-image {
      width: 100%;
      height: 200px;
      background: #f0f0f0;
    }

    .skeleton-content {
      padding: 1rem;
    }

    .skeleton-title {
      height: 20px;
      background: #f0f0f0;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      width: 80%;
    }

    .skeleton-text {
      height: 14px;
      background: #f0f0f0;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      width: 100%;
    }

    .skeleton-text.short {
      width: 60%;
    }

    .skeleton-button {
      height: 36px;
      background: #f0f0f0;
      border-radius: 6px;
      width: 100px;
      margin-top: 0.5rem;
    }

    .skeleton-circle {
      border-radius: 50%;
      background: #f0f0f0;
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'card' | 'text' | 'image' | 'button' | 'circle' = 'card';
  @Input() width = 100;
  @Input() height = 100;
}
