# 🤖 VORTEX AI - Sistema de Modelos 3D con IA Conversacional

## 🎯 Descripción

VORTEX AI es un sistema avanzado que combina **reconocimiento de voz multiidioma**, **inteligencia artificial conversacional** y **exploración de modelos 3D** para crear una experiencia inmersiva de realidad aumentada.

### ✨ Características Principales

- 🎤 **Reconocimiento de voz multiidioma** con AssemblyAI
- 🤖 **IA conversacional especializada** en modelos 3D y realidad aumentada
- 🗣️ **Respuestas por voz** en el idioma detectado
- 🎯 **Control de modelos 3D por comando de voz**
- 📱 **Interfaz móvil responsive** con React Native
- 🌐 **Backend inteligente** con Flask y Dash
- 🎨 **Animaciones fluidas** y efectos visuales

---

## 🚀 Inicio Rápido

### 1. Iniciar Servicios Backend

```bash
# Navegar al directorio backend
cd frontend/backend

# Ejecutar el launcher de VORTEX AI
python3 start_vortex_ai.py
```

Esto iniciará automáticamente:
- 🤖 **VORTEX AI Service** (Puerto 8052)
- 🎯 **3D Model Service** (Puerto 8051)

### 2. Ejecutar App React Native

```bash
# En otro terminal, desde el directorio frontend
cd frontend

# Instalar dependencias (si es necesario)
npm install

# Iniciar la aplicación
npx expo start
```

### 3. Probar la IA

1. Abre la app en tu dispositivo/emulador
2. Navega a **"VortexAI"** o **"AI3DExplorer"**
3. Concede permisos de micrófono
4. ¡Mantén presionado el botón y habla!

---

## 🗣️ Comandos de Voz Soportados

### Español 🇪🇸
- **"explotar modelo"** / **"explosión"** → Activa vista explodida
- **"vista normal"** / **"restaurar"** → Vuelve a vista normal
- **"rotar modelo"** / **"girar"** → Rota el modelo
- **"zoom"** / **"acercar"** → Controla zoom
- **"ir a catálogo"** → Navega al catálogo
- **"ayuda"** → Muestra ayuda

### English 🇺🇸
- **"explode model"** → Activate exploded view
- **"normal view"** → Return to normal view
- **"rotate"** → Rotate model
- **"zoom in"** / **"zoom out"** → Control zoom
- **"go to catalog"** → Navigate to catalog
- **"help"** → Show help

### Français 🇫🇷
- **"exploser modèle"** → Activer vue éclatée
- **"vue normale"** → Retourner à la vue normale
- **"tourner"** → Faire tourner
- **"zoom"** → Contrôler zoom

---

## 🏗️ Arquitectura del Sistema

```
VORTEX AI System
├── 🤖 AI Service (Flask) - Puerto 8052
│   ├── Procesamiento de comandos de voz
│   ├── Respuestas contextualizadas
│   └── Detección de intenciones
├── 🎯 3D Model Service (Dash) - Puerto 8051
│   ├── Visualización de modelos 3D
│   ├── Control de explosiones
│   └── Interacciones táctiles
└── 📱 React Native App
    ├── VortexAIAssistant - IA pura
    ├── AI3DExplorerScreen - IA + 3D
    └── Integración con servicios backend
```

---

## 📂 Estructura de Archivos

```
frontend/
├── App.js                          # Navegación principal
├── Interfaces/
│   ├── VortexAIAssistant.js        # 🤖 Asistente de IA puro
│   ├── AI3DExplorerScreen.js       # 🎯 IA + Modelos 3D
│   ├── testAssemblyAI.js          # 🎤 Reconocimiento de voz original
│   └── [otras pantallas...]
├── backend/
│   ├── ai_service.py              # 🤖 Servicio de IA conversacional
│   ├── app.py                     # 🎯 Servicio de modelos 3D
│   └── start_vortex_ai.py         # 🚀 Launcher de servicios
└── README_VORTEX_AI.md            # 📖 Esta documentación
```

---

## 🛠️ Instalación Completa

### Dependencias Python

```bash
pip install flask flask-cors plotly dash dash-bootstrap-components numpy pandas
```

### Dependencias React Native

```bash
npm install @react-navigation/native @react-navigation/stack
npm install expo-av expo-speech expo-linear-gradient
npm install react-native-webview
npm install @expo/vector-icons
```

---

## ⚙️ Configuración Avanzada

### API Keys

1. **AssemblyAI**: Reemplaza la clave en `VortexAIAssistant.js`
2. **OpenAI** (opcional): Configura en `ai_service.py` para IA más avanzada

```javascript
// En VortexAIAssistant.js
const ASSEMBLYAI_API_KEY = 'TU_ASSEMBLYAI_API_KEY';
```

```python
# En ai_service.py
# openai.api_key = 'TU_OPENAI_API_KEY'
```

### URLs de Servicios

Configura las URLs según tu entorno:

```javascript
// En VortexAIAssistant.js
const AI_SERVICE_URL = 'http://TU_IP:8052';

// En AI3DExplorerScreen.js
const model3DUrl = 'http://TU_IP:8051';
```

---

## 🎨 Personalización

### Emociones de la IA

Puedes personalizar las emociones y colores de la IA:

```javascript
const emotions = {
    'excited': '#FF6B6B',    // Emocionado - Rojo
    'helpful': '#4ECDC4',    // Servicial - Turquesa
    'thoughtful': '#45B7D1', // Pensativo - Azul
    'calm': '#96CEB4',       // Calmado - Verde
    'confident': '#FECA57'   // Confiado - Amarillo
};
```

### Comandos Personalizados

Agrega nuevos comandos en `ai_service.py`:

```python
def detect_commands(self, user_input: str, detected_language: str):
    commands = {
        'es': {
            'mi_comando': ['palabra_clave1', 'palabra_clave2'],
            # ... otros comandos
        }
    }
```

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Servicios no inician
```bash
# Verificar puertos ocupados
lsof -i :8051 -i :8052

# Matar procesos si es necesario
kill -9 <PID>
```

#### 2. Error de permisos de audio
- Verificar permisos de micrófono en la app
- Reiniciar la aplicación
- Verificar configuración del simulador

#### 3. WebView no carga
```javascript
// Verificar URL del servicio 3D
const model3DUrl = 'http://127.0.0.1:8051/';

// Para dispositivos físicos, usar IP local
const model3DUrl = 'http://192.168.1.XXX:8051/';
```

#### 4. IA no responde
- Verificar que el servicio de IA esté corriendo
- Revisar logs en la consola
- Comprobar conexión de red

---

## 🚀 Desarrollo y Contribución

### Agregar Nuevos Idiomas

1. Extender diccionario de comandos en `ai_service.py`
2. Agregar configuración de voz en `VortexAIAssistant.js`
3. Actualizar respuestas multiidioma

### Nuevas Funciones 3D

1. Crear función en `app.py` (backend Dash)
2. Agregar comando en `ai_service.py`
3. Implementar manejo en `AI3DExplorerScreen.js`

---

## 📊 Monitoreo y Logs

### Ver logs de servicios

```bash
# Logs del servicio de IA
curl http://127.0.0.1:8052/ai/health

# Historial de conversaciones
curl http://127.0.0.1:8052/ai/history
```

### Endpoints de API

- `POST /ai/chat` - Enviar mensaje a la IA
- `POST /ai/context` - Actualizar contexto 3D
- `GET /ai/history` - Obtener historial
- `GET /ai/health` - Estado del servicio

---

## 🎯 Casos de Uso

### 1. Educación
- Explicación de conceptos 3D
- Exploración interactiva de modelos
- Aprendizaje multiidioma

### 2. Industria
- Revisión de diseños CAD
- Entrenamiento técnico
- Visualización de productos

### 3. Entretenimiento
- Juegos de realidad aumentada
- Experiencias inmersivas
- Arte interactivo

---

## 📞 Soporte

Para soporte técnico:

1. Revisa los logs de servicios
2. Verifica la configuración de red
3. Comprueba las dependencias
4. Consulta esta documentación

---

## 🎉 ¡Felicidades!

Has implementado exitosamente **VORTEX AI**, un sistema de vanguardia que combina:

- ✅ **Reconocimiento de voz multiidioma**
- ✅ **IA conversacional especializada** 
- ✅ **Control por voz de modelos 3D**
- ✅ **Respuestas por voz contextualizadas**
- ✅ **Interfaz móvil intuitiva**

**🚀 ¡Tu IA está lista para explorar modelos 3D y realidad aumentada!**

---

*VORTEX AI - Donde la inteligencia artificial se encuentra con la exploración 3D* 🤖🎯
