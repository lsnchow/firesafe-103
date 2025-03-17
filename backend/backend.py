from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route('/get-data', methods=['GET'])
def get_data():
    try:
        # Get table_id from URL parameters
        table_id = request.args.get('table_id', 'id_table')
        print(f"Requesting data for table: {table_id}")
        
        # Make request to the PHP API
        headers = {'Content-Type': 'application/json'}
        response = requests.get(
            'http://184.144.75.214/api/api.php',
            json={'table_id': table_id},
            headers=headers
        )
        
        # Parse the JSON response
        data = response.json()
        
        # Debug print
        print("Raw data received:", data)
        
        # Convert to list of individual elements
        result = []
        if isinstance(data, list):
            for item in data:
                # Check if item is a dictionary and has required keys
                if isinstance(item, dict) and all(key in item for key in ['time', 'loc', 'sensor_1', 'sensor_2']):
                    result.extend([
                        {'time': item['time']},
                        {'loc': item['loc']},
                        {'sensor_1': item['sensor_1']},
                        {'sensor_2': item['sensor_2']}
                    ])
        elif isinstance(data, dict):
            # Check if data dictionary has required keys
            if all(key in data for key in ['time', 'loc', 'sensor_1', 'sensor_2']):
                result.extend([
                    {'time': data['time']},
                    {'loc': data['loc']},
                    {'sensor_1': data['sensor_1']},
                    {'sensor_2': data['sensor_2']}
                ])
            
        print("Processed data:", result)


        heatmap_data = [
            {"lat": 44.2253, "lng": -76.4951, "value": 85},
            {"lat": 44.2258, "lng": -76.4942, "value": 75},
            {"lat": 44.2248, "lng": -76.4960, "value": 90},
            {"lat": 44.2263, "lng": -76.4955, "value": 65},

        ]
        
        return jsonify(heatmap_data)
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

#sifting through the data and deleting if incremeents are too large/small

#Datapoint every 10 seconds

#parse and analyze data

#parse through the data