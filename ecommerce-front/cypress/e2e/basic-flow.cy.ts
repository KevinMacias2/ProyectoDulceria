const mockProduct = {
  _id: '65ff123abc123abc123abc12',
  id: 'p-001',
  name: 'Gomitas Demo',
  description: 'Gomitas demo para pruebas automatizadas',
  price: 9.99,
  imageUrl: 'assets/picafresas.webp',
  category: 'Gomitas',
  stock: 10
};

const mockUser = {
  _id: 'user-demo-1',
  id: 'user-demo-1',
  name: 'Usuario Demo',
  email: 'demo@demo.com',
  role: 'admin'
};

describe('Flujo E2E completo del ecommerce', () => {
  const cartProducts: any[] = [];

  beforeEach(() => {
    cartProducts.length = 0;

    cy.intercept('GET', '**/products?limit=100', {
      products: [mockProduct]
    }).as('getProducts');

    cy.intercept('POST', '**/auth/login', {
      success: true,
      token: 'token-demo',
      user: mockUser
    }).as('login');

    cy.intercept('GET', '**/cart/user/**', (_req) => {
      return _req.reply({
        _id: 'cart-demo',
        products: cartProducts
      });
    }).as('getCart');

    cy.intercept('POST', '**/cart/add-product', (req) => {
      const quantity = req.body?.quantity ?? 1;
      cartProducts.length = 0;
      cartProducts.push({
        product: mockProduct,
        quantity
      });
      req.reply({ products: cartProducts });
    }).as('addToCart');

    cy.intercept('PUT', '**/cart/**', (req) => {
      if (req.body?.products) {
        cartProducts.length = 0;
        req.body.products.forEach((item: any) => {
          cartProducts.push({
            product: mockProduct,
            quantity: item.quantity || 1
          });
        });
      }
      req.reply({ products: cartProducts });
    }).as('updateCart');

    cy.intercept('POST', '**/orders', (req) => {
      cartProducts.length = 0;
      req.reply({
        _id: 'order-demo',
        products: [
          {
            productId: {
              _id: mockProduct._id,
              name: mockProduct.name,
              description: mockProduct.description,
              imagesUrl: [mockProduct.imageUrl]
            },
            quantity: 1,
            price: mockProduct.price
          }
        ],
        shippingAddress: {
          name: req.body?.shippingAddress?.name || 'Cliente Demo',
          email: 'demo@demo.com',
          address: 'Calle 123',
          phone: '5512345678'
        },
        totalPrice: mockProduct.price,
        paymentMethod: {
          type: 'credit_card',
          cardHolderName: 'Cliente Demo',
          cardNumber: '****1234',
          expiryDate: '12/30'
        },
        createdAt: new Date().toISOString()
      });
    }).as('createOrder');
  });

  it('permite iniciar sesión, agregar al carrito y finalizar la compra', () => {
    cy.visit('/auth/login');
    cy.get('#email').type('demo@demo.com');
    cy.get('#password').type('Password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');

    cy.visit('/productos');
    cy.wait('@getProducts');
    cy.get('[data-testid="add-to-cart-btn"]').first().click();
    cy.wait('@addToCart');

    cy.visit('/carrito');
    cy.wait('@getCart');
    cy.contains(mockProduct.name).should('exist');

    cy.visit('/checkout');
    cy.wait('@getCart');

    cy.get('input[name="customerName"]').type('Cliente Demo');
    cy.get('input[name="email"]').clear().type('demo@demo.com');
    cy.get('input[name="phone"]').clear().type('5512345678');
    cy.get('textarea[name="address"]').type('Calle Falsa 123');
    cy.get('input[name="city"]').clear().type('CDMX');
    cy.get('select[name="state"]').select('Ciudad de México');
    cy.get('input[name="postalCode"]').clear().type('01000');
    cy.get('input[name="country"]').clear().type('México');

    cy.get('#pagoTarjeta').check({ force: true });
    cy.get('#cardNumber').type('4242 4242 4242 4242');
    cy.get('#cardName').type('Cliente Demo');
    cy.get('#cardExpiry').type('1230');
    cy.get('#cardCvv').type('123');

    // Interceptar la navegación después de crear la orden
    cy.intercept('GET', '**/orders/**', {
      _id: 'order-demo',
      products: [
        {
          productId: {
            _id: mockProduct._id,
            name: mockProduct.name,
            description: mockProduct.description,
            imagesUrl: [mockProduct.imageUrl]
          },
          quantity: 1,
          price: mockProduct.price
        }
      ],
      shippingAddress: {
        name: 'Cliente Demo',
        email: 'demo@demo.com',
        address: 'Calle Falsa 123',
        phone: '5512345678'
      },
      totalPrice: mockProduct.price,
      paymentMethod: {
        type: 'credit_card',
        cardHolderName: 'Cliente Demo',
        cardNumber: '****1234',
        expiryDate: '12/30'
      },
      createdAt: new Date().toISOString()
    }).as('getOrder');

    cy.get('button[type="submit"]').contains('Confirmar Pedido').click();
    
    // Esperar a que se complete la creación de la orden
    cy.wait('@createOrder', { timeout: 10000 });
    
    // Esperar a que la navegación ocurra (aumentado el timeout)
    cy.url({ timeout: 15000 }).should('include', '/confirmacion');
    
    // Verificar que la página de confirmación se haya cargado completamente
    cy.contains('¡Pedido Confirmado!', { timeout: 10000 }).should('be.visible');
  });
});

