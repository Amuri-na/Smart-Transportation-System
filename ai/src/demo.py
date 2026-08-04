import tkinter as tk
from tkinter import filedialog
from ultralytics import YOLO


# Load YOLO model on CPU (compatible with your laptop)
model = YOLO("yolov8n.pt")
model.to("cpu")


window = tk.Tk()
window.title("🚕 AI Transportation Analyzer")
window.geometry("600x500")


title = tk.Label(
    window,
    text="🚕 AI Transportation Analyzer",
    font=("Arial", 18)
)
title.pack(pady=20)


image_label = tk.Label(
    window,
    text="No image selected"
)
image_label.pack(pady=10)


result_label = tk.Label(
    window,
    text="Results will appear here",
    font=("Arial", 14),
    justify="left"
)
result_label.pack(pady=20)


def analyze_image():

    file_path = filedialog.askopenfilename(
        filetypes=[
            ("Images", "*.jpg *.jpeg *.png")
        ]
    )

    if file_path:

        image_label.config(
            text="Analyzing:\n" + file_path
        )

        # Force CPU inference
        results = model(
            file_path,
            device="cpu"
        )

        cars = 0
        people = 0
        buses = 0

        for result in results:

            for box in result.boxes:

                cls = int(box.cls[0])
                name = model.names[cls]

                if name == "car":
                    cars += 1

                elif name == "person":
                    people += 1

                elif name == "bus":
                    buses += 1


        total_activity = cars + people + buses

        if total_activity > 10:
            activity = "HIGH"
        elif total_activity > 5:
            activity = "MEDIUM"
        else:
            activity = "LOW"


        result_label.config(
            text=f"""
🚕 Transportation Analysis
-------------------------

Cars: {cars}
Buses: {buses}
People: {people}

Station Activity: {activity}
"""
        )


button = tk.Button(
    window,
    text="Select & Analyze Image",
    command=analyze_image,
    width=25,
    height=2
)

button.pack(pady=20)


window.mainloop()