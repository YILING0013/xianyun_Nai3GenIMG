import gzip
import json
from PIL import Image
from io import BytesIO
import tkinter as tk
from tkinter import filedialog, messagebox
import os

def bits_to_int(bits):
    return int("".join(map(str, bits)), 2)

def int_to_bits(value, length):
    return [int(x) for x in bin(value)[2:].zfill(length)]

def string_to_bits(string):
    bits = []
    for char in string:
        bits.extend(int_to_bits(ord(char), 8))
    return bits

def extract_bits_from_pixel(pixel_list):
    bits_list = []
    for pixel in pixel_list:
        if pixel[3] & 1:
            bits_list.append(1)
        else:
            bits_list.append(0)
    return bits_list

def insert_bits_into_pixel(pixel_list, bits_list):
    for i in range(len(bits_list)):
        pixel = list(pixel_list[i])
        if bits_list[i] == 1:
            pixel[3] |= 1
        else:
            pixel[3] &= ~1
        pixel_list[i] = tuple(pixel)
    return pixel_list

def read_hidden_data_from_image(image_data):
    img = Image.open(BytesIO(image_data))
    img = img.transpose(5)
    pixel_list = list(img.getdata())

    bits_list = extract_bits_from_pixel(pixel_list)

    prefix_length = len("stealth_pngcomp") * 8
    length_bits = bits_list[prefix_length : prefix_length + 32]
    data_length = bits_to_int(length_bits)

    data_bits = bits_list[prefix_length + 32 : prefix_length + 32 + data_length]
    data_bytes = bytearray()
    for i in range(0, len(data_bits), 8):
        byte = data_bits[i : i + 8]
        data_bytes.append(int("".join(map(str, byte)), 2))

    decompressed_data = gzip.decompress(data_bytes).decode("utf-8")
    return json.loads(decompressed_data)

def save_hidden_data_to_image(image_data, hidden_data, output_path):
    img = Image.open(BytesIO(image_data))
    img = img.transpose(5)
    pixel_list = list(img.getdata())

    compressed_data = gzip.compress(json.dumps(hidden_data).encode("utf-8"))
    data_bits = []
    for byte in compressed_data:
        data_bits.extend(int_to_bits(byte, 8))

    length_bits = int_to_bits(len(data_bits), 32)
    prefix_bits = string_to_bits("stealth_pngcomp")

    bits_list = prefix_bits + length_bits + data_bits

    if len(bits_list) > len(pixel_list):
        raise ValueError("Data is too large to be hidden in the image")

    pixel_list = insert_bits_into_pixel(pixel_list, bits_list)

    new_img = Image.new(img.mode, img.size)
    new_img.putdata(pixel_list)
    new_img = new_img.transpose(5)
    new_img.save(output_path, "PNG")

def open_image():
    file_path = filedialog.askopenfilename(filetypes=[("PNG Images", "*.png")])
    if not file_path:
        return

    with open(file_path, 'rb') as img_file:
        image_data = img_file.read()

    try:
        data = read_hidden_data_from_image(image_data)
        display_metadata(data, file_path, image_data)
    except Exception as e:
        messagebox.showerror("Error", f"Failed to extract data from image: {e}")

def display_metadata(data, file_path, image_data):
    for widget in frame.winfo_children():
        widget.destroy()

    tk.Label(frame, text=f"File: {os.path.basename(file_path)}").pack()
    tk.Label(frame, text="Metadata:").pack()

    canvas = tk.Canvas(frame, borderwidth=0)
    scrollbar = tk.Scrollbar(frame, orient="vertical", command=canvas.yview)
    scrollable_frame = tk.Frame(canvas)

    scrollable_frame.bind(
        "<Configure>",
        lambda e: canvas.configure(
            scrollregion=canvas.bbox("all")
        )
    )

    def on_mousewheel(event):
        canvas.yview_scroll(int(-1*(event.delta/120)), "units")

    canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)

    entries = {}
    for key, value in data.items():
        if key == "Comment":
            comment_data = json.loads(value)
            tk.Label(scrollable_frame, text=f"{key}:").pack()
            for sub_key, sub_value in comment_data.items():
                if sub_value is None:
                    sub_value = ""
                row = tk.Frame(scrollable_frame)
                tk.Label(row, text=sub_key, width=20, anchor='w').pack(side=tk.LEFT)
                entry = tk.Entry(row, width=80)
                entry.pack(side=tk.RIGHT, expand=tk.YES, fill=tk.X)
                entry.insert(tk.END, sub_value)
                row.pack(side=tk.TOP, fill=tk.X, padx=5, pady=5)
                entries[f"Comment.{sub_key}"] = entry
        else:
            if value is None:
                value = ""
            row = tk.Frame(scrollable_frame)
            tk.Label(row, text=key, width=20, anchor='w').pack(side=tk.LEFT)
            entry = tk.Entry(row, width=80)
            entry.pack(side=tk.RIGHT, expand=tk.YES, fill=tk.X)
            entry.insert(tk.END, value)
            row.pack(side=tk.TOP, fill=tk.X, padx=5, pady=5)
            entries[key] = entry

    tk.Button(scrollable_frame, text="Save Changes", command=lambda: save_changes(entries, file_path, image_data)).pack()

    canvas.pack(side="left", fill="both", expand=True)
    scrollbar.pack(side="right", fill="y")

    scrollable_frame.bind_all("<MouseWheel>", on_mousewheel)

def save_changes(entries, file_path, image_data):
    try:
        json_data = {}
        comment_data = {}
        for key, entry in entries.items():
            if key.startswith("Comment."):
                comment_key = key.split(".", 1)[1]
                comment_data[comment_key] = entry.get()
            else:
                json_data[key] = entry.get()
        if comment_data:
            json_data["Comment"] = json.dumps(comment_data)
        output_path = filedialog.asksaveasfilename(defaultextension=".png", filetypes=[("PNG Images", "*.png")])
        if output_path:
            save_hidden_data_to_image(image_data, json_data, output_path)
            messagebox.showinfo("Success", "Changes saved successfully!")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to save changes: {e}")

root = tk.Tk()
root.title("Image Metadata Editor")
root.geometry("800x600")  # Set a larger window size

frame = tk.Frame(root)
frame.pack(fill=tk.BOTH, expand=True, pady=20, padx=20)

tk.Button(root, text="Open Image", command=open_image).pack(pady=10)

root.mainloop()
