import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno antes de instanciar el servicio
dotenv.config();

class EmailService {
  constructor() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass) {
      console.error('❌ EMAIL CONFIGURATION ERROR: EMAIL_USER y EMAIL_PASS deben estar configurados en el archivo .env');
      console.error('   El servicio de email no funcionará hasta que configures estas variables.');
      console.error('   Revisa el archivo EMAIL_SETUP.md para más información.');
    } else {
      console.log('📧 Email service inicializado con:', emailUser);
    }

    const cleanEmailPass = emailPass ? emailPass.trim().replace(/\s+/g, '') : '';
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser || 'tu-email@gmail.com',
        pass: cleanEmailPass || 'tu-app-password'
      },
      tls: {
        rejectUnauthorized: false
      },
      secure: false,
      requireTLS: true
    });

    this.verifyConnection().catch(() => {
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service conectado correctamente');
      return true;
    } catch (error) {
      if (error.code === 'EAUTH') {
        console.error('❌ Error de autenticación de email. Verifica:');
        console.error('   1. Que EMAIL_USER sea correcto');
        console.error('   2. Que EMAIL_PASS sea una App Password válida (no tu contraseña normal)');
        console.error('   3. Que tengas la verificación en 2 pasos activada en Gmail');
        console.error('   4. Que hayas generado una nueva App Password si la anterior expiró');
      } else {
        console.error('❌ Error al verificar conexión de email:', error.message);
      }
      return false;
    }
  }

  async sendOrderConfirmation(order, customerEmail) {
    try {
      if (!customerEmail) {
        throw new Error('No se proporcionó un email de destino');
      }

      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim().replace(/\s+/g, '') : '';
      
      if (!emailUser || !emailPass) {
        throw new Error('Las credenciales de email no están configuradas en el archivo .env');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: false
        },
        secure: false,
        requireTLS: true
      });


      const customerName = order.shippingAddress?.name || order.user?.displayName || 'Cliente';
      const orderDate = new Date(order.createdAt || Date.now());
      const formattedDate = orderDate.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const orderItems = order.products.map(item => {
        const productName = item.productId?.name || 'Producto';
        const quantity = item.quantity || 0;
        const price = item.price || 0;
        const subtotal = price * quantity;
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${productName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">${quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">$${price.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">$${subtotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const subtotal = order.products.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      const shippingCost = order.shippingCost || 0;
      const total = order.totalPrice || 0;

      const shippingInfo = order.shippingAddress ? `
        <p style="margin: 5px 0;"><strong>Dirección:</strong> ${order.shippingAddress.address || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Ciudad:</strong> ${order.shippingAddress.city || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Estado:</strong> ${order.shippingAddress.state || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Código Postal:</strong> ${order.shippingAddress.postalCode || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>País:</strong> ${order.shippingAddress.country || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${order.shippingAddress.phone || 'N/A'}</p>
      ` : '<p>No disponible</p>';

      let paymentInfo = 'No especificado';
      if (order.paymentMethod) {
        if (order.paymentMethod.type === 'credit_card' && order.paymentMethod.cardNumber) {
          const cardNumber = order.paymentMethod.cardNumber.replace(/\s/g, '');
          const last4 = cardNumber.slice(-4);
          paymentInfo = `Tarjeta de crédito/débito terminada en ****${last4}`;
          if (order.paymentMethod.cardHolderName) {
            paymentInfo += ` - ${order.paymentMethod.cardHolderName}`;
          }
        } else if (order.paymentMethod.type === 'paypal' && order.paymentMethod.paypalEmail) {
          paymentInfo = `PayPal: ${order.paymentMethod.paypalEmail}`;
        } else {
          paymentInfo = order.paymentMethod.type || 'No especificado';
        }
      }

      const statusMap = {
        'pending': 'Pendiente',
        'processing': 'En Proceso',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
      };
      const paymentStatusMap = {
        'pending': 'Pendiente',
        'paid': 'Pagado',
        'failed': 'Fallido',
        'refunded': 'Reembolsado'
      };
      const orderStatus = statusMap[order.status] || order.status;
      const paymentStatus = paymentStatusMap[order.paymentStatus] || order.paymentStatus;

      const emailFrom = process.env.EMAIL_USER || 'tu-email@gmail.com';
      const logoUrl = process.env.LOGO_URL || 'https://via.placeholder.com/200x80/667eea/ffffff?text=Dulceria+Yankee';

      const mailOptions = {
        from: `"Dulcería Yankee" <${emailFrom}>`,
        to: customerEmail,
        subject: `Confirmación de Pedido #${order._id.toString().slice(-8)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @media only screen and (max-width: 600px) {
                .email-container { width: 100% !important; }
                .logo { max-width: 150px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header con Logo -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <img src="${logoUrl}" alt="Dulcería Yankee" style="max-width: 200px; height: auto; margin-bottom: 20px; background-color: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;" class="logo">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">¡Gracias por tu compra!</h1>
                <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Tu pedido ha sido confirmado exitosamente</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                  <p style="color: #2c3e50; font-size: 18px; line-height: 1.8; margin: 0 0 10px 0;">Hola <strong style="color: #667eea;">${customerName}</strong>,</p>
                  <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0;">Tu pedido ha sido confirmado exitosamente. Aquí están los detalles completos de tu compra:</p>
            </div>

                <!-- Detalles del Pedido -->
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: bold; display: flex; align-items: center;">
                    <span style="background-color: #667eea; color: white; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                    Detalles del Pedido
                  </h3>
                  <div style="display: grid; gap: 12px;">
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Número de Pedido:</strong> 
                      <span style="color: #667eea; font-weight: bold; font-size: 16px;">#${order._id.toString().slice(-8)}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Fecha:</strong> 
                      <span style="color: #555555;">${formattedDate}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Estado:</strong> 
                      <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${orderStatus}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Estado de Pago:</strong> 
                      <span style="background-color: #28a745; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${paymentStatus}</span>
                    </p>
                  </div>
                </div>

                <!-- Productos -->
                <div style="margin: 25px 0;">
                  <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 22px; font-weight: bold; display: flex; align-items: center;">
                    <span style="background-color: #667eea; color: white; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                    Productos
                  </h3>
                  <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                          <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px;">Producto</th>
                          <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">Cantidad</th>
                          <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 14px;">Precio Unit.</th>
                          <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 14px;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${orderItems}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3" style="padding: 15px; text-align: right; font-weight: 600; font-size: 15px; color: #555555; border-top: 2px solid #e9ecef;">Subtotal:</td>
                          <td style="padding: 15px; text-align: right; font-weight: 600; font-size: 15px; color: #2c3e50; border-top: 2px solid #e9ecef;">$${subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; font-size: 15px; color: #555555;">Envío:</td>
                          <td style="padding: 12px; text-align: right; font-weight: 600; font-size: 15px; color: #2c3e50;">$${shippingCost.toFixed(2)}</td>
                        </tr>
                        <tr style="background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);">
                          <td colspan="3" style="padding: 18px; text-align: right; font-weight: bold; font-size: 20px; color: #2c3e50;">Total:</td>
                          <td style="padding: 18px; text-align: right; font-weight: bold; font-size: 20px; color: #28a745;">$${total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <!-- Dirección de Envío y Método de Pago en Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
                  <!-- Dirección de Envío -->
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: bold; display: flex; align-items: center;">
                      <span style="background-color: #28a745; color: white; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                      Dirección de Envío
                    </h3>
                    ${shippingInfo}
            </div>

                  <!-- Método de Pago -->
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #ffc107; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: bold; display: flex; align-items: center;">
                      <span style="background-color: #ffc107; color: white; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                      Método de Pago
                    </h3>
                    <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">${paymentInfo}</p>
                  </div>
            </div>

                <!-- Mensaje Final -->
                <div style="background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px solid #28a745;">
                  <p style="color: #2c3e50; font-size: 18px; margin: 0 0 10px 0; font-weight: bold;">✨ Te mantendremos informado sobre el estado de tu pedido</p>
                  <p style="color: #555555; font-size: 16px; margin: 0;">¡Gracias por elegirnos! 🎉</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center;">
                <img src="${logoUrl}" alt="Dulcería Yankee" style="max-width: 120px; height: auto; margin-bottom: 15px; opacity: 0.9;" class="logo">
                <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Dulcería Yankee</p>
                <p style="color: #b0b0b0; margin: 0; font-size: 12px; line-height: 1.6;">Este es un correo automático, por favor no respondas a este mensaje.<br>Si tienes alguna pregunta, contáctanos a través de nuestro sitio web.</p>
              </div>
          </div>
          </body>
          </html>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email de confirmación enviado a:', customerEmail);
      return result;
    } catch (error) {
      console.error('Error enviando email de confirmación:', error.message);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'tu-email@gmail.com',
        to: userEmail,
        subject: '¡Bienvenido a nuestra tienda!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">¡Bienvenido, ${userName}!</h2>
            <p>Gracias por registrarte en nuestra tienda.</p>
            <p>Ahora puedes disfrutar de todos nuestros productos y ofertas especiales.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">¿Qué puedes hacer ahora?</h3>
              <ul>
                <li>Explorar nuestros productos</li>
                <li>Agregar productos a tu carrito</li>
                <li>Realizar pedidos</li>
                <li>Gestionar tu perfil</li>
              </ul>
            </div>

            <p>¡Esperamos que disfrutes tu experiencia de compra!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 12px;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de bienvenida enviado exitosamente:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
      throw error;
    }
  }

  async sendOrderStatusUpdate(order, customerEmail, newStatus, oldStatus) {
    try {
      if (!customerEmail) {
        throw new Error('No se proporcionó un email de destino');
      }

      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim().replace(/\s+/g, '') : '';
      
      if (!emailUser || !emailPass) {
        throw new Error('Las credenciales de email no están configuradas en el archivo .env');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: false
        },
        secure: false,
        requireTLS: true
      });

      const customerName = order.shippingAddress?.name || order.user?.displayName || 'Cliente';
      const orderDate = new Date(order.createdAt || Date.now());
      const formattedDate = orderDate.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusMap = {
        'pending': 'Pendiente',
        'processing': 'En Proceso',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
      };

      const newStatusText = statusMap[newStatus] || newStatus;
      const oldStatusText = statusMap[oldStatus] || oldStatus;

      let statusMessage = '';
      let statusColor = '#667eea';
      let statusIcon = '📦';

      switch (newStatus) {
        case 'processing':
          statusMessage = 'Tu pedido está siendo procesado y preparado para el envío.';
          statusColor = '#17a2b8';
          statusIcon = '⚙️';
          break;
        case 'shipped':
          statusMessage = '¡Tu pedido ha sido enviado! Pronto recibirás más información sobre el seguimiento.';
          statusColor = '#007bff';
          statusIcon = '🚚';
          break;
        case 'delivered':
          statusMessage = '¡Tu pedido ha sido entregado! Esperamos que disfrutes tus productos.';
          statusColor = '#28a745';
          statusIcon = '✅';
          break;
        case 'cancelled':
          statusMessage = 'Tu pedido ha sido cancelado. Si tienes alguna pregunta, contáctanos.';
          statusColor = '#dc3545';
          statusIcon = '❌';
          break;
        default:
          statusMessage = 'El estado de tu pedido ha sido actualizado.';
      }

      const emailFrom = process.env.EMAIL_USER || 'tu-email@gmail.com';
      const logoUrl = process.env.LOGO_URL || 'https://via.placeholder.com/200x80/667eea/ffffff?text=Dulceria+Yankee';

      const mailOptions = {
        from: `"Dulcería Yankee" <${emailFrom}>`,
        to: customerEmail,
        subject: `Actualización de Pedido #${order._id.toString().slice(-8)} - ${newStatusText}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @media only screen and (max-width: 600px) {
                .email-container { width: 100% !important; }
                .logo { max-width: 150px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header con Logo -->
              <div style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 40px 30px; text-align: center;">
                <img src="${logoUrl}" alt="Dulcería Yankee" style="max-width: 200px; height: auto; margin-bottom: 20px; background-color: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;" class="logo">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  ${statusIcon} Actualización de Pedido
                </h1>
                <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">El estado de tu pedido ha cambiado</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                  <p style="color: #2c3e50; font-size: 18px; line-height: 1.8; margin: 0 0 10px 0;">Hola <strong style="color: ${statusColor};">${customerName}</strong>,</p>
                  <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0;">${statusMessage}</p>
                </div>

                <!-- Estado del Pedido -->
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid ${statusColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: bold; display: flex; align-items: center;">
                    <span style="background-color: ${statusColor}; color: white; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                    Información del Pedido
                  </h3>
                  <div style="display: grid; gap: 12px;">
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Número de Pedido:</strong> 
                      <span style="color: ${statusColor}; font-weight: bold; font-size: 16px;">#${order._id.toString().slice(-8)}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Fecha:</strong> 
                      <span style="color: #555555;">${formattedDate}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Estado Anterior:</strong> 
                      <span style="background-color: #6c757d; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${oldStatusText}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Estado Actual:</strong> 
                      <span style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${newStatusText}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Total:</strong> 
                      <span style="color: #28a745; font-weight: bold; font-size: 16px;">$${(order.totalPrice || 0).toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                <!-- Mensaje Final -->
                <div style="background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px solid #28a745;">
                  <p style="color: #2c3e50; font-size: 18px; margin: 0 0 10px 0; font-weight: bold;">✨ Te mantendremos informado sobre cualquier cambio</p>
                  <p style="color: #555555; font-size: 16px; margin: 0;">Si tienes alguna pregunta, no dudes en contactarnos. 🎉</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center;">
                <img src="${logoUrl}" alt="Dulcería Yankee" style="max-width: 120px; height: auto; margin-bottom: 15px; opacity: 0.9;" class="logo">
                <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Dulcería Yankee</p>
                <p style="color: #b0b0b0; margin: 0; font-size: 12px; line-height: 1.6;">Este es un correo automático, por favor no respondas a este mensaje.<br>Si tienes alguna pregunta, contáctanos a través de nuestro sitio web.</p>
              </div>
          </div>
          </body>
          </html>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email de actualización de estado enviado a:', customerEmail);
      return result;
    } catch (error) {
      console.error('Error enviando email de actualización de estado:', error.message);
      throw error;
    }
  }

  async sendOrderNotificationToAdmin(order, customerEmail, customerName) {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim().replace(/\s+/g, '') : '';
      
      if (!emailUser || !emailPass) {
        throw new Error('Las credenciales de email no están configuradas en el archivo .env');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: false
        },
        secure: false,
        requireTLS: true
      });

      const orderDate = new Date(order.createdAt || Date.now());
      const formattedDate = orderDate.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const orderItems = order.products.map(item => {
        const productName = item.productId?.name || 'Producto';
        const quantity = item.quantity || 0;
        const price = item.price || 0;
        const subtotal = price * quantity;
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${productName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: center;">${quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">$${price.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">$${subtotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const subtotal = order.products.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      const shippingCost = order.shippingCost || 0;
      const total = order.totalPrice || 0;

      const shippingInfo = order.shippingAddress ? `
        <p style="margin: 8px 0;"><strong>Dirección:</strong> ${order.shippingAddress.address || 'N/A'}</p>
        <p style="margin: 8px 0;"><strong>Ciudad:</strong> ${order.shippingAddress.city || 'N/A'}</p>
        <p style="margin: 8px 0;"><strong>Estado:</strong> ${order.shippingAddress.state || 'N/A'}</p>
        <p style="margin: 8px 0;"><strong>Código Postal:</strong> ${order.shippingAddress.postalCode || 'N/A'}</p>
        <p style="margin: 8px 0;"><strong>País:</strong> ${order.shippingAddress.country || 'N/A'}</p>
        <p style="margin: 8px 0;"><strong>Teléfono:</strong> ${order.shippingAddress.phone || 'N/A'}</p>
      ` : '<p>No disponible</p>';

      let paymentInfo = 'No especificado';
      if (order.paymentMethod) {
        if (order.paymentMethod.type === 'credit_card' && order.paymentMethod.cardNumber) {
          const cardNumber = order.paymentMethod.cardNumber.replace(/\s/g, '');
          const last4 = cardNumber.slice(-4);
          paymentInfo = `Tarjeta de crédito/débito terminada en ****${last4}`;
          if (order.paymentMethod.cardHolderName) {
            paymentInfo += ` - ${order.paymentMethod.cardHolderName}`;
          }
        } else if (order.paymentMethod.type === 'paypal' && order.paymentMethod.paypalEmail) {
          paymentInfo = `PayPal: ${order.paymentMethod.paypalEmail}`;
        } else {
          paymentInfo = order.paymentMethod.type || 'No especificado';
        }
      }

      const statusMap = {
        'pending': 'Pendiente',
        'processing': 'En Proceso',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
      };
      const paymentStatusMap = {
        'pending': 'Pendiente',
        'paid': 'Pagado',
        'failed': 'Fallido',
        'refunded': 'Reembolsado'
      };
      const orderStatus = statusMap[order.status] || order.status;
      const paymentStatus = paymentStatusMap[order.paymentStatus] || order.paymentStatus;

      const logoUrl = process.env.LOGO_URL || 'https://via.placeholder.com/200x80/667eea/ffffff?text=Dulceria+Yankee';

      const mailOptions = {
        from: `"Dulcería Yankee - Sistema" <${emailUser}>`,
        to: emailUser,
        subject: `Nueva Orden #${order._id.toString().slice(-8)} - ${customerName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @media only screen and (max-width: 600px) {
                .email-container { width: 100% !important; }
                .logo { max-width: 150px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center;">
                <img src="${logoUrl}" alt="Dulcería Yankee" style="max-width: 200px; height: auto; margin-bottom: 20px; background-color: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;" class="logo">
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🛒 Nueva Orden Recibida</h1>
                <p style="color: #ffffff; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Se ha registrado un nuevo pedido</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <!-- Información del Cliente -->
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid #dc3545; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: bold; display: flex; align-items: center;">
                    <span style="background-color: #dc3545; color: white; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                    Información del Cliente
                  </h3>
                  <div style="display: grid; gap: 12px;">
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">ID de Orden:</strong> 
                      <span style="color: #dc3545; font-weight: bold; font-size: 16px; font-family: monospace;">${order._id.toString()}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Nombre:</strong> 
                      <span style="color: #555555;">${customerName}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Correo:</strong> 
                      <span style="color: #667eea; font-weight: 600;">${customerEmail}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Fecha:</strong> 
                      <span style="color: #555555;">${formattedDate}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Estado:</strong> 
                      <span style="background-color: #667eea; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${orderStatus}</span>
                    </p>
                    <p style="margin: 0; color: #555555; font-size: 15px;">
                      <strong style="color: #2c3e50; display: inline-block; min-width: 140px;">Estado de Pago:</strong> 
                      <span style="background-color: #28a745; color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${paymentStatus}</span>
                    </p>
                  </div>
                </div>

                <!-- Productos -->
                <div style="margin: 25px 0;">
                  <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 22px; font-weight: bold; display: flex; align-items: center;">
                    <span style="background-color: #667eea; color: white; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 10px;"></span>
                    Detalle de la Orden
                  </h3>
                  <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                          <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px;">Producto</th>
                          <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">Cantidad</th>
                          <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 14px;">Precio Unit.</th>
                          <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 14px;">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${orderItems}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3" style="padding: 15px; text-align: right; font-weight: 600; font-size: 15px; color: #555555; border-top: 2px solid #e9ecef;">Subtotal:</td>
                          <td style="padding: 15px; text-align: right; font-weight: 600; font-size: 15px; color: #2c3e50; border-top: 2px solid #e9ecef;">$${subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; font-size: 15px; color: #555555;">Envío:</td>
                          <td style="padding: 12px; text-align: right; font-weight: 600; font-size: 15px; color: #2c3e50;">$${shippingCost.toFixed(2)}</td>
                        </tr>
                        <tr style="background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);">
                          <td colspan="3" style="padding: 18px; text-align: right; font-weight: bold; font-size: 20px; color: #2c3e50;">Total:</td>
                          <td style="padding: 18px; text-align: right; font-weight: bold; font-size: 20px; color: #28a745;">$${total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <!-- Dirección y Pago -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: bold;">Dirección de Envío</h3>
                    ${shippingInfo}
                  </div>
                  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 25px; border-radius: 12px; border-left: 5px solid #ffc107; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: bold;">Método de Pago</h3>
                    <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">${paymentInfo}</p>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 30px; text-align: center;">
                <img src="${logoUrl}" alt="Dulcería Yankee" style="max-width: 120px; height: auto; margin-bottom: 15px; opacity: 0.9;" class="logo">
                <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Dulcería Yankee - Sistema de Notificaciones</p>
                <p style="color: #b0b0b0; margin: 0; font-size: 12px; line-height: 1.6;">Este es un correo automático del sistema.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error enviando notificación al admin:', error.message);
      throw error;
    }
  }
}

const emailService = new EmailService();
export default emailService;
