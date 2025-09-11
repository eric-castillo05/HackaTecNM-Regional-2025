# 🪑 Visualizador 3D de Silla - Backend Dash

Este directorio contiene el servidor Python/Dash que proporciona la funcionalidad de visualización 3D avanzada para la aplicación React Native.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias Python

```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Ejecutar Servidor

**Opción A - Script de inicio automático:**
```bash
python start_server.py
```

**Opción B - Aplicación directa:**
```bash
python app.py
```

### 3. Usar en la App React Native

1. Abre la aplicación React Native
2. Ve a la pantalla de "Explosionado" 
3. Presiona el botón "🌐 Dash Explorer"
4. Sigue las instrucciones en pantalla

## 📁 Estructura de Archivos

```
backend/
├── app.py                 # Aplicación principal de Dash
├── start_server.py        # Script de inicio con verificaciones
├── output_chair.json      # Datos del modelo 3D de la silla
├── requirements.txt       # Dependencias Python
└── README.md             # Este archivo
```

## 🔧 Configuración

### Puerto del Servidor
- **Puerto por defecto**: `8051`
- **URL completa**: `http://127.0.0.1:8051`

Si necesitas cambiar el puerto, modifica estas líneas:
- En `app.py`: línea 746
- En `start_server.py`: línea 59  
- En `DashExplorer.js`: línea 28

### Dependencias Python

- `dash>=2.14.0` - Framework web
- `plotly>=5.17.0` - Visualización 3D  
- `numpy>=1.21.0` - Cálculos numéricos
- `pandas>=1.5.0` - Manipulación de datos
- `dash-bootstrap-components>=1.5.0` - Componentes UI

## 🎮 Características del Visualizador

### Controles Interactivos
- **Slider de explosión**: 0-10 para separar componentes
- **Vistas rápidas**: Superior, Frontal, Lateral
- **Rotación libre**: Mouse/trackpad para manipular
- **Zoom**: Scroll wheel para acercar/alejar

### Funcionalidades
- ✅ **Modelo 3D completo**: 17,904 vértices, 5,968 triángulos  
- ✅ **Explosión radial**: Separación desde centro global
- ✅ **Cambio de colores**: Azul → Rojo al explotar
- ✅ **Estadísticas en tiempo real**: Dimensiones, centro, etc.
- ✅ **Exportación de imágenes**: PNG de alta calidad
- ✅ **Interfaz responsive**: Desktop, tablet, mobile

## 🔧 Solución de Problemas

### "No se puede conectar al servidor"
1. Verifica que Python esté instalado
2. Ejecuta `python --version` (requiere Python 3.8+)
3. Instala dependencias: `pip install -r requirements.txt`
4. Ejecuta el servidor: `python start_server.py`

### "Error de dependencias"
```bash
# Actualizar pip
python -m pip install --upgrade pip

# Instalar dependencias una por una
pip install dash plotly numpy pandas dash-bootstrap-components
```

### "Puerto ocupado"
```bash
# Verificar qué proceso usa el puerto 8051
lsof -i :8051

# Matar proceso si es necesario
kill -9 [PID]
```

## 🌐 Integración con React Native

### Flujo de Comunicación

1. **React Native App** → Inicia `DashExplorer.js`
2. **DashExplorer** → Verifica servidor Python en puerto 8051
3. **WebView** → Conecta a `http://127.0.0.1:8051`
4. **Dash App** → Renderiza interfaz 3D con Plotly
5. **Usuario** → Interactúa con controles web

### WebView Configurado

```javascript
<WebView
  source={{ uri: 'http://127.0.0.1:8051' }}
  javaScriptEnabled={true}
  domStorageEnabled={true}
  onError={handleError}
  onLoad={handleLoad}
/>
```

## 📊 Datos del Modelo

### Formato JSON
```json
{
  "v": [
    [
      [x1, y1, z1],  // Vértice 1 del triángulo
      [x2, y2, z2],  // Vértice 2 del triángulo  
      [x3, y3, z3]   // Vértice 3 del triángulo
    ]
    // ... más triángulos
  ]
}
```

### Estadísticas
- **Vértices totales**: 17,904
- **Triángulos totales**: 5,968
- **Centro del modelo**: [-1.7, -0.1, -122.5]
- **Dimensiones**: ~290 × 322 × 471 unidades

## 🚀 Desarrollo

### Ejecutar en Modo Desarrollo
```bash
python app.py
# Servidor con hot reload activado
```

### Personalizar Visualización
Editar `app.py` en las siguientes secciones:
- `create_exploded_geometry()` - Algoritmo de explosión
- `create_plotly_mesh()` - Configuración del mesh 3D
- `create_plotly_figure()` - Layout y cámara
- Callbacks - Interactividad de controles

### Agregar Nuevos Modelos
1. Colocar archivo JSON en formato compatible
2. Modificar `Chair3DVisualizer.__init__()` 
3. Actualizar estadísticas si es necesario

## 📱 Compatibilidad

### Plataformas Soportadas
- ✅ **iOS**: iPhone/iPad con Expo Go
- ✅ **Android**: Dispositivos con Expo Go  
- ✅ **Web**: Navegadores modernos
- ✅ **Desktop**: Emuladores iOS/Android

### Requisitos
- **React Native**: Expo SDK 50+
- **Python**: 3.8 o superior
- **Node.js**: 16+ (para la app React Native)
- **Memoria**: Mínimo 2GB RAM recomendado

---

## 🤝 Contribuir

Para contribuir a este proyecto:

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)  
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

**¡Desarrollado con ❤️ usando Plotly Dash + React Native!**
