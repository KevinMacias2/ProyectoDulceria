import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { CartItem } from '../../../core/models/cart-item';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { switchMap, of, catchError, combineLatest, Subscription } from 'rxjs';
import { Order } from '../../../core/models/order.model';
import { HasUnsavedChanges } from '../../../core/guards/pending-changes.guard';
import { SkeletonComponent } from '../../../components/shared/skeleton/skeleton.component';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterLink, FormsModule, SkeletonComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  @ViewChild('checkoutForm') checkoutForm?: NgForm;
  cartItems: CartItem[] = [];
  total = 0;
  paymentMethod: string = '';
  cardDetails = {
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  };

  paypalEmail: string = '';

  paymentError: string = '';

  customerDetails = {
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Ciudad de México',
    state: 'Ciudad de México',
    postalCode: '01000',
    country: 'México'
  };

  // Estados de México
  estadosMexico = [
    'Aguascalientes',
    'Baja California',
    'Baja California Sur',
    'Campeche',
    'Chiapas',
    'Chihuahua',
    'Ciudad de México',
    'Coahuila',
    'Colima',
    'Durango',
    'Estado de México',
    'Guanajuato',
    'Guerrero',
    'Hidalgo',
    'Jalisco',
    'Michoacán',
    'Morelos',
    'Nayarit',
    'Nuevo León',
    'Oaxaca',
    'Puebla',
    'Querétaro',
    'Quintana Roo',
    'San Luis Potosí',
    'Sinaloa',
    'Sonora',
    'Tabasco',
    'Tamaulipas',
    'Tlaxcala',
    'Veracruz',
    'Yucatán',
    'Zacatecas'
  ];

  private cartService = inject(CartService);

  private orderService = inject(OrderService);

  private router = inject(Router);

  private toastService = inject(ToastService);

  private authService = inject(AuthService);
  private formSubmitted = false;
  cartLoading = true;
  private cartSubscription?: Subscription;

  ngOnInit(): void {
    this.cartSubscription = combineLatest([
      this.cartService.getCart(),
      this.cartService.loading$
    ]).subscribe(([items, loading]) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
      this.cartLoading = loading;

      if (!loading && this.cartItems.length === 0) {
        this.router.navigate(['/productos']);
      }
    });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  onSubmit(form: NgForm): void {
    this.checkoutForm = form;
    this.formSubmitted = false;
    this.paymentError = '';

    if (!form.valid) {
      this.paymentError = 'Completa todos los datos de contacto.';
      this.toastService.error('Completa todos los datos de contacto');
      return;
    }

    // Validar teléfono
    if (!this.validatePhone(this.customerDetails.phone)) {
      this.paymentError = 'El teléfono debe tener 10 dígitos (formato mexicano).';
      this.toastService.error('El teléfono debe tener 10 dígitos');
      return;
    }

    if (!this.paymentMethod) {
      this.paymentError = 'Selecciona un método de pago.';
      this.toastService.warning('Selecciona un método de pago');
      return;
    }

    if (this.paymentMethod === 'tarjeta') {
      // Validar que todos los campos estén completos
      if (
        !this.cardDetails.cardNumber ||
        !this.cardDetails.cardName ||
        !this.cardDetails.cardExpiry ||
        !this.cardDetails.cardCvv
      ) {
        this.paymentError = 'Completa todos los datos de la tarjeta.';
        this.toastService.error('Completa todos los datos de la tarjeta');
        return;
      }

      // Validar número de tarjeta
      if (!this.validateCardNumber(this.cardDetails.cardNumber)) {
        this.paymentError = 'El número de tarjeta no es válido.';
        this.toastService.error('El número de tarjeta no es válido');
        return;
      }

      // Validar nombre en la tarjeta
      if (!this.validateCardName(this.cardDetails.cardName)) {
        this.paymentError = 'El nombre en la tarjeta debe contener solo letras y espacios.';
        this.toastService.error('El nombre en la tarjeta no es válido');
        return;
      }

      // Validar fecha de expiración
      if (!this.validateCardExpiry(this.cardDetails.cardExpiry)) {
        this.paymentError = 'La fecha de expiración no es válida. Debe ser MM/AA y no puede estar vencida.';
        this.toastService.error('La fecha de expiración no es válida');
        return;
      }

      // Validar CVV
      if (!this.validateCardCvv(this.cardDetails.cardCvv)) {
        this.paymentError = 'El CVV debe tener 3 o 4 dígitos.';
        this.toastService.error('El CVV no es válido');
        return;
      }
    }

    if (this.paymentMethod === 'paypal') {
      if (!this.paypalEmail) {
        this.paymentError = 'Ingresa el correo de PayPal.';
        this.toastService.error('Ingresa el correo de PayPal');
        return;
      }
      // Validar formato de email
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(this.paypalEmail)) {
        this.paymentError = 'Ingresa un correo de PayPal válido.';
        this.toastService.error('Ingresa un correo de PayPal válido');
        return;
      }
    }

    // Preparar datos de pago para el backend

    let paymentData: any = { method: this.paymentMethod };

    if (this.paymentMethod === 'tarjeta') {
      paymentData = { ...paymentData, ...this.cardDetails };
    } else if (this.paymentMethod === 'paypal') {
      paymentData = { ...paymentData, paypalEmail: this.paypalEmail };
    }

    // Verificar si el usuario está autenticado
    const isAuthenticated = this.authService.isAuthenticated;
    console.log('Iniciando proceso de checkout...');
    console.log('Usuario autenticado:', isAuthenticated);
    console.log('Items del carrito:', this.cartItems.length);
    console.log('Detalles del cliente:', this.customerDetails);
    console.log('Método de pago:', this.paymentMethod);
    
    if (!isAuthenticated) {
      this.paymentError = 'Debes iniciar sesión para realizar una compra.';
      this.toastService.error('Debes iniciar sesión para realizar una compra');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    
    // Si el usuario está autenticado, sincronizar el carrito primero
    // El backend necesita que el carrito esté en la base de datos para crear la orden
    // Usar switchMap para encadenar la sincronización del carrito con la creación de la orden
    const syncObs = this.cartService.syncCartToBackend();
    
    syncObs.pipe(
      switchMap((syncResult) => {
        console.log('Sincronización del carrito completada:', syncResult);
        // Después de sincronizar (o si no es necesario), crear la orden
        // Usar of() para convertir el Observable en un flujo manejable
        return this.orderService.createOrder(
          { ...this.customerDetails, payment: paymentData },
          this.cartItems,
          this.total
        ).pipe(
          catchError((error: any) => {
            console.error('Error en el observable de createOrder:', error);
            throw error; // Re-lanzar para que el subscribe lo capture
          })
        );
      }),
      catchError((error: any) => {
        console.error('Error en el pipe de syncCartToBackend:', error);
        // Si falla la sincronización pero el usuario no está autenticado, intentar crear orden de todas formas
        return this.orderService.createOrder(
          { ...this.customerDetails, payment: paymentData },
          this.cartItems,
          this.total
        );
      })
    ).subscribe({
      next: (orderResponse: any) => {
        console.log('Orden creada exitosamente:', orderResponse);
        console.log('Estructura de respuesta de la orden:', JSON.stringify(orderResponse, null, 2));
        
        // Mapear la respuesta del backend a la estructura Order
        const mappedOrder: Order = {
          id: orderResponse._id || orderResponse.id,
          _id: orderResponse._id,
          items: orderResponse.products?.map((p: any) => ({
            product: {
              id: p.productId?._id || p.productId?.id || p.productId,
              name: p.productId?.name || 'Producto',
              price: p.price || 0,
              description: p.productId?.description || '',
              imagesUrl: p.productId?.imagesUrl || []
            },
            quantity: p.quantity || 0
          })) || [],
          customerName: orderResponse.shippingAddress?.name || orderResponse.customerName || '',
          email: orderResponse.shippingAddress?.email || orderResponse.email || '',
          address: orderResponse.shippingAddress?.address || orderResponse.address || '',
          phone: orderResponse.shippingAddress?.phone || orderResponse.phone || '',
          total: orderResponse.totalPrice || orderResponse.total || 0,
          date: orderResponse.createdAt ? new Date(orderResponse.createdAt) : new Date(),
          payment: orderResponse.paymentMethod ? {
            method: orderResponse.paymentMethod.type === 'credit_card' ? 'tarjeta' : 'paypal',
            cardNumber: orderResponse.paymentMethod.cardNumber,
            cardName: orderResponse.paymentMethod.cardHolderName,
            cardExpiry: orderResponse.paymentMethod.expiryDate,
            paypalEmail: orderResponse.paymentMethod.paypalEmail
          } : undefined,
          boucher: orderResponse.boucher || undefined
        };
        
        console.log('Orden mapeada:', mappedOrder);
        console.log('La orden tiene boucher:', !!mappedOrder.boucher);
        if (mappedOrder.boucher) {
          console.log('Detalles del boucher:', JSON.stringify(mappedOrder.boucher, null, 2));
        }
        
        // Guardar la orden mapeada (puede fallar si localStorage está lleno, pero no debe bloquear)
        try {
          this.orderService.saveCurrentOrder(mappedOrder);
        } catch (error) {
          console.warn('No se pudo guardar la orden en localStorage, pero la orden fue creada exitosamente:', error);
          // Continuar con el flujo aunque falle el guardado local
        }
        
        this.toastService.success('¡Pedido realizado exitosamente!');
        this.formSubmitted = true;
        this.checkoutForm?.resetForm();
        this.cartService.clearCart();
        this.router.navigate(['/confirmacion']);
      },
      error: (error: any) => {
        console.error('Error en el proceso de checkout:', error);
        console.error('Estado del error:', error?.status);
        console.error('Texto del estado del error:', error?.statusText);
        console.error('Cuerpo del error:', error?.error);
        
        let errorMsg = 'Error al procesar el pedido. Inténtalo de nuevo.';
        
        // Manejar diferentes tipos de errores
        if (error.status === 401 || error.status === 403) {
          errorMsg = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
        } else if (error.status === 400) {
          if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.error?.error) {
            errorMsg = error.error.error;
          } else if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else {
            errorMsg = 'Los datos proporcionados no son válidos. Verifica tu información.';
          }
        } else if (error.status === 404) {
          errorMsg = 'No se encontró el carrito. Por favor, agrega productos al carrito primero.';
        } else if (error.status === 0 || error.status === 500) {
          errorMsg = 'Error del servidor. Por favor, intenta más tarde.';
        } else if (error.error) {
          if (error.error.message) {
            errorMsg = error.error.message;
          } else if (error.error.error) {
            errorMsg = error.error.error;
          } else if (typeof error.error === 'string') {
            errorMsg = error.error;
          }
        }
        
        this.paymentError = errorMsg;
        this.toastService.error(errorMsg);
      }
    });
  }

  onCardExpiryInput(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');

    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }

    this.cardDetails.cardExpiry = value.slice(0, 5);
  }

  onCardNumberInput(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    
    // Agregar espacios cada 4 dígitos
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    
    this.cardDetails.cardNumber = value.slice(0, 19);
  }

  onCardCvvInput(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    this.cardDetails.cardCvv = value.slice(0, 4);
  }

  // Validar número de tarjeta usando algoritmo de Luhn
  validateCardNumber(cardNumber: string): boolean {
    // Remover espacios
    const cleaned = cardNumber.replace(/\s/g, '');
    
    // Debe tener entre 13 y 19 dígitos
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Algoritmo de Luhn
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Validar nombre en la tarjeta
  validateCardName(name: string): boolean {
    // Debe contener solo letras, espacios y algunos caracteres especiales como guiones
    const namePattern = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
    return namePattern.test(name.trim()) && name.trim().length >= 2;
  }

  // Validar fecha de expiración
  validateCardExpiry(expiry: string): boolean {
    const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryPattern.test(expiry)) {
      return false;
    }

    const [month, year] = expiry.split('/');
    const expiryMonth = parseInt(month, 10);
    const expiryYear = parseInt('20' + year, 10);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Verificar que no esté vencida
    if (expiryYear < currentYear || 
        (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return false;
    }

    return true;
  }

  // Validar CVV
  validateCardCvv(cvv: string): boolean {
    const cleaned = cvv.replace(/\s/g, '');
    // CVV debe tener 3 o 4 dígitos
    return /^[0-9]{3,4}$/.test(cleaned);
  }

  // Validar teléfono mexicano (10 dígitos)
  validatePhone(phone: string): boolean {
    if (!phone) {
      return false;
    }
    // Remover espacios, guiones y paréntesis
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Debe tener exactamente 10 dígitos
    return /^[0-9]{10}$/.test(cleaned);
  }

  // Formatear teléfono mientras se escribe
  onPhoneInput(event: any): void {
    let value = event.target.value.replace(/[^0-9]/g, '');
    
    // Limitar a 10 dígitos
    value = value.slice(0, 10);
    
    // Formatear con guiones opcionales (opcional, puedes comentar si prefieres sin formato)
    // if (value.length > 6) {
    //   value = value.slice(0, 6) + '-' + value.slice(6);
    // }
    // if (value.length > 3 && !value.includes('-')) {
    //   value = value.slice(0, 3) + '-' + value.slice(3);
    // }
    
    this.customerDetails.phone = value;
  }

  hasUnsavedChanges(): boolean {
    return !this.formSubmitted && !!this.checkoutForm && !!this.checkoutForm.dirty;
  }
}
