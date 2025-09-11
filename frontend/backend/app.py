#!/usr/bin/env python3
"""
Visualizador 3D de Silla con Efecto de Explosión - Optimizado para Mobile
Usando Dash y Plotly para interactividad completa en dispositivos móviles
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

    def create_plotly_figure(self, explosion_factor=0, mobile_mode=True):
        """Crear figura completa de Plotly optimizada para móvil"""
        # Crear mesh
        mesh = self.create_plotly_mesh(explosion_factor)

        # Crear figura
        fig = go.Figure(data=[mesh])

        # Configurar layout optimizado para móvil
        title_text = f"Silla 3D - {'Explosión' if explosion_factor > 0 else 'Normal'}"

        # Configuración responsive
        if mobile_mode:
            width = None  # Auto width
            height = 400  # Altura fija para móvil
            margin = dict(l=10, r=10, t=40, b=10)
            font_size = 14
        else:
            width = 900
            height = 700
            margin = dict(l=0, r=0, t=50, b=0)
            font_size = 16

        fig.update_layout(
            title={
                'text': title_text,
                'x': 0.5,
                'font': {'size': font_size, 'color': 'darkblue'}
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
            width=width,
            height=height,
            margin=margin,
            showlegend=False,
            # Optimizaciones para móvil
            autosize=True,
            dragmode='orbit'  # Mejor para touch
        )

        return fig


# Inicializar visualizador
print("🚀 Inicializando visualizador de silla 3D para móvil...")
visualizer = Chair3DVisualizer('output_chair.json')

# Crear aplicación Dash con tema móvil
app = dash.Dash(__name__,
                external_stylesheets=[dbc.themes.BOOTSTRAP],
                meta_tags=[
                    {"name": "viewport", "content": "width=device-width, initial-scale=1, shrink-to-fit=no"},
                    {"name": "apple-mobile-web-app-capable", "content": "yes"},
                    {"name": "apple-mobile-web-app-status-bar-style", "content": "default"}
                ])

app.title = "Silla 3D Mobile"

# CSS personalizado para móvil
mobile_styles = {
    'padding': '10px',
    'margin': '5px 0'
}

card_style = {
    'margin-bottom': '15px',
    'box-shadow': '0 2px 8px rgba(0,0,0,0.1)'
}

button_style = {
    'margin': '2px',
    'font-size': '14px'
}

# Layout optimizado para móvil
app.layout = dbc.Container([
    # Header compacto
    dbc.Row([
        dbc.Col([
            html.H3("🪑 Silla 3D Interactiva",
                   className="text-center mb-2 text-primary",
                   style={'font-size': '1.8rem'}),
            html.P("Controla la explosión con gestos táctiles",
                   className="text-center text-muted mb-3 small")
        ])
    ], style=mobile_styles),

    # Gráfico 3D - Prioridad en móvil
    dbc.Row([
        dbc.Col([
            dcc.Graph(
                id='3d-plot',
                style={'height': '400px', 'width': '100%'},
                config={
                    'displayModeBar': False,  # Ocultar toolbar en móvil
                    'doubleClick': 'reset',
                    'scrollZoom': True,
                    'touchZoom': True,
                    'dragRotation': True,
                    'staticPlot': False,
                    'responsive': True
                }
            )
        ], width=12)
    ], style={'margin-bottom': '10px'}),

    # Control de explosión prominente
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.Label("💥 Factor de Explosión",
                              className="fw-bold mb-2 text-center d-block"),
                    dcc.Slider(
                        id='explosion-slider',
                        min=0,
                        max=10,
                        step=0.5,
                        value=0,
                        marks={
                            0: {'label': '0'},
                            5: {'label': '5'},
                            10: {'label': '10'}
                        },
                        tooltip={
                            "placement": "bottom",
                            "always_visible": True,
                            "style": {"fontSize": "14px"}
                        }
                    )
                ], className="p-3")
            ], style=card_style)
        ], width=12)
    ]),

    # Botones de acción rápida
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("Reset", id="reset-btn",
                                     color="primary", size="sm",
                                     className="w-100", style=button_style)
                        ], width=4),
                        dbc.Col([
                            dbc.Button("MAX", id="max-explosion-btn",
                                     color="danger", size="sm",
                                     className="w-100", style=button_style)
                        ], width=4),
                        dbc.Col([
                            dbc.Button("Info", id="info-toggle-btn",
                                     color="info", size="sm",
                                     className="w-100", style=button_style)
                        ], width=4),
                    ], className="g-1")
                ], className="p-2")
            ], style=card_style)
        ], width=12)
    ]),

    # Vistas rápidas (colapsable en móvil)
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader([
                    html.H6("Vistas Rápidas", className="mb-0 text-center")
                ]),
                dbc.CardBody([
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("Frontal", id="front-view-btn",
                                     color="outline-info", size="sm",
                                     className="w-100", style=button_style)
                        ], width=4),
                        dbc.Col([
                            dbc.Button("Superior", id="top-view-btn",
                                     color="outline-info", size="sm",
                                     className="w-100", style=button_style)
                        ], width=4),
                        dbc.Col([
                            dbc.Button("Lateral", id="side-view-btn",
                                     color="outline-info", size="sm",
                                     className="w-100", style=button_style)
                        ], width=4),
                    ], className="g-1")
                ], className="p-2")
            ], style=card_style)
        ], width=12)
    ]),

    # Panel de información (colapsable)
    dbc.Row([
        dbc.Col([
            dbc.Collapse([
                dbc.Card([
                    dbc.CardHeader("📈 Estadísticas del Modelo"),
                    dbc.CardBody([
                        dbc.Row([
                            dbc.Col([
                                html.P([
                                    html.Strong("Vértices: "),
                                    html.Span(f"{visualizer.vertex_count:,}", className="text-info")
                                ], className="mb-2 small"),
                                html.P([
                                    html.Strong("Triángulos: "),
                                    html.Span(f"{visualizer.triangle_count:,}", className="text-info")
                                ], className="mb-2 small")
                            ], width=6),
                            dbc.Col([
                                html.P([
                                    html.Strong("Centro: "),
                                    html.Span(f"({visualizer.global_center[0]:.1f}, {visualizer.global_center[1]:.1f}, {visualizer.global_center[2]:.1f})",
                                            className="text-info")
                                ], className="mb-2 small"),
                                html.P([
                                    html.Strong("Estado: "),
                                    html.Span("", id="current-status", className="text-success fw-bold")
                                ], className="mb-2 small")
                            ], width=6)
                        ])
                    ], className="p-2")
                ])
            ], id="info-collapse", is_open=False)
        ], width=12)
    ]),

    # Instrucciones móviles (colapsable)
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.P("💡 Instrucciones:", className="fw-bold mb-2 small"),
                    html.Ul([
                        html.Li("👆 Toca y arrastra para rotar", className="small"),
                        html.Li("🤏 Pellizca para zoom", className="small"),
                        html.Li("⚡ Usa el slider para explosión", className="small"),
                        html.Li("🎯 Botones de vista rápida", className="small")
                    ], className="mb-0")
                ], className="p-2")
            ], style=card_style)
        ], width=12)
    ]),

    # Footer compacto
    html.Hr(style={'margin': '20px 0 10px 0'}),
    html.P([
        "🛠️ Desarrollado con Plotly Dash | ",
        html.Span(f"{datetime.now().strftime('%Y')}", className="text-muted")
    ], className="text-center text-muted small mb-2")

], fluid=True, style={'padding': '5px'})


# Callbacks optimizados
@app.callback(
    [Output('3d-plot', 'figure'),
     Output('current-status', 'children')],
    [Input('explosion-slider', 'value'),
     Input('reset-btn', 'n_clicks'),
     Input('max-explosion-btn', 'n_clicks'),
     Input('top-view-btn', 'n_clicks'),
     Input('front-view-btn', 'n_clicks'),
     Input('side-view-btn', 'n_clicks')],
    prevent_initial_call=False
)
def update_3d_plot(explosion_factor, reset_clicks, max_explosion_clicks,
                  top_clicks, front_clicks, side_clicks):
    """Actualizar el plot 3D basado en los controles"""

    # Determinar qué input fue activado
    ctx = dash.callback_context
    if not ctx.triggered:
        button_id = 'explosion-slider'
    else:
        button_id = ctx.triggered[0]['prop_id'].split('.')[0]

    # Crear figura base móvil
    fig = visualizer.create_plotly_figure(explosion_factor, mobile_mode=True)

    # Configurar vista según el botón presionado
    if button_id == 'top-view-btn':
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=0, y=0, z=2.5),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=1, z=0)
            )
        )
        status = f"Superior - {explosion_factor}"

    elif button_id == 'front-view-btn':
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=0, y=-2.5, z=0),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=0, z=1)
            )
        )
        status = f"Frontal - {explosion_factor}"

    elif button_id == 'side-view-btn':
        fig.update_layout(
            scene_camera=dict(
                eye=dict(x=2.5, y=0, z=0),
                center=dict(x=0, y=0, z=0),
                up=dict(x=0, y=0, z=1)
            )
        )
        status = f"Lateral - {explosion_factor}"

    elif button_id == 'max-explosion-btn':
        explosion_factor = 10
        fig = visualizer.create_plotly_figure(explosion_factor, mobile_mode=True)
        status = f"Máximo - {explosion_factor}"

    elif button_id == 'reset-btn':
        status = f"Reset - {explosion_factor}"

    else:
        # Slider cambio normal
        if explosion_factor == 0:
            status = "Normal"
        elif explosion_factor <= 3:
            status = f"Ligera - {explosion_factor}"
        elif explosion_factor <= 6:
            status = f"Media - {explosion_factor}"
        else:
            status = f"Fuerte - {explosion_factor}"

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
        return dash.no_update


@app.callback(
    Output('info-collapse', 'is_open'),
    [Input('info-toggle-btn', 'n_clicks')],
    [State('info-collapse', 'is_open')]
)
def toggle_info_collapse(n_clicks, is_open):
    """Toggle del panel de información"""
    if n_clicks:
        return not is_open
    return is_open


if __name__ == '__main__':
    print("📱 Iniciando aplicación móvil...")
    print("🌐 Abre tu navegador en: http://127.0.0.1:8051")
    print("📲 Optimizado para:")
    print("   • Pantallas táctiles")
    print("   • Gestos de pellizco/zoom")
    print("   • Interface responsive")
    print("   • Navegación táctil")
    print("\n🚀 ¡Aplicación lista para móvil!")

    app.run(debug=True, host='0.0.0.0', port=8051)