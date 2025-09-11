import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    ScrollView,
    Alert,
    Pressable,
    Animated,
    Dimensions
} from 'react-native';
import { Audio } from 'expo-av';

const ASSEMBLYAI_API_KEY = '7cbc39b7c733465f8546b25cf4cfc1c6';

export default function App() {
    const [transcript, setTranscript] = useState('');
    const [translation, setTranslation] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [isPushToTalkPressed, setIsPushToTalkPressed] = useState(false);
    const [pushToTalkRecording, setPushToTalkRecording] = useState(null);

    // Animaciones
    const buttonScale = useRef(new Animated.Value(1)).current;
    const buttonOpacity = useRef(new Animated.Value(1)).current;
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const rippleAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('🚀 Iniciando sistema de grabación push-to-talk');
        requestPermissions();
    }, []);

    useEffect(() => {
        if (isPushToTalkPressed) {
            startPulseAnimation();
            startRippleAnimation();
        } else {
            stopAnimations();
        }
    }, [isPushToTalkPressed]);

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
                    'Esta app necesita acceso al micrófono para funcionar.',
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

    const startPushToTalkRecording = async () => {
        if (!hasPermissions) {
            await requestPermissions();
            return;
        }

        if (isPushToTalkPressed || pushToTalkRecording) {
            return;
        }

        console.log('🎤 Iniciando grabación push-to-talk');

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
            console.log('✅ Grabación push-to-talk iniciada');
        } catch (error) {
            console.error('Error iniciando grabación push-to-talk:', error);
            Alert.alert('Error', 'No se pudo iniciar la grabación');

            // Restaurar animación en caso de error
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

        console.log('⏹️ Deteniendo grabación push-to-talk');

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
                    setDetectedLanguage(transcriptionResult.language_code || 'Desconocido');

                    if (transcriptionResult.text) {
                        console.log('📝 Texto transcrito (push-to-talk):', transcriptionResult.text);
                        const translatedText = await translateToEnglish(transcriptionResult.text);
                        console.log('🌐 Texto traducido (push-to-talk):', translatedText);
                        setTranslation(translatedText);
                    }
                }
            }

            setIsProcessing(false);

        } catch (error) {
            console.error('Error procesando grabación push-to-talk:', error);
            setPushToTalkRecording(null);
            setIsProcessing(false);
            Alert.alert('Error', 'No se pudo procesar la grabación');
        }
    };

    const getStatusEmoji = () => {
        if (isProcessing) return '⚡';
        if (isPushToTalkPressed) return '🔴';
        return '🎙️';
    };

    const getStatusText = () => {
        if (isProcessing) return 'Procesando audio...';
        if (isPushToTalkPressed) return 'Grabando - Suelta para detener';
        return 'Mantén presionado para grabar';
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
            <Text style={styles.title}>🎤 Grabadora de Voz</Text>

            {!hasPermissions ? (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        📱 Esta app necesita permisos para acceder al micrófono.
                    </Text>
                    <Button
                        title="Conceder Permisos"
                        onPress={requestPermissions}
                        color="#1E88E5"
                    />
                </View>
            ) : (
                <>
                    {/* Sección de traducción arriba */}
                    <View style={styles.translationSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>🌐</Text>
                            <Text style={styles.sectionTitle}>Traducción al inglés</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.resultText}>
                                {translation || 'La traducción aparecerá aquí...'}
                            </Text>
                        </View>
                        {detectedLanguage && (
                            <Text style={styles.detectedLanguage}>
                                🌍 Idioma detectado: {getLanguageName(detectedLanguage)}
                            </Text>
                        )}
                    </View>

                    {/* Botón central circular */}
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
                                        isProcessing && styles.pushToTalkProcessing
                                    ]}
                                    onPressIn={startPushToTalkRecording}
                                    onPressOut={stopPushToTalkRecording}
                                    disabled={isProcessing}
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
                            isProcessing && styles.processingStatus
                        ]}>
                            {getStatusText()}
                        </Text>
                    </View>

                    {/* Sección de transcripción abajo */}
                    <View style={styles.transcriptionSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionIcon}>📝</Text>
                            <Text style={styles.sectionTitle}>Texto transcrito</Text>
                        </View>
                        <ScrollView style={styles.textContainer} showsVerticalScrollIndicator={false}>
                            <Text style={styles.resultText}>
                                {transcript || 'Mantén presionado el botón para comenzar a grabar...'}
                            </Text>
                        </ScrollView>
                    </View>
                </>
            )}
        </View>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F8FF',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#1E88E5',
        textShadowColor: 'rgba(30, 136, 229, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    permissionContainer: {
        backgroundColor: '#FFFFFF',
        padding: 25,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(30, 136, 229, 0.1)',
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#424242',
        lineHeight: 24,
    },
    translationSection: {
        flex: 1,
        marginBottom: 20,
    },
    transcriptionSection: {
        flex: 1,
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    sectionIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E88E5',
    },
    textContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        flex: 1,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(30, 136, 229, 0.08)',
    },
    resultText: {
        fontSize: 16,
        color: '#424242',
        lineHeight: 24,
        textAlign: 'left',
    },
    detectedLanguage: {
        fontSize: 14,
        color: '#1E88E5',
        marginTop: 12,
        textAlign: 'center',
        fontWeight: '500',
        backgroundColor: '#E3F2FD',
        padding: 8,
        borderRadius: 8,
    },
    buttonSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
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
        backgroundColor: '#2196F3',
        opacity: 0.3,
    },
    pushToTalkButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1E88E5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    pushToTalkActive: {
        backgroundColor: '#F44336',
        shadowColor: '#F44336',
        borderColor: '#FFCDD2',
    },
    pushToTalkProcessing: {
        backgroundColor: '#FF9800',
        shadowColor: '#FF9800',
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
        color: '#F44336',
        fontWeight: 'bold',
        fontSize: 18,
    },
    processingStatus: {
        color: '#FF9800',
        fontWeight: 'bold',
        fontSize: 18,
    },
});