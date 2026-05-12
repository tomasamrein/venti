# Guía de uso de Ventix

Esta guía cubre el uso completo del sistema desde el primer ingreso hasta operación diaria.

## Índice

1. [Primer ingreso y onboarding](#1-primer-ingreso-y-onboarding)
2. [Punto de venta (POS)](#2-punto-de-venta-pos)
3. [Productos y stock](#3-productos-y-stock)
4. [Caja](#4-caja)
5. [Clientes y cuentas corrientes](#5-clientes-y-cuentas-corrientes)
6. [Proveedores y compras](#6-proveedores-y-compras)
7. [Facturación ARCA](#7-facturación-arca)
8. [Ventas y reportes](#8-ventas-y-reportes)
9. [Equipo y sucursales](#9-equipo-y-sucursales)
10. [Suscripción](#10-suscripción)
11. [Modo offline / PWA](#11-modo-offline--pwa)
12. [Preguntas frecuentes](#12-preguntas-frecuentes)

---

## 1. Primer ingreso y onboarding

Al registrarte creás tu cuenta, tu organización y tu primera sucursal en un solo flujo de 3 pasos. Inmediatamente tenés acceso al **trial gratuito de 14 días** con todas las funcionalidades del plan Simple, sin tarjeta de crédito.

El **panel principal** te muestra una guía de primeros pasos:

1. Agregá tu primer producto
2. Abrí tu primera caja
3. Realizá tu primera venta

La guía desaparece automáticamente al completar los 3 pasos.

**Recordar cuenta**: al iniciar sesión, marcá "Recordar mi cuenta en este dispositivo" (viene tildado por defecto) para no tener que volver a loguearte cada vez. Desmarcalo si estás en una computadora prestada.

---

## 2. Punto de venta (POS)

Acceso: barra lateral → **Punto de Venta**.

### Cobrar una venta

1. Buscá el producto por nombre, código de barras o SKU (la barra superior)
2. O escaneá con el lector USB (auto-detecta cualquier escáner estándar)
3. O usá la cámara del celular tocando el ícono de cámara
4. O escaneá desde tu celular como **escáner remoto**: tocá el botón del celular en la parte inferior izquierda y escaneá el QR con tu teléfono
5. El producto se suma al carrito. Editá cantidad y descuentos por línea
6. Tocá **Cobrar** y elegí método de pago:
   - **Efectivo** — calculá vuelto automático
   - **Débito / Crédito / Transferencia / Mercado Pago**
   - **Cuenta corriente** — solo si el cliente tiene cuenta habilitada
   - **Mixto** — combinás varios métodos
7. La venta se completa, se descuenta el stock y se registra en la caja abierta

### Ventas en espera

Si llega otro cliente y necesitás dejar la venta pausada, tocá **Guardar en espera** con una etiqueta (ej: "Cliente con tarro azul"). La recuperás desde **POS → Espera** cuando vuelva.

### Ticket

Al completar, podés:
- **Imprimir** el ticket (CSS optimizado para impresoras térmicas)
- **Enviar por WhatsApp** — abre WhatsApp con el resumen pre-cargado

---

## 3. Productos y stock

Acceso: barra lateral → **Productos**.

### Crear producto

**Productos → Nuevo producto**. Campos:

- **Nombre** (obligatorio)
- **Código de barras** (único por organización — usalo para escanear)
- **SKU** (opcional, código interno)
- **Precio costo** y **Precio venta** (margen se calcula solo)
- **Stock actual** y **Stock mínimo** (para alertas)
- **Control de stock**: si lo desactivás, vendés sin descontar (servicios, etc.)
- **Permitir stock negativo**: vendés aunque no tengas stock
- **Categoría**, **Marca**, **Imagen**

### Importar desde Excel/CSV

**Productos → Importar CSV** o **Importar Excel**. Descargá la plantilla, llenala con todo tu catálogo y subila. Acepta cientos de productos de una vez.

### Actualización masiva de precios

**Productos → Actualizar precios**. Aplicás un porcentaje (+10%, -5%, etc.) sobre todos o filtrado por categoría. Queda registrado en el historial.

### Alertas de stock

En la lista de productos aparecen automáticamente dos contadores arriba: **Sin stock** y **Stock bajo**. Tocando cada uno filtrás. También se generan alertas en la campanita del top nav.

### Etiquetas

**Productos → Etiquetas**. Generás PDF de etiquetas con código de barras impreso (formato A4, varias por hoja).

---

## 4. Caja

Acceso: barra lateral → **Caja**.

### Abrir caja

Antes de vender, abrí caja con el monto inicial de efectivo. Solo puede haber **una caja abierta por sucursal** al mismo tiempo. Todas las ventas se registran contra esa caja.

### Movimientos durante el turno

- **Ventas en efectivo** → entran solas a caja
- **Gastos desde caja** → tocá "Registrar gasto" durante el turno
- **Depósitos / Retiros** manuales

### Cerrar caja

Al final del turno, tocá **Cerrar caja**. Vas a ver:

- Monto esperado (apertura + ventas en efectivo − gastos − retiros)
- Campo para contar el efectivo real
- Diferencia automática (positiva o negativa)
- Notas para explicar diferencias

El historial queda en **Caja → Historial**.

---

## 5. Clientes y cuentas corrientes

Acceso: barra lateral → **Clientes**.

### Crear cliente

**Clientes → Nuevo**. Si activás **Cuenta corriente**, podés:

- Cargarle ventas a fiado desde el POS
- Registrarle pagos a cuenta
- Ver saldo e historial completo

### Cargar venta a cuenta corriente

En el POS, al cobrar elegí **Cuenta corriente** y seleccioná el cliente. El monto se suma a su saldo.

### Registrar un pago

**Cuentas corrientes → [cliente] → Registrar pago**. Indicás el monto y método (efectivo, transferencia, etc.). El saldo se actualiza solo y queda registrado.

### Enviar estado de cuenta por WhatsApp

Desde el detalle del cliente, tocá **Enviar por WhatsApp**. Se abre con el resumen del saldo y últimos movimientos pre-cargados.

---

## 6. Proveedores y compras

Acceso: barra lateral → **Proveedores** (solo plan Con Facturación).

### Vincular productos a proveedores

Desde el detalle del proveedor, agregás los productos que te vende, con su SKU del proveedor y precio. Marcás uno como **principal** por producto.

### Compras sugeridas

**Compras sugeridas** te muestra automáticamente qué productos tenés con stock bajo y los agrupa por proveedor principal. Tocás **Enviar pedido por WhatsApp** y se abre el chat con el proveedor con la lista pre-armada.

---

## 7. Facturación ARCA

Acceso: barra lateral → **Facturación** (plan Con Facturación).

### Configuración inicial (una sola vez)

**Configuración → Facturación ARCA**:

1. Subí tu **certificado fiscal** (.crt) y **clave privada** (.key) — generados desde el portal de ARCA con tu CUIT
2. Cargá tu **punto de venta** (debe estar habilitado para web services en ARCA)
3. Elegí ambiente: **Homologación** (pruebas) o **Producción** (real)
4. Guardá. El certificado se guarda encriptado en Supabase Vault

### Emitir factura

Tres caminos:
- **Desde una venta**: en el detalle de la venta, tocá "Generar factura"
- **Desde Facturación → Nueva**: cargás manualmente
- **Automática**: configurable por cliente (si tiene CUIT)

Elegís tipo:
- **Factura A** — cliente con CUIT (responsable inscripto)
- **Factura B** — consumidor final con DNI/CUIT
- **Factura C** — solo monotributistas, sin discriminar IVA
- **Ticket no fiscal** — sin valor fiscal

Al confirmar, Ventix:
1. Pide token a WSAA (cacheado 12h)
2. Solicita CAE a WSFEv1
3. Genera PDF con QR fiscal estándar ARCA
4. Sube a Supabase Storage
5. Te ofrece compartir por WhatsApp

### Problemas comunes

- **"Certificado vencido"** → renová el certificado desde el portal de ARCA
- **"Punto de venta inválido"** → habilitalo para web services en ARCA
- **"CAE no autorizado"** → revisá que el CUIT del cliente esté bien para Factura A
- **Ambiente Homologación** no genera facturas con validez fiscal — usá producción para real

---

## 8. Ventas y reportes

### Historial de ventas

**Ventas** (barra lateral). Filtrás por fecha, cliente, método de pago, cajero. Tocás una venta para ver el detalle, anular o generar factura.

### Anular venta

Desde el detalle, **Anular**. Repone el stock, reversa la caja y, si tenía factura, genera nota de crédito.

### Reportes (plan Con Facturación)

**Reportes**:

- **Ventas**: por día/semana/mes, breakdown por método de pago, gráfico de ventas por hora
- **Stock**: stock actual valorizado, productos sin stock, productos vendidos por período
- **Caja**: sesiones cerradas, diferencias, breakdown por cajero
- **Gastos**: por categoría, por proveedor, por sucursal

Todo exportable a **CSV** y **Excel**.

---

## 9. Equipo y sucursales

### Sucursales (plan Con Facturación)

**Configuración → Sucursales**. Agregás sucursales con nombre, dirección y la marcás como **principal** (solo una). Cada sucursal tiene su propio stock y caja.

### Equipo

**Configuración → Equipo**. Invitás usuarios por email. Roles:

- **Owner**: control total, incluyendo sucursales y suscripción
- **Admin**: gestiona productos, clientes, proveedores, ve reportes
- **Cashier (cajero)**: solo POS, caja y ver clientes — no edita precios ni ve reportes

El invitado recibe un email con link de activación. Al aceptar, crea su cuenta y queda vinculado a la sucursal que le asignaste.

---

## 10. Suscripción

**Configuración → Suscripción**. Ves tu plan actual, fecha del próximo cobro y los días restantes de trial.

### Cambiar plan

Tocás el plan al que querés pasar y se abre Mercado Pago para autorizar la suscripción. Los primeros 3 meses son al precio promocional, después pasa al precio regular.

### Cancelar

Contactanos por WhatsApp o email para cancelar. Sin permanencia. Cancelás cuando quieras.

---

## 11. Modo offline / PWA

### Instalar en el celular

- **Android (Chrome)**: tocá el menú (3 puntos) → "Instalar aplicación"
- **iPhone (Safari)**: tocá el botón compartir → "Añadir a pantalla de inicio"

### Modo offline

Ventix funciona sin internet:

- Las **ventas en efectivo** y el **cobro con cuenta corriente** funcionan offline
- El **stock** se descuenta localmente y se sincroniza al volver la conexión
- Las **ventas en espera** se guardan en el dispositivo
- Aparece un **banner naranja** cuando estás offline

**Requisitos**:
- Abrí el POS al menos una vez con internet antes (precarga catálogo y caja)
- No reinicies el celular mientras estás offline (los datos pendientes se conservan, pero es más seguro)

Al volver la conexión, la cola de sincronización se drena sola en segundo plano.

---

## 12. Preguntas frecuentes

**¿Necesito instalar algo?**
No. Funciona en el navegador. Opcionalmente lo instalás como app desde el celular.

**¿Sirve con cualquier lector de código de barras?**
Sí. Funciona con cualquier escáner USB que actúe como teclado (que es el 99% de los del mercado).

**¿Pierdo datos si se corta internet en medio de una venta?**
No. La venta queda guardada localmente y se sincroniza al volver.

**¿Cómo invito a un empleado?**
Configuración → Equipo → Invitar. Le mandamos un email con el link.

**¿Olvidé mi contraseña?**
En el login, "¿Olvidaste tu contraseña?" → te enviamos un link al email.

**¿Mis datos están seguros?**
Sí. Cada negocio (organización) tiene sus datos aislados con políticas RLS en Postgres. Nadie más que tu equipo puede ver tu información. Los certificados de ARCA se guardan encriptados.

**¿Puedo tener varios cajeros al mismo tiempo en sucursales distintas?**
Sí, cada sucursal tiene su propia caja independiente.

**¿Qué pasa al finalizar el trial?**
Te avisamos por email. Si no contratás plan, el acceso queda limitado al login y la sección de suscripción. Tus datos se conservan.

**¿Atienden por WhatsApp?**
Sí, y también tenés el **chatbot IA** dentro del sistema (botón flotante abajo a la derecha) que responde cualquier duda del sistema al instante, 24/7.
