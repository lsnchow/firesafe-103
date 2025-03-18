from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import math
import requests
from bs4 import BeautifulSoup
from google import genai
API_KEY = "AIzaSyBeltDinU60RtwUK1UDoVMjBmAnYYI4dQ8" #idgaf about leaking it
    
client = genai.Client(api_key=API_KEY)
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Queens University campus landmarks
'''
CAMPUS_LANDMARKS = [
    {"name": "Grant Hall", "lat": 44.2267, "lng": -76.4951},
    {"name": "Stauffer Library", "lat": 44.2280, "lng": -76.4945},
    {"name": "Queen's Centre", "lat": 44.2285, "lng": -76.4960},
    {"name": "University Club", "lat": 44.2253, "lng": -76.4951},
    {"name": "Douglas Library", "lat": 44.2273, "lng": -76.4935},
    {"name": "Kingston Hall", "lat": 44.2265, "lng": -76.4940},
    {"name": "BioSciences Complex", "lat": 44.2245, "lng": -76.4910},
    {"name": "Goodes Hall", "lat": 44.2305, "lng": -76.4970},
    {"name": "Mitchell Hall", "lat": 44.2292, "lng": -76.4947},
]

# Downtown Kingston areas
DOWNTOWN_AREAS = [
    {"name": "Market Square", "lat": 44.2295, "lng": -76.4800},
    {"name": "Confederation Park", "lat": 44.2285, "lng": -76.4810},
    {"name": "Princess Street", "lat": 44.2310, "lng": -76.4850},
]

def generate_sample_points(timestamp):
    # Convert timestamp string to datetime
    time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    
    # Seed random based on hour and minute to get variation but consistency for the same time
    random.seed(time.hour * 100 + time.minute + time.day)
    
    points = []
    
    # Number of points to generate
    num_points = 150  # Increased from 50 to 150
    
    # Generate points clustered around campus landmarks (70% of points)
    campus_points = int(num_points * 0.7)
    for _ in range(campus_points):
        # Pick a random landmark
        landmark = random.choice(CAMPUS_LANDMARKS)
        
        # Generate point near the landmark with reduced randomness
        # Using normal distribution for more realistic clustering
        sigma = 0.003  # Controls spread - smaller value = tighter clustering
        lat = landmark["lat"] + random.normalvariate(0, sigma)
        lng = landmark["lng"] + random.normalvariate(0, sigma)
        
        # Value between 40-100, with higher values during daytime hours
        hour = time.hour
        daytime_boost = max(0, 10 - abs(hour - 14))  # Peak at 2pm (14:00)
        base_value = random.randint(40, 80)
        value = min(100, base_value + daytime_boost)
        
        # Add some time-based variation (like wave patterns through the day)
        time_factor = math.sin(hour / 24 * 2 * math.pi)
        value += time_factor * 10
        
        points.append({
            "lat": lat,
            "lng": lng,
            "value": round(value, 1)
        })
    
    # Generate points in downtown Kingston (30% of points)
    downtown_points = num_points - campus_points
    for _ in range(downtown_points):
        # Pick a random downtown area
        area = random.choice(DOWNTOWN_AREAS)
        
        # Generate point near the downtown area
        sigma = 0.005  # Slightly more spread for downtown
        lat = area["lat"] + random.normalvariate(0, sigma)
        lng = area["lng"] + random.normalvariate(0, sigma)
        
        # Downtown values are generally lower than campus
        hour = time.hour
        evening_boost = max(0, 10 - abs(hour - 20))  # Peak at 8pm (20:00)
        base_value = random.randint(30, 70)
        value = min(100, base_value + evening_boost)
        
        points.append({
            "lat": lat,
            "lng": lng,
            "value": round(value, 1)
        })
    
    return points '''

@app.route('/get-points', methods=['POST'])
def get_points():
    try:
        data = request.get_json()
        timestamp = data.get('timestamp')
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
        requested_uid = 'UID_1'  # Hardcoded for now, could use timestamp to select
        print(f"Requesting data for UID: {requested_uid}")
        
        if requested_uid not in uids:
            return jsonify({'error': f"UID {requested_uid} not found. Available UIDs: {uids}"}), 404
        
        # Now make the request for the specific UID
        uid_response = requests.get(
            'http://184.144.75.214/api/api.php',
            json={'table_id': requested_uid},
            headers=headers_input
        )

        api_data = uid_response.json()
        print("Raw data received:", api_data)
        
        # Convert API data to the format expected by the frontend
        points = []
        if isinstance(api_data, list):
            for item in api_data:
                if isinstance(item, dict) and all(key in item for key in ['lat', 'lng', 'sensor_1']):
                    try:
                        # Convert string values to float
                        lat = float(item['lat'])
                        lng = float(item['lng']) 
                        value = float(item['sensor_1'])  # Using sensor_1 as the value
                        
                        points.append({
                            "lat": lat,
                            "lng": lng,
                            "value": round(value, 1)
                        })
                    except (ValueError, TypeError):
                        print(f"Skipping invalid data point: {item}")
        
        print(f"Processed {len(points)} data points")
        return jsonify(points)
        
    except Exception as e:
        print(f"Error in get_points: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/news', methods=['GET'])
def get_news():
    
    input1 = "Input: Current BREAKING NEWS about Air Quality, Fire Issues, and general Environmental Trends in Ontario, Canada. Description Task: Use your knowledge and search capabilities to find 2-3 relevant sources (including titles,sources, and brief descriptions if available). Summarize the key information from each source. Ensure all summaries are UNIQUE, PRECISE, and not ROUNDED! IF YOU FORMAT SLIGHTLY WRONG YOU WILL BE SHAMED AND IT WILL BE YOUR FAULT (ONLY ANSWER THE RESULT, ENCLOSED IN <<< >>>) <<<@@Title 1 summarized in ~ 10 words@@Source@@Description in 20 words OF THE TOPIC OF THE SOURCE, not the SOURCE@@Title 2 summarized ~ 10 words@@Source@@Description in 20 words OF THE TOPIC OF THE SOURCE, not the SOURCE@@>>>"

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=input1,
    )
    response_text = str(response.text)
    print(response)
    response_ans = []
    response_ans = response_text.replace("<","").replace(">","").split("@")
    response_ans[:] = [item for item in response_ans if item]
    print(response_ans)
    try:
        # Example news data - replace with actual API calls
        news = []
        # Process every 3 items (title, source, description)
        for i in range(0, len(response_ans), 3):
            if i + 2 < len(response_ans):  # Ensure we have all 3 items
                news_item = {
                    "title": response_ans[i].strip(),
                    "source": response_ans[i + 1].strip(),
                    "description": response_ans[i + 2].strip(),
                    "date": datetime.now().isoformat()
                }
                news.append(news_item)
        
        return jsonify(news)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)