# 🍭 API E-commerce - Dulcería

Esta es una API RESTful robusta y completa, construida con Node.js, Express y MongoDB, diseñada para manejar toda la lógica de backend de una tienda de dulces en línea.

---

## ✨ Características Principales

- 🔐 **Autenticación y Autorización con JWT**: Sistema seguro de registro y login que genera JSON Web Tokens.
- 🧑‍💼 **Gestión de Roles**: Distinción entre usuarios `admin` y `customer`, con rutas y permisos específicos para cada uno.
- 🛍️ **Gestión de Catálogo**: CRUD completo para `Productos` y `Categorías`, accesible solo para administradores.
- 👤 **Gestión de Perfiles**: Los usuarios pueden gestionar sus datos personales, direcciones de envío y métodos de pago.
- 🛒 **Carrito de Compras**: Funcionalidad de carrito de compras persistente por usuario.
- 📦 **Sistema de Órdenes**: Flujo completo para la creación y seguimiento de órdenes, vinculando productos, usuarios, dirección y pago.
- 📝 **Validaciones Robustas**: Uso de `express-validator` para validar todos los datos de entrada y garantizar la integridad de la información.
- 🔑 **Seguridad de Contraseñas**: Hasheo seguro de contraseñas utilizando `bcrypt`.
- ⚙️ **Manejo de Errores Centralizado**: Un `errorHandler` global que registra los errores en un archivo `logs/error.log` para una depuración eficiente.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB con Mongoose (ODM)
- **Autenticación**: JSON Web Tokens (JWT)
- **Seguridad**: bcrypt
- **Validación**: express-validator

---

## 📁 Estructura del Proyecto

El proyecto sigue una arquitectura por capas para una clara separación de responsabilidades, lo que lo hace escalable y fácil de mantener.

/
├── src/
│ ├── config/
│ ├── controllers/
│ ├── middlewares/
│ ├── models/
│ └── routes/
├── logs/
├── .env
└── server.js

---

## 🚀 Instalación y Puesta en Marcha

Sigue estos pasos para levantar el entorno de desarrollo local.

### **Prerrequisitos**

- Node.js (v18 o superior)
- npm
- MongoDB (instalado localmente o una instancia en la nube como MongoDB Atlas)

### **Pasos**

1.  **Clona el repositorio:**

    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd ecommerce-api
    ```

2.  **Instala las dependencias:**

    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**

    ```env
    # Puerto del servidor
    PORT=3000

    # URI de conexión de MongoDB
    MONGODB_URI=mongodb://localhost:27017/ecommerce-db

    # Secreto para firmar los JWT (genera uno largo y aleatorio)
    JWT_SECRET=tu_secreto_super_largo_y_aleatorio
    ```

4.  **Inicia el servidor en modo desarrollo:**

    ```bash
    npm run dev
    ```

5.  **Pobla la base de datos (Opcional):**
    Usa la colección de Postman proporcionada y el "Collection Runner" con los archivos de datos (`.json`) para crear 10 registros en cada entidad principal.

---

🗺️ API Endpoints

La URL base para todos los endpoints es `/api`.

### 🔑 Autenticación (`/auth`)

- `POST /register`
  - **Descripción:** Registra un nuevo usuario (cliente o admin).
  - **Protección:** Pública.
- `POST /login`
  - **Descripción:** Inicia sesión con email y contraseña.
  - **Protección:** Pública.
  - **Respuesta Exitosa:** Devuelve un JSON Web Token (JWT).

### 👤 Usuarios (`/users`)

- `GET /profile`
  - **Descripción:** Obtiene el perfil del usuario autenticado.
  - **Protección:** Cliente.
- `PUT /profile`
  - **Descripción:** Actualiza el perfil del usuario autenticado.
  - **Protección:** Cliente.
- `GET /`
  - **Descripción:** Obtiene una lista de todos los usuarios.
  - **Protección:** Admin.
- `GET /:id`
  - **Descripción:** Obtiene un usuario específico por su ID.
  - **Protección:** Admin.

### 🏷️ Categorías (`/category`)

- `GET /`
  - **Descripción:** Lista todas las categorías.
  - **Protección:** Pública.
- `POST /`
  - **Descripción:** Crea una nueva categoría.
  - **Protección:** Admin.
- `PUT /:id`
  - **Descripción:** Actualiza una categoría existente.
  - **Protección:** Admin.
- `DELETE /:id`
  - **Descripción:** Elimina una categoría.
  - **Protección:** Admin.

### 🍬 Productos (`/product`)

- `GET /`
  - **Descripción:** Lista todos los productos con paginación.
  - **Protección:** Pública.
- `POST /`
  - **Descripción:** Crea un nuevo producto.
  - **Protección:** Admin.
- `PUT /:id`
  - **Descripción:** Actualiza un producto existente.
  - **Protección:** Admin.
- `DELETE /:id`
  - **Descripción:** Elimina un producto.
  - **Protección:** Admin.

### 🛒 Carrito (`/cart`)

- `POST /add-product`
  - **Descripción:** Añade un producto al carrito del usuario.
  - **Protección:** Cliente.
- `GET /user/me`
  - **Descripción:** Obtiene el contenido del carrito del usuario.
  - **Protección:** Cliente.
- `DELETE /:id`
  - **Descripción:** Vacía el carrito del usuario usando el ID del carrito.
  - **Protección:** Cliente.

### 🏠 Direcciones de Envío (`/shipping-address`)

- `POST /`
  - **Descripción:** Crea una nueva dirección de envío para el usuario.
  - **Protección:** Cliente.
- `GET /`
  - **Descripción:** Obtiene todas las direcciones del usuario.
  - **Protección:** Cliente.
- `PUT /:id`
  - **Descripción:** Actualiza una dirección.
  - **Protección:** Cliente.
- `DELETE /:id`
  - **Descripción:** Elimina una dirección.
  - **Protección:** Cliente.
- `PATCH /:id/default`
  - **Descripción:** Marca una dirección como predeterminada.
  - **Protección:** Cliente.

### 💳 Métodos de Pago (`/payment-method`)

- `POST /`
  - **Descripción:** Crea un nuevo método de pago para el usuario.
  - **Protección:** Cliente.
- `GET /user/me`
  - **Descripción:** Obtiene todos los métodos de pago del usuario.
  - **Protección:** Cliente.
- `PUT /:id`
  - **Descripción:** Actualiza un método de pago.
  - **Protección:** Cliente.
- `DELETE /:id`
  - **Descripción:** Elimina un método de pago.
  - **Protección:** Cliente.
- `PATCH /:id/set-default`
  - **Descripción:** Marca un método de pago como predeterminado.
  - **Protección:** Cliente.
- `PATCH /:id/deactivate`
  - **Descripción:** Desactiva un método de pago.
  - **Protección:** Cliente.

### 📦 Órdenes (`/order`)

- `POST /`
  - **Descripción:** Crea una nueva orden a partir del carrito del usuario.
  - **Protección:** Cliente.
- `GET /my-orders`
  - **Descripción:** Obtiene el historial de órdenes del usuario.
  - **Protección:** Cliente.
- `GET /`
  - **Descripción:** Obtiene todas las órdenes del sistema.
  - **Protección:** Admin.
- `PATCH /:id/status`
  - **Descripción:** Actualiza el estado de una orden.
  - **Protección:** Admin.
