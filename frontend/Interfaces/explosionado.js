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
        // Timeout para evitar que el loader quede colgado indefinidamente
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
                    x.push(vertex[0]);
                    y.push(vertex[1]);
                    z.push(vertex[2]);
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
    <meta name="viewport" content="width=device-width, initial-scale=1">
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
        }
        #plotDiv {
            width: 100vw;
            height: 100vh;
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
    </style>
</head>
<body>
    <div id="plotDiv">
        <div class="loading">Cargando modelo 3D...</div>
    </div>
    <script>
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
                        eye: { x: 1.2, y: 1.2, z: 1.2 }
                    },
                    aspectmode: 'cube'
                },
                margin: { l: 0, r: 0, b: 0, t: 40 },
                autosize: true,
                responsive: true
            };
            const config = {
                displayModeBar: true,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
                displaylogo: false,
                responsive: true
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
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.webViewLoading}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text>Cargando modelo 3D...</Text>
                    </View>
                )}
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