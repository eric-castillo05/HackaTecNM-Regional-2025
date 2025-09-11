import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Modal, 
    Dimensions, 
    StatusBar,
    ActivityIndicator,
    Alert
} from 'react-native';
import { WebView } from 'react-native-webview';

const chairData = require('../assets/output_chair.json');

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PlotlyExplorer = ({ navigation }) => {
    const [showViewer, setShowViewer] = useState(false);
    const [explosionFactor, setExplosionFactor] = useState(0);
    const [currentView, setCurrentView] = useState('default');
    const [isLoading, setIsLoading] = useState(false);
    const webViewRef = useRef(null);

    const processChairData = () => {
        const vectors = chairData.v;
        const vertices = [];
        const triangles = [];

        // Procesar triángulos
        vectors.forEach((triangle, triIndex) => {
            triangle.forEach((vertex) => {
                vertices.push(vertex[0], vertex[1], vertex[2]); // x, y, z
            });
            const baseIndex = triIndex * 3;
            triangles.push([baseIndex, baseIndex + 1, baseIndex + 2]);
        });

        const x = vertices.filter((_, i) => i % 3 === 0);
        const y = vertices.filter((_, i) => i % 3 === 1);
        const z = vertices.filter((_, i) => i % 3 === 2);

        return { x, y, z, triangles };
    };

    const createPlotlyHTML = () => {
        const { x, y, z, triangles } = processChairData();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>🪑 Visualizador 3D de Silla</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
        }
        
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        .header {
            background: rgba(255,255,255,0.95);
            padding: 15px 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 0 0 10px 0;
            text-align: center;
        }
        
        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .slider {
            width: 200px;
            height: 6px;
            border-radius: 3px;
            background: #ddd;
            outline: none;
            appearance: none;
            -webkit-appearance: none;
        }
        
        .slider::-webkit-slider-thumb {
            appearance: none;
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4A90E2;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            min-width: 120px;
        }
        
        .btn-primary { background: #4A90E2; color: white; }
        .btn-success { background: #51cf66; color: white; }
        .btn-danger { background: #ff6b6b; color: white; }
        .btn-info { background: #74c0fc; color: white; }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .plot-container {
            flex: 1;
            padding: 10px;
            background: rgba(255,255,255,0.1);
        }
        
        .stats {
            background: rgba(255,255,255,0.9);
            padding: 10px 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #51cf66;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        
        #plotDiv {
            width: 100%;
            height: 100%;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
            .controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .control-group {
                justify-content: space-between;
                width: 100%;
            }
            
            .slider {
                width: 150px;
            }
            
            .btn {
                min-width: auto;
                padding: 8px 16px;
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🪑 Visualizador 3D - Silla Explosionada</h1>
            <div class="controls">
                <div class="control-group">
                    <label>💥 Explosión:</label>
                    <input type="range" min="0" max="10" step="0.5" value="0" class="slider" id="explosionSlider">
                    <span id="explosionValue">0.0</span>
                    <span class="status-badge" id="statusBadge">Normal</span>
                </div>
                <div class="control-group">
                    <button class="btn btn-primary" onclick="setView('top')">📊 Superior</button>
                    <button class="btn btn-info" onclick="setView('front')">👁️ Frontal</button>
                    <button class="btn btn-success" onclick="setView('side')">🔍 Lateral</button>
                    <button class="btn btn-danger" onclick="resetView()">🔄 Reset</button>
                </div>
            </div>
        </div>
        
        <div class="plot-container">
            <div id="plotDiv"></div>
        </div>
        
        <div class="stats">
            <strong>📊 Estadísticas:</strong> 
            ${x.length.toLocaleString()} vértices | 
            ${triangles.length.toLocaleString()} triángulos | 
            Centro: [${(x.reduce((a,b) => a+b, 0)/x.length).toFixed(1)}, ${(y.reduce((a,b) => a+b, 0)/y.length).toFixed(1)}, ${(z.reduce((a,b) => a+b, 0)/z.length).toFixed(1)}]
        </div>
    </div>

    <script>
        // Datos del modelo
        const originalData = {
            x: [${x.join(',')}],
            y: [${y.join(',')}],
            z: [${z.join(',')}],
            triangles: [${triangles.map(t => `[${t.join(',')}]`).join(',')}]
        };
        
        // Variables globales
        let currentExplosion = 0;
        let currentLayout = null;
        
        // Función para calcular explosión
        function createExplodedGeometry(explosionFactor) {
            if (explosionFactor === 0) {
                return {
                    x: [...originalData.x],
                    y: [...originalData.y], 
                    z: [...originalData.z]
                };
            }
            
            // Calcular centro global
            const globalCenter = {
                x: originalData.x.reduce((a,b) => a+b, 0) / originalData.x.length,
                y: originalData.y.reduce((a,b) => a+b, 0) / originalData.y.length,
                z: originalData.z.reduce((a,b) => a+b, 0) / originalData.z.length
            };
            
            const explodedX = [...originalData.x];
            const explodedY = [...originalData.y];
            const explodedZ = [...originalData.z];
            
            // Aplicar explosión por triángulo
            originalData.triangles.forEach(triangle => {
                // Centro del triángulo
                const triCenter = {
                    x: (originalData.x[triangle[0]] + originalData.x[triangle[1]] + originalData.x[triangle[2]]) / 3,
                    y: (originalData.y[triangle[0]] + originalData.y[triangle[1]] + originalData.y[triangle[2]]) / 3,
                    z: (originalData.z[triangle[0]] + originalData.z[triangle[1]] + originalData.z[triangle[2]]) / 3
                };
                
                // Vector dirección
                const direction = {
                    x: triCenter.x - globalCenter.x,
                    y: triCenter.y - globalCenter.y,
                    z: triCenter.z - globalCenter.z
                };
                
                // Normalizar
                const length = Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2);
                if (length > 0) {
                    direction.x /= length;
                    direction.y /= length;
                    direction.z /= length;
                }
                
                // Aplicar desplazamiento
                const displacement = explosionFactor * 50;
                triangle.forEach(vertexIndex => {
                    explodedX[vertexIndex] = originalData.x[vertexIndex] + direction.x * displacement;
                    explodedY[vertexIndex] = originalData.y[vertexIndex] + direction.y * displacement;
                    explodedZ[vertexIndex] = originalData.z[vertexIndex] + direction.z * displacement;
                });
            });
            
            return { x: explodedX, y: explodedY, z: explodedZ };
        }
        
        // Función para crear el plot
        function createPlot(explosionFactor = 0) {
            const coords = createExplodedGeometry(explosionFactor);
            
            const trace = {
                type: 'mesh3d',
                x: coords.x,
                y: coords.y,
                z: coords.z,
                i: originalData.triangles.map(t => t[0]),
                j: originalData.triangles.map(t => t[1]),
                k: originalData.triangles.map(t => t[2]),
                colorscale: explosionFactor > 0 ? 'Reds' : 'Blues',
                intensity: coords.z,
                opacity: explosionFactor > 0 ? 0.9 : 0.8,
                showscale: false,
                hovertemplate: '<b>Coordenadas:</b><br>X: %{x:.1f}<br>Y: %{y:.1f}<br>Z: %{z:.1f}<extra></extra>',
                name: explosionFactor > 0 ? 'Silla Explodida' : 'Silla Normal'
            };
            
            const layout = {
                title: {
                    text: explosionFactor > 0 ? '💥 Modo Explosionado' : '🪑 Modo Normal',
                    font: { size: 20, color: '#333' },
                    x: 0.5
                },
                scene: {
                    xaxis: { title: 'X', gridcolor: '#ddd', zerolinecolor: '#999' },
                    yaxis: { title: 'Y', gridcolor: '#ddd', zerolinecolor: '#999' },
                    zaxis: { title: 'Z', gridcolor: '#ddd', zerolinecolor: '#999' },
                    bgcolor: 'rgba(240,240,240,0.8)',
                    camera: {
                        eye: { x: 1.2, y: 1.2, z: 1.2 },
                        center: { x: 0, y: 0, z: 0 },
                        up: { x: 0, y: 0, z: 1 }
                    },
                    aspectmode: 'cube'
                },
                margin: { l: 0, r: 0, t: 50, b: 0 },
                showlegend: false,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)'
            };
            
            // Aplicar vista específica si hay una
            if (currentLayout) {
                layout.scene.camera = currentLayout;
            }
            
            Plotly.newPlot('plotDiv', [trace], layout, {
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                toImageButtonOptions: {
                    format: 'png',
                    filename: 'silla_3d_explosionado',
                    height: 800,
                    width: 1200,
                    scale: 2
                }
            });
        }
        
        // Event listeners
        document.getElementById('explosionSlider').addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            currentExplosion = value;
            document.getElementById('explosionValue').textContent = value.toFixed(1);
            
            // Actualizar badge
            const badge = document.getElementById('statusBadge');
            if (value === 0) {
                badge.textContent = 'Normal';
                badge.style.background = '#51cf66';
            } else if (value <= 2.5) {
                badge.textContent = 'Ligero';
                badge.style.background = '#ffd43b';
            } else if (value <= 5) {
                badge.textContent = 'Medio';
                badge.style.background = '#ff9f43';
            } else if (value <= 7.5) {
                badge.textContent = 'Fuerte';
                badge.style.background = '#ff6b6b';
            } else {
                badge.textContent = 'Extremo';
                badge.style.background = '#e74c3c';
            }
            
            createPlot(value);
        });
        
        // Funciones de vista
        function setView(viewType) {
            switch(viewType) {
                case 'top':
                    currentLayout = {
                        eye: { x: 0, y: 0, z: 2.5 },
                        center: { x: 0, y: 0, z: 0 },
                        up: { x: 0, y: 1, z: 0 }
                    };
                    break;
                case 'front':
                    currentLayout = {
                        eye: { x: 0, y: -2.5, z: 0 },
                        center: { x: 0, y: 0, z: 0 },
                        up: { x: 0, y: 0, z: 1 }
                    };
                    break;
                case 'side':
                    currentLayout = {
                        eye: { x: 2.5, y: 0, z: 0 },
                        center: { x: 0, y: 0, z: 0 },
                        up: { x: 0, y: 0, z: 1 }
                    };
                    break;
            }
            createPlot(currentExplosion);
        }
        
        function resetView() {
            currentLayout = null;
            document.getElementById('explosionSlider').value = 0;
            document.getElementById('explosionValue').textContent = '0.0';
            document.getElementById('statusBadge').textContent = 'Normal';
            document.getElementById('statusBadge').style.background = '#51cf66';
            currentExplosion = 0;
            createPlot(0);
        }
        
        // Inicializar
        window.addEventListener('load', function() {
            createPlot(0);
        });
        
        // Comunicación con React Native
        window.ReactNativeWebView = {
            postMessage: function(message) {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(message);
                }
            }
        };
    </script>
</body>
</html>`;
    };

    const openViewer = () => {
        setIsLoading(true);
        setShowViewer(true);
    };

    const closeViewer = () => {
        setShowViewer(false);
        setIsLoading(false);
    };

    const onWebViewLoad = () => {
        setIsLoading(false);
    };

    const onWebViewMessage = (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log('Mensaje desde WebView:', message);
        } catch (error) {
            console.log('Mensaje desde WebView:', event.nativeEvent.data);
        }
    };

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
                <Text style={styles.headerTitle}>Plotly Explorer</Text>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>🎯 Visualizador 3D Nativo</Text>
                <Text style={styles.infoText}>
                    Explora la silla 3D con controles avanzados usando Plotly.js nativo
                </Text>
                <View style={styles.featuresList}>
                    <Text style={styles.featureItem}>⚡ Renderizado nativo con WebView</Text>
                    <Text style={styles.featureItem}>🎮 Controles de explosión interactivos</Text>
                    <Text style={styles.featureItem}>📊 Vistas predefinidas (Superior/Frontal/Lateral)</Text>
                    <Text style={styles.featureItem}>🖱️ Rotación 3D libre con mouse/touch</Text>
                    <Text style={styles.featureItem}>📸 Exportación de imágenes PNG</Text>
                </View>
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>📈 Estadísticas del Modelo</Text>
                <View style={styles.statsRow}>
                    <Text style={styles.statItem}>Vértices: {processChairData().x.length.toLocaleString()}</Text>
                    <Text style={styles.statItem}>Triángulos: {processChairData().triangles.length.toLocaleString()}</Text>
                </View>
            </View>

            {/* Launch Button */}
            <TouchableOpacity style={styles.launchButton} onPress={openViewer}>
                <Text style={styles.launchButtonText}>🚀 Abrir Visualizador 3D</Text>
            </TouchableOpacity>

            {/* Comparison */}
            <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>⚖️ Comparación de Opciones</Text>
                <View style={styles.comparisonRow}>
                    <View style={styles.comparisonOption}>
                        <Text style={styles.optionTitle}>Three.js Nativo</Text>
                        <Text style={styles.optionPros}>✅ Máximo rendimiento</Text>
                        <Text style={styles.optionPros}>✅ Controles táctiles</Text>
                        <Text style={styles.optionCons}>❌ Controles básicos</Text>
                    </View>
                    <View style={styles.comparisonOption}>
                        <Text style={styles.optionTitle}>Plotly Web</Text>
                        <Text style={styles.optionPros}>✅ Controles avanzados</Text>
                        <Text style={styles.optionPros}>✅ UI rica</Text>
                        <Text style={styles.optionCons}>❌ Requiere WebView</Text>
                    </View>
                </View>
            </View>

            {/* WebView Modal */}
            <Modal
                visible={showViewer}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={closeViewer}
            >
                <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={closeViewer}
                        >
                            <Text style={styles.closeButtonText}>✕ Cerrar</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Plotly 3D Visualizer</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                    
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                            <Text style={styles.loadingText}>Cargando visualizador...</Text>
                        </View>
                    )}
                    
                    <WebView
                        ref={webViewRef}
                        source={{ html: createPlotlyHTML() }}
                        style={styles.webview}
                        onLoad={onWebViewLoad}
                        onMessage={onWebViewMessage}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        originWhitelist={['*']}
                        mixedContentMode="compatibility"
                        onLoadStart={() => setIsLoading(true)}
                        onLoadEnd={() => setIsLoading(false)}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn('WebView error: ', nativeEvent);
                            Alert.alert('Error', 'Error cargando el visualizador');
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingTop: 50,
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
        color: '#4A90E2',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    infoCard: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 15,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
        lineHeight: 22,
    },
    featuresList: {
        gap: 8,
    },
    featureItem: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    statsCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 15,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '600',
    },
    launchButton: {
        backgroundColor: '#4A90E2',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 18,
        borderRadius: 15,
        elevation: 3,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    launchButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    comparisonCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 15,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    comparisonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    comparisonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    comparisonOption: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 10,
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    optionPros: {
        fontSize: 12,
        color: '#51cf66',
        marginVertical: 2,
    },
    optionCons: {
        fontSize: 12,
        color: '#ff6b6b',
        marginVertical: 2,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#4A90E2',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: 50,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSpacer: {
        width: 60,
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '600',
    },
});

export default PlotlyExplorer;
