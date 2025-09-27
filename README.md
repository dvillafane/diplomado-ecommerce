# Tienda E-commerce

## Descripción

**Tienda E-commerce** es una aplicación web de comercio electrónico desarrollada con **React** y **Firebase**, diseñada para ofrecer una experiencia de compra en línea sencilla y eficiente. Permite a los usuarios explorar productos, filtrarlos por categoría o búsqueda, añadirlos al carrito, realizar pedidos y gestionar su historial de compras. Incluye un panel de administración protegido para gestionar productos, pedidos y códigos promocionales. La aplicación utiliza **Zustand** para la gestión del estado global, optimización con carga diferida, paginación y manejo de errores con **Sentry**.

---

## Características

- **Exploración de Productos**: Navega productos destacados, en oferta o populares, con filtros por categoría y búsqueda.
- **Carrito de Compras**: Añade, modifica o elimina productos, con validaciones de stock y aplicación de descuentos.
- **Códigos Promocionales**: Aplica códigos de descuento; los administradores pueden gestionarlos.
- **Gestión de Pedidos**: Revisa el historial de compras o administra pedidos desde el panel de administración.
- **Autenticación**: Registro, inicio de sesión y recuperación de contraseña mediante Firebase Authentication.
- **Panel de Administración**: Gestiona productos, pedidos y códigos promocionales (exclusivo para administradores).
- **Notificaciones por WhatsApp**: Envía mensajes con detalles de pedidos.

---

## Tecnologías

- **Frontend**: React, React Router, Bootstrap, react-helmet-async.
- **Gestión de Estado**: Zustand con persistencia local.
- **Backend**: Firebase Authentication, Firestore.
- **Monitoreo**: Sentry.
- **Utilidades**: Formateo de moneda (COP), notificaciones por WhatsApp.

---

## Requisitos Previos

- **Node.js** (v16+)
- **Firebase**: Proyecto con Authentication y Firestore habilitados
- **.env** con las siguientes variables:
  ```env
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  ```

---

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/dvillafane/diplomado-ecommerce
   cd diplomado-ecommerce
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env` con las credenciales de Firebase.

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## Uso

- **Usuarios**: Explora productos, filtra, añade al carrito, aplica códigos promocionales y realiza pedidos..
- **Administradores**: Accede para gestionar productos, pedidos y códigos promocionales.
- **Notificaciones**: Los pedidos generan mensajes de WhatsApp automáticos.
