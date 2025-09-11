import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    Pressable,
    Animated,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const ASSEMBLYAI_API_KEY = '7cbc39b7c733465f8546b25cf4cfc1c6';
const DEEPL_API_KEY = 'a70ccccf-66c0-49f4-80da-48ef2d00726a:fx';

// Configuration for AI Service - multiple fallback URLs
const AI_SERVICE_URLS = [
    'http://192.168.0.39:8052',   // Current machine IP (priority)
    'http://127.0.0.1:8052',     // Local development
    'http://localhost:8052',      // Alternative localhost
    'http://10.0.2.2:8052',      // Android emulator host
];

let AI_SERVICE_URL = AI_SERVICE_URLS[0]; // Start with machine IP

const StepVoiceAIAssistant = ({ navigation, onActionRequest }) => {
    // Estados del reconocimiento de voz
    const [transcript, setTranscript] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [isPushToTalkPressed, setIsPushToTalkPressed] = useState(false);
    const [pushToTalkRecording, setPushToTalkRecording] = useState(null);

    // Estados de la IA
    const [aiResponse, setAiResponse] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiEmotion, setAiEmotion] = useState('calm');
    const [currentVoice, setCurrentVoice] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Animaciones
    const buttonScale = useRef(new Animated.Value(1)).current;
    const buttonOpacity = useRef(new Animated.Value(1)).current;
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const rippleAnimation = useRef(new Animated.Value(0)).current;
    const aiGlowAnimation = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        console.log('🤖 Iniciando STEPVOICE AI Assistant');
        requestPermissions();
        initializeAI();
        startAIGlowAnimation();
    }, []);

    useEffect(() => {
        if (isPushToTalkPressed) {
            startPulseAnimation();
            startRippleAnimation();
        } else {
            stopAnimations();
        }
    }, [isPushToTalkPressed]);

    // Function to find working AI service URL
    const findWorkingAIService = async () => {
        for (const url of AI_SERVICE_URLS) {
            try {
                console.log(`🔍 Probando conexión a: ${url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout per URL

                const response = await fetch(`${url}/ai/health`, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ AI Service encontrado en: ${url}`);
                    console.log('📊 Service Info:', data.service, data.version);
                    AI_SERVICE_URL = url; // Update global URL
                    return { url, data };
                }
            } catch (error) {
                console.log(`❌ Falló conexión a ${url}:`, error.message);
                continue; // Try next URL
            }
        }
        return null; // No working service found
    };

    const initializeAI = async () => {
        try {
            console.log('🚀 Buscando servicio AI disponible...');
            const serviceInfo = await findWorkingAIService();
            
            if (serviceInfo) {
                console.log('🤖 AI Service conectado exitosamente');
                // Mensaje de bienvenida enfocado en el proyecto
setAiResponse(`¡Bienvenido al demo de STEPVOICE AI! Este es un proyecto de exploración de modelos 3D con realidad aumentada. \n\n¿Qué te gustaría saber sobre nuestro proyecto? \n\n• ¿Cómo funciona la vista de explosión 3D? \n• ¿Qué tecnologías utilizamos? \n• ¿Cómo se implementa la realidad aumentada? \n• ¿Qué modelos están disponibles?`);
            } else {
                throw new Error('No AI service available');
            }

        } catch (error) {
            console.error('Error conectando con AI Service:', error);
            // Fallback graceful - modo offline
setAiResponse(`¡Bienvenido al demo de STEPVOICE AI! Este es nuestro proyecto de exploración de modelos 3D con realidad aumentada.\n\n¿Qué te gustaría saber sobre el proyecto?\n\n• ¿Cómo funciona la vista de explosión 3D?\n• ¿Qué tecnologías utilizamos?\n• ¿Cómo se implementa la realidad aumentada?\n• ¿Qué modelos están disponibles?\n\nEstoy en modo básico, pero puedo responder estas preguntas.`);
        }
    };

    const startAIGlowAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(aiGlowAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(aiGlowAnimation, {
                    toValue: 0.3,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                })
            ])
        ).start();
    };

    const startRippleAnimation = () => {
        rippleAnimation.setValue(0);
        Animated.loop(
            Animated.timing(rippleAnimation, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    };

    const stopAnimations = () => {
        pulseAnimation.stopAnimation();
        rippleAnimation.stopAnimation();
        Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
        Animated.timing(rippleAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    async function requestPermissions() {
        try {
            const { status } = await Audio.requestPermissionsAsync();

            if (status === 'granted') {
                setHasPermissions(true);
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
            } else {
                Alert.alert(
                    'Permisos Necesarios',
                    'STEPVOICE AI necesita acceso al micrófono para funcionar.',
                    [{ text: 'Reintentar', onPress: requestPermissions }]
                );
            }
        } catch (err) {
            console.error('Error solicitando permisos:', err);
            Alert.alert('Error', 'No se pudieron solicitar los permisos de audio');
        }
    }

    async function uploadToAssemblyAI(blob) {
        try {
            const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    authorization: ASSEMBLYAI_API_KEY,
                    'content-type': 'application/octet-stream',
                },
                body: blob,
            });
            const uploadData = await uploadResponse.json();
            return uploadData.upload_url;
        } catch (err) {
            console.error('Error al subir audio:', err);
            return null;
        }
    }

    async function getTranscript(audioUrl) {
        try {
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: {
                    authorization: ASSEMBLYAI_API_KEY,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    language_detection: true,
                    language_code: null
                }),
            });

            const data = await response.json();
            const transcriptId = data.id;

            while (true) {
                const pollingResp = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                    headers: { authorization: ASSEMBLYAI_API_KEY },
                });
                const pollingData = await pollingResp.json();

                if (pollingData.status === 'completed') {
                    return {
                        text: pollingData.text,
                        language_code: pollingData.language_code
                    };
                } else if (pollingData.status === 'error') {
                    throw new Error('Error en transcripción');
                }
                await new Promise((r) => setTimeout(r, 3000));
            }
        } catch (err) {
            console.error('Error al obtener transcripción:', err);
            return null;
        }
    }

    // Función de AI offline como fallback
    function processWithOfflineAI(text, language) {
        const responses = {
            'es': {
                'explotar': 'Activando vista de explosión del modelo 3D. Esta funcionalidad te permite ver cómo están ensambladas todas las piezas del modelo. ¡Es ideal para entender la estructura interna!',
                'normal': 'Restaurando vista normal del modelo. Ahora puedes ver el modelo completamente ensamblado tal como aparecería en la realidad.',
                'rotar': 'Activando controles de rotación 3D. Puedes usar gestos táctiles para rotar el modelo y explorarlo desde todos los ángulos.',
                'ayuda': 'Soy STEPVOICE AI, tu guía del proyecto. Este sistema permite explorar modelos 3D con realidad aumentada. Puedes decir "explotar modelo", "vista normal" o preguntarme sobre las tecnologías que usamos.',
                'default': 'Lo siento, soy un asistente especializado solo en modelos 3D y realidad aumentada. ¿Te gustaría preguntarme sobre las funcionalidades 3D de nuestro proyecto? Puedes preguntar sobre explosión de modelos, rotación, o realidad aumentada.'
            },
            'en': {
                'explode': 'Activating 3D model explosion view. This feature lets you see how all the pieces are assembled together. Perfect for understanding internal structure!',
                'normal': 'Restoring normal model view. Now you can see the fully assembled model as it would appear in reality.',
                'rotate': 'Activating 3D rotation controls. You can use touch gestures to rotate the model and explore it from every angle.',
                'help': 'I\'m STEPVOICE AI, your project guide. This system allows exploring 3D models with augmented reality. You can say "explode model", "normal view" or ask me about the technologies we use.',
                'default': 'Sorry, I\'m an assistant specialized only in 3D models and augmented reality. Would you like to ask me about the 3D functionalities of our project? You can ask about model explosion, rotation, or augmented reality.'
            },
            'fr': {
                'exploser': 'Activation de la vue d\'explosion du modèle 3D. Parfait pour voir tous les composants!',
                'normal': 'Restauration de la vue normale du modèle. Maintenant il est complètement assemblé.',
                'rotation': 'Contrôle de la rotation du modèle 3D. Utilisez des gestes pour l\'explorer.',
                'aide': 'Je suis STEPVOICE AI. Je peux vous aider avec les modèles 3D. Dites "exploser le modèle" ou "vue normale".',
                'default': 'Je comprends que vous voulez travailler avec des modèles 3D. Le serveur AI n\'est pas disponible, mais je peux vous aider avec des commandes de base.'
            },
            'de': {
                'explodieren': 'Aktiviere die Explosionsansicht des 3D-Modells. Perfekt, um alle Komponenten zu sehen!',
                'normal': 'Stelle die normale Modellansicht wieder her. Jetzt ist es vollständig zusammengebaut.',
                'drehen': 'Steuere die 3D-Modell-Rotation. Verwende Gesten, um es zu erkunden.',
                'hilfe': 'Ich bin STEPVOICE AI. Ich kann dir mit 3D-Modellen helfen. Sage "Modell explodieren" oder "normale Ansicht".',
                'default': 'Ich verstehe, dass du mit 3D-Modellen arbeiten möchtest. Der AI-Server ist nicht verfügbar, aber ich kann mit grundlegenden Befehlen helfen.'
            },
            'pt': {
                'explodir': 'Ativando vista de explosão do modelo 3D. Perfeito para ver todos os componentes!',
                'normal': 'Restaurando vista normal do modelo. Agora está completamente montado.',
                'rotacionar': 'Controlando a rotação do modelo 3D. Use gestos para explorá-lo.',
                'ajuda': 'Eu sou STEPVOICE AI. Posso te ajudar com modelos 3D. Diga "explodir modelo" ou "vista normal".',
                'default': 'Entendo que quer trabalhar com modelos 3D. O servidor AI não está disponível, mas posso ajudar com comandos básicos.'
            },
            'it': {
                'esplodere': 'Attivando la vista esplosione del modello 3D. Perfetto per vedere tutti i componenti!',
                'normale': 'Ripristinando la vista normale del modello. Ora è completamente assemblato.',
                'ruotare': 'Controllando la rotazione del modello 3D. Usa i gesti per esplorarlo.',
                'aiuto': 'Sono STEPVOICE AI. Posso aiutarti con i modelli 3D. Dì "esplodi modello" o "vista normale".',
                'default': 'Capisco che vuoi lavorare con modelli 3D. Il server AI non è disponibile, ma posso aiutare con comandi base.'
            }
        };

        const textLower = text.toLowerCase();
        // Normalizar el código de idioma para buscar respuestas
        const langKey = language.substring(0, 2); // Obtener solo las primeras 2 letras (es, en, fr, etc.)
        const langResponses = responses[langKey] || responses['en'];

        let responseText = langResponses.default;
        let emotion = 'calm';
        let action = null;

        // Detectar comandos de explosión en múltiples idiomas
        if (textLower.includes('explotar') || textLower.includes('explode') || textLower.includes('exploser') || 
            textLower.includes('explodieren') || textLower.includes('explodir') || textLower.includes('esplodere')) {
            responseText = langResponses['explotar'] || langResponses['explode'] || langResponses['exploser'] || 
                         langResponses['explodieren'] || langResponses['explodir'] || langResponses['esplodere'];
            emotion = 'excited';
            action = { type: 'explosion', factor: 5.0 };
        } 
        // Detectar comandos de vista normal
        else if (textLower.includes('normal') || textLower.includes('normale')) {
            responseText = langResponses['normal'] || langResponses['normale'];
            emotion = 'calm';
            action = { type: 'reset_view', factor: 0 };
        } 
        // Detectar comandos de rotación
        else if (textLower.includes('rotar') || textLower.includes('rotate') || textLower.includes('rotation') || 
                 textLower.includes('drehen') || textLower.includes('rotacionar') || textLower.includes('ruotare')) {
            responseText = langResponses['rotar'] || langResponses['rotate'] || langResponses['rotation'] || 
                         langResponses['drehen'] || langResponses['rotacionar'] || langResponses['ruotare'];
            emotion = 'helpful';
        } 
        // Detectar comandos de ayuda
        else if (textLower.includes('ayuda') || textLower.includes('help') || textLower.includes('aide') || 
                 textLower.includes('hilfe') || textLower.includes('ajuda') || textLower.includes('aiuto')) {
            responseText = langResponses['ayuda'] || langResponses['help'] || langResponses['aide'] || 
                         langResponses['hilfe'] || langResponses['ajuda'] || langResponses['aiuto'];
            emotion = 'helpful';
        }

        return {
            text: responseText,
            language: language,
            emotion: emotion,
            action: action
        };
    }

    async function processWithAI(text, language) {
        setIsAiProcessing(true);
        try {
            // Intentar con el servidor AI primero
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            console.log(`🧠 Procesando con IA en: ${AI_SERVICE_URL}`);
            const response = await fetch(`${AI_SERVICE_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: language
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    const aiResp = data.response;
                    
                    // Traducir respuesta si no está en español
                    const translatedText = await translateWithDeepL(aiResp.text, language);
                    
                    setAiResponse(translatedText);
                    setAiEmotion(aiResp.emotion || 'calm');

                    // Agregar a historial
                    const newConversation = {
                        user: text,
                        ai: translatedText,
                        language: language,
                        timestamp: new Date().toLocaleTimeString(),
                        emotion: aiResp.emotion
                    };
                    setConversationHistory(prev => [...prev, newConversation].slice(-5)); // Últimas 5

                    // Texto a voz con voz natural optimizada
                    await speakWithNaturalVoice(translatedText, language);

                    // Ejecutar acciones si hay
                    if (aiResp.action) {
                        handleAIAction(aiResp.action);
                    }

                    // Retornar respuesta con texto traducido
                    return {
                        ...aiResp,
                        text: translatedText
                    };
                }
            }

            throw new Error('Server response not successful');

        } catch (error) {
            console.error('Error procesando con IA, usando modo offline:', error);

            // Usar AI offline como fallback
            const offlineResponse = processWithOfflineAI(text, language);
            setAiResponse(offlineResponse.text);
            setAiEmotion(offlineResponse.emotion || 'calm');

            // Agregar a historial
            const newConversation = {
                user: text,
                ai: offlineResponse.text + ' (modo offline)',
                language: language,
                timestamp: new Date().toLocaleTimeString(),
                emotion: offlineResponse.emotion
            };
            setConversationHistory(prev => [...prev, newConversation].slice(-5));

            // Texto a voz offline con voz natural optimizada
            await speakWithNaturalVoice(offlineResponse.text, language);

            // Ejecutar acciones si hay
            if (offlineResponse.action) {
                handleAIAction(offlineResponse.action);
            }

            return offlineResponse;
        } finally {
            setIsAiProcessing(false);
        }
    }

    const handleAIAction = (action) => {
        if (onActionRequest) {
            onActionRequest(action);
        }

        // Manejar acciones específicas
        switch (action.type) {
            case 'explosion':
                console.log('🎯 Acción IA: Explotar modelo', action.factor);
                break;
            case 'reset_view':
                console.log('🎯 Acción IA: Vista normal');
                break;
            case 'navigation':
                console.log('🎯 Acción IA: Navegación', action.target);
                if (navigation && action.target !== 'auto_detect') {
                    navigation.navigate(action.target);
                }
                break;
        }
    };

    const getLanguageName = (code) => {
        const languages = {
            'es': 'Español',
            'en': 'Inglés',
            'fr': 'Francés',
            'de': 'Alemán',
            'it': 'Italiano',
            'pt': 'Portugués',
            'ru': 'Ruso',
            'zh': 'Chino',
            'ja': 'Japonés',
            'ko': 'Coreano',
            'ar': 'Árabe',
            'hi': 'Hindi',
            'nl': 'Neerlandés',
            'sv': 'Sueco',
            'no': 'Noruego',
            'da': 'Danés',
            'pl': 'Polaco',
            'el': 'Griego'
        };
        return languages[code] || code;
    };
    
    // Función para seleccionar la voz más natural disponible
    const selectBestVoice = async (language) => {
        try {
            const voices = await Speech.getAvailableVoicesAsync();
            const langCode = language.substring(0, 2);
            
            // Filtrar voces por idioma
            const languageVoices = voices.filter(voice => 
                voice.language?.toLowerCase().includes(langCode)
            );
            
            if (languageVoices.length === 0) {
                return null;
            }
            
            // Priorizar voces que suenan más humanas (orden de preferencia)
            const humanVoiceKeywords = [
                // PRIMERA PRIORIDAD: Voces neurales (las más humanas)
                'neural', 'premium', 'enhanced-quality', 'enhanced',
                
                // SEGUNDA PRIORIDAD: Voces específicas muy naturales
                // Español
                'monica', 'esperanza', 'guadalupe', 'jorge', 'diego', 'carlos',
                // Inglés
                'alex', 'victoria', 'daniel', 'karen', 'aaron', 'nicky', 'samantha',
                // Francés
                'amelie', 'thomas', 'marie', 'olivier',
                // Italiano
                'alice', 'luca', 'federica',
                
                // TERCERA PRIORIDAD: Voces de calidad media-alta
                'eloquence', 'voice-compact', 'compact',
                
                // CUARTA PRIORIDAD: Voces básicas de calidad
                'quality'
            ];
            
            // Buscar voces con palabras clave de calidad humana (orden de preferencia)
            for (const keyword of humanVoiceKeywords) {
                const matchedVoice = languageVoices.find(voice => 
                    voice.name?.toLowerCase().includes(keyword) ||
                    voice.identifier?.toLowerCase().includes(keyword)
                );
                if (matchedVoice) {
                    const voiceType = keyword.includes('neural') ? 'NEURAL' : 
                                    keyword.includes('premium') ? 'PREMIUM' : 
                                    keyword.includes('enhanced') ? 'ENHANCED' : 'NATURAL';
                    console.log(`🎤 Voz ${voiceType} seleccionada: ${matchedVoice.name || matchedVoice.identifier}`);
                    setCurrentVoice(`${matchedVoice.name || matchedVoice.identifier} (${voiceType})`);
                    return matchedVoice.identifier;
                }
            }
            
            // Si no encuentra voces especiales, usar la primera disponible
            const defaultVoice = languageVoices[0];
            console.log(`🎤 Voz por defecto seleccionada: ${defaultVoice.name || defaultVoice.identifier}`);
            setCurrentVoice(defaultVoice.name || defaultVoice.identifier);
            return defaultVoice.identifier;
            
        } catch (error) {
            console.error('Error seleccionando voz natural:', error);
            return null;
        }
    };
    
    // Función para mapear códigos de idioma a configuraciones de Speech
    const getSpeechLanguageConfig = (detectedLanguage) => {
        const languageMap = {
            // Español y variantes
            'es': 'es-ES',
            'es-ES': 'es-ES',
            'es-MX': 'es-MX',
            'es-AR': 'es-AR',
            'es-CO': 'es-CO',
            
            // Inglés y variantes
            'en': 'en-US',
            'en-US': 'en-US',
            'en-GB': 'en-GB',
            'en-AU': 'en-AU',
            
            // Francés
            'fr': 'fr-FR',
            'fr-FR': 'fr-FR',
            'fr-CA': 'fr-CA',
            
            // Alemán
            'de': 'de-DE',
            'de-DE': 'de-DE',
            
            // Italiano
            'it': 'it-IT',
            'it-IT': 'it-IT',
            
            // Portugués
            'pt': 'pt-BR',
            'pt-BR': 'pt-BR',
            'pt-PT': 'pt-PT',
            
            // Ruso
            'ru': 'ru-RU',
            'ru-RU': 'ru-RU',
            
            // Chino
            'zh': 'zh-CN',
            'zh-CN': 'zh-CN',
            'zh-TW': 'zh-TW',
            
            // Japonés
            'ja': 'ja-JP',
            'ja-JP': 'ja-JP',
            
            // Coreano
            'ko': 'ko-KR',
            'ko-KR': 'ko-KR',
            
            // Árabe
            'ar': 'ar-SA',
            'ar-SA': 'ar-SA',
            
            // Hindi
            'hi': 'hi-IN',
            'hi-IN': 'hi-IN',
            
            // Neerlandés
            'nl': 'nl-NL',
            'nl-NL': 'nl-NL',
            
            // Sueco
            'sv': 'sv-SE',
            'sv-SE': 'sv-SE',
            
            // Noruego
            'no': 'nb-NO',
            'nb-NO': 'nb-NO',
            
            // Danés
            'da': 'da-DK',
            'da-DK': 'da-DK',
            
            // Polaco
            'pl': 'pl-PL',
            'pl-PL': 'pl-PL',
            
            // Griego
            'el': 'el-GR',
            'el-GR': 'el-GR'
        };
        
        const speechLang = languageMap[detectedLanguage];
        console.log(`🌍 Idioma detectado: ${detectedLanguage} → Configuración Speech: ${speechLang || 'en-US (fallback)'}`);
        
        return speechLang || 'en-US'; // Fallback a inglés si no se encuentra
    };
    
    // Función para hablar con voz natural mejorada
    const speakWithNaturalVoice = async (text, language) => {
        try {
            // Interrumpir cualquier voz anterior
            await Speech.stop();
            
            setIsSpeaking(true);
            
            // Seleccionar la mejor voz disponible
            const bestVoiceId = await selectBestVoice(language);
            
            const voiceConfig = {
                language: getSpeechLanguageConfig(language),
                pitch: 0.98,         // Tono muy cercano al humano
                rate: 1.0,           // Velocidad natural humana
                quality: 'enhanced', // Calidad mejorada
                volume: 1.0,         // Volumen completo
                
                // Parámetros adicionales para voces más humanas (iOS)
                voiceQuality: 'enhanced',
                outputFormat: 'enhanced',
                audioSessionCategory: 'playback'
            };
            
            // Si encontramos una voz específica, usarla
            if (bestVoiceId) {
                voiceConfig.voice = bestVoiceId;
            }
            
            console.log(`🎵 Hablando con configuración natural:`, {
                language: voiceConfig.language,
                voice: bestVoiceId || 'sistema por defecto',
                pitch: voiceConfig.pitch,
                rate: voiceConfig.rate
            });
            
            // Añadir callbacks para manejar el estado de habla
            voiceConfig.onStart = () => {
                console.log('🎤 Voz iniciada');
                setIsSpeaking(true);
            };
            
            voiceConfig.onDone = () => {
                console.log('✓ Voz completada');
                setIsSpeaking(false);
            };
            
            voiceConfig.onStopped = () => {
                console.log('⏹️ Voz interrumpida');
                setIsSpeaking(false);
            };
            
            voiceConfig.onError = (error) => {
                console.log('❌ Error de voz:', error);
                setIsSpeaking(false);
            };
            
            await Speech.speak(text, voiceConfig);
            
        } catch (error) {
            console.error('Error hablando con voz natural:', error);
            setIsSpeaking(false);
            
            // Fallback a configuración básica
            try {
                await Speech.speak(text, {
                    language: getSpeechLanguageConfig(language),
                    pitch: 0.98,
                    rate: 1.0,
                    onDone: () => setIsSpeaking(false),
                    onStopped: () => setIsSpeaking(false),
                    onError: () => setIsSpeaking(false)
                });
            } catch (fallbackError) {
                console.error('Error en fallback de voz:', fallbackError);
                setIsSpeaking(false);
            }
        }
    };
    
    // Función para traducir texto con DeepL
    const translateWithDeepL = async (text, targetLanguage) => {
        // Si el idioma objetivo es español, no traducir (Groq ya responde en español)
        if (targetLanguage.startsWith('es')) {
            console.log('🌍 Texto ya está en español, no se requiere traducción');
            return text;
        }
        
        try {
            // Mapeo de códigos de idioma para DeepL
            const deeplLanguageMap = {
                'en': 'EN',
                'en-US': 'EN-US',
                'en-GB': 'EN-GB',
                'fr': 'FR',
                'fr-FR': 'FR',
                'de': 'DE',
                'de-DE': 'DE',
                'it': 'IT',
                'it-IT': 'IT',
                'pt': 'PT-BR',
                'pt-BR': 'PT-BR',
                'pt-PT': 'PT-PT',
                'ru': 'RU',
                'zh': 'ZH',
                'ja': 'JA',
                'ko': 'KO',
                'pl': 'PL',
                'nl': 'NL',
                'sv': 'SV',
                'da': 'DA',
                'el': 'EL'
            };
            
            // Normalizar el código de idioma
            const langKey = targetLanguage.substring(0, 2);
            const deeplTargetLang = deeplLanguageMap[targetLanguage] || deeplLanguageMap[langKey];
            
            if (!deeplTargetLang) {
                console.log(`⚠️ Idioma ${targetLanguage} no soportado por DeepL, usando texto original`);
                return text;
            }
            
            console.log(`🔄 Traduciendo de ES a ${deeplTargetLang}: "${text.substring(0, 50)}..."`);
            
            const params = new URLSearchParams({
                auth_key: DEEPL_API_KEY,
                text: text,
                source_lang: 'ES', // Groq responde en español
                target_lang: deeplTargetLang,
            });

            const response = await fetch('https://api-free.deepl.com/v2/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            const data = await response.json();
            if (data.translations && data.translations.length > 0) {
                const translatedText = data.translations[0].text;
                console.log(`✅ Traducción exitosa: "${translatedText.substring(0, 50)}..."`);
                return translatedText;
            } else {
                console.error('❌ Error: No se encontraron traducciones en la respuesta de DeepL');
                return text; // Devolver texto original si falla
            }
            
        } catch (error) {
            console.error(`❌ Error en traducción DeepL:`, error);
            return text; // Devolver texto original si falla
        }
    };

    const startPushToTalkRecording = async () => {
        if (!hasPermissions) {
            await requestPermissions();
            return;
        }

        if (isPushToTalkPressed || pushToTalkRecording) {
            return;
        }
        
        // INTERRUPCIÓN DE VOZ: Detener cualquier voz que esté sonando
        if (isSpeaking) {
            console.log('⏹️ Interrumpiendo voz para iniciar grabación');
            await Speech.stop();
            setIsSpeaking(false);
        }

        console.log('🎤 Iniciando grabación STEPVOICE AI');

        // Animación de inicio
        Animated.parallel([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonOpacity, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();

        try {
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await recording.startAsync();

            setPushToTalkRecording(recording);
            setIsPushToTalkPressed(true);
            console.log('✅ Grabación STEPVOICE AI iniciada');
        } catch (error) {
            console.error('Error iniciando grabación:', error);
            Alert.alert('Error', 'No se pudo iniciar la grabación');
            // Restaurar animación
            Animated.parallel([
                Animated.timing(buttonScale, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(buttonOpacity, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();
        }
    };

    const stopPushToTalkRecording = async () => {
        if (!isPushToTalkPressed || !pushToTalkRecording) {
            return;
        }

        console.log('⏹️ Procesando con STEPVOICE AI');

        // Animación de fin
        Animated.parallel([
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(buttonOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();

        setIsPushToTalkPressed(false);
        setIsProcessing(true);

        try {
            await pushToTalkRecording.stopAndUnloadAsync();
            const uri = pushToTalkRecording.getURI();
            setPushToTalkRecording(null);

            if (!uri) {
                console.error('No se pudo obtener URI del audio');
                setIsProcessing(false);
                return;
            }

            const response = await fetch(uri);
            const audioBlob = await response.blob();

            const uploadUrl = await uploadToAssemblyAI(audioBlob);
            if (uploadUrl) {
                const transcriptionResult = await getTranscript(uploadUrl);
                if (transcriptionResult) {
                    setTranscript(transcriptionResult.text);
                    setDetectedLanguage(transcriptionResult.language_code || 'es');

                    if (transcriptionResult.text) {
                        console.log('📝 Texto transcrito:', transcriptionResult.text);
                        console.log('🌍 Idioma:', transcriptionResult.language_code);

                        // Procesar con IA
                        await processWithAI(transcriptionResult.text, transcriptionResult.language_code);
                    }
                }
            }

            setIsProcessing(false);

        } catch (error) {
            console.error('Error procesando grabación:', error);
            setPushToTalkRecording(null);
            setIsProcessing(false);
            Alert.alert('Error', 'No se pudo procesar la grabación');
        }
    };

    const getStatusEmoji = () => {
        if (isProcessing || isAiProcessing) return '🧠';
        if (isSpeaking) return '🔊'; // Altavoz cuando está hablando
        if (isPushToTalkPressed) return '🎤';
        return '🤖';
    };

    const getStatusText = () => {
        if (isAiProcessing) return 'STEPVOICE AI procesando...';
        if (isProcessing) return 'Transcribiendo audio...';
        if (isSpeaking) return 'STEPVOICE AI hablando - Presiona para interrumpir';
        if (isPushToTalkPressed) return 'Grabando - Suelta para procesar con IA';
        return 'Mantén presionado para hablar con STEPVOICE AI';
    };

    const getEmotionColor = () => {
        const emotions = {
            'excited': '#FF6B6B',
            'helpful': '#4ECDC4',
            'thoughtful': '#45B7D1',
            'calm': '#96CEB4',
            'confident': '#FECA57'
        };
        return emotions[aiEmotion] || '#96CEB4';
    };

    const rippleScale = rippleAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.5],
    });

    const rippleOpacity = rippleAnimation.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0.8, 0.3, 0],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.header}
            >
                <Text style={styles.title}>🤖 STEPVOICE AI</Text>
                <Text style={styles.subtitle}>Asistente de Modelos 3D y AR</Text>
            </LinearGradient>

            {!hasPermissions ? (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        🎤 STEPVOICE AI necesita acceso al micrófono para escucharte.
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestPermissions}
                    >
                        <Text style={styles.permissionButtonText}>Conceder Permisos</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Respuesta de IA */}
                    <ScrollView style={styles.aiResponseSection} showsVerticalScrollIndicator={false}>
                        <LinearGradient
                            colors={[getEmotionColor() + '20', getEmotionColor() + '05']}
                            style={styles.aiResponseContainer}
                        >
                            <Animated.View style={[styles.aiIconContainer, {
                                opacity: aiGlowAnimation,
                                shadowColor: getEmotionColor()
                            }]}>
                                <Text style={styles.aiIcon}>🤖</Text>
                            </Animated.View>
                <Text style={styles.aiResponseText}>
                    {aiResponse || '¡Bienvenido al demo de STEPVOICE AI! Este es nuestro proyecto de exploración de modelos 3D con realidad aumentada.\n\n¿Qué te gustaría saber sobre el proyecto?\n\n• ¿Cómo funciona la vista de explosión 3D?\n• ¿Qué tecnologías utilizamos?\n• ¿Cómo se implementa la realidad aumentada?\n• ¿Qué modelos están disponibles?'}
                </Text>
                            {isAiProcessing && (
                                <View style={styles.aiProcessingContainer}>
                                    <ActivityIndicator color={getEmotionColor()} size="small" />
                                    <Text style={styles.aiProcessingText}>Pensando...</Text>
                                </View>
                            )}
                            {currentVoice && (
                                <Text style={styles.voiceIndicator}>
                                    🎤 Voz natural: {currentVoice}
                                </Text>
                            )}
                        </LinearGradient>
                    </ScrollView>

                    {/* Botón principal de grabación */}
                    <View style={styles.buttonSection}>
                        <View style={styles.buttonContainer}>
                            {/* Ondas de ripple */}
                            {isPushToTalkPressed && (
                                <Animated.View
                                    style={[
                                        styles.ripple,
                                        {
                                            transform: [{ scale: rippleScale }],
                                            opacity: rippleOpacity,
                                            backgroundColor: getEmotionColor(),
                                        },
                                    ]}
                                />
                            )}

                            <Animated.View
                                style={{
                                    transform: [
                                        { scale: Animated.multiply(buttonScale, pulseAnimation) }
                                    ],
                                    opacity: buttonOpacity,
                                }}
                            >
                                <Pressable
                                    style={[
                                        styles.pushToTalkButton,
                                        isPushToTalkPressed && styles.pushToTalkActive,
                                        (isProcessing || isAiProcessing) && styles.pushToTalkProcessing,
                                        isSpeaking && styles.pushToTalkSpeaking,
                                        { backgroundColor: getEmotionColor() }
                                    ]}
                                    onPressIn={startPushToTalkRecording}
                                    onPressOut={stopPushToTalkRecording}
                                    disabled={isProcessing || isAiProcessing}
                                >
                                    <Text style={styles.buttonEmoji}>
                                        {getStatusEmoji()}
                                    </Text>
                                </Pressable>
                            </Animated.View>
                        </View>

                        <Text style={[
                            styles.statusText,
                            isPushToTalkPressed && styles.recordingStatus,
                            (isProcessing || isAiProcessing) && styles.processingStatus,
                            isSpeaking && styles.speakingStatus
                        ]}>
                            {getStatusText()}
                        </Text>
                    </View>

                    {/* Sección de transcripción oculta - solo conversación visible */}

                    {/* Historial de conversación - ahora principal */}
                    {conversationHistory.length > 0 && (
                        <ScrollView style={styles.historySection} showsVerticalScrollIndicator={false}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="chatbubbles" size={20} color="#4A90E2" />
                                <Text style={styles.sectionTitle}>Conversación</Text>
                            </View>
                            {conversationHistory.slice(-5).map((conv, index) => (
                                <View key={index} style={styles.conversationItem}>
                                    <Text style={styles.userMessage}>👤 {conv.user}</Text>
                                    <Text style={[styles.aiMessage, { color: getEmotionColor() }]}>
                                        🤖 {conv.ai}
                                    </Text>
                                    <Text style={styles.timestamp}>{conv.timestamp}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </>
            )}
        </View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FF',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
        marginTop: 5,
    },
    permissionContainer: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        padding: 25,
        borderRadius: 20,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        alignItems: 'center',
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#424242',
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    aiResponseSection: {
        flex: 1,
        margin: 20,
        marginBottom: 10,
    },
    aiResponseContainer: {
        borderRadius: 20,
        padding: 20,
        minHeight: 100,
    },
    aiIconContainer: {
        alignSelf: 'center',
        marginBottom: 15,
        shadowRadius: 10,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
    },
    aiIcon: {
        fontSize: 32,
    },
    aiResponseText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#2C3E50',
        textAlign: 'center',
        fontWeight: '500',
    },
    aiProcessingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    aiProcessingText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#4A90E2',
        fontStyle: 'italic',
    },
    voiceIndicator: {
        fontSize: 11,
        color: '#7F8C8D',
        textAlign: 'center',
        marginTop: 10,
        fontStyle: 'italic',
        opacity: 0.7,
    },
    buttonSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        marginHorizontal: 20,
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ripple: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        opacity: 0.3,
    },
    pushToTalkButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    pushToTalkActive: {
        backgroundColor: '#FF6B6B',
        shadowColor: '#FF6B6B',
        borderColor: '#FFCDD2',
    },
    pushToTalkProcessing: {
        backgroundColor: '#FFA726',
        shadowColor: '#FFA726',
    },
    pushToTalkSpeaking: {
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        borderColor: '#A5D6A7',
    },
    buttonEmoji: {
        fontSize: 36,
        textAlign: 'center',
    },
    statusText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        color: '#666',
        fontWeight: '500',
        minHeight: 20,
    },
    recordingStatus: {
        color: '#FF6B6B',
        fontWeight: 'bold',
        fontSize: 18,
    },
    processingStatus: {
        color: '#4A90E2',
        fontWeight: 'bold',
        fontSize: 18,
    },
    speakingStatus: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A90E2',
        marginLeft: 8,
    },
    historySection: {
        flex: 1,
        maxHeight: 300,
        marginHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    conversationItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#4A90E2',
    },
    userMessage: {
        fontSize: 14,
        color: '#2C3E50',
        marginBottom: 5,
        fontWeight: '500',
    },
    aiMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 5,
    },
    timestamp: {
        fontSize: 12,
        color: '#95A5A6',
        textAlign: 'right',
    },
});

export default StepVoiceAIAssistant;
