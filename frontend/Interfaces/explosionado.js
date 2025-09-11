import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import vectorsData from '../assets/output_chair.json';

const { width, height } = Dimensions.get('window');

const Explosionado = () => {
    const [plotlyHTML, setPlotlyHTML] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        generatePlotlyVisualization();
        const timeout = setTimeout(() => {
            if (isLoading) {
                console.warn('Timeout: Plotly no respondió en 10 segundos');
                setIsLoading(false);
            }
        }, 10000);
        return () => clearTimeout(timeout);
    }, []);

    const generatePlotlyVisualization = () => {
        try {
            console.log('Generating Plotly visualization...');
            console.log('vectorsData:', JSON.stringify(vectorsData, null, 2));

            // Validar datos del JSON
            const vectors = vectorsData.v;
            if (!vectors || !Array.isArray(vectors) || vectors.length === 0) {
                throw new Error('Invalid or empty vectors data');
            }
            console.log('Vectors loaded:', vectors.length, 'triangles');

            // Preparar los datos para Plotly (mesh3d)
            const x = [];
            const y = [];
            const z = [];
            const i = [];
            const j = [];
            const k = [];
            let vertexIndex = 0;

            // Normalizar coordenadas
            let maxCoord = 0;
            vectors.forEach(triangle => {
                triangle.forEach(vertex => {
                    maxCoord = Math.max(maxCoord, Math.abs(vertex[0]), Math.abs(vertex[1]), Math.abs(vertex[2]));
                });
            });
            const scaleFactor = maxCoord > 0 ? 1 / maxCoord : 1;

            vectors.forEach((triangle, index) => {
                if (!Array.isArray(triangle) || triangle.length !== 3) {
                    console.warn(`Invalid triangle format at index ${index}:`, triangle);
                    return;
                }
                triangle.forEach(vertex => {
                    if (!Array.isArray(vertex) || vertex.length !== 3) {
                        console.warn(`Invalid vertex format in triangle ${index}:`, vertex);
                        return;
                    }
                    x.push(vertex[0] * scaleFactor);
                    y.push(vertex[1] * scaleFactor);
                    z.push(vertex[2] * scaleFactor);
                });
                i.push(vertexIndex);
                j.push(vertexIndex + 1);
                k.push(vertexIndex + 2);
                vertexIndex += 3;
            });

            if (x.length === 0) {
                throw new Error('No valid vertex data processed');
            }

            // Crear el HTML con Plotly embebido
            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=15.0, user-scalable=yes">
    <title>3D Model Viewer</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            overflow: hidden;
            touch-action: auto;
        }
        #plotDiv {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
            color: #666;
            z-index: 10;
        }
        .controls {
            position: absolute;
            bottom: 10px;
            left: 10px;
            z-index: 20;
            display: flex;
            gap: 10px;
        }
        .control-btn {
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .control-btn:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div id="plotDiv">
        <div class="loading">Cargando modelo 3D...</div>
    </div>
    <div class="controls">
        <button class="control-btn" onclick="zoomIn()">Zoom In</button>
        <button class="control-btn" onclick="zoomOut()">Zoom Out</button>
        <button class="control-btn" onclick="resetView()">Reset</button>
    </div>
    <script>
        let currentZoom = 2;
        function zoomIn() {
            currentZoom *= 0.8;
            Plotly.relayout('plotDiv', {
                'scene.camera.eye': {
                    x: currentZoom * Math.cos(45 * Math.PI / 180),
                    y: currentZoom * Math.sin(45 * Math.PI / 180),
                    z: currentZoom
                }
            });
            console.log('Zoom In:', currentZoom);
        }
        function zoomOut() {
            currentZoom *= 1.25;
            Plotly.relayout('plotDiv', {
                'scene.camera.eye': {
                    x: currentZoom * Math.cos(45 * Math.PI / 180),
                    y: currentZoom * Math.sin(45 * Math.PI / 180),
                    z: currentZoom
                }
            });
            console.log('Zoom Out:', currentZoom);
        }
        function resetView() {
            currentZoom = 2;
            Plotly.relayout('plotDiv', {
                'scene.camera.eye': { x: 2, y: 2, z: 2 }
            });
            console.log('Reset View');
        }
        try {
            console.log('Initializing Plotly 3D visualization...');
            if (!${JSON.stringify(x)}.length) {
                throw new Error('No vertex data available');
            }
            const data = [{
                type: 'mesh3d',
                x: ${JSON.stringify(x)},
                y: ${JSON.stringify(y)},
                z: ${JSON.stringify(z)},
                i: ${JSON.stringify(i)},
                j: ${JSON.stringify(j)},
                k: ${JSON.stringify(k)},
                color: 'pink',
                opacity: 0.8,
                lighting: {
                    ambient: 0.5,
                    diffuse: 0.9,
                    fresnel: 0.2,
                    specular: 1.5,
                    roughness: 0.05,
                    facenormalsepsilon: 1e-15,
                    vertexnormalsepsilon: 1e-15
                },
                flatshading: false,
                hovertemplate: 'X: %{x}<br>Y: %{y}<br>Z: %{z}<extra></extra>'
            }];
            const layout = {
                scene: {
                    bgcolor: '#f8f9fa',
                    xaxis: {
                        title: '',
                        gridcolor: '#e9ecef',
                        zerolinecolor: '#dee2e6',
                        showticklabels: false,
                        showgrid: false,
                        zeroline: false
                    },
                    yaxis: {
                        title: '',
                        gridcolor: '#e9ecef',
                        zerolinecolor: '#dee2e6',
                        showticklabels: false,
                        showgrid: false,
                        zeroline: false
                    },
                    zaxis: {
                        title: '',
                        gridcolor: '#e9ecef',
                        zerolinecolor: '#dee2e6',
                        showticklabels: false,
                        showgrid: false,
                        zeroline: false
                    },
                    camera: {
                        eye: { x: 2, y: 2, z: 2 },
                        up: { x: 0, y: 0, z: 1 },
                        projection: { type: 'perspective' }
                    },
                    aspectmode: 'cube',
                    dragmode: 'orbit' // Priorizar rotación
                },
                margin: { l: 0, r: 0, b: 0, t: 40 },
                autosize: true,
                responsive: true
            };
            const config = {
                displayModeBar: true,
                modeBarButtonsToAdd: ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'],
                modeBarButtonsToRemove: ['lasso2d'],
                displaylogo: false,
                responsive: true,
                scrollZoom: true,
                doubleClick: 'reset'
            };
            Plotly.newPlot('plotDiv', data, layout, config).then(() => {
                console.log('Plotly plot created successfully');
                const loader = document.querySelector('.loading');
                if (loader) {
                    loader.style.display = 'none';
                }
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage('loaded');
                }
                // Depurar eventos táctiles
                document.getElementById('plotDiv').addEventListener('touchstart', (e) => {
                    console.log('Touch event:', e.touches.length, e);
                });
            }).catch(error => {
                console.error('Error creating Plotly plot:', error);
                const loader = document.querySelector('.loading');
                if (loader) {
                    loader.style.display = 'none';
                    loader.style.color = 'red';
                    loader.textContent = 'Error cargando el modelo: ' + error.message;
                }
            });
        } catch (error) {
            console.error('JavaScript error:', error);
            const loader = document.querySelector('.loading');
            if (loader) {
                loader.style.display = 'none';
                loader.style.color = 'red';
                loader.textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>`;

            setPlotlyHTML(html);
            console.log('HTML generated successfully');

        } catch (error) {
            console.error('Error generating visualization:', error);
            setIsLoading(false);
            alert('Error al generar la visualización: ' + error.message);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Preparando visualización 3D...</Text>
                <Text style={styles.debugText}>
                    Cargando {vectorsData.v?.length || 0} triángulos
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: plotlyHTML }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
                setBuiltInZoomControls={true}
                setDisplayZoomControls={false}
                enableTouchEvents={true}
                bounces={true} // Habilita gestos elásticos en iOS
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error:', nativeEvent);
                    setIsLoading(false);
                    alert('Error en WebView: ' + nativeEvent.description);
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView HTTP error:', nativeEvent);
                    setIsLoading(false);
                    alert('Error HTTP en WebView: ' + nativeEvent.statusCode);
                }}
                onMessage={(event) => {
                    const message = event.nativeEvent.data;
                    console.log('WebView message:', message);
                    if (message === 'loaded') {
                        setIsLoading(false);
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    debugText: {
        marginTop: 10,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    webView: {
        flex: 1,
    },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});

export default Explosionado;