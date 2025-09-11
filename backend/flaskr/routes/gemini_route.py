from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

from flaskr.services.gemini_service import gemini_service

gemini_bp = Blueprint('gemini_bp', __name__, url_prefix='/gemini')
gemini_service = gemini_service()

@gemini_bp.route('/get-answer', methods=['POST'])
@cross_origin(origins="/*", methods=['POST'])
def ask():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    
    # Extract text from the request data
    text = data.get('text')
    
    result = gemini_service.ask(text)
    
    # Handle the service response
    status, code, response_text = result
    return jsonify({
            "status": status,
            "error": code,
            "response": response_text
    })
