import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

interface User {
  _id: string;
  displayName: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
}

interface UserOrder {
  _id: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  products: any[];
  shippingAddress?: any;
  user?: any;
  shippingCost?: number;
}

@Component({
  selector: 'app-users-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-panel.component.html',
  styleUrls: ['./users-panel.component.css']
})
export class UsersPanelComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  userOrders: UserOrder[] = [];
  showUserForm = false;
  isEditing = false;
  currentPage = 1;
  totalPages = 1;
  totalUsers = 0;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showOrdersModal = false;
  expandedOrders: Set<string> = new Set();

  userForm: FormGroup;

  private authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private orderService = inject(OrderService);

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      role: ['customer', Validators.required],
      avatar: ['']
    });
  }

  ngOnInit(): void {
    // Verificar si el usuario es admin
    if (!this.authService.currentUser || this.authService.currentUser.role !== 'admin') {
      this.router.navigate(['/productos']);
      return;
    }
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.loading = true;
    this.errorMessage = null;
    this.userService.getAllUsers(page, 10).subscribe({
      next: (response) => {
        this.users = response.users || [];
        this.currentPage = response.currentPage || page;
        this.totalPages = response.totalPages || 1;
        this.totalUsers = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Error al cargar usuarios: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  openAddUserForm(): void {
    this.isEditing = false;
    this.selectedUser = null;
    this.userForm.reset({
      role: 'customer'
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showUserForm = true;
  }

  openEditUserForm(user: User): void {
    this.isEditing = true;
    this.selectedUser = user;
    this.userForm.patchValue({
      displayName: user.displayName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      avatar: user.avatar || '',
      password: '' // No se usa en edición, pero se mantiene para evitar errores
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showUserForm = true;
  }

  closeUserForm(): void {
    this.showUserForm = false;
    this.selectedUser = null;
    this.userForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.userForm.value;
    const userData: any = {
      displayName: formValue.displayName,
      email: formValue.email,
      phone: formValue.phone,
      role: formValue.role,
      avatar: formValue.avatar
    };

    if (this.isEditing && this.selectedUser) {
      // Actualizar usuario (no se incluye password, requiere endpoint separado)
      this.userService.updateUser(this.selectedUser._id, userData).subscribe({
        next: () => {
          this.successMessage = 'Usuario actualizado correctamente';
          this.loadUsers(this.currentPage);
          setTimeout(() => {
            this.closeUserForm();
          }, 1500);
        },
        error: (error) => {
          console.error('Error completo:', error);
          let errorMsg = 'Error al actualizar usuario';
          
          if (error.error) {
            // Si hay errores de validación
            if (error.error.errors && Array.isArray(error.error.errors)) {
              errorMsg += ': ' + error.error.errors.map((e: any) => e.msg || e.message).join(', ');
            } else if (error.error.message) {
              errorMsg += ': ' + error.error.message;
            } else if (typeof error.error === 'string') {
              errorMsg += ': ' + error.error;
            }
          } else if (error.message) {
            errorMsg += ': ' + error.message;
          }
          
          this.errorMessage = errorMsg;
          this.loading = false;
        }
      });
    } else {
      // Crear usuario
      userData.password = formValue.password;
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.successMessage = 'Usuario creado correctamente';
          this.loadUsers(this.currentPage);
          setTimeout(() => {
            this.closeUserForm();
          }, 1500);
        },
        error: (error) => {
          console.error('Error completo:', error);
          let errorMsg = 'Error al crear usuario';
          
          if (error.error) {
            // Si hay errores de validación
            if (error.error.errors && Array.isArray(error.error.errors)) {
              errorMsg += ': ' + error.error.errors.map((e: any) => e.msg || e.message).join(', ');
            } else if (error.error.message) {
              errorMsg += ': ' + error.error.message;
            } else if (typeof error.error === 'string') {
              errorMsg += ': ' + error.error;
            }
          } else if (error.message) {
            errorMsg += ': ' + error.message;
          }
          
          this.errorMessage = errorMsg;
          this.loading = false;
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${user.displayName}?`)) {
      return;
    }

    this.loading = true;
    this.userService.deleteUser(user._id).subscribe({
      next: () => {
        this.successMessage = 'Usuario eliminado correctamente';
        this.loadUsers(this.currentPage);
      },
      error: (error) => {
        this.errorMessage = 'Error al eliminar usuario: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  viewUserOrders(user: User): void {
    this.selectedUser = user;
    this.loading = true;
    this.expandedOrders.clear();
    this.orderService.getOrdersByUserId(user._id).subscribe({
      next: (orders) => {
        this.userOrders = orders;
        // Expandir la primera orden automáticamente
        if (orders.length > 0) {
          this.expandedOrders.add(orders[0]._id);
        }
        this.showOrdersModal = true;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar órdenes: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  updateOrderStatus(order: UserOrder, newStatus: string): void {
    if (order.status === newStatus) {
      return;
    }

    if (!confirm(`¿Estás seguro de cambiar el estado de la orden de "${this.getStatusText(order.status)}" a "${this.getStatusText(newStatus)}"?`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
      next: (updatedOrder) => {
        // Actualizar la orden en la lista
        const index = this.userOrders.findIndex(o => o._id === order._id);
        if (index !== -1) {
          this.userOrders[index] = updatedOrder;
        }
        this.successMessage = `Estado de la orden actualizado a "${this.getStatusText(newStatus)}". Se ha enviado una notificación por correo.`;
        this.loading = false;
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = 'Error al actualizar el estado: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'processing': 'En Proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusOptions(): string[] {
    return ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  }

  toggleOrderDetails(orderId: string): void {
    if (this.expandedOrders.has(orderId)) {
      this.expandedOrders.delete(orderId);
    } else {
      this.expandedOrders.add(orderId);
    }
  }

  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrders.has(orderId);
  }

  closeOrdersModal(): void {
    this.showOrdersModal = false;
    this.selectedUser = null;
    this.userOrders = [];
    this.expandedOrders.clear();
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'customer':
        return 'bg-primary';
      case 'guest':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'processing':
        return 'bg-info';
      case 'shipped':
        return 'bg-primary';
      case 'delivered':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadUsers(page);
    }
  }
}

