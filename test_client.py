import requests

url = 'http://localhost:5000/upload'

files = {'file': open('uploads/1.png', 'rb')}
response = requests.post(url, files=files)

if response.status_code == 200:
    data = response.json()
    prediction = data['prediction']
    print(f"Predicted numbers: {prediction}")
else:
    print("Error:", response.text)