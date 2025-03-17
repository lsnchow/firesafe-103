from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import math
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Queens University campus landmarks
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
    
    return points

@app.route('/get-points', methods=['POST'])
def get_points():
    try:
        data = request.get_json()
        timestamp = data.get('timestamp')
        
        if not timestamp:
            return jsonify({"error": "Timestamp is required"}), 400
            
        points = generate_sample_points(timestamp)
        print(points)
        return jsonify(points)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/news', methods=['GET'])
def get_news():
    try:
        # Example news data - replace with actual API calls
        news = [
            {
                "title": "Air Quality Warning for Kingston Area",
                "description": "Local authorities have issued an air quality warning due to increased particulate matter in the atmosphere.",
                "source": "Kingston News",
                "date": datetime.now().isoformat(),
                "url": "https://example.com/news/1"
            },
            {
                "title": "Queens University Updates Emergency Response Plans",
                "description": "The university has updated its emergency response protocols following recent environmental concerns.",
                "source": "University Gazette",
                "date": (datetime.now() - timedelta(hours=2)).isoformat(),
                "url": "https://example.com/news/2"
            }
        ]
        return jsonify(news)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)