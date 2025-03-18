from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

@app.route('/get-data', methods=['GET'])
def get_data():
    try:
        # First get the available UIDs
        headers_input = {'Content-Type': 'application/json'}
        response = requests.get(
            'http://184.144.75.214/api/api.php',
            json={'table_id': 'id_table'},
            headers=headers_input
        )
        
        uids = response.json()
        print("Available UIDs:", uids)
        
        # Get the requested UID from parameters or default to UID_1
        requested_uid = request.args.get('uid', 'UID_1')
        print(f"Requesting data for UID: {requested_uid}")
        
        if requested_uid not in uids:
            return jsonify({'error': f"UID {requested_uid} not found. Available UIDs: {uids}"}), 404
        
        # Now make the request for the specific UID
        uid_response = requests.get(
            'http://184.144.75.214/api/api.php',
            json={'table_id': requested_uid},
            headers=headers_input
        )
        
        # Parse the JSON response
        data = uid_response.json()
        print("Raw data received:", data)
        
        # Convert to list of individual elements
        result = []
        if isinstance(data, list):
            for item in data:
                # Check if item is a dictionary and has required keys
                if isinstance(item, dict) and all(key in item for key in ['time', 'lat', 'lng', 'sensor_1', 'sensor_2']):
                    # Combine lat and lng into a loc object
                    loc = f"{item['lat']},{item['lng']}"
                    result.extend([
                        {'time': item['time']},
                        {'loc': loc},
                        {'sensor_1': item['sensor_1']},
                        {'sensor_2': item['sensor_2']}
                    ])
        elif isinstance(data, dict):
            # Check if data dictionary has required keys
            if all(key in data for key in ['time', 'lat', 'lng', 'sensor_1', 'sensor_2']):
                # Combine lat and lng into a loc object
                loc = f"{data['lat']},{data['lng']}"
                result.extend([
                    {'time': data['time']},
                    {'loc': loc},
                    {'sensor_1': data['sensor_1']},
                    {'sensor_2': data['sensor_2']}
                ])
            
        print("Processed data:", result)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

#sifting through the data and deleting if incremeents are too large/small

#Datapoint every 10 seconds

#parse and analyze data

#parse through the data