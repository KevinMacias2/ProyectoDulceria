import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../types/auth.types';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  orders: Order[] = [];
  loadingProfile = true;
  loadingOrders = true;
  profileError: string | null = null;
  ordersError: string | null = null;

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.fetchProfile();
    this.fetchOrders();
  }

  logout(): void {
    this.authService.logout();
  }

  private fetchProfile(): void {
    this.loadingProfile = true;
    this.userService.getProfile().subscribe({
      next: (response) => {
        const userData = response.user || response;
        if (userData) {
          const mergedUser: User = {
            ...(this.currentUser || {} as User),
            name: userData.displayName || userData.name,
            email: userData.email,
            profileImage: userData.avatar || userData.profileImage,
            role: userData.role || this.currentUser?.role || 'user',
            phone: userData.phone
          };
          this.currentUser = mergedUser;
          this.authService.updateCurrentUser(mergedUser);
        }
        this.loadingProfile = false;
      },
      error: (error) => {
        console.error('Error al cargar el perfil:', error);
        this.profileError = 'No pudimos cargar tus datos. Intenta más tarde.';
        this.loadingProfile = false;
      }
    });
  }

  private fetchOrders(): void {
    this.loadingOrders = true;
    this.orderService.getOrdersFromBackend().subscribe({
      next: (orders) => {
        this.orders = orders || [];
        this.loadingOrders = false;
      },
      error: (error) => {
        console.error('Error al cargar el historial de pedidos:', error);
        this.ordersError = 'No pudimos cargar tu historial de pedidos.';
        this.loadingOrders = false;
      }
    });
  }

  get hasOrders(): boolean {
    return this.orders.length > 0;
  }
}
