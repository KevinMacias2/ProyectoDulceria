import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { ShippingAddress } from '../models/shipping-address.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ShippingAddressService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getShippingAddressesByUser(userId: string): Observable<ShippingAddress[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ShippingAddress[]>(`${this.apiUrl}/shipping-addresses/user/${userId}`, { headers }).pipe(
      catchError((error) => {
        console.warn('API not available, using local data:', error);
        return of(this.getLocalShippingAddresses(userId));
      })
    );
  }

  getShippingAddressById(id: string): Observable<ShippingAddress | undefined> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<ShippingAddress>(`${this.apiUrl}/shipping-addresses/${id}`, { headers }).pipe(
      catchError((error) => {
        console.warn('API not available, using local data:', error);
        const localAddresses = this.getLocalShippingAddresses('');
        return of(localAddresses.find(address => address._id === id));
      })
    );
  }

  createShippingAddress(shippingAddress: ShippingAddress): Observable<ShippingAddress> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<ShippingAddress>(`${this.apiUrl}/shipping-addresses`, shippingAddress, { headers });
  }

  updateShippingAddress(id: string, shippingAddress: ShippingAddress): Observable<ShippingAddress> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ShippingAddress>(`${this.apiUrl}/shipping-addresses/${id}`, shippingAddress, { headers });
  }

  deleteShippingAddress(id: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/shipping-addresses/${id}`, { headers });
  }

  setDefaultShippingAddress(id: string): Observable<ShippingAddress> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<ShippingAddress>(`${this.apiUrl}/shipping-addresses/${id}/default`, {}, { headers });
  }

  private getLocalShippingAddresses(userId: string): ShippingAddress[] {
    return [
      {
        id: 1,
        userId: userId,
        fullName: 'Juan Pérez',
        address: 'Calle Principal 123',
        city: 'Ciudad de México',
        state: 'CDMX',
        zipCode: '01000',
        country: 'México',
        phone: '+52 55 1234 5678',
        isDefault: true
      },
      {
        id: 2,
        userId: userId,
        fullName: 'María García',
        address: 'Avenida Secundaria 456',
        city: 'Guadalajara',
        state: 'Jalisco',
        zipCode: '44100',
        country: 'México',
        phone: '+52 33 9876 5432',
        isDefault: false
      }
    ];
  }
}
