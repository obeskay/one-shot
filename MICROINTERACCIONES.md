# Microinteracciones Elegantes - One Shot

Implementación completa de microinteracciones sutiles y elegantes para mejorar la experiencia de usuario sin librerías externas.

## Resumen de Cambios

- **5 componentes UI mejorados** con microinteracciones elegantes
- **Transiciones de 150-200ms** para respuesta rápida
- **Animaciones nativas de Tailwind CSS** sin dependencias externas
- **Accesibilidad completa** con soporte para `prefers-reduced-motion`
- **0 librerías agregadas** - solo CSS y Tailwind

---

## Componentes Actualizados

### 1. Button (components/ui/Button.tsx)

**Efectos implementados:**
- **Hover**: `scale(1.02)` con sombra sutil (`shadow-lg shadow-primary/10`)
- **Active**: `scale(0.98)` para feedback táctil
- **Transiciones**: `150ms ease-out` para respuesta rápida
- **Loading state**: Spinner animado integrado con `animate-spin`
- **Iconos**: Transición suave en transform

**Uso:**
```tsx
<Button variant="primary" isLoading={loading}>
  Enviar
</Button>
```

---

### 2. Input (components/ui/Input.tsx)

**Efectos implementados:**
- **Focus**: Ring azul sutil (`ring-1 ring-primary/30`) sin borde grueso
- **Placeholder**: Transición de opacidad (50% en focus)
- **Icono**: Cambio de color de `secondary` a `primary` en focus
- **Transiciones**: `200ms` para suavidad

**Uso:**
```tsx
<Input
  placeholder="Escribe aquí..."
  icon={<SearchIcon />}
/>
```

---

### 3. Card (components/ui/Card.tsx)

**Efectos implementados:**
- **Hover**: `scale(1.01)` + cambio de borde y fondo
- **Selección**: Checkmark animado con `zoom-in`
- **Props nuevas**: `selectable` y `selected`
- **Transiciones**: `200ms ease-out`

**Uso:**
```tsx
<Card
  selectable
  selected={isSelected}
  onClick={() => setSelected(!isSelected)}
>
  Contenido
</Card>
```

---

### 4. Modal (components/ui/Modal.tsx)

**Efectos implementados:**
- **Entrada**: `fade-in` + `zoom-in-95` + `slide-in-from-bottom-4`
- **Backdrop**: Blur animado con transición de `300ms`
- **Salida**: Suave con fade-out automático
- **Duración**: `200ms` para entrada rápida

**Características:**
- Backdrop con click para cerrar
- Escape key para cerrar
- Animaciones Tailwind CSS nativas

---

### 5. Toast (components/ui/Toast.tsx)

**Efectos implementados:**
- **Entrada**: `slide-in-from-top-4` con bounce sutil
- **Auto-dismiss**: Configurable (default: 5000ms)
- **Barra de progreso**: Animada con countdown visual
- **Botón cerrar**: `scale(1.1)` en hover, `scale(0.95)` en click
- **Duración**: `300ms ease-out`

**Uso:**
```tsx
<Toast
  type="success"
  message="operación exitosa"
  onClose={handleClose}
  duration={5000}
/>
```

**Props:**
- `duration`: Tiempo antes de auto-cerrar (ms)
- Barra de progreso color-coded por tipo

---

## Animaciones Globales (index.css)

### Keyframes personalizados:
- `bounce-in`: Entrada desde arriba con rebote sutil
- `zoom-in`: Escala desde 0.8 a 1.0

### Clases de utilidad:
- `.animate-bounce-in`: Aplicar bounce-in
- `.animate-zoom-in`: Aplicar zoom-in

### Optimizaciones:
- `will-change` para mejor performance
- Reset automático de `will-change` después de animación
- Soporte para `prefers-reduced-motion`

---

## Animaciones Tailwind Existentes Utilizadas

El proyecto usa las siguientes animaciones configuradas en `index.html`:

- `animate-reveal`: Fade + slide desde abajo (800ms expo)
- `animate-fade-in`: Simple fade (400ms ease-out)
- `animate-spin`: Rotación continua (para loaders)

**Además se usan las animaciones nativas de Tailwind:**
- `animate-in`: Animación de entrada genérica
- `fade-in`: Fade simple
- `zoom-in-95`: Zoom desde 95%
- `slide-in-from-top-4`: Deslizar desde arriba 16px
- `slide-in-from-bottom-4`: Deslizar desde abajo 16px

---

## Timing y Duraciones

| Componente | Duración | Easing | Uso |
|------------|----------|---------|-----|
| Button hover | 150ms | ease-out | Respuesta rápida |
| Button active | 150ms | ease-out | Feedback táctil |
| Input focus | 200ms | ease-out | Transición suave |
| Card hover | 200ms | ease-out | Selección visual |
| Modal entrada | 200ms | ease-out | Aparición rápida |
| Toast entrada | 300ms | ease-out | Notificación visible |
| Toast progreso | 75ms | linear | Countdown preciso |

---

## Principios de Diseño

1. **Rapidez**: Transiciones de 150-200ms para respuesta inmediata
2. **Sutileza**: Escalas pequeñas (1.01-1.02) para elegancia
3. **Consistencia**: `ease-out` para la mayoría de interacciones
4. **Feedback**: Escalas activas (0.98) para confirmación táctil
5. **Accesibilidad**: Soporte para `prefers-reduced-motion`

---

## Notas Técnicas

- **No se agregaron librerías externas**: Solo Tailwind CSS y CSS vanilla
- **Performance**: Uso de `will-change` para animaciones suaves
- **Browser support**: Animaciones CSS3 modernas
- **Accesibilidad**: Todas las animaciones respetan `prefers-reduced-motion`
