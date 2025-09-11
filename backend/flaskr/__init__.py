from flask import Flask
from flask_cors import CORS

from flaskr.routes.gemini_route import gemini_bp


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.register_blueprint(gemini_bp, url_prefix='/gemini')
    return app