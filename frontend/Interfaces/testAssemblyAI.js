import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity
} from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';


const ASSEMBLYAI_API_KEY = '7cbc39b7c733465f8546b25cf4cfc1c6';

export default function App() {
    const [recording, setRecording] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [translation, setTranslation] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAssistantActive, setIsAssistantActive] = useState(true);
    
    const listeningRecording = useRef(null);
    const listeningInterval = useRef(null);
    const assistantCallsCount = useRef(0);

    const navigation = useNavigation();


    useEffect(() => {
        console.log('🚀 Iniciando sistema de asistente de voz');
        console.log('📊 Contador de activaciones inicializado en: 0');
        requestPermissions();
    }, []);

    useEffect(() => {
        if (hasPermissions && isAssistantActive) {
            startListeningForKeyword();
        }
        
        return () => {
            stopListeningForKeyword();
        };
    }, [hasPermissions, isAssistantActive]);

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
                    'Esta app necesita acceso al micrófono para funcionar.',
                    [{ text: 'Reintentar', onPress: requestPermissions }]
                );
            }
        } catch (err) {
            console.error('Error solicitando permisos:', err);
            Alert.alert('Error', 'No se pudieron solicitar los permisos de audio');
        }
    }

    async function startListeningForKeyword() {
        if (!hasPermissions || isListening) return;
        
        try {
            setIsListening(true);
            
            const startListeningCycle = async () => {
                if (!isAssistantActive || isRecording || isProcessing) {
                    console.log('🗑️ Saltando ciclo de escucha:', { isAssistantActive, isRecording, isProcessing });
                    return;
                }
                
                console.log('👂 Iniciando nuevo ciclo de escucha...');
                
                try {
                    // Prepare the recording first
                    const recording = new Audio.Recording();
                    await recording.prepareToRecordAsync({
                        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                        android: {
                            extension: '.m4a',
                            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
                            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
                            sampleRate: 44100,
                            numberOfChannels: 2,
                            bitRate: 128000,
                            maxFileSize: 1024 * 1024, // 1MB max
                        },
                        ios: {
                            extension: '.m4a',
                            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
                            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                            sampleRate: 44100,
                            numberOfChannels: 2,
                            bitRate: 128000,
                            linearPCMBitDepth: 16,
                            linearPCMIsBigEndian: false,
                            linearPCMIsFloat: false,
                        },
                        web: {
                            mimeType: 'audio/webm',
                            bitsPerSecond: 128000,
                        },
                    });
                    
                    // Start recording after preparation
                    await recording.startAsync();
                    
                    listeningRecording.current = recording;
                    
                    // Grabar por 4 segundos para mejor captura
                    setTimeout(async () => {
                        if (listeningRecording.current && isAssistantActive) {
                            console.log('🎤 Procesando audio capturado...');
                            await processKeywordDetection(listeningRecording.current);
                        }
                    }, 4000);
                    
                } catch (error) {
                    console.error('Error en ciclo de escucha:', error);
                    // Reintentar después de 1 segundo
                    setTimeout(startListeningCycle, 1000);
                }
            };
            
            startListeningCycle();
            
            // Configurar intervalo para escucha continua
            listeningInterval.current = setInterval(() => {
                if (isAssistantActive && !isRecording && !isProcessing) {
                    startListeningCycle();
                }
            }, 5000); // Cada 5 segundos
            
        } catch (error) {
            console.error('Error iniciando escucha de palabra clave:', error);
            setIsListening(false);
        }
    }

    async function stopListeningForKeyword() {
        setIsListening(false);
        
        if (listeningInterval.current) {
            clearInterval(listeningInterval.current);
            listeningInterval.current = null;
        }
        
        if (listeningRecording.current) {
            try {
                await listeningRecording.current.stopAndUnloadAsync();
            } catch (error) {
                console.error('Error deteniendo grabación de escucha:', error);
            }
            listeningRecording.current = null;
        }
    }

    async function processKeywordDetection(recording) {
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            
            if (!uri) return;
            
            const response = await fetch(uri);
            const audioBlob = await response.blob();
            
            const uploadUrl = await uploadToAssemblyAI(audioBlob);
            if (uploadUrl) {
                const transcriptionResult = await getTranscriptForKeyword(uploadUrl);
                if (transcriptionResult && transcriptionResult.text) {
                    const text = transcriptionResult.text.toLowerCase();
                    console.log('Texto detectado:', text);
                    
                    // Detectar palabra clave con "oye" como principal
                    const keywords = ['oye', 'hey', 'hola', 'asistente', 'assistant', 'asisten', 'sistente'];
                    const hasKeyword = keywords.some(keyword => text.includes(keyword));
                    
                    console.log('🔍 Analizando texto para palabra clave:', text);
                    console.log('🎯 Palabras clave buscadas:', keywords.join(', '));
                    
                    if (hasKeyword) {
                        assistantCallsCount.current += 1;
                        console.log('=== 🔊 ACTIVACIÓN DEL ASISTENTE DETECTADA 🔊 ===');
                        console.log(`📊 Número de activación: ${assistantCallsCount.current}`);
                        console.log(`Texto detectado: "${text}"`);
                        console.log('Fecha/hora:', new Date().toLocaleString());
                        console.log('================================================');
                        await handleKeywordActivation();
                    } else {
                        console.log('😵 No se detectó palabra clave en el texto');
                    }
                } else {
                    console.log('⚠️ No se obtuvo texto de la transcripción');
                }
            } else {
                console.log('⚠️ No se pudo subir el audio a AssemblyAI');
            }
        } catch (error) {
            console.error('Error procesando detección de palabra clave:', error);
        }
    }

    async function getTranscriptForKeyword(audioUrl) {
        try {
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: {
                    authorization: ASSEMBLYAI_API_KEY,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    audio_url: audioUrl,
                    language_detection: false, // Desactivar detección automática
                    language_code: 'es', // Forzar español para mejor reconocimiento
                    speech_threshold: 0.05, // Aún más sensible para captar "oye"
                    punctuate: false, // Sin puntuación para simplificar
                    format_text: false, // Sin formato para texto más limpio
                    boost_param: 'high', // Aumentar precisión
                    filter_profanity: false // No filtrar para captar todas las palabras
                }),
            });

            const data = await response.json();
            const transcriptId = data.id;

            // Polling más rápido para palabra clave
            let attempts = 0;
            while (attempts < 10) { // Máximo 10 intentos
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
                    break;
                }
                await new Promise((r) => setTimeout(r, 1000)); // 1 segundo entre intentos
                attempts++;
            }
        } catch (err) {
            console.error('Error al obtener transcripción de palabra clave:', err);
        }
        return null;
    }

    async function handleKeywordActivation() {
        console.log('👂 Iniciando proceso de activación del asistente...');
        // Detener la escucha continua temporalmente
        await stopListeningForKeyword();
        
        // Mostrar que se activó el asistente
        Alert.alert(
            '🎙️ Asistente Activado',
            'Te estoy escuchando... Habla ahora.',
            [{ text: 'OK' }]
        );
        
        // Iniciar grabación principal
        await startMainRecording();
    }

    async function startMainRecording() {
        console.log('🎤 Iniciando grabación principal del asistente');
        if (!hasPermissions) {
            console.log('⚠️ No hay permisos de micrófono, solicitando...');
            await requestPermissions();
            return;
        }

        try {
            // Prepare the recording first
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            
            // Start recording after preparation
            await recording.startAsync();

            console.log('✅ Grabación iniciada correctamente');
            setRecording(recording);
            setIsRecording(true);
            setTranscript('');
            setTranslation('');
            setDetectedLanguage('');
            
            // Detener grabación automáticamente después de 10 segundos
            setTimeout(() => {
                if (recording) {
                    stopRecording();
                }
            }, 10000);
            
        } catch (err) {
            console.error('Error al iniciar grabación:', err);
            Alert.alert('Error', 'No se pudo iniciar la grabación');
        }
    }

    async function stopRecording() {
        console.log('⏹️ Deteniendo grabación del asistente');
        try {
            if (!recording) {
                console.log('⚠️ No hay grabación activa para detener');
                return;
            }

            setIsRecording(false);
            setIsProcessing(true);

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

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
                    setDetectedLanguage(transcriptionResult.language_code || 'Desconocido');

                    if (transcriptionResult.text) {
                        console.log('📝 Texto transcrito:', transcriptionResult.text);
                        const translatedText = await translateToEnglish(transcriptionResult.text);
                        console.log('🌐 Texto traducido:', translatedText);
                        setTranslation(translatedText);
                    }
                }
            }

            setRecording(null);
            setIsProcessing(false);
            
            // Reanudar escucha de palabra clave después de procesar
            setTimeout(() => {
                if (isAssistantActive) {
                    startListeningForKeyword();
                }
            }, 2000);

        } catch (err) {
            console.error('Error al procesar grabación:', err);
            setIsProcessing(false);
            // Reanudar escucha incluso si hay error
            setTimeout(() => {
                if (isAssistantActive) {
                    startListeningForKeyword();
                }
            }, 2000);
            Alert.alert('Error', 'No se pudo procesar la grabación');
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

            // Polling para obtener resultado
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

    async function translateToEnglish(text) {
        try {
            const params = new URLSearchParams({
                auth_key: 'a70ccccf-66c0-49f4-80da-48ef2d00726a:fx',
                text: text,
                target_lang: 'EN',
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
                return data.translations[0].text;
            }
            return '';
        } catch (err) {
            console.error('Error en traducción:', err);
            return '';
        }
    }

    const getLanguageName = (code) => {
        const languages = {
            'es': 'Español',
            'en': 'Inglés',
            'fr': 'Francés',
            'de': 'Alemán',
            'it': 'Italiano',
            'pt': 'Portugués',
            'ru': 'Ruso',
            'ja': 'Japonés',
            'ko': 'Coreano',
            'zh': 'Chino'
        };
        return languages[code] || code;
    };

    const getStatusText = () => {
        if (isProcessing) return '⚡ Procesando audio...';
        if (isRecording) return '🎤 Grabando... (Se detendrá automáticamente)';
        if (isListening && isAssistantActive) return '👂 Escuchando "oye"...';
        if (isAssistantActive) return '🤖 Asistente listo - Di "oye" para activar';
        return '😴 Asistente desactivado';
    };

    const toggleAssistant = async () => {
        if (isAssistantActive) {
            console.log('😴 Desactivando asistente manualmente');
            await stopListeningForKeyword();
            setIsAssistantActive(false);
            console.log('⚠️ Asistente desactivado - No escuchará comandos');
        } else {
            console.log('🤖 Activando asistente manualmente');
            console.log(`📊 Activaciones hasta ahora: ${assistantCallsCount.current}`);
            setIsAssistantActive(true);
            if (hasPermissions) {
                await startListeningForKeyword();
            }
            console.log('✅ Asistente activado - Escuchando "oye"...');
        }
    };

    const handlePloty = async () => {
        navigation.navigate('Explosionado');

    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🤖 Asistente de Voz</Text>

            {!hasPermissions ? (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        📱 Esta app necesita permisos para acceder al micrófono.
                    </Text>
                    <Button
                        title="Conceder Permisos"
                        onPress={requestPermissions}
                        color="#007AFF"
                    />
                </View>
            ) : (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.assistantButton,
                            isAssistantActive ? styles.assistantActive : styles.assistantInactive
                        ]}
                        onPress={toggleAssistant}
                        disabled={isProcessing || isRecording}
                    >
                        <Text style={styles.assistantButtonText}>
                            {isAssistantActive ? '🤖 Desactivar Asistente' : '🤖 Activar Asistente'}
                        </Text>
                    </TouchableOpacity>
                    
                    {isRecording && (
                        <TouchableOpacity
                            style={styles.stopButton}
                            onPress={stopRecording}
                        >
                            <Text style={styles.stopButtonText}>⏹️ Detener Ahora</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={() => {
                            console.log('🧪 Activación manual de prueba');
                            handleKeywordActivation();
                        }}
                        disabled={isProcessing || isRecording}
                    >
                        <Text style={styles.testButtonText}>🧪 Prueba Manual</Text>
                    </TouchableOpacity>



                </View>
            )}

            <Text style={[
                styles.statusText,
                isRecording && styles.recordingStatus,
                isProcessing && styles.processingStatus,
                isListening && styles.listeningStatus
            ]}>
                {getStatusText()}
            </Text>

            {detectedLanguage && (
                <Text style={styles.detectedLanguage}>
                    🌍 Idioma detectado: {getLanguageName(detectedLanguage)}
                </Text>
            )}

            <ScrollView style={styles.transcriptBox}>
                <Text style={styles.label}>📝 Texto transcrito:</Text>
                <Text style={styles.transcriptText}>
                    {transcript || 'Di "oye" para activar el reconocimiento de voz...'}
                </Text>

                <Text style={styles.label}>🌐 Traducción al inglés:</Text>
                <Text style={styles.transcriptText}>
                    {translation || 'La traducción aparecerá aquí después de hablar...'}
                </Text>
            </ScrollView>


            <TouchableOpacity style={styles.testButton} onPress={handlePloty}>
                <Text style={styles.testButtonText}>🧪 Prueba Manual</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa'
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#007AFF'
    },
    permissionContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
        lineHeight: 24
    },
    buttonContainer: {
        marginBottom: 20,
    },
    statusText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 15,
        color: '#666',
        fontWeight: '600',
        minHeight: 25
    },
    recordingStatus: {
        color: '#ff4444',
        fontWeight: 'bold'
    },
    processingStatus: {
        color: '#FF9500',
        fontWeight: 'bold'
    },
    transcriptBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        height: 300,
        borderWidth: 1,
        borderColor: '#e1e8ed',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    label: {
        fontWeight: 'bold',
        marginTop: 10,
        fontSize: 16,
        color: '#333',
        marginBottom: 8
    },
    transcriptText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        marginBottom: 15
    },
    detectedLanguage: {
        fontSize: 14,
        color: '#007AFF',
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: '500',
        backgroundColor: '#F0F8FF',
        padding: 8,
        borderRadius: 6
    },
    listeningStatus: {
        color: '#4CAF50',
        fontWeight: 'bold'
    },
    assistantButton: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    assistantActive: {
        backgroundColor: '#4CAF50',
    },
    assistantInactive: {
        backgroundColor: '#9E9E9E',
    },
    assistantButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    stopButton: {
        backgroundColor: '#FF5722',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    stopButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    testButton: {
        backgroundColor: '#9C27B0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    testButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
    }
});
