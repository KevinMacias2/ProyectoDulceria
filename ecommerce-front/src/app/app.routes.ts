import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { HomeComponent } from './components/pages/home/home.component';
import { ProductListComponent } from './components/pages/product-list/product-list.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  // Main layout routes
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'productos', component: ProductListComponent },
      { 
        path: 'producto/:id', 
        loadComponent: () => import('./components/pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) 
      },
      {
        path: 'carrito',
        canActivate: [authGuard],
        loadComponent: () => import('./components/pages/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        canDeactivate: [pendingChangesGuard],
        loadComponent: () => import('./components/pages/checkout/chechout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'confirmacion',
        canActivate: [authGuard],
        loadComponent: () => import('./components/pages/confirmation/confirmation.component').then(m => m.ConfirmationComponent)
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () => import('./components/pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'editar-perfil',
        canActivate: [authGuard],
        canDeactivate: [pendingChangesGuard],
        loadComponent: () => import('./components/pages/edit-profile/edit-profile.component').then(m => m.EditProfileComponent)
      },
      {
        path: 'agregar-producto',
        canActivate: [adminGuard],
        canDeactivate: [pendingChangesGuard],
        loadComponent: () => import('./components/pages/add-product/add-product.component').then(m => m.AddProductComponent)
      },
      {
        path: 'editar-producto/:id',
        canActivate: [adminGuard],
        canDeactivate: [pendingChangesGuard],
        loadComponent: () => import('./components/pages/edit-product/edit-product.component').then(m => m.EditProductComponent)
      },
      {
        path: 'panel-usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/pages/users-panel/users-panel.component').then(m => m.UsersPanelComponent)
      }
    ]
  },
  
  // Auth layout routes
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { 
        path: 'login', 
        loadComponent: () => import('./components/pages/login/login.component').then(m => m.LoginComponent) 
      },
      { 
        path: 'register', 
        loadComponent: () => import('./components/pages/register/register.component').then(m => m.RegisterComponent) 
      }
    ]
  },
  
  // Redirects for backward compatibility
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: '/auth/register', pathMatch: 'full' },
  
  // Wildcard route
  { path: '**', redirectTo: '/' }
];
