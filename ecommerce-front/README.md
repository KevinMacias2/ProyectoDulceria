# Mini Ecommerce Angular

Este proyecto es una evaluación final para estudiantes del curso de Angular. Consiste en crear una aplicación base de ecommerce utilizando `localStorage` como fuente de datos.

## 🌟 Objetivo

Demostrar el dominio de los conceptos vistos durante el curso mediante la creación de una aplicación funcional que incluya:

- Vista de productos
- Vista del carrito
- Vista de checkout
- Vista de confirmación de compra

---

## ✅ Qué se espera que hagas

1. Haz un **fork** de este repositorio:
   [https://github.com/Inadaptados/2025-1-ecommerce](https://github.com/Inadaptados/2025-1-ecommerce)
2. Clona tu fork:
   ```bash
   git clone https://github.com/<tu-usuario>/2025-1-ecommerce.git
   cd 2025-1-ecommerce
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el proyecto:
   ```bash
   ng serve
   ```
5. Crea las siguientes vistas:
   - `/productos`: Muestra una lista de productos.
   - `/carrito`: Muestra los productos agregados.
   - `/checkout`: Formulario para ingresar datos del comprador.
   - `/confirmacion`: Muestra un resumen de la compra.
6. Usa `localStorage` únicamente para persistir el comprobante de compra que retorna el backend (voucher) y cualquier estado mínimo necesario para mostrar la confirmación.
7. Sube tus cambios a tu repositorio.
8. Entrega el link de tu repositorio.

---

## 🧪 Pruebas

### Unitarias

```bash
npm run test
```

### E2E con Cypress

1. Ejecuta el backend en `http://localhost:3000`.
2. (Opcional) Exporta credenciales válidas antes de correr Cypress:

   ```bash
   set CYPRESS_testUserEmail=usuario@dominio.com
   set CYPRESS_testUserPassword=tuPassword
   ```

3. Corre las pruebas:

   ```bash
   npm run e2e      # modo headless
   npm run e2e:open # modo interactivo
   ```

## 📤 Publicar en GitHub Pages

> Esta sección es opcional y puede realizarse con apoyo del docente.

1. Asegúrate de que el proyecto esté compilado para producción:
   ```bash
   ng build --base-href "/2025-1-ecommerce/"
   ```
2. Instala el paquete para desplegar:
   ```bash
   ng add angular-cli-ghpages
   ```
3. Despliega el proyecto:
   ```bash
   npx angular-cli-ghpages --dir=dist/2025-1-ecommerce
   ```
4. Tu aplicación estará disponible en:
   ```
   https://<tu-usuario>.github.io/2025-1-ecommerce/
   ```

---

## 📊 Evaluación

| Criterio            | Peso |
| ------------------- | ---- |
| Data Binding        | 25%  |
| Directivas          | 25%  |
| Servicios           | 15%  |
| Ruteo               | 15%  |
| Uso de localStorage | 20%  |
| **Total**           | 100% |

---

## 📂 Estructura recomendada

```
src/
├── app/
│   ├──components/
│   │
│   ├──pages/
│   │   ├── product-list/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── confirmation/
│   ├── services/
│   │   ├── cart.service.ts
│   │   └── product.service.ts
│   └── app.routes.ts
```

---

## 📅 Fecha de entrega

La entrega del proyecto se realiza subiendo el código a GitHub y compartiendo el link con el equipo de Inadaptados antes del 23 de abril de 2025.

NOTA: Asegúrate de que tu repositorio sea público y que todo el código esté en la rama `main`.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 📧 Contacto

[Inadaptados](https://inadaptados.mx)

🚀 ¡Buena suerte y deja volar tu creatividad!
