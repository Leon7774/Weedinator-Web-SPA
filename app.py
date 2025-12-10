from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import io
import base64
from flask_cors import CORS

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# Load models at startup
print("Loading models...")
models = {
    'yolo': YOLO("best_yolo.pt"),
    'resnet': YOLO("best_resnet.pt"),
    'convnext': YOLO("best_ConvNext.pt")
}
print("Models loaded.")

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/ping')
def ping():
    return "Server reached", 200

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    model_id = request.form.get('model', 'yolo')
    if model_id not in models:
        return jsonify({"error": "Invalid model selected"}), 400

    try:
        # Read image to numpy array
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Invalid image format"}), 400

        # Run Inference
        selected_model = models[model_id]
        results = selected_model(img)
        
        # Process results
        result = results[0]
        detections = []
        for box in result.boxes:
            # Extract info
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            label = result.names[cls_id]
            
            detections.append({
                "label": label,
                "confidence": conf,
                "bbox": xyxy
            })
        
        # Visualize
        annotated_img = result.plot()
        
        # Encode back to jpg then base64
        _, buffer = cv2.imencode('.jpg', annotated_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            "image": img_base64,
            "detections": detections
        })
        
    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

if __name__ == '__main__':
    app.run()
