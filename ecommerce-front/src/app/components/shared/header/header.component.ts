import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthStore } from '../../../core/state/auth.store';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private cartService = inject(CartService);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  itemCount = 0;

  ngOnInit(): void {
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.itemCount = this.cartService.getItemCount();
      });

    this.cartService.count$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => (this.itemCount = count));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authStore.logout();
  }

  goToProfile(): void {
    this.router.navigate(['/perfil']);
  }

  get isAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }

  get currentUser() {
    return this.authStore.currentUser();
  }
}

