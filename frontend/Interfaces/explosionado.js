import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, PanResponder } from 'react-native';
import * as THREE from 'three';
import { GLView } from 'expo-gl';
import * as FileSystem from 'expo-file-system';

const chairData = require('../assets/output_chair.json');

const Explosionado = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [exploded, setExploded] = useState(false);
    const [isWebGLReady, setIsWebGLReady] = useState(false);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [autoRotate, setAutoRotate] = useState(true);
    const glViewRef = useRef(null);
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const meshRef = useRef(null);
    
    // Create PanResponder for rotation controls
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Disable auto rotation when user starts touching
                setAutoRotate(false);
                console.log('Manual rotation started');
            },
            onPanResponderMove: (evt, gestureState) => {
                const { dx, dy } = gestureState;
                // Convert touch movement to rotation with better sensitivity
                const sensitivity = 0.008;
                setRotation(prev => ({
                    x: prev.x + dy * sensitivity,
                    y: prev.y + dx * sensitivity
                }));
            },
            onPanResponderRelease: () => {
                console.log('Manual rotation ended');
                // Re-enable auto rotation after a shorter delay
                setTimeout(() => {
                    setAutoRotate(true);
                    console.log('Returning to auto rotation');
                }, 1500); // 1.5 seconds delay
            },
        })
    ).current;

    // Process JSON vectors (array of triangles: [[[x,y,z], [x,y,z], [x,y,z]], ...])
    const processVectors = (jsonData) => {
        const vectors = jsonData.v;
        if (!vectors || !Array.isArray(vectors) || !vectors.every(triangle =>
                Array.isArray(triangle) && triangle.length === 3 && triangle.every(vertex =>
                    Array.isArray(vertex) && vertex.length === 3
                )
        )) {
            throw new Error('Invalid vectors data: must be an array of triangles with [x,y,z] vertices');
        }

        const vertices = [];
        const triangles = [];

        // Flatten vertices and create triangle indices
        vectors.forEach((triangle, triIndex) => {
            triangle.forEach((vertex, vertexIndex) => {
                vertices.push(...vertex); // Add x, y, z
            });
            // Indices for this triangle (vertices are added in order)
            const baseIndex = triIndex * 3;
            triangles.push([baseIndex, baseIndex + 1, baseIndex + 2]);
        });

        const x = vertices.filter((_, i) => i % 3 === 0);
        const y = vertices.filter((_, i) => i % 3 === 1);
        const z = vertices.filter((_, i) => i % 3 === 2);

        return { x, y, z, triangles, vertexCount: x.length, triangleCount: triangles.length };
    };

    // Create Three.js geometry with optional explosion
    const createGeometry = (processedData, isExploded = false) => {
        const { x, y, z, triangles } = processedData;
        let plotX = [...x];
        let plotY = [...y];
        let plotZ = [...z];

        if (isExploded) {
            console.log('Starting explosion calculation...');
            
            // Calculate global center of the model
            const globalCenterX = x.reduce((sum, val) => sum + val, 0) / x.length;
            const globalCenterY = y.reduce((sum, val) => sum + val, 0) / y.length;
            const globalCenterZ = z.reduce((sum, val) => sum + val, 0) / z.length;
            
            console.log(`Global center: [${globalCenterX.toFixed(2)}, ${globalCenterY.toFixed(2)}, ${globalCenterZ.toFixed(2)}]`);
            console.log(`Total vertices: ${x.length}, Total triangles: ${triangles.length}`);
            
            // Use a larger explosion factor for better visibility
            const explosionFactor = 10.0;
            
            // Process each triangle separately to create explosion effect
            triangles.forEach((triangle) => {
                // Calculate triangle center
                const triCenterX = (x[triangle[0]] + x[triangle[1]] + x[triangle[2]]) / 3;
                const triCenterY = (y[triangle[0]] + y[triangle[1]] + y[triangle[2]]) / 3;
                const triCenterZ = (z[triangle[0]] + z[triangle[1]] + z[triangle[2]]) / 3;
                
                // Direction from global center to triangle center
                const dirX = triCenterX - globalCenterX;
                const dirY = triCenterY - globalCenterY;
                const dirZ = triCenterZ - globalCenterZ;
                
                // Normalize direction vector
                const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
                const normalizedDirX = length > 0 ? dirX / length : 0;
                const normalizedDirY = length > 0 ? dirY / length : 0;
                const normalizedDirZ = length > 0 ? dirZ / length : 0;
                
                // Move each vertex of the triangle along the explosion direction
                const displacement = explosionFactor * 20; // Even larger displacement
                triangle.forEach((vertexIndex) => {
                    const oldX = plotX[vertexIndex];
                    const oldY = plotY[vertexIndex];
                    const oldZ = plotZ[vertexIndex];
                    
                    plotX[vertexIndex] = x[vertexIndex] + normalizedDirX * displacement;
                    plotY[vertexIndex] = y[vertexIndex] + normalizedDirY * displacement;
                    plotZ[vertexIndex] = z[vertexIndex] + normalizedDirZ * displacement;
                    
                    // Log first few changes for debugging
                    if (vertexIndex < 3) {
                        console.log(`Vertex ${vertexIndex}: [${oldX.toFixed(1)}, ${oldY.toFixed(1)}, ${oldZ.toFixed(1)}] -> [${plotX[vertexIndex].toFixed(1)}, ${plotY[vertexIndex].toFixed(1)}, ${plotZ[vertexIndex].toFixed(1)}]`);
                    }
                });
            });
            console.log('Explosion calculation completed!');
        } else {
            console.log('Using normal geometry (no explosion)');
        }

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(plotX.map((x, i) => [x, plotY[i], plotZ[i]]).flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const indices = triangles.flat();
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    };

    // Export to STL
    const exportToSTL = async (processedData) => {
        const { x, y, z, triangles } = processedData;
        let stlContent = 'solid exported\n';

        triangles.forEach((triangle) => {
            const v1 = [x[triangle[0]], y[triangle[0]], z[triangle[0]]];
            const v2 = [x[triangle[1]], y[triangle[1]], z[triangle[1]]];
            const v3 = [x[triangle[2]], y[triangle[2]], z[triangle[2]]];

            const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
            const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
            const normal = [
                edge1[1] * edge2[2] - edge1[2] * edge2[1],
                edge1[2] * edge2[0] - edge1[0] * edge2[2],
                edge1[0] * edge2[1] - edge1[1] * edge2[0],
            ];
            const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
            if (length > 0) {
                normal[0] /= length;
                normal[1] /= length;
                normal[2] /= length;
            }

            stlContent += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
            stlContent += '    outer loop\n';
            stlContent += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
            stlContent += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
            stlContent += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
            stlContent += '    endloop\n';
            stlContent += '  endfacet\n';
        });

        stlContent += 'endsolid exported\n';

        const outputPath = `${FileSystem.documentDirectory}output.stl`;
        await FileSystem.writeAsStringAsync(outputPath, stlContent, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        return outputPath;
    };

    // Initialize stats and validate JSON
    useEffect(() => {
        try {
            const processedData = processVectors(chairData);
            setStats({
                vertices: processedData.vertexCount,
                triangles: processedData.triangleCount,
                size: JSON.stringify(chairData).length,
            });
            setIsLoading(false);
        } catch (error) {
            console.error('Error procesando datos:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos de la silla');
            setIsLoading(false);
        }
    }, []);

    // Function to update mesh (to be called from onContextCreate and when exploded changes)
    const updateMesh = () => {
        if (isLoading || !isWebGLReady) {
            console.log('Skipping mesh update - WebGL not ready or still loading');
            return;
        }
        
        console.log(`Updating mesh with exploded=${exploded}`);
        const processedData = processVectors(chairData);
        const geometry = createGeometry(processedData, exploded);
        
        if (meshRef.current) {
            console.log('Removing existing mesh');
            sceneRef.current.remove(meshRef.current);
            meshRef.current.geometry.dispose();
        }
        const material = new THREE.MeshPhongMaterial({
            color: exploded ? 0xff6b6b : 0x74c0fc, // Red for exploded, light blue for normal
            opacity: exploded ? 0.9 : 0.8,
            transparent: true,
            side: THREE.DoubleSide, // Show both sides of triangles
        });
        meshRef.current = new THREE.Mesh(geometry, material);
        console.log('Adding new mesh to scene');
        sceneRef.current.add(meshRef.current);
    };

    // Update 3D model when exploded state changes
    useEffect(() => {
        updateMesh();
    }, [exploded, isLoading, isWebGLReady]);

    // Set up Three.js renderer
    const onContextCreate = async (gl) => {
        console.log('onContextCreate called!');
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
        console.log(`Canvas size: ${width} x ${width}`);

        try {
            console.log('Creating WebGLRenderer with expo-gl-cpp...');
            // Use expo-gl compatible approach
            rendererRef.current = new THREE.WebGLRenderer({
                canvas: {
                    width: width,
                    height: height,
                    style: {},
                    addEventListener: () => {},
                    removeEventListener: () => {},
                    clientHeight: height,
                    clientWidth: width,
                },
                context: gl,
                antialias: true,
            });
            console.log('WebGLRenderer created successfully');
            
            rendererRef.current.setSize(width, height, false);
            rendererRef.current.setClearColor(0xffffff, 1);
            console.log('Renderer configured');

            console.log('Creating camera...');
            cameraRef.current = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
            console.log('Camera created successfully');
            
            console.log('Processing chair data...');
            const processedData = processVectors(chairData);
            console.log('Data processed successfully');
            
            // Manual bounding box calculation
            const minX = Math.min(...processedData.x);
            const maxX = Math.max(...processedData.x);
            const minY = Math.min(...processedData.y);
            const maxY = Math.max(...processedData.y);
            const minZ = Math.min(...processedData.z);
            const maxZ = Math.max(...processedData.z);
            
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const centerZ = (minZ + maxZ) / 2;
            
            const sizeX = maxX - minX;
            const sizeY = maxY - minY;
            const sizeZ = maxZ - minZ;
            const maxDim = Math.max(sizeX, sizeY, sizeZ);
            
            console.log(`Model bounds: [${minX.toFixed(1)}, ${minY.toFixed(1)}, ${minZ.toFixed(1)}] to [${maxX.toFixed(1)}, ${maxY.toFixed(1)}, ${maxZ.toFixed(1)}]`);
            console.log(`Center: [${centerX.toFixed(1)}, ${centerY.toFixed(1)}, ${centerZ.toFixed(1)}], Max dimension: ${maxDim.toFixed(1)}`);
            
            // Position camera further back to accommodate explosion effect
            cameraRef.current.position.set(centerX + maxDim * 3, centerY + maxDim * 3, centerZ + maxDim * 3);
            cameraRef.current.lookAt(new THREE.Vector3(centerX, centerY, centerZ));
            console.log('Camera positioned');

            // Add multiple lights for better visibility
            const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
            mainLight.position.set(100, 200, 100);
            sceneRef.current.add(mainLight);
            console.log('Main light added');
            
            const ambientLight = new THREE.AmbientLight(0x404040, 0.4); // soft white light
            sceneRef.current.add(ambientLight);
            console.log('Ambient light added');
            
            const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
            backLight.position.set(-100, -200, -100);
            sceneRef.current.add(backLight);
            console.log('Back light added');
        
            // Mark WebGL as ready and create initial mesh
            console.log('Setting WebGL as ready and creating initial mesh');
            setIsWebGLReady(true);
        } catch (error) {
            console.error('Error in onContextCreate:', error);
        }

        const animate = () => {
            if (!rendererRef.current) return;
            requestAnimationFrame(animate);
            if (meshRef.current) {
                if (autoRotate) {
                    // Auto rotation when not being manipulated
                    meshRef.current.rotation.y += 0.01;
                } else {
                    // Apply manual rotation smoothly
                    meshRef.current.rotation.x = rotation.x;
                    meshRef.current.rotation.y = rotation.y;
                }
            }
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            gl.flush();
            gl.endFrameEXP();
        };
        animate();
    };

    const toggleExplosion = () => {
        const newExploded = !exploded;
        console.log(`Toggling explosion: ${exploded} -> ${newExploded}`);
        setExploded(newExploded);
    };
    
    const resetRotation = () => {
        console.log('Resetting rotation to default');
        setRotation({ x: 0, y: 0 });
        setAutoRotate(true);
    };

    const handleExportSTL = async () => {
        try {
            const processedData = processVectors(chairData);
            const outputPath = await exportToSTL(processedData);
            Alert.alert('Éxito', `STL exportado a ${outputPath}`);
        } catch (error) {
            console.error('Error exporting STL:', error);
            Alert.alert('Error', 'No se pudo exportar el STL');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Cargando datos de la silla...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Explosionado de Silla 3D</Text>
            <View style={styles.statsContainer}>
                <Text style={styles.statText}>Vértices: {stats.vertices}</Text>
                <Text style={styles.statText}>Triángulos: {stats.triangles}</Text>
                <Text style={styles.statText}>Tamaño: {(stats.size / 1024).toFixed(2)} KB</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={toggleExplosion}>
                    <Text style={styles.buttonText}>
                        {exploded ? 'Vista Normal' : 'Vista Explosionada'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={resetRotation}>
                    <Text style={styles.buttonText}>Reset Rotación</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleExportSTL}>
                    <Text style={styles.buttonText}>Exportar STL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: '#FF6B35' }]} 
                    onPress={() => navigation.navigate('DashExplorer')}
                >
                    <Text style={styles.buttonText}>🌐 Dash Explorer</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.plotContainer} {...panResponder.panHandlers}>
                <GLView ref={glViewRef} style={{ flex: 1, height: 300 }} onContextCreate={onContextCreate} />
                <Text style={styles.plotSubtext}>
                    Estado: {exploded ? 'Explotado' : 'Normal'} | 
                    Rotación: {autoRotate ? 'Automática' : `Manual (X: ${rotation.x.toFixed(2)}, Y: ${rotation.y.toFixed(2)})`}
                </Text>
            </View>
            <View style={styles.dataInfo}>
                <Text style={styles.infoTitle}>Controles:</Text>
                <Text style={styles.infoText}>• Arrastra para rotar manualmente</Text>
                <Text style={styles.infoText}>• Usa "Reset Rotación" para volver a rotación automática</Text>
                <Text style={styles.infoText}>• "Vista Explosionada" separa los componentes</Text>
            </View>
            <View style={styles.dataInfo}>
                <Text style={styles.infoTitle}>Datos del Modelo:</Text>
                <Text style={styles.infoText}>Puntos: {stats.vertices}</Text>
                <Text style={styles.infoText}>Caras: {stats.triangles}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    loadingText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
        color: '#666',
    },
    statsContainer: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statText: {
        fontSize: 16,
        marginVertical: 2,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        minWidth: 100,
        flex: 1,
        marginHorizontal: 5,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    plotContainer: {
        backgroundColor: 'white',
        height: 300,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    plotSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    dataInfo: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    infoText: {
        fontSize: 14,
        marginVertical: 2,
        color: '#666',
    },
});

export default Explosionado;