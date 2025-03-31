python -m venv venv
source venv\Scripts\activate
pip install flask flask-cors google-genai requests
pip freeze > requirements.txt
pip install -r requirements.txt
python backend\backend1.py