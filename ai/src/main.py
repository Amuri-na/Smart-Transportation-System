from ultralytics import YOLO
import cv2

# Load the pretrained YOLO model
model = YOLO("yolov8n.pt")

# Read the input image
image_path = "images/test.jpg"
image = cv2.imread(image_path)

# Run object detection
results = model(image, device="cpu")

# Get the annotated image (with boxes and labels)
annotated = results[0].plot()

# Save the output image
output_path = "outputs/result.jpg"
cv2.imwrite(output_path, annotated)

# Print detected objects
print("\nDetected Objects:")
for box in results[0].boxes:
    class_id = int(box.cls[0])
    class_name = model.names[class_id]
    confidence = float(box.conf[0])
    print(f"{class_name} ({confidence:.2f})")

print(f"\nAnnotated image saved to: {output_path}")