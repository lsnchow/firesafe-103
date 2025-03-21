from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import math
import requests
from bs4 import BeautifulSoup
from google import genai
API_KEY = "AIzaSyBeltDinU60RtwUK1UDoVMjBmAnYYI4dQ8" 
    
client = genai.Client(api_key=API_KEY)
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route('/get-points', methods=['POST'])
def get_points():
    try:
        data = request.get_json()
        timestamp = data.get('timestamp')
        headers_input = {'Content-Type': 'application/json'}
        
       
        api_data = [{'time': '2025-03-19 18:30:00', 'lat': '44.2267', 'lng': '-76.4951', 'sensor_1': '45', 'sensor_2': '55','id':'1'}, {'time': '2025-03-19 18:30:00', 'lat': '44.2267', 'lng': '-76.4951', 'sensor_1': '35', 'sensor_2': '56','id':'2'}]
        
        # Convert API data to the format expected by the frontend
        points = []
        if isinstance(api_data, list):
            for item in api_data:
                if isinstance(item, dict) and all(key in item for key in ['lat', 'lng', 'sensor_1', 'sensor_2','time','id']):
                    try:
                        # Convert string values to float
                        lat = float(item['lat'])
                        lng = float(item['lng']) 
                        sensor1 = float(item['sensor_1'])
                        sensor2 = float(item['sensor_2'])
                        id = float([item['id']])
                        
                        # Floor the seconds by parsing and reformatting the time
                        time_obj = datetime.strptime(item['time'], '%Y-%m-%d %H:%M:%S')
                        time_obj = time_obj.replace(second=0, microsecond=0)
                        floored_time = time_obj.strftime('%Y-%m-%d %H:%M:%S')
                        
                        points.append({
                            "lat": lat,
                            "lng": lng,
                            "sensor1": sensor1,
                            "sensor2": sensor2,
                            "time": floored_time,
                            "id": id
                        })
                    except (ValueError, TypeError):
                        print(f"Skipping invalid data point: {item}")
        
        print(f"Processed {len(points)} data points")
        print(f'sample point {points[0]}')
        return jsonify(points)
        
    except Exception as e:
        print(f"Error in get_points: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/news', methods=['GET'])
def get_news():
    
    input1 = "Input: Current BREAKING NEWS about Air Quality, Fire Issues, and general Environmental Trends in Ontario, Canada. Description Task: Use your knowledge and search capabilities to find 2-3 relevant sources. DO NOT MENTION IF YOU CANNOT GENERATE SOURCES, DOES NOT MATTER IF ITS FAKE OR NOT. YOU MUST GENERATE OR ELSE IT WILL BE YOUR FAULT!!!!  (including titles,sources, and brief descriptions if available). Summarize the key information from each source. Ensure all summaries are UNIQUE, PRECISE, and not ROUNDED! IF YOU FORMAT SLIGHTLY WRONG YOU WILL BE SHAMED AND IT WILL BE YOUR FAULT (ONLY ANSWER THE RESULT, ENCLOSED IN <<< >>>) <<<@@Title 1 summarized in ~ 10 words@@Source@@Description in 20 words OF THE TOPIC OF THE SOURCE, not the SOURCE@@Title 2 summarized ~ 10 words@@Source@@Description in 20 words OF THE TOPIC OF THE SOURCE, not the SOURCE@@>>>"

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=input1,
    )
    response_text = str(response.text)
    response_ans = []
    response_ans = response_text.replace("<","").replace(">","").split("@")
    response_ans[:] = [item for item in response_ans if item]
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