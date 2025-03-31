python3 -m venv venv
source venv/Scripts/activate
pip3 install flask flask-cors google-genai requests
pip3 freeze > requirements.txt
pip3 install -r requirements.txt
python3 backend/backend1.py