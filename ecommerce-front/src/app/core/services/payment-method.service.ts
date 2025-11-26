import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { PaymentMethod } from '../models/payment-method.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getAllPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payment-methods`).pipe(
      catchError((error) => {
        console.warn('API not available, using local data:', error);
        return of(this.getLocalPaymentMethods());
      })
    );
  }

  getPaymentMethodById(id: string): Observable<PaymentMethod | undefined> {
    return this.http.get<PaymentMethod>(`${this.apiUrl}/payment-methods/${id}`).pipe(
      catchError((error) => {
        console.warn('API not available, using local data:', error);
        const localMethods = this.getLocalPaymentMethods();
        return of(localMethods.find(method => method._id === id));
      })
    );
  }

  createPaymentMethod(paymentMethod: PaymentMethod): Observable<PaymentMethod> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<PaymentMethod>(`${this.apiUrl}/payment-methods`, paymentMethod, { headers });
  }

  updatePaymentMethod(id: string, paymentMethod: PaymentMethod): Observable<PaymentMethod> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<PaymentMethod>(`${this.apiUrl}/payment-methods/${id}`, paymentMethod, { headers });
  }

  deletePaymentMethod(id: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/payment-methods/${id}`, { headers });
  }

  private getLocalPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 1,
        name: 'Tarjeta de Crédito',
        description: 'Pago con tarjeta de crédito',
        type: 'credit_card',
        isActive: true,
        icon: 'credit_card'
      },
      {
        id: 2,
        name: 'Tarjeta de Débito',
        description: 'Pago con tarjeta de débito',
        type: 'debit_card',
        isActive: true,
        icon: 'debit_card'
      },
      {
        id: 3,
        name: 'PayPal',
        description: 'Pago con PayPal',
        type: 'paypal',
        isActive: true,
        icon: 'paypal'
      },
      {
        id: 4,
        name: 'Efectivo',
        description: 'Pago en efectivo',
        type: 'cash',
        isActive: true,
        icon: 'cash'
      }
    ];
  }
}
