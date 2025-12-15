# Ejemplos de Uso - Microinteracciones

Guía rápida para usar los componentes UI mejorados con microinteracciones.

---

## Button

### Uso Básico
```tsx
import { Button } from './components/ui/Button';

// Botón estándar con hover y active
<Button variant="primary" onClick={handleClick}>
  Enviar
</Button>

// Con estado de carga
<Button variant="primary" isLoading={isSubmitting}>
  Procesando...
</Button>

// Con icono
import { Save } from 'lucide-react';
<Button variant="secondary" icon={<Save size={16} />}>
  Guardar
</Button>

// Botón de solo icono
<Button variant="ghost" size="icon">
  <Settings size={18} />
</Button>
```

### Variantes Disponibles
- `primary`: Acción principal (bg primario)
- `secondary`: Acción secundaria (surface)
- `outline`: Transparente con borde
- `ghost`: Sin fondo ni borde
- `danger`: Acciones destructivas (rojo)

---

## Input

### Uso Básico
```tsx
import { Input } from './components/ui/Input';
import { Search, Mail, Lock } from 'lucide-react';

// Input simple con focus ring
<Input
  type="text"
  placeholder="buscar archivos..."
/>

// Con icono (animación en focus)
<Input
  type="email"
  placeholder="correo electrónico"
  icon={<Mail size={16} />}
/>

// Password con icono
<Input
  type="password"
  placeholder="contraseña"
  icon={<Lock size={16} />}
/>

// Search con icono y placeholder animado
<Input
  type="search"
  placeholder="buscar en el proyecto..."
  icon={<Search size={16} />}
/>
```

### Efectos Visuales
- Focus: Ring azul sutil aparece suavemente
- Placeholder: Se desvanece a 50% en focus
- Icono: Cambia de gris a blanco en focus

---

## Card

### Uso Básico
```tsx
import { Card } from './components/ui/Card';

// Card estático (sin hover)
<Card>
  <h3>Título</h3>
  <p>Contenido de la tarjeta</p>
</Card>

// Card clickeable (con hover)
<Card onClick={handleClick} hoverable>
  <h3>Tarjeta Clickeable</h3>
  <p>Haz click para interactuar</p>
</Card>

// Card seleccionable con checkmark
<Card
  selectable
  selected={isSelected}
  onClick={() => setSelected(!isSelected)}
>
  <h3>Seleccionable</h3>
  <p>Click para seleccionar</p>
</Card>

// Card con focus para teclado
<Card focusable hoverable>
  <h3>Navegable con teclado</h3>
  <p>Presiona Tab para enfocar</p>
</Card>
```

### Props Especiales
- `hoverable`: Activa efectos de hover
- `selectable`: Muestra checkmark cuando selected=true
- `selected`: Estado de selección
- `focusable`: Permite navegación con teclado

---

## Modal

### Uso Básico
```tsx
import { Modal } from './components/ui/Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="configuración"
      >
        <div className="space-y-4">
          <p>Contenido del modal aquí</p>
          <Button onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </>
  );
}
```

### Características
- **Entrada**: Zoom + slide desde abajo (200ms)
- **Backdrop**: Blur animado (300ms)
- **Cierre**: Click en backdrop, ESC, o botón X
- **Accesibilidad**: Focus trap, restore focus al cerrar

---

## Toast

### Uso Básico
```tsx
import { Toast } from './components/ui/Toast';
import { ToastContext } from './contexts/ToastContext';

// Usando el context (recomendado)
function MyComponent() {
  const { showToast } = useContext(ToastContext);

  const handleSuccess = () => {
    showToast('success', 'operación exitosa');
  };

  const handleError = () => {
    showToast('error', 'algo salió mal');
  };

  return (
    <>
      <Button onClick={handleSuccess}>Éxito</Button>
      <Button onClick={handleError}>Error</Button>
    </>
  );
}

// Uso directo (avanzado)
function ToastExample() {
  const [show, setShow] = useState(false);

  return show ? (
    <Toast
      type="success"
      message="archivo guardado correctamente"
      onClose={() => setShow(false)}
      duration={3000}
    />
  ) : null;
}
```

### Tipos Disponibles
- `success`: Verde, para confirmaciones
- `error`: Rojo, para errores
- `info`: Azul, para información

### Props
- `duration`: Tiempo antes de auto-cerrar (ms, default: 5000)
- `onClose`: Callback al cerrar
- Barra de progreso muestra countdown visual

---

## Ejemplo Completo

```tsx
import { useState, useContext } from 'react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Card } from './components/ui/Card';
import { Modal } from './components/ui/Modal';
import { ToastContext } from './contexts/ToastContext';
import { Save, Trash2 } from 'lucide-react';

function FormExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useContext(ToastContext);

  const handleSave = async () => {
    setLoading(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    showToast('success', 'cambios guardados');
    setIsOpen(false);
  };

  const options = [
    { id: 1, title: 'Opción 1' },
    { id: 2, title: 'Opción 2' },
    { id: 3, title: 'Opción 3' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Botones con microinteracciones */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => setIsOpen(true)}
          icon={<Save size={16} />}
        >
          Editar
        </Button>
        <Button
          variant="danger"
          icon={<Trash2 size={16} />}
        >
          Eliminar
        </Button>
      </div>

      {/* Cards seleccionables */}
      <div className="grid grid-cols-3 gap-4">
        {options.map(option => (
          <Card
            key={option.id}
            selectable
            selected={selected.includes(option.id)}
            onClick={() => {
              setSelected(prev =>
                prev.includes(option.id)
                  ? prev.filter(id => id !== option.id)
                  : [...prev, option.id]
              );
            }}
          >
            <h3 className="font-medium">{option.title}</h3>
            <p className="text-sm text-secondary">Click para seleccionar</p>
          </Card>
        ))}
      </div>

      {/* Modal con form */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="editar configuración"
      >
        <div className="space-y-4">
          <Input
            placeholder="nombre del proyecto..."
            icon={<Save size={16} />}
          />
          <Input
            type="email"
            placeholder="correo de notificaciones..."
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={loading}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default FormExample;
```

---

## Testing de Microinteracciones

### Checklist de Prueba

- [ ] **Button hover**: Se escala a 1.02 suavemente
- [ ] **Button active**: Se comprime a 0.98
- [ ] **Button loading**: Spinner rota correctamente
- [ ] **Input focus**: Ring azul aparece suavemente
- [ ] **Input placeholder**: Se desvanece en focus
- [ ] **Card hover**: Escala y cambia borde
- [ ] **Card checkmark**: Aparece con zoom-in
- [ ] **Modal entrada**: Zoom + slide desde abajo
- [ ] **Modal backdrop**: Blur se anima
- [ ] **Toast entrada**: Desliza desde arriba
- [ ] **Toast progreso**: Barra cuenta regresiva
- [ ] **Toast auto-close**: Se cierra automáticamente

### Dispositivos de Prueba
- Desktop (hover real)
- Tablet (touch con hover emulado)
- Mobile (solo touch, sin hover)

---

## Personalización

### Ajustar Duraciones
Edita las clases de transición en cada componente:

```tsx
// Más rápido (100ms)
"transition-all duration-100 ease-out"

// Más lento (300ms)
"transition-all duration-300 ease-out"
```

### Ajustar Escalas
```tsx
// Más sutil
"hover:scale-[1.005]"

// Más notorio
"hover:scale-[1.05]"
```

### Deshabilitar Animaciones
Agregar al CSS global:
```css
* {
  transition: none !important;
  animation: none !important;
}
```
