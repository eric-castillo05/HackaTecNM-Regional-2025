# STEPVOICE AI Backend

Backend para el asistente de voz STEPVOICE AI, especializado en modelos 3D y realidad aumentada.

## 🚀 Características

- **IA Real**: Integración con OpenAI GPT para respuestas inteligentes
- **Multiidioma**: Soporte para español e inglés
- **Acciones 3D**: Control de modelos (explosión, vista normal, navegación)
- **Seguridad**: Rate limiting, CORS, validaciones
- **Emociones**: Respuestas con emociones para UI dinámica

## 📋 Prerrequisitos

- Node.js >= 16.0.0
- npm o yarn
- Clave API de OpenAI

## 🛠️ Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```

3. **Editar `.env` con tus credenciales**:
   ```bash
   # Obtén tu clave en: https://platform.openai.com/api-keys
   OPENAI_API_KEY=sk-your-openai-api-key-here
   
   # Opcional: cambiar modelo (por defecto gpt-4o-mini)
   LLM_MODEL=gpt-4o-mini
   
   # Puerto del servidor
   PORT=8052
   ```

## 🏃‍♂️ Ejecución

### Desarrollo (con recarga automática):
```bash
npm run dev
```

### Producción:
```bash
npm start
```

El servidor estará disponible en: http://localhost:8052

## 📡 Endpoints

### GET `/ai/health`
Verifica el estado del servicio.

**Respuesta**:
```json
{
  "service": "STEPVOICE AI Backend",
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-09-11T12:30:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "openai_configured": true
}
```

### POST `/ai/chat`
Procesa texto del usuario y devuelve respuesta de IA.

**Request Body**:
```json
{
  "text": "Explota el modelo",
  "language": "es"
}
```

**Response**:
```json
{
  "success": true,
  "response": {
    "text": "¡Perfecto! Activando vista de explosión del modelo 3D para que puedas ver todos los componentes.",
    "emotion": "excited",
    "action": {
      "type": "explosion",
      "factor": 5.0
    }
  },
  "timestamp": "2025-09-11T12:30:00.000Z",
  "language": "es"
}
```

## 🎭 Emociones Disponibles

- `excited`: Emocionado/entusiasmado
- `helpful`: Servicial/útil
- `thoughtful`: Pensativo/reflexivo
- `calm`: Calmado/relajado
- `confident`: Confiado/seguro

## ⚙️ Acciones 3D

### Explosión
```json
{
  "type": "explosion",
  "factor": 5.0
}
```

### Vista Normal
```json
{
  "type": "reset_view",
  "factor": 0
}
```

### Navegación
```json
{
  "type": "navigation",
  "target": "ModelosScreen"
}
```

## 🔧 Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `OPENAI_API_KEY` | Clave API de OpenAI (requerida) | - |
| `LLM_MODEL` | Modelo de OpenAI a usar | `gpt-4o-mini` |
| `PORT` | Puerto del servidor | `8052` |
| `NODE_ENV` | Entorno de ejecución | `development` |

### Rate Limiting
- **Límite**: 30 requests por minuto por IP
- **Ventana**: 1 minuto

### CORS
Configurado para permitir:
- `http://localhost:19006` (Expo web)
- `exp://192.168.0.39:19000` (Expo móvil)

## 🚨 Troubleshooting

### Error: "OPENAI_API_KEY no configurada"
- Verifica que el archivo `.env` existe
- Confirma que `OPENAI_API_KEY` tiene un valor válido
- Reinicia el servidor después de cambiar `.env`

### Error: "Rate limit exceeded"
- Espera 1 minuto antes de hacer más requests
- En producción, considera implementar autenticación

### Error de CORS
- Verifica que la IP en `cors.origin` coincida con tu red
- Para React Native, usa la IP de tu máquina local

## 🧪 Testing

Puedes probar los endpoints con curl:

```bash
# Health check
curl http://localhost:8052/ai/health

# Chat
curl -X POST http://localhost:8052/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola, explota el modelo", "language": "es"}'
```

## 📝 Logs

El servidor muestra logs detallados:
- Requests entrantes
- Respuestas de OpenAI
- Errores y excepciones
- Estado de configuración

## 🔐 Seguridad

- ✅ Helmet para headers de seguridad
- ✅ Rate limiting por IP
- ✅ Validación de entrada
- ✅ CORS configurado
- ✅ Variables de entorno para secretos
- ✅ Timeouts en requests

## 🤝 Integración con Frontend

El frontend ya está configurado para usar este backend:
- URL: `http://192.168.0.39:8052` (ajustar IP según tu red)
- Endpoints: `/ai/health` y `/ai/chat`
- Formato de respuesta compatible

## 📦 Estructura del Proyecto

```
backend/
├── src/
│   ├── services/
│   │   └── aiService.js    # Lógica de OpenAI
│   └── server.js           # Servidor Express
├── .env.example            # Plantilla de variables
├── package.json            # Dependencias
└── README.md              # Esta documentación
```

## 📄 Licencia

MIT - HackaTecNM Regional 2025
