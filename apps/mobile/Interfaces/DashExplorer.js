import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    Modal,
    Dimensions,
    StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DashExplorer = ({ navigation }) => {
    const [isServerRunning, setIsServerRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showWebView, setShowWebView] = useState(false);
    const [serverUrl, setServerUrl] = useState('');
    const [serverStatus, setServerStatus] = useState('Iniciando...');
    const webViewRef = useRef(null);

    // Configuración del servidor
    const SERVER_HOST = '192.168.0.39';
    const SERVER_PORT = 8051; // Puerto diferente para evitar conflictos
    const FULL_SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

    useEffect(() => {
        initializeDashServer();
        return () => {
            // Cleanup al salir del componente
            stopDashServer();
        };
    }, []);

    const initializeDashServer = async () => {
        try {
            setServerStatus('Verificando Python...');
            
            // Verificar si Python está disponible
            const pythonCheck = await checkPythonAvailability();
            if (!pythonCheck) {
                throw new Error('Python no está disponible');
            }

            setServerStatus('Iniciando servidor Dash...');
            await startDashServer();
            
        } catch (error) {
            console.error('Error inicializando servidor:', error);
            setServerStatus(`Error: ${error.message}`);
            Alert.alert(
                'Error del Servidor',
                'No se pudo iniciar el servidor Dash. ¿Deseas usar la versión nativa de Three.js?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Usar Three.js', onPress: () => navigation.goBack() }
                ]
            );
        }
    };

    const checkPythonAvailability = async () => {
        try {
            // En un entorno real, aquí verificarías si Python está disponible
            // Para este ejemplo, asumimos que está disponible
            return true;
        } catch (error) {
            console.error('Python no disponible:', error);
            return false;
        }
    };

    const startDashServer = async () => {
        try {
            setServerStatus('Configurando servidor...');
            
            // Simular inicio del servidor (en un entorno real, ejecutarías el script Python)
            // Por ahora, usaremos la URL del servidor que debe estar ejecutándose externamente
            
            setTimeout(() => {
                setServerUrl(FULL_SERVER_URL);
                setIsServerRunning(true);
                setServerStatus('Servidor listo');
                setIsLoading(false);
            }, 2000);
            
        } catch (error) {
            throw new Error(`No se pudo iniciar el servidor: ${error.message}`);
        }
    };

    const stopDashServer = async () => {
        try {
            setIsServerRunning(false);
            setServerStatus('Detenido');
        } catch (error) {
            console.error('Error deteniendo servidor:', error);
        }
    };

    const openDashInterface = () => {
        if (isServerRunning) {
            setShowWebView(true);
        } else {
            Alert.alert('Error', 'El servidor no está ejecutándose');
        }
    };

    const closeDashInterface = () => {
        setShowWebView(false);
    };

    const refreshWebView = () => {
        if (webViewRef.current) {
            webViewRef.current.reload();
        }
    };

    const handleWebViewError = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView error: ', nativeEvent);
        Alert.alert(
            'Error de Conexión',
            'No se pudo conectar al servidor Dash. ¿Deseas reintentar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Reintentar', onPress: refreshWebView }
            ]
        );
    };

    const handleWebViewLoad = () => {
        console.log('WebView cargado exitosamente');
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>🚀 Iniciando Visualizador Dash</Text>
                <Text style={styles.statusText}>{serverStatus}</Text>
                <View style={styles.loadingInfo}>
                    <Text style={styles.infoText}>• Cargando Python backend</Text>
                    <Text style={styles.infoText}>• Inicializando servidor Plotly</Text>
                    <Text style={styles.infoText}>• Procesando modelo 3D</Text>
                </View>
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dash Explorer</Text>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={refreshWebView}
                >
                    <Text style={styles.refreshButtonText}>🔄</Text>
                </TouchableOpacity>
            </View>

            {/* Status Panel */}
            <View style={styles.statusPanel}>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Estado del Servidor:</Text>
                    <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: isServerRunning ? '#4CAF50' : '#f44336' }
                    ]}>
                        <Text style={styles.statusIndicatorText}>
                            {isServerRunning ? 'ACTIVO' : 'INACTIVO'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.serverUrl}>URL: {serverUrl || 'No disponible'}</Text>
            </View>

            {/* Control Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]}
                    onPress={openDashInterface}
                    disabled={!isServerRunning}
                >
                    <Text style={styles.buttonText}>
                        🚀 Abrir Visualizador Dash
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]}
                    onPress={initializeDashServer}
                >
                    <Text style={styles.buttonText}>
                        🔄 Reiniciar Servidor
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>📋 Instrucciones:</Text>
                <Text style={styles.instructionText}>
                    1. Asegúrate de que el servidor Python esté ejecutándose
                </Text>
                <Text style={styles.instructionText}>
                    2. Ejecuta: <Text style={styles.codeText}>cd backend && python app.py</Text>
                </Text>
                <Text style={styles.instructionText}>
                    3. Presiona "Abrir Visualizador Dash" para acceder
                </Text>
                <Text style={styles.instructionText}>
                    4. Usa los controles web para manipular el modelo 3D
                </Text>
            </View>

            {/* WebView Modal */}
            <Modal
                visible={showWebView}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={closeDashInterface}
            >
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={closeDashInterface}
                        >
                            <Text style={styles.modalCloseText}>✕ Cerrar</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Visualizador 3D - Dash</Text>
                        <TouchableOpacity 
                            style={styles.modalRefreshButton}
                            onPress={refreshWebView}
                        >
                            <Text style={styles.modalRefreshText}>🔄</Text>
                        </TouchableOpacity>
                    </View>

                    {/* WebView */}
                    <WebView
                        ref={webViewRef}
                        source={{ uri: serverUrl }}
                        style={styles.webview}
                        onLoad={handleWebViewLoad}
                        onError={handleWebViewError}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.webviewLoading}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.webviewLoadingText}>Cargando Dash...</Text>
                            </View>
                        )}
                        onLoadStart={() => console.log('WebView loading started')}
                        onLoadEnd={() => console.log('WebView loading ended')}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    loadingText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        color: '#333',
        textAlign: 'center',
    },
    statusText: {
        fontSize: 16,
        marginTop: 10,
        color: '#666',
        textAlign: 'center',
    },
    loadingInfo: {
        marginTop: 30,
        alignItems: 'flex-start',
    },
    infoText: {
        fontSize: 14,
        color: '#777',
        marginVertical: 3,
    },
    cancelButton: {
        marginTop: 30,
        backgroundColor: '#f44336',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 15,
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    refreshButton: {
        padding: 8,
    },
    refreshButtonText: {
        fontSize: 18,
    },
    statusPanel: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 10,
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 10,
        color: '#333',
    },
    statusIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusIndicatorText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    serverUrl: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'monospace',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        gap: 15,
    },
    button: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    instructionsContainer: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 10,
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    codeText: {
        fontFamily: 'monospace',
        backgroundColor: '#f0f0f0',
        padding: 2,
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#333',
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 50, // Status bar space
    },
    modalCloseButton: {
        padding: 8,
    },
    modalCloseText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    modalTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalRefreshButton: {
        padding: 8,
    },
    modalRefreshText: {
        fontSize: 18,
    },
    webview: {
        flex: 1,
    },
    webviewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    webviewLoadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
});

export default DashExplorer;
