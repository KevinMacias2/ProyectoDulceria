import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-split">
      <div class="auth-left">
        <div class="brand">
          <img src="assets/LogoYankee.png" alt="Dulces Yankee" class="brand-logo" />
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-card">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-split {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
    }

    .auth-left {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      color: #fff;
    }

    .brand {
      text-align: center;
      max-width: 520px;
    }

    .brand-logo {
      width: 400px;
      height: auto;
      filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.25));
    }

    .brand-title {
      margin-top: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .brand-subtitle {
      opacity: 0.9;
      margin: 4px 0 0;
    }

    .auth-right {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      background: #f8f9fb;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
      padding: 28px;
    }

    @media (max-width: 992px) {
      .auth-split {
        grid-template-columns: 1fr;
      }
      .auth-left {
        padding: 32px 20px;
      }
      .brand-logo {
        width: 200px;
      }
      .auth-card {
        max-width: 520px;
      }
    }
  `]
})
export class AuthLayoutComponent {}
