# Instrucciones para el Agente (SORTEA)

Este archivo contiene las directrices fundamentales para el desarrollo y mantenimiento de la plataforma de rifas **Sortea**.

## 🚀 Contexto del Proyecto
- **Propósito:** Sistema de rifas diseñado para proyectos académicos (culminación de estudios de Ingeniería) y familiares.
- **Tecnologías:** Next.js, Tailwind CSS, Firebase (Firestore), Framer Motion, Zod.
- **Idioma:** Toda la comunicación con el usuario y los mensajes en la interfaz deben ser en **Español**.

## 🎨 Reglas de Diseño y UX (CRÍTICO)
- **Estética:** Mantener el diseño original minimalista basado en la paleta de colores de la escala **Zinc** (gris/negro) con acentos en **Amber** (ámbar/amarillo).
- **No Alterar:** No modificar márgenes, rellenos (paddings), redondeados (border-radius) ni tipografías sin aprobación explícita.
- **Interactividad:** Todos los elementos pulsables (botones, selectores, tarjetas de pago) DEBEN tener la clase `cursor-pointer`.
- **Scroll:** El proyecto usa **Lenis** para scroll suave. No implementar contenedores con scroll interno (`overflow-y-auto` con altura fija) en páginas principales para evitar conflictos.

## 🔐 Seguridad y Datos
- **Transacciones:** Las reservas de boletas deben usar siempre `runTransaction` de Firestore para garantizar atomicidad y evitar la venta duplicada de un mismo número.
- **Estructura de Boletas:** Soportar formato híbrido:
  - Antiguo: Campo `numero` (integer).
  - Actual/Preferido: Campo `"numeros boletas"` (array de integers).
- **Validación:** Usar **Zod** para validar todos los formularios antes de procesarlos.

## 🛠 Estándares de Ingeniería
- **Linter:** Después de cada modificación, ejecutar `npm run lint` para asegurar que no hay importaciones huérfanas ni errores de tipos.
- **Tipado:** Evitar el uso de `any`. Tipar correctamente los errores en bloques `catch` (preferiblemente `error: unknown` con validación de instancia).
- **Limpieza:** No dejar importaciones de iconos o librerías que no se utilicen en el código final.

---
*Nota: Lee siempre este archivo antes de proponer o ejecutar cambios estructurales.*
