#!/usr/bin/env python3
"""
Visualizador 3D de Silla con Efecto de Explosión
Usando Dash y Plotly para interactividad completa
"""

import json
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

import dash
from dash import dcc, html, Input, Output, State, callback
import dash_bootstrap_components as dbc
from datetime import datetime


class Chair3DVisualizer:
    def __init__(self, json_file_path):
        """Inicializar el visualizador con datos de la silla"""
        self.load_data(json_file_path)
        self.process_vectors()
    
    def load_data(self, json_file_path):
        """Cargar datos JSON de la silla"""
        try:
            with open(json_file_path, 'r') as f:
                self.chair_data = json.load(f)
            print(f"✅ Datos cargados: {len(self.chair_data['v'])} triángulos")
        except Exception as e:
            print(f"❌ Error cargando datos: {e}")
            raise
    
    def process_vectors(self):
        """Procesar vectores JSON en formato utilizable"""
        vectors = self.chair_data['v']
        
        # Validar estructura de datos
        if not all(len(triangle) == 3 for triangle in vectors):
            raise ValueError("Datos inválidos: cada triángulo debe tener 3 vértices")
        
        # Aplanar vértices y crear índices de triángulos
        vertices = []
        triangles = []
        
        for tri_idx, triangle in enumerate(vectors):
            for vertex in triangle:
                if len(vertex) != 3:
                    raise ValueError("Cada vértice debe tener coordenadas [x, y, z]")
                vertices.extend(vertex)
            
            # Índices para este triángulo
            base_idx = tri_idx * 3
            triangles.append([base_idx, base_idx + 1, base_idx + 2])
        
        # Separar coordenadas
        self.x = np.array(vertices[0::3])
        self.y = np.array(vertices[1::3])
        self.z = np.array(vertices[2::3])
        self.triangles = np.array(triangles)
        
        # Calcular estadísticas
        self.vertex_count = len(self.x)
        self.triangle_count = len(self.triangles)
        
        # Calcular centro global
        self.global_center = np.array([
            np.mean(self.x),
            np.mean(self.y), 
            np.mean(self.z)
        ])
        
        # Calcular bounding box
        self.bounds = {
            'x': [np.min(self.x), np.max(self.x)],
            'y': [np.min(self.y), np.max(self.y)],
            'z': [np.min(self.z), np.max(self.z)]
        }
        
        print(f"📊 Procesado: {self.vertex_count} vértices, {self.triangle_count} triángulos")
        print(f"🎯 Centro: [{self.global_center[0]:.1f}, {self.global_center[1]:.1f}, {self.global_center[2]:.1f}]")
    
    def create_exploded_geometry(self, explosion_factor=5.0):
        """Crear geometría explodida"""
        if explosion_factor == 0:
            return self.x.copy(), self.y.copy(), self.z.copy()
        
        # Copiar coordenadas originales
        exploded_x = self.x.copy()
        exploded_y = self.y.copy() 
        exploded_z = self.z.copy()
        
        # Aplicar explosión a cada triángulo
        for triangle in self.triangles:
            # Calcular centro del triángulo
            tri_center = np.array([
                np.mean(self.x[triangle]),
                np.mean(self.y[triangle]),
                np.mean(self.z[triangle])
            ])
            
            # Vector dirección desde el centro global
            direction = tri_center - self.global_center
            length = np.linalg.norm(direction)
            
            if length > 0:
                # Normalizar dirección
                direction = direction / length
                
                # Aplicar desplazamiento
                displacement = direction * explosion_factor * 50  # Factor de escala
                
                # Mover cada vértice del triángulo
                for vertex_idx in triangle:
                    exploded_x[vertex_idx] = self.x[vertex_idx] + displacement[0]
                    exploded_y[vertex_idx] = self.y[vertex_idx] + displacement[1]
                    exploded_z[vertex_idx] = self.z[vertex_idx] + displacement[2]
        
        return exploded_x, exploded_y, exploded_z
    
    def create_plotly_mesh(self, explosion_factor=0, color_scheme='viridis'):
        """Crear mesh 3D de Plotly"""
        # Obtener coordenadas (normales o explodidas)
        x_coords, y_coords, z_coords = self.create_exploded_geometry(explosion_factor)
        
        # Aplanar índices de triángulos para Plotly
        i_indices = self.triangles[:, 0]
        j_indices = self.triangles[:, 1] 
        k_indices = self.triangles[:, 2]
        
        # Crear colores basados en altura (Z)
        vertex_colors = z_coords
        
        # Configurar colores según el estado
        if explosion_factor > 0:
            colorscale = 'Reds'
            mesh_color = 'red'
            opacity = 0.8
        else:
            colorscale = 'Blues'
            mesh_color = 'lightblue'
            opacity = 0.7
        
        # Crear mesh 3D
        mesh = go.Mesh3d(
            x=x_coords,
            y=y_coords,
            z=z_coords,
            i=i_indices,
            j=j_indices,
            k=k_indices,
            intensity=vertex_colors,
            colorscale=colorscale,
            opacity=opacity,
            showscale=False,
            hovertemplate=(
                '<b>Coordenadas:</b><br>'
                'X: %{x:.1f}<br>'
                'Y: %{y:.1f}<br>'
                'Z: %{z:.1f}<br>'
                '<extra></extra>'
            ),
            name=f"Silla {'(Explodida)' if explosion_factor > 0 else '(Normal)'}"
        )
        
        return mesh
    
    def create_plotly_figure(self, explosion_factor=0):
        """Crear figura completa de Plotly"""
        # Crear mesh
        mesh = self.create_plotly_mesh(explosion_factor)
        
        # Crear figura
        fig = go.Figure(data=[mesh])
        
        # Configurar layout
        title_text = f"Visualizador 3D de Silla - {'Modo Explosionado' if explosion_factor > 0 else 'Modo Normal'}"
        
        fig.update_layout(
            title={
                'text': title_text,
                'x': 0.5,
                'font': {'size': 20, 'color': 'darkblue'}
            },
            scene=dict(
                xaxis_title="X",
                yaxis_title="Y", 
                zaxis_title="Z",
                camera=dict(
                    eye=dict(x=1.2, y=1.2, z=1.2),
                    center=dict(x=0, y=0, z=0),
                    up=dict(x=0, y=0, z=1)
                ),
                aspectmode='cube',
                bgcolor='rgba(240, 240, 240, 0.8)'
            ),
            width=900,
            height=700,
            margin=dict(l=0, r=0, t=50, b=0),
            showlegend=False
        )
        
        return fig


# Inicializar visualizador
print("🚀 Inicializando visualizador de silla 3D...")
visualizer = Chair3DVisualizer('output_chair.json')

# Crear aplicación Dash
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "Visualizador 3D de Silla - Explosionado"

# Layout de la aplicación
app.layout = dbc.Container([
    # Header
    dbc.Row([
        dbc.Col([
            html.H1("🪑 Visualizador 3D de Silla con Explosionado", 
                   className="text-center mb-4 text-primary"),
            html.P("Manipula los controles para explorar la silla en 3D con efecto de explosión interactivo",
                   className="text-center text-muted mb-4")
        ])
    ]),
    
    # Controls Row
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("🎮 Controles Interactivos"),
                dbc.CardBody([
                    # Explosion Control
                    html.Label("Factor de Explosión:", className="fw-bold mb-2"),
                    dcc.Slider(
                        id='explosion-slider',
                        min=0,
                        max=10,
                        step=0.5,
                        value=0,
                        marks={
                            0: {'label': 'Normal', 'style': {'color': 'blue'}},
                            2.5: {'label': 'Poco'},
                            5: {'label': 'Medio', 'style': {'color': 'orange'}},
                            7.5: {'label': 'Mucho'},
                            10: {'label': 'Máximo', 'style': {'color': 'red'}}
                        },
                        tooltip={"placement": "bottom", "always_visible": True}
                    ),
                    
                    html.Hr(),
                    
                    # Buttons
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("🔄 Reset Vista", id="reset-btn", 
                                     color="primary", className="w-100 mb-2")
                        ], width=6),
                        dbc.Col([
                            dbc.Button("💥 Explosión Máxima", id="max-explosion-btn",
                                     color="danger", className="w-100 mb-2")
                        ], width=6),
                    ]),
                    
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("📊 Vista Superior", id="top-view-btn",
                                     color="info", className="w-100")
                        ], width=4),
                        dbc.Col([
                            dbc.Button("👁️ Vista Frontal", id="front-view-btn", 
                                     color="info", className="w-100")
                        ], width=4),
                        dbc.Col([
                            dbc.Button("🔍 Vista Lateral", id="side-view-btn",
                                     color="info", className="w-100")
                        ], width=4),
                    ])
                ])
            ])
        ], width=4),
        
        # Stats Column
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("📈 Estadísticas del Modelo"),
                dbc.CardBody([
                    html.P([
                        html.Strong("Vértices: "),
                        html.Span(f"{visualizer.vertex_count:,}", className="text-info")
                    ]),
                    html.P([
                        html.Strong("Triángulos: "),
                        html.Span(f"{visualizer.triangle_count:,}", className="text-info")
                    ]),
                    html.P([
                        html.Strong("Centro: "),
                        html.Span(f"({visualizer.global_center[0]:.1f}, {visualizer.global_center[1]:.1f}, {visualizer.global_center[2]:.1f})", 
                                className="text-info")
                    ]),
                    html.P([
                        html.Strong("Dimensiones: "),
                        html.Span(f"{visualizer.bounds['x'][1] - visualizer.bounds['x'][0]:.1f} × {visualizer.bounds['y'][1] - visualizer.bounds['y'][0]:.1f} × {visualizer.bounds['z'][1] - visualizer.bounds['z'][0]:.1f}", 
                                className="text-info")
                    ]),
                    html.Hr(),
                    html.P([
                        html.Strong("Estado: "),
                        html.Span("", id="current-status", className="text-success fw-bold")
                    ])
                ])
            ])
        ], width=4),
        
        # Instructions Column  
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("💡 Instrucciones de Uso"),
                dbc.CardBody([
                    html.Ul([
                        html.Li("🖱️ Arrastra para rotar la vista"),
                        html.Li("🔍 Scroll para zoom in/out"),
                        html.Li("⚡ Usa el slider para controlar la explosión"),
                        html.Li("🎯 Haz clic en los botones de vista rápida"),
                        html.Li("💥 'Explosión Máxima' para ver todos los componentes"),
                        html.Li("🔄 'Reset Vista' para volver a la posición inicial")
                    ])
                ])
            ])
        ], width=4)
    ], className="mb-4"),
    
    # 3D Plot Row
    dbc.Row([
        dbc.Col([
            dcc.Graph(
                id='3d-plot',
                config={
                    'displayModeBar': True,
                    'displaylogo': False,
                    'modeBarButtonsToAdd': ['pan3d', 'orbitRotation', 'tableRotation'],
                    'toImageButtonOptions': {
                        'format': 'png',
                        'filename': 'silla_3d_explosionado',
                        'height': 700,
                        'width': 900,
                        'scale': 2
                    }
                }
            )
        ], width=12)
    ]),
    
    # Footer
    dbc.Row([
        dbc.Col([
            html.Hr(),
            html.P([
                "🛠️ Desarrollado con ",
                html.A("Plotly Dash", href="https://dash.plotly.com/", target="_blank"),
                f" | Actualizado: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            ], className="text-center text-muted small")
        ])
    ])
], fluid=True)

# Layout de la aplicación
app.layout = dbc.Container([
    # Header
    dbc.Row([
        dbc.Col([
            html.H1("🪑 Visualizador 3D de Silla con Explosionado", 
                   className="text-center mb-4 text-primary"),
            html.P("Manipula los controles para explorar la silla en 3D con efecto de explosión interactivo",
                   className="text-center text-muted mb-4")
        ])
    ]),
    
    # Controls Row
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("🎮 Controles Interactivos"),
                dbc.CardBody([
                    # Explosion Control
                    html.Label("Factor de Explosión:", className="fw-bold mb-2"),
                    dcc.Slider(
                        id='explosion-slider',
                        min=0,
                        max=10,
                        step=0.5,
                        value=0,
                        marks={
                            0: {'label': 'Normal', 'style': {'color': 'blue'}},
                            2.5: {'label': 'Poco'},
                            5: {'label': 'Medio', 'style': {'color': 'orange'}},
                            7.5: {'label': 'Mucho'},
                            10: {'label': 'Máximo', 'style': {'color': 'red'}}
                        },
                        tooltip={"placement": "bottom", "always_visible": True}
                    ),
                    
                    html.Hr(),
                    
                    # Buttons
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("🔄 Reset Vista", id="reset-btn", 
                                     color="primary", className="w-100 mb-2")
                        ], width=6),
                        dbc.Col([
                            dbc.Button("💥 Explosión Máxima", id="max-explosion-btn",
                                     color="danger", className="w-100 mb-2")
                        ], width=6),
                    ]),
                    
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("📊 Vista Superior", id="top-view-btn",
                                     color="info", className="w-100")
                        ], width=4),
                        dbc.Col([
                            dbc.Button("👁️ Vista Frontal", id="front-view-btn", 
                                     color="info", className="w-100")
                        ], width=4),
                        dbc.Col([
                            dbc.Button("🔍 Vista Lateral", id="side-view-btn",
                                     color="info", className="w-100")
                        ], width=4),
                    ])
                ])
            ])
        ], width=4),
        
        # Stats Column
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("📈 Estadísticas del Modelo"),
                dbc.CardBody([
                    html.P([
                        html.Strong("Vértices: "),
                        html.Span(f"{visualizer.vertex_count:,}", className="text-info")
                    ]),
                    html.P([
                        html.Strong("Triángulos: "),
                        html.Span(f"{visualizer.triangle_count:,}", className="text-info")
                    ]),
                    html.P([
                        html.Strong("Centro: "),
                        html.Span(f"({visualizer.global_center[0]:.1f}, {visualizer.global_center[1]:.1f}, {visualizer.global_center[2]:.1f})", 
                                className="text-info")
                    ]),
                    html.P([
                        html.Strong("Dimensiones: "),
                        html.Span(f"{visualizer.bounds['x'][1] - visualizer.bounds['x'][0]:.1f} × {visualizer.bounds['y'][1] - visualizer.bounds['y'][0]:.1f} × {visualizer.bounds['z'][1] - visualizer.bounds['z'][0]:.1f}", 
                                className="text-info")
                    ]),
                    html.Hr(),
                    html.P([
                        html.Strong("Estado: "),
                        html.Span("", id="current-status", className="text-success fw-bold")
                    ])
                ])
            ])
        ], width=4),
        
        # Instructions Column  
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("💡 Instrucciones de Uso"),
                dbc.CardBody([
                    html.Ul([
                        html.Li("🖱️ Arrastra para rotar la vista"),
                        html.Li("🔍 Scroll para zoom in/out"),
                        html.Li("⚡ Usa el slider para controlar la explosión"),
                        html.Li("🎯 Haz clic en los botones de vista rápida"),
                        html.Li("💥 'Explosión Máxima' para ver todos los componentes"),
                        html.Li("🔄 'Reset Vista' para volver a la posición inicial")
                    ])
                ])
            ])
        ], width=4)
    ], className="mb-4"),
    
    # 3D Plot Row
    dbc.Row([
        dbc.Col([
            dcc.Graph(
                id='3d-plot',
                config={
                    'displayModeBar': True,
                    'displaylogo': False,
                    'modeBarButtonsToAdd': ['pan3d', 'orbitRotation', 'tableRotation'],
                    'toImageButtonOptions': {
                        'format': 'png',
                        'filename': 'silla_3d_explosionado',
                        'height': 700,
                        'width': 900,
                        'scale': 2
                    }
                }
            )
        ], width=12)
    ]),
    
    # Footer
    dbc.Row([
        dbc.Col([
            html.Hr(),
            html.P([
                "🛠️ Desarrollado con ",
                html.A("Plotly Dash", href="https://dash.plotly.com/", target="_blank"),
                f" | Actualizado: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            ], className="text-center text-muted small")
        ])
    ])
], fluid=True)


# Callbacks
@app.callback(
    [Output('3d-plot', 'figure'),
     Output('current-status', 'children')],
    [Input('explosion-slider', 'value'),
     Input('reset-btn', 'n_clicks'),
     Input('max-explosion-btn', 'n_clicks'),
     Input('top-view-btn', 'n_clicks'),
     Input('front-view-btn', 'n_clicks'), 
     Input('side-view-btn', 'n_clicks')],
    [State('3d-plot', 'relayoutData')]
)
def update_3d_plot(explosion_factor, reset_clicks, max_explosion_clicks, 
                  top_clicks, front_clicks, side_clicks, current_layout):
    """Actualizar el plot 3D basado en los controles"""
    
    # Determinar qué input fue activado
    ctx = dash.callback_context
    if not ctx.triggered:
        button_id = 'explosion-slider'
    else:
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    # Crear figura base
    fig = visualizer.create_plotly_figure(explosion_factor)
    
    # Configurar vista según el botón presionado
    if button_id == 'top-view-btn':
        # Vista superior (desde arriba)
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=0, y=0, z=2.5),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=1, z=0)
            )
        )
        status = f"Vista Superior - Explosión: {explosion_factor}"
        
    elif button_id == 'front-view-btn':
        # Vista frontal
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=0, y=-2.5, z=0),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=0, z=1)
            )
        )
        status = f"Vista Frontal - Explosión: {explosion_factor}"
        
    elif button_id == 'side-view-btn':
        # Vista lateral
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=2.5, y=0, z=0),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=0, z=1)
            )
        )
        status = f"Vista Lateral - Explosión: {explosion_factor}"
        
    elif button_id == 'max-explosion-btn':
        # Explosión máxima
        explosion_factor = 10
        fig = visualizer.create_plotly_figure(explosion_factor)
        status = f"Explosión Máxima - Factor: {explosion_factor}"
        
    elif button_id == 'reset-btn':
        # Reset vista
        status = f"Vista Reset - Explosión: {explosion_factor}"
        
    else:
        # Slider cambio normal
        if explosion_factor == 0:
            status = "Modo Normal - Sin Explosión"
        elif explosion_factor <= 2.5:
            status = f"Explosión Ligera - Factor: {explosion_factor}"
        elif explosion_factor <= 5:
            status = f"Explosión Media - Factor: {explosion_factor}"
        elif explosion_factor <= 7.5:
            status = f"Explosión Fuerte - Factor: {explosion_factor}"
        else:
            status = f"Explosión Extrema - Factor: {explosion_factor}"
    
    return fig, status


@app.callback(
    Output('explosion-slider', 'value'),
    [Input('max-explosion-btn', 'n_clicks'),
     Input('reset-btn', 'n_clicks')]
)
def update_slider_value(max_clicks, reset_clicks):
    """Actualizar valor del slider según botones"""
    ctx = dash.callback_context
    if not ctx.triggered:
        return 0
    
    button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if button_id == 'max-explosion-btn':
        return 10
    elif button_id == 'reset-btn':
        return 0
    else:
        return 0


# Callbacks
@app.callback(
    [Output('3d-plot', 'figure'),
     Output('current-status', 'children')],
    [Input('explosion-slider', 'value'),
     Input('reset-btn', 'n_clicks'),
     Input('max-explosion-btn', 'n_clicks'),
     Input('top-view-btn', 'n_clicks'),
     Input('front-view-btn', 'n_clicks'), 
     Input('side-view-btn', 'n_clicks')],
    [State('3d-plot', 'relayoutData')]
)
def update_3d_plot(explosion_factor, reset_clicks, max_explosion_clicks, 
                  top_clicks, front_clicks, side_clicks, current_layout):
    """Actualizar el plot 3D basado en los controles"""
    
    # Determinar qué input fue activado
    ctx = dash.callback_context
    if not ctx.triggered:
        button_id = 'explosion-slider'
    else:
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    # Crear figura base
    fig = visualizer.create_plotly_figure(explosion_factor)
    
    # Configurar vista según el botón presionado
    if button_id == 'top-view-btn':
        # Vista superior (desde arriba)
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=0, y=0, z=2.5),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=1, z=0)
            )
        )
        status = f"Vista Superior - Explosión: {explosion_factor}"
        
    elif button_id == 'front-view-btn':
        # Vista frontal
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=0, y=-2.5, z=0),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=0, z=1)
            )
        )
        status = f"Vista Frontal - Explosión: {explosion_factor}"
        
    elif button_id == 'side-view-btn':
        # Vista lateral
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=2.5, y=0, z=0),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=0, z=1)
            )
        )
        status = f"Vista Lateral - Explosión: {explosion_factor}"
        
    elif button_id == 'max-explosion-btn':
        # Explosión máxima
        explosion_factor = 10
        fig = visualizer.create_plotly_figure(explosion_factor)
        status = f"Explosión Máxima - Factor: {explosion_factor}"
        
    elif button_id == 'reset-btn':
        # Reset vista
        status = f"Vista Reset - Explosión: {explosion_factor}"
        
    else:
        # Slider cambio normal
        if explosion_factor == 0:
            status = "Modo Normal - Sin Explosión"
        elif explosion_factor <= 2.5:
            status = f"Explosión Ligera - Factor: {explosion_factor}"
        elif explosion_factor <= 5:
            status = f"Explosión Media - Factor: {explosion_factor}"
        elif explosion_factor <= 7.5:
            status = f"Explosión Fuerte - Factor: {explosion_factor}"
        else:
            status = f"Explosión Extrema - Factor: {explosion_factor}"
    
    return fig, status


@app.callback(
    Output('explosion-slider', 'value'),
    [Input('max-explosion-btn', 'n_clicks'),
     Input('reset-btn', 'n_clicks')]
)
def update_slider_value(max_clicks, reset_clicks):
    """Actualizar valor del slider según botones"""
    ctx = dash.callback_context
    if not ctx.triggered:
        return 0
    
    button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if button_id == 'max-explosion-btn':
        return 10
    elif button_id == 'reset-btn':
        return 0
    else:
        return 0



if __name__ == '__main__':
    print("🌐 Iniciando servidor Dash...")
    print("📱 Abre tu navegador en: http://127.0.0.1:8050")
    print("🎮 Controles disponibles:")
    print("   • Slider de explosión (0-10)")
    print("   • Botones de vista rápida")
    print("   • Rotación/zoom con mouse")
    print("   • Reset y explosión máxima")
    print("\n🚀 ¡Iniciando aplicación!")
    
    app.run(debug=True, host='0.0.0.0', port=8050)
