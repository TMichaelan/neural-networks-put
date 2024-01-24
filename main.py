from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import matplotlib.pyplot as plt
from datetime import datetime
import os




def preprocess_image(image, save_path=None):
    gray_image = image.convert('L')
    enhancer = ImageEnhance.Contrast(gray_image)
    enhanced_image = enhancer.enhance(2)
    blurred_image = enhanced_image.filter(ImageFilter.GaussianBlur(1))
    binary_image = blurred_image.point(lambda x: 0 if x < 128 else 255, '1')

    if save_path:
        binary_image.save(save_path)

    return binary_image
 
def recognize_numbers(image_paths, coordinates_list=None):
    all_recognized_numbers = []
    
    if coordinates_list is None:

        for image_path in image_paths:
            image = Image.open(image_path)
            processed_image = preprocess_image(image)

            custom_config = r'--oem 3 --psm 6 outputbase digits'
            text = pytesseract.image_to_string(processed_image, config=custom_config)

            recognized_numbers = text.strip().split()

            all_recognized_numbers.append(recognized_numbers)

        return all_recognized_numbers
    else:
        for image_path, coordinates in zip(image_paths, coordinates_list):
            image = Image.open(image_path)
            processed_image = preprocess_image(image)
    
            recognized_numbers = []
    
            for i, (x, y, width, height) in enumerate(coordinates):
                number_image = processed_image.crop((x, y, x + width, y + height))
    
                plt.imshow(number_image, cmap='binary')
                plt.axis('off')
                plt.show()
    
                custom_config = r'--oem 3 --psm 6 outputbase digits'
                text = pytesseract.image_to_string(number_image, config=custom_config)
    
                recognized_numbers.append(text.strip())
    
            all_recognized_numbers.append(recognized_numbers)
        return all_recognized_numbers




app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file:
        filename = secure_filename(file.filename)
        now = datetime.now()
        timestamp = now.strftime("%Y%m%d%H%M%S")
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        image_paths = [file_path]

        processed_image_paths = []
        for img_path in image_paths:
            img = Image.open(img_path)
            processed_filename = os.path.splitext(os.path.basename(img_path))[0] + timestamp + "_processed.jpg"
            processed_img_path = os.path.join(PROCESSED_FOLDER, processed_filename)
            preprocess_image(img).save(processed_img_path)
            processed_image_paths.append(processed_img_path)


        prediction = recognize_numbers(image_paths)
        print(prediction)
        return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)
