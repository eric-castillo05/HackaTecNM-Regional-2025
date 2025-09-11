import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Dimensions, 
    TouchableOpacity, 
    Alert,
    Animated,
    PanResponder 
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import StepVoiceAIAssistant from './StepVoiceAIAssistant';

const { width, height } = Dimensions.get('window');

const AI3DExplorerScreen = ({ navigation, route }) => {
    // Estados del modelo 3D
    const [explosionFactor, setExplosionFactor] = useState(0);
    const [currentView, setCurrentView] = useState('normal');
    const [isLoading, setIsLoading] = useState(true);
    const [showAI, setShowAI] = useState(false);
    
    // Referencias para animaciones
    const aiPanelHeight = useRef(new Animated.Value(0)).current;
    const webViewOpacity = useRef(new Animated.Value(1)).current;
    
    // WebView reference para enviar comandos
    const webViewRef = useRef(null);
    
    // Configuración del modelo 3D
    const model3DUrl = route?.params?.modelUrl || 'http://127.0.0.1:8051/'; // Tu backend Dash

    useEffect(() => {
        console.log('🎯 Iniciando AI 3D Explorer');
        Speech.speak("Cargando explorador de modelos 3D con inteligencia artificial");
    }, []);

    const toggleAIPanel = () => {
        const toValue = showAI ? 0 : height * 0.6;
        
        setShowAI(!showAI);
        
        Animated.parallel([
            Animated.timing(aiPanelHeight, {
                toValue,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(webViewOpacity, {
                toValue: showAI ? 1 : 0.3,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleAIAction = (action) => {
        console.log('🎯 Recibiendo acción de IA:', action);
        
        switch (action.type) {
            case 'explosion':
                setExplosionFactor(action.factor || 5.0);
                sendCommandToWebView('setExplosion', action.factor || 5.0);
                Speech.speak("Activando vista de explosión del modelo");
                break;
                
            case 'reset_view':
                setExplosionFactor(0);
                setCurrentView('normal');
                sendCommandToWebView('resetView');
                Speech.speak("Restaurando vista normal");
                break;
                
            case 'rotate':
                sendCommandToWebView('rotate', action.direction || 'auto');
                Speech.speak("Rotando modelo");
                break;
                
            case 'zoom':
                sendCommandToWebView('zoom', action.level || 'in');
                Speech.speak(`Aplicando zoom ${action.level || 'in'}`);
                break;
                
            case 'view_change':
                setCurrentView(action.view || 'normal');
                sendCommandToWebView('changeView', action.view);
                Speech.speak(`Cambiando a vista ${action.view}`);
                break;
                
            case 'navigation':
                if (action.target && action.target !== 'auto_detect') {
                    navigation.navigate(action.target);
                }
                break;
                
            default:
                console.log('Acción no reconocida:', action.type);
        }
    };

    const sendCommandToWebView = (command, params) => {
        if (webViewRef.current) {
            const jsCode = `
                try {
                    if (window.handleAICommand) {
                        window.handleAICommand('${command}', ${JSON.stringify(params)});
                    } else {
                        console.log('AI Command handler not found');
                    }
                } catch (error) {
                    console.error('Error executing AI command:', error);
                }
                true;
            `;
            webViewRef.current.injectJavaScript(jsCode);
        }
    };

    const quickActions = [
        {
            id: 'explode',
            icon: 'scatter-plot',
            label: 'Explotar',
            color: '#FF6B6B',
            action: () => handleAIAction({ type: 'explosion', factor: 5.0 })
        },
        {
            id: 'normal',
            icon: 'view-in-ar',
            label: 'Normal',
            color: '#4ECDC4',
            action: () => handleAIAction({ type: 'reset_view' })
        },
        {
            id: 'rotate',
            icon: '360',
            label: 'Rotar',
            color: '#45B7D1',
            action: () => handleAIAction({ type: 'rotate' })
        },
        {
            id: 'zoom',
            icon: 'zoom-in',
            label: 'Zoom',
            color: '#96CEB4',
            action: () => handleAIAction({ type: 'zoom', level: 'in' })
        }
    ];

    const injectedJavaScript = `
        // Función para manejar comandos de IA desde React Native
        window.handleAICommand = function(command, params) {
            console.log('Recibiendo comando AI:', command, params);
            
            switch(command) {
                case 'setExplosion':
                    if (window.updateSliderFromAI) {
                        window.updateSliderFromAI(params);
                    }
                    break;
                case 'resetView':
                    if (window.resetModelView) {
                        window.resetModelView();
                    }
                    break;
                case 'rotate':
                    if (window.rotateModel) {
                        window.rotateModel(params);
                    }
                    break;
                case 'zoom':
                    if (window.zoomModel) {
                        window.zoomModel(params);
                    }
                    break;
                case 'changeView':
                    if (window.changeModelView) {
                        window.changeModelView(params);
                    }
                    break;
                default:
                    console.log('Comando no reconocido:', command);
            }
        };
        
        // Notificar que el modelo está cargado
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'modelLoaded', status: 'ready' })
        );
        
        true; // Necesario para evaluar correctamente
    `;

    const onWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('📨 Mensaje desde WebView:', data);
            
            switch (data.type) {
                case 'modelLoaded':
                    setIsLoading(false);
                    Speech.speak("Modelo 3D cargado y listo para interacción");
                    break;
                case 'explosionChanged':
                    setExplosionFactor(data.value);
                    break;
                case 'viewChanged':
                    setCurrentView(data.view);
                    break;
            }
        } catch (error) {
            console.error('Error procesando mensaje de WebView:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header con información del modelo */}
            <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🎯 AI 3D Explorer</Text>
                    <Text style={styles.headerSubtitle}>
                        Vista: {currentView} | Explosión: {explosionFactor.toFixed(1)}
                    </Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.aiToggle, showAI && styles.aiToggleActive]}
                    onPress={toggleAIPanel}
                >
                    <MaterialIcons 
                        name="smart-toy" 
                        size={24} 
                        color={showAI ? '#FFD700' : '#fff'} 
                    />
                </TouchableOpacity>
            </LinearGradient>

            {/* Modelo 3D WebView */}
            <Animated.View style={[styles.webViewContainer, { opacity: webViewOpacity }]}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: model3DUrl }}
                    style={styles.webView}
                    originWhitelist={['*']}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    injectedJavaScript={injectedJavaScript}
                    onMessage={onWebViewMessage}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={(error) => {
                        console.error('Error cargando WebView:', error);
                        Alert.alert('Error', 'No se pudo cargar el modelo 3D');
                    }}
                />
                
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <MaterialIcons name="view-in-ar" size={48} color="#4A90E2" />
                        <Text style={styles.loadingText}>Cargando modelo 3D...</Text>
                    </View>
                )}
            </Animated.View>

            {/* Botones de acción rápida */}
            <View style={styles.quickActionsContainer}>
                {quickActions.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        style={[styles.quickActionButton, { backgroundColor: action.color }]}
                        onPress={action.action}
                    >
                        <MaterialIcons name={action.icon} size={24} color="#fff" />
                        <Text style={styles.quickActionText}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Panel de IA deslizable */}
            <Animated.View 
                style={[
                    styles.aiPanel, 
                    { 
                        height: aiPanelHeight,
                        transform: [{ 
                            translateY: aiPanelHeight.interpolate({
                                inputRange: [0, height * 0.6],
                                outputRange: [height * 0.6, 0]
                            })
                        }]
                    }
                ]}
            >
                <View style={styles.aiPanelHandle}>
                    <View style={styles.aiPanelHandlebar} />
                    <Text style={styles.aiPanelTitle}>🤖 STEPVOICE AI Assistant</Text>
                </View>
                
                {showAI && (
                    <StepVoiceAIAssistant 
                        navigation={navigation}
                        onActionRequest={handleAIAction}
                        style={styles.aiAssistant}
                    />
                )}
            </Animated.View>

            {/* Indicador de estado de IA */}
            {showAI && (
                <View style={styles.aiStatusIndicator}>
                    <MaterialIcons name="mic" size={16} color="#FFD700" />
                    <Text style={styles.aiStatusText}>IA Activa - Habla para controlar el modelo</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 8,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
        marginTop: 4,
    },
    aiToggle: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    aiToggleActive: {
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
    },
    webViewContainer: {
        flex: 1,
        margin: 10,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    webView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(248, 249, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#4A90E2',
        marginTop: 10,
        fontWeight: '500',
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    quickActionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
    },
    quickActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    aiPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    aiPanelHandle: {
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#f8f9ff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    aiPanelHandlebar: {
        width: 40,
        height: 4,
        backgroundColor: '#4A90E2',
        borderRadius: 2,
        opacity: 0.3,
        marginBottom: 8,
    },
    aiPanelTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A90E2',
    },
    aiAssistant: {
        flex: 1,
    },
    aiStatusIndicator: {
        position: 'absolute',
        top: 120,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    aiStatusText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
});

export default AI3DExplorerScreen;
