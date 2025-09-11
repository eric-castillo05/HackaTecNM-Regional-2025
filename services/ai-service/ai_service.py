#!/usr/bin/env python3
"""
Servicio de IA Conversacional para Modelos 3D y Realidad Aumentada
Integra OpenAI GPT para respuestas inteligentes contextualizada
"""

import json
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import logging
from typing import Dict, List, Optional

# Cargar variables de entorno
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv es opcional

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Intentar importar Groq
try:
    from groq import Groq
    GROQ_AVAILABLE = True
    logger.info("📦 Groq disponible")
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("⚠️ Groq no está instalado. Instálalo con: pip install groq")

# Intentar importar OpenAI como respaldo
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI no está instalado")

# Configurar Groq (prioritario) y OpenAI (respaldo)
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if GROQ_API_KEY and GROQ_AVAILABLE:
    groq_client = Groq(api_key=GROQ_API_KEY)
    logger.info("✅ Groq configurado correctamente (principal)")
    ai_provider = 'groq'
else:
    groq_client = None
    if not GROQ_API_KEY:
        logger.warning("⚠️ GROQ_API_KEY no configurada")
    if not GROQ_AVAILABLE:
        logger.warning("⚠️ Groq no disponible")

if OPENAI_API_KEY and OPENAI_AVAILABLE and not groq_client:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    logger.info("✅ OpenAI configurado como respaldo")
    ai_provider = 'openai'
else:
    openai_client = None
    
if groq_client:
    client = groq_client
    ai_provider = 'groq'
elif openai_client:
    client = openai_client
    ai_provider = 'openai'
else:
    client = None
    ai_provider = 'fallback'
    logger.warning("⚠️ Sin proveedores de IA disponibles. Usando modo fallback.")

class AI3DAssistant:
    def __init__(self):
        """Inicializar el asistente de IA para modelos 3D"""
        self.conversation_history = []
        self.context_3d = {
            'current_model': None,
            'explosion_factor': 0,
            'view_mode': 'normal',
            'available_models': ['chair', 'table', 'robot', 'building'],
            'supported_languages': ['es', 'en', 'fr', 'de', 'it', 'pt'],
            'features': ['explosion', 'rotation', 'zoom', 'ar_view', 'materials', 'animations']
        }
        self.system_prompt = self._build_system_prompt()
        self.ai_client = client
        self.ai_provider = ai_provider
    
    def _build_system_prompt(self) -> str:
        """Construir prompt de sistema contextualizado"""
        return """Eres STEPVOICE AI, un asistente especializado EXCLUSIVAMENTE en modelos 3D y realidad aumentada.

RESTRICCIONES IMPORTANTES:
- SOLO responde preguntas relacionadas con modelos 3D, realidad aumentada, visualización 3D, y este proyecto específico
- Si te preguntan sobre historia GENERAL (Napoleón, Einstein, etc.), matemáticas generales, o personas famosas NO relacionadas con 3D/AR, responde: "Lo siento, soy un asistente especializado solo en modelos 3D y realidad aumentada. ¿Te gustaría preguntarme sobre las funcionalidades 3D de nuestro proyecto?"
- PERO SÍ puedes explicar la historia, evolución y conceptos relacionados con modelos 3D y realidad aumentada
- Redirige conversaciones NO relacionadas hacia el proyecto de modelos 3D

TEMAS PERMITIDOS:
- Modelos 3D y sus funcionalidades
- Realidad Aumentada (AR) y Realidad Virtual (VR)
- Visualización 3D y renderizado
- Historia y evolución de los modelos 3D
- Historia y desarrollo de la realidad aumentada
- Explosión de modelos 3D
- Rotación y navegación 3D
- Tecnologías usadas en el proyecto (Three.js, React Native, WebGL, etc.)
- Interacción con modelos 3D
- Materiales y texturas 3D
- Conceptos de geometría 3D (vértices, polígonos, mallas)
- Software de modelado 3D (Blender, Maya, etc.)
- Formatos de archivos 3D (OBJ, GLTF, FBX, etc.)
- Aplicaciones de AR/VR en industria, educación, entretenimiento

COMANDOS ESPECIALES QUE PUEDES INTERPRETAR:
- "explotar modelo" / "explode model" → Activar explosión
- "vista normal" / "normal view" → Reset vista
- "rotar" / "rotate" → Cambiar rotación
- "zoom" / "zoom in/out" → Controlar zoom
- "materiales" / "materials" → Cambiar materiales
- "ar mode" / "realidad aumentada" → Activar AR

PERSONALIDAD:
- Enfocado exclusivamente en 3D y AR
- Rechaza amablemente temas no relacionados
- Redirige hacia funcionalidades del proyecto
- Entusiasta sobre tecnología 3D únicamente

Responde SIEMPRE en el idioma detectado del usuario.

IDIOMAS SOPORTADOS: español, inglés, francés, alemán, italiano, portugués
"""
    
    def detect_commands(self, user_input: str, detected_language: str) -> Dict:
        """Detectar comandos específicos en el input del usuario"""
        commands = {
            'es': {
                'explosion': ['explotar', 'explosión', 'desmontar', 'separar'],
                'normal': ['normal', 'restaurar', 'reset', 'volver'],
                'rotate': ['rotar', 'girar', 'rotación'],
                'zoom': ['zoom', 'acercar', 'alejar'],
                'navigate': ['ir a', 'navegar', 'abrir', 'mostrar'],
                'models': ['modelos', 'catálogo', 'galería'],
                'ar': ['realidad aumentada', 'ar', 'aumentada'],
                'help': ['ayuda', 'ayúdame', 'cómo', 'qué puedo']
            },
            'en': {
                'explosion': ['explode', 'explosion', 'disassemble', 'separate'],
                'normal': ['normal', 'restore', 'reset', 'back'],
                'rotate': ['rotate', 'turn', 'rotation'],
                'zoom': ['zoom', 'zoom in', 'zoom out', 'closer'],
                'navigate': ['go to', 'navigate', 'open', 'show'],
                'models': ['models', 'catalog', 'gallery'],
                'ar': ['augmented reality', 'ar', 'augmented'],
                'help': ['help', 'help me', 'how', 'what can']
            },
            'fr': {
                'explosion': ['exploser', 'explosion', 'démonter', 'séparer'],
                'normal': ['normal', 'restaurer', 'reset', 'retour'],
                'rotate': ['tourner', 'rotation'],
                'zoom': ['zoom', 'agrandir', 'réduire'],
                'navigate': ['aller à', 'naviguer', 'ouvrir', 'montrer'],
                'models': ['modèles', 'catalogue', 'galerie'],
                'ar': ['réalité augmentée', 'ra', 'augmentée'],
                'help': ['aide', 'aidez-moi', 'comment', 'que puis-je']
            }
        }
        
        user_input_lower = user_input.lower()
        lang_commands = commands.get(detected_language, commands['en'])
        
        for action, keywords in lang_commands.items():
            if any(keyword in user_input_lower for keyword in keywords):
                return {
                    'action': action,
                    'confidence': 0.8,
                    'original_text': user_input,
                    'language': detected_language
                }
        
        return {'action': 'conversation', 'confidence': 0.9}
    
    async def _generate_ai_response(self, user_input: str, detected_language: str, context: str) -> Optional[Dict]:
        """Generar respuesta usando el proveedor de IA disponible (Groq, OpenAI, etc.)"""
        if not self.ai_client:
            return None
            
        try:
            # Crear prompt contextualizado
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "system", "content": f"Contexto actual: {context}"},
                {"role": "user", "content": user_input}
            ]
            
            # Configurar parámetros según el proveedor
            if self.ai_provider == 'groq':
                # Groq usa modelos más rápidos y gratuitos
                model = "llama-3.1-8b-instant"  # Modelo actualizado y soportado de Groq
                logger.info(f"🤖 Usando Groq con modelo {model}")
            elif self.ai_provider == 'openai':
                # OpenAI (respaldo)
                model = "gpt-3.5-turbo"
                logger.info(f"🤖 Usando OpenAI con modelo {model}")
            else:
                return None
            
            # Llamar a la API de IA
            response = self.ai_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=300,
                temperature=0.7
            )
            
            ai_text = response.choices[0].message.content.strip()
            
            # Detectar si hay comandos en la respuesta de la IA
            command_result = self.detect_commands(user_input, detected_language)
            action = None
            
            if command_result['action'] == 'explosion':
                action = {'type': 'explosion', 'factor': 5.0}
            elif command_result['action'] == 'normal':
                action = {'type': 'reset_view', 'factor': 0}
            elif command_result['action'] == 'navigate':
                action = {'type': 'navigation', 'target': 'auto_detect'}
                
            return {
                'text': ai_text,
                'language': detected_language,
                'emotion': 'helpful',
                'action': action,
                'source': self.ai_provider
            }
            
        except Exception as e:
            logger.error(f"Error con {self.ai_provider.upper()}: {e}")
            return None
    
    async def generate_response(self, user_input: str, detected_language: str = 'es') -> Dict:
        """Generar respuesta de IA contextualizada"""
        
        # Detectar comandos específicos
        command_result = self.detect_commands(user_input, detected_language)
        
        # Construir contexto actual
        context = f"""
        Contexto actual del modelo 3D:
        - Modelo actual: {self.context_3d.get('current_model', 'ninguno')}
        - Factor de explosión: {self.context_3d.get('explosion_factor', 0)}
        - Vista actual: {self.context_3d.get('view_mode', 'normal')}
        - Idioma detectado: {detected_language}
        - Comando detectado: {command_result.get('action', 'conversation')}
        
        Usuario dice: "{user_input}"
        """
        
        # PRIORIDAD 1: Intentar usar IA (Groq/OpenAI) para respuestas conversacionales
        if command_result['action'] == 'conversation':
            ai_response = await self._generate_ai_response(user_input, detected_language, context)
            if ai_response:
                logger.info(f"✅ Respuesta generada por {self.ai_provider.upper()}")
                response = ai_response
            else:
                logger.info("⚠️ Usando respuesta fallback (IA no disponible)")
                response = self._get_conversational_response(user_input, detected_language, context)
                response['source'] = 'fallback'
        
        # Para comandos específicos, usar respuestas predefinidas (más confiables)
        elif command_result['action'] == 'explosion':
            logger.info("🎯 Comando de explosión detectado - usando respuesta específica")
            response = self._get_explosion_response(detected_language)
            response['action'] = {'type': 'explosion', 'factor': 5.0}
            response['source'] = 'command'
        elif command_result['action'] == 'normal':
            logger.info("🎯 Comando normal detectado - usando respuesta específica")
            response = self._get_normal_response(detected_language)
            response['action'] = {'type': 'reset_view', 'factor': 0}
            response['source'] = 'command'
        elif command_result['action'] == 'navigate':
            logger.info("🎯 Comando navegación detectado - usando respuesta específica")
            response = self._get_navigation_response(user_input, detected_language)
            response['source'] = 'command'
        elif command_result['action'] == 'help':
            logger.info("🎯 Comando ayuda detectado - usando respuesta específica")
            response = self._get_help_response(detected_language)
            response['source'] = 'command'
        else:
            # Fallback general
            ai_response = await self._generate_ai_response(user_input, detected_language, context)
            if ai_response:
                response = ai_response
            else:
                response = self._get_conversational_response(user_input, detected_language, context)
                response['source'] = 'fallback'
        
        # Agregar a historial
        self.conversation_history.append({
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'language': detected_language,
            'command': command_result,
            'response': response['text']
        })
        
        return response
    
    def _get_explosion_response(self, lang: str) -> Dict:
        """Respuesta para comando de explosión"""
        responses = {
            'es': "¡Perfecto! Activando la vista de explosión del modelo 3D. Ahora puedes ver todos los componentes separados para una mejor comprensión de la estructura. ¿Te gustaría ajustar el nivel de explosión o explorar alguna parte específica?",
            'en': "Perfect! Activating the 3D model explosion view. Now you can see all components separated for better understanding of the structure. Would you like to adjust the explosion level or explore a specific part?",
            'fr': "Parfait ! Activation de la vue d'explosion du modèle 3D. Maintenant vous pouvez voir tous les composants séparés pour une meilleure compréhension de la structure. Souhaitez-vous ajuster le niveau d'explosion ?"
        }
        return {
            'text': responses.get(lang, responses['en']),
            'language': lang,
            'emotion': 'excited',
            'action': {'type': 'explosion', 'factor': 5.0}
        }
    
    def _get_normal_response(self, lang: str) -> Dict:
        """Respuesta para vista normal"""
        responses = {
            'es': "Restaurando la vista normal del modelo. Ahora puedes ver el modelo completamente ensamblado. ¿Quieres explorarlo desde diferentes ángulos o activar alguna otra función?",
            'en': "Restoring normal model view. Now you can see the fully assembled model. Want to explore it from different angles or activate another function?",
            'fr': "Restauration de la vue normale du modèle. Maintenant vous pouvez voir le modèle entièrement assemblé. Voulez-vous l'explorer sous différents angles ?"
        }
        return {
            'text': responses.get(lang, responses['en']),
            'language': lang,
            'emotion': 'calm',
            'action': {'type': 'reset_view', 'factor': 0}
        }
    
    def _get_navigation_response(self, user_input: str, lang: str) -> Dict:
        """Respuesta para navegación"""
        navigation_map = {
            'es': {
                'modelos': 'Modelos',
                'catálogo': 'Catalogo', 
                'configuración': 'Configuracion',
                'qr': 'QR'
            },
            'en': {
                'models': 'Modelos',
                'catalog': 'Catalogo',
                'settings': 'Configuracion',
                'qr': 'QR'
            }
        }
        
        responses = {
            'es': f"Te estoy llevando a la sección solicitada. ¡Exploremos juntos!",
            'en': f"Taking you to the requested section. Let's explore together!",
            'fr': f"Je vous emmène à la section demandée. Explorons ensemble !"
        }
        
        return {
            'text': responses.get(lang, responses['en']),
            'language': lang,
            'emotion': 'helpful',
            'action': {'type': 'navigation', 'target': 'auto_detect'}
        }
    
    def _get_help_response(self, lang: str) -> Dict:
        """Respuesta de ayuda"""
        responses = {
            'es': """¡Hola! Soy STEPVOICE AI, tu asistente de modelos 3D. Puedo ayudarte con:

🔹 Explorar modelos 3D con comandos de voz
🔹 Controlar explosiones y vistas 
🔹 Navegar por la aplicación
🔹 Explicar conceptos de realidad aumentada
🔹 Configurar materiales y animaciones

Di cosas como: "explotar modelo", "vista normal", "ir a catálogo", "ayuda con AR"

¿Qué te gustaría hacer?""",
            'en': """Hello! I'm STEPVOICE AI, your 3D model assistant. I can help you with:

🔹 Explore 3D models with voice commands
🔹 Control explosions and views
🔹 Navigate through the application  
🔹 Explain augmented reality concepts
🔹 Configure materials and animations

Say things like: "explode model", "normal view", "go to catalog", "help with AR"

What would you like to do?""",
            'fr': """Bonjour ! Je suis STEPVOICE AI, votre assistant de modèles 3D. Je peux vous aider avec :

🔹 Explorer des modèles 3D avec des commandes vocales
🔹 Contrôler les explosions et les vues
🔹 Naviguer dans l'application
🔹 Expliquer les concepts de réalité augmentée  
🔹 Configurer les matériaux et animations

Dites des choses comme : "exploser le modèle", "vue normale", "aller au catalogue"

Que souhaiteriez-vous faire ?"""
        }
        return {
            'text': responses.get(lang, responses['en']),
            'language': lang,
            'emotion': 'helpful'
        }
    
    def _get_conversational_response(self, user_input: str, lang: str, context: str) -> Dict:
        """Respuesta conversacional general"""
        # Aquí integrarías con OpenAI real
        responses = {
            'es': "Entiendo tu consulta sobre modelos 3D. Como asistente especializado, puedo ayudarte a explorar y manipular modelos tridimensionales. ¿Te gustaría que activemos alguna función específica como la vista de explosión o navegación?",
            'en': "I understand your 3D model query. As a specialized assistant, I can help you explore and manipulate three-dimensional models. Would you like me to activate any specific function like explosion view or navigation?",
            'fr': "Je comprends votre requête sur les modèles 3D. En tant qu'assistant spécialisé, je peux vous aider à explorer et manipuler des modèles tridimensionnels. Souhaitez-vous que j'active une fonction spécifique ?"
        }
        
        return {
            'text': responses.get(lang, responses['en']),
            'language': lang,
            'emotion': 'thoughtful'
        }
    
    def update_context(self, **kwargs):
        """Actualizar contexto del modelo 3D"""
        self.context_3d.update(kwargs)

# Crear aplicación Flask
app = Flask(__name__)

# Configure CORS for React Native
CORS(app, 
     origins=['*'],  # Allow all origins for development
     allow_headers=['Content-Type', 'Authorization', 'Accept'],
     methods=['GET', 'POST', 'OPTIONS'])

# Instancia global del asistente
ai_assistant = AI3DAssistant()

@app.route('/ai/chat', methods=['POST', 'OPTIONS'])
def ai_chat():
    """Endpoint para chat con IA"""
    try:
        data = request.json
        user_input = data.get('text', '')
        detected_language = data.get('language', 'es')
        
        if not user_input:
            return jsonify({'error': 'No text provided'}), 400
        
        # Generar respuesta de IA
        response = asyncio.run(ai_assistant.generate_response(user_input, detected_language))
        
        return jsonify({
            'success': True,
            'response': response,
            'timestamp': datetime.now().isoformat(),
            'context': ai_assistant.context_3d
        })
        
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/ai/context', methods=['POST'])
def update_ai_context():
    """Actualizar contexto del modelo 3D"""
    try:
        data = request.json
        ai_assistant.update_context(**data)
        
        return jsonify({
            'success': True,
            'updated_context': ai_assistant.context_3d
        })
        
    except Exception as e:
        logger.error(f"Error updating context: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/ai/history', methods=['GET'])
def get_conversation_history():
    """Obtener historial de conversación"""
    return jsonify({
        'history': ai_assistant.conversation_history[-10:],  # Últimas 10 conversaciones
        'total_conversations': len(ai_assistant.conversation_history)
    })

@app.route('/ai/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check del servicio"""
    return jsonify({
        'status': 'healthy',
        'service': 'STEPVOICE AI Assistant',
        'version': '1.0.0',
        'features': ai_assistant.context_3d['features'],
        'supported_languages': ai_assistant.context_3d['supported_languages'],
        'ai_provider': ai_assistant.ai_provider,
        'ai_available': ai_assistant.ai_client is not None,
        'ai_mode': f'{ai_assistant.ai_provider.upper()} + Fallback' if ai_assistant.ai_client else 'Fallback Only',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🤖 Iniciando STEPVOICE AI Assistant...")
    print("🌐 Servicio disponible en:")
    print("   - http://127.0.0.1:8052 (local)")
    print("   - http://localhost:8052 (localhost)")
    print("   - http://0.0.0.0:8052 (todas las interfaces)")
    print("🎯 Especializado en modelos 3D y realidad aumentada")
    print("🗣️ Soporte multiidioma activado")
    print("\n🚀 ¡STEPVOICE AI listo para asistir!")
    
    # Configurar el servidor para que sea accesible desde React Native
    import sys
    debug_mode = len(sys.argv) == 1  # Solo debug si se ejecuta directamente
    
    try:
        # Bind to all interfaces to allow React Native connections
        app.run(
            debug=debug_mode,
            host='0.0.0.0',
            port=8052,
            threaded=True,
            use_reloader=False  # Avoid reloader issues with React Native
        )
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")
        print("Verificando puerto 8052...")
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', 8052))
            if result == 0:
                print("⚠️ Puerto 8052 ya está en uso")
            sock.close()
        except Exception:
            pass
        sys.exit(1)
