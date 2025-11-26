import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Order } from '../models/order.model';
import { CartItem } from '../models/cart-item';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orderKey = 'candy-orders';
  private currentOrderKey = 'candy-current-order';
  private readonly apiUrl = environment.apiUrl;

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  constructor(private cartService: CartService) { }



  createOrder(customerDetails: {
    customerName: string;
    email: string;
    address: string;
    phone: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    payment?: any;
  }, items: CartItem[], total: number): Observable<Order> {
    const headers = this.authService.getAuthHeaders();
    
    const orderData = {
      shippingAddress: {
        name: customerDetails.customerName,
        address: customerDetails.address,
        city: customerDetails.city,
        state: customerDetails.state,
        postalCode: customerDetails.postalCode,
        country: customerDetails.country,
        phone: customerDetails.phone,
        email: customerDetails.email,
        isDefault: true,
        addressType: 'home'
      },
      paymentMethod: {
        type: customerDetails.payment?.method === 'tarjeta' ? 'credit_card' : 'paypal',
        cardNumber: customerDetails.payment?.cardNumber,
        cardHolderName: customerDetails.payment?.cardName,
        expiryDate: customerDetails.payment?.cardExpiry,
        paypalEmail: customerDetails.payment?.paypalEmail,
        isDefault: true
      }
    };

    return this.http.post<any>(`${this.apiUrl}/orders`, orderData, { headers }).pipe(
      catchError((error) => {
        console.error('Error creating order:', error);
        // No hacer fallback automático - dejar que el error se propague
        // para que el componente pueda manejarlo y mostrar el mensaje adecuado
        throw error;
      })
    );
  }

  private createLocalOrder(customerDetails: any, items: CartItem[], total: number): Order {
    const order: Order = {
      id: this.generateOrderId(),
      items: [...items],
      customerName: customerDetails.customerName,
      email: customerDetails.email,
      address: customerDetails.address,
      phone: customerDetails.phone,
      total: total,
      date: new Date(),
      payment: customerDetails.payment
    };

    this.saveCurrentOrder(order);
    this.saveOrder(order);
    this.cartService.clearCart();

    return order;
  }



  private generateOrderId(): string {

    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  }



  private saveOrder(order: Order): void {

    const orders = this.getOrders();

    orders.push(order);

    localStorage.setItem(this.orderKey, JSON.stringify(orders));

  }



  getOrders(): Order[] {

    const ordersData = localStorage.getItem(this.orderKey);

    return ordersData ? JSON.parse(ordersData) : [];

  }



  saveCurrentOrder(order: Order): void {
    try {
      // Optimizar la orden para guardar solo datos esenciales
      const optimizedOrder: any = {
        id: order.id,
        _id: order._id,
        // Guardar solo información básica de productos (sin imágenes completas)
        items: order.items?.map(item => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            // Solo guardar la primera imagen o ninguna para ahorrar espacio
            imagesUrl: item.product.imagesUrl && item.product.imagesUrl.length > 0 ? [item.product.imagesUrl[0]] : []
          },
          quantity: item.quantity
        })) || [],
        customerName: order.customerName,
        email: order.email,
        address: order.address,
        phone: order.phone,
        total: order.total,
        date: order.date,
        // Guardar solo información esencial del pago
        payment: order.payment ? {
          method: order.payment.method,
          // No guardar números de tarjeta completos por seguridad
          cardNumber: order.payment.cardNumber ? '****' + order.payment.cardNumber.slice(-4) : undefined,
          cardName: order.payment.cardName,
          paypalEmail: order.payment.paypalEmail
        } : undefined,
        // Guardar el boucher completo ya que es necesario para la vista
        boucher: order.boucher
      };

      // Intentar limpiar localStorage si está lleno
      try {
        localStorage.setItem(this.currentOrderKey, JSON.stringify(optimizedOrder));
      } catch (quotaError: any) {
        if (quotaError.name === 'QuotaExceededError') {
          console.warn('LocalStorage lleno, limpiando órdenes antiguas...');
          // Limpiar órdenes antiguas
          this.clearOldOrders();
          // Intentar guardar solo el ID y datos mínimos
          const minimalOrder = {
            id: order.id,
            _id: order._id,
            customerName: order.customerName,
            email: order.email,
            total: order.total,
            date: order.date,
            boucher: order.boucher
          };
          localStorage.setItem(this.currentOrderKey, JSON.stringify(minimalOrder));
          console.log('Orden guardada en formato mínimo debido a espacio limitado');
        } else {
          throw quotaError;
        }
      }
    } catch (error) {
      console.error('Error guardando orden en localStorage:', error);
      // No fallar la aplicación, solo loguear el error
      // La orden ya está creada en el backend, así que el usuario puede continuar
    }
  }

  private clearOldOrders(): void {
    try {
      // Limpiar órdenes antiguas del historial
      const orders = this.getOrders();
      // Mantener solo las últimas 5 órdenes
      if (orders.length > 5) {
        const recentOrders = orders.slice(-5);
        localStorage.setItem(this.orderKey, JSON.stringify(recentOrders));
      }
      // Limpiar la orden actual anterior si existe
      localStorage.removeItem(this.currentOrderKey);
    } catch (error) {
      console.error('Error limpiando órdenes antiguas:', error);
    }
  }



  getCurrentOrder(): Order | null {

    const orderData = localStorage.getItem(this.currentOrderKey);

    return orderData ? JSON.parse(orderData) : null;

  }

  clearCurrentOrder(): void {
    localStorage.removeItem(this.currentOrderKey);
  }

  // Métodos para conectar con el backend
  getOrdersFromBackend(): Observable<Order[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<Order[]>(`${this.apiUrl}/orders/my-orders`, { headers }).pipe(
      catchError((error) => {
        console.warn('API not available, using local data:', error);
        return of(this.getOrders());
      })
    );
  }

  getOrderByIdFromBackend(id: string): Observable<Order | undefined> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`, { headers }).pipe(
      catchError((error) => {
        console.warn('API not available, using local data:', error);
        const localOrders = this.getOrders();
        return of(localOrders.find(order => order.id === id));
      })
    );
  }

  getAllOrders(): Observable<Order[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, { headers }).pipe(
      catchError((error) => {
        console.error('Error getting all orders:', error);
        throw error;
      })
    );
  }

  getOrdersByUserId(userId: string): Observable<any[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/orders/user/${userId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error getting user orders:', error);
        throw error;
      })
    );
  }


  updateOrderStatus(orderId: string, status: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.patch<any>(`${this.apiUrl}/orders/${orderId}/status`, { status }, { headers }).pipe(
      catchError((error) => {
        console.error('Error updating order status:', error);
        throw error;
      })
    );
  }
}