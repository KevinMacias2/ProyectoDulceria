import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-confirmation',
  imports: [CommonModule, RouterLink],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.css'
})
export class ConfirmationComponent implements OnInit{
  order: Order | null = null;
  boucher: any = null;

  private orderService = inject(OrderService);
  private router = inject(Router);

  ngOnInit(): void {
    this.order = this.orderService.getCurrentOrder();
    
    // Si no hay una orden, redirigir a productos
    if (!this.order) {
      console.warn('No hay orden disponible en el servicio');
      this.router.navigate(['/productos']);
      return;
    }

    console.log('Orden cargada:', this.order);
    console.log('La orden tiene boucher:', !!this.order.boucher);
    console.log('Estructura de la orden:', JSON.stringify(this.order, null, 2));
    
    // Si la orden tiene boucher, extraerlo
    if (this.order.boucher) {
      this.boucher = this.order.boucher;
      console.log('Boucher cargado:', this.boucher);
      console.log('Cliente del boucher:', this.boucher.customer);
      console.log('Envío del boucher:', this.boucher.shipping);
      console.log('Items del boucher:', this.boucher.items);
      console.log('Cantidad de items del boucher:', this.boucher.items?.length);
      console.log('Totales del boucher:', this.boucher.totals);
      console.log('Pago del boucher:', this.boucher.payment);
      
      // Verificar si los datos están vacíos
      if (!this.boucher.customer || !this.boucher.customer.name) {
        console.warn('El boucher no tiene datos de cliente');
      }
      if (!this.boucher.items || this.boucher.items.length === 0) {
        console.warn('El boucher no tiene items');
      }
    } else {
      console.warn('La orden no tiene boucher');
      console.log('Orden completa:', JSON.stringify(this.order, null, 2));
    }
  }

  printBoucher(): void {
    window.print();
  }
}
