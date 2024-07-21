import gzip
import json
from PIL import Image, ImageTk
from io import BytesIO
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import sys
import os
import logging
from threading import Thread
import pystray
from pystray import MenuItem as item
import webbrowser

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

    global image_files, image_data
    image_files = [file_path]

    with open(file_path, 'rb') as img_file:
        image_data = img_file.read()

    try:
        data = read_hidden_data_from_image(image_data)
        display_metadata(data, file_path, image_data)
    except Exception as e:
        messagebox.showerror("Error", f"Failed to extract data from image: {e}")
        logger.error(f"Failed to extract data from image {file_path}: {e}")

def open_images():
    folder_path = filedialog.askdirectory()
    if not folder_path:
        return

    global image_files, image_data
    image_files = [os.path.join(folder_path, file) for file in os.listdir(folder_path) if file.endswith('.png')]
    if not image_files:
        messagebox.showerror("Error", "No PNG images found in the selected folder")
        return

    try:
        with open(image_files[0], 'rb') as img_file:
            image_data = img_file.read()
        data = read_hidden_data_from_image(image_data)
        display_metadata(data, image_files[0], image_data)
    except Exception as e:
        messagebox.showerror("Error", f"Failed to extract data from image: {e}")
        logger.error(f"Failed to extract data from image {image_files[0]}: {e}")

def display_metadata(data, file_path, image_data):
    for widget in frame.winfo_children():
        widget.destroy()

    tk.Label(frame, text=f"File: {os.path.basename(file_path)}").grid(row=0, column=0, columnspan=2, sticky="w")
    tk.Label(frame, text="Metadata:").grid(row=1, column=0, columnspan=2, sticky="w")

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
    row_idx = 2
    for key, value in data.items():
        if key == "Comment":
            comment_data = json.loads(value)
            tk.Label(scrollable_frame, text=f"{key}:").grid(row=row_idx, column=0, sticky="w")
            row_idx += 1
            for sub_key, sub_value in comment_data.items():
                if sub_value is None:
                    sub_value = ""
                tk.Label(scrollable_frame, text=sub_key, width=20, anchor='w').grid(row=row_idx, column=0, sticky="w")
                text_box = tk.Text(scrollable_frame, wrap='word', height=1, width=80)
                text_box.grid(row=row_idx, column=1, sticky="w")
                text_box.insert(tk.END, sub_value)
                text_box.bind("<Configure>", lambda e, tb=text_box: adjust_textbox_height(tb))
                entries[f"Comment.{sub_key}"] = text_box
                row_idx += 1
        else:
            if value is None:
                value = ""
            tk.Label(scrollable_frame, text=key, width=20, anchor='w').grid(row=row_idx, column=0, sticky="w")
            text_box = tk.Text(scrollable_frame, wrap='word', height=1, width=80)
            text_box.grid(row=row_idx, column=1, sticky="w")
            text_box.insert(tk.END, value)
            text_box.bind("<Configure>", lambda e, tb=text_box: adjust_textbox_height(tb))
            entries[key] = text_box
            row_idx += 1

    canvas.grid(row=2, column=0, columnspan=2, sticky="nsew")
    scrollbar.grid(row=2, column=2, sticky="ns")

    scrollable_frame.bind_all("<MouseWheel>", on_mousewheel)

    button_frame = tk.Frame(frame)
    button_frame.grid(row=3, column=0, columnspan=2, pady=10)
    tk.Button(button_frame, text="Save Changes", command=lambda: save_changes(entries, file_path, image_data)).grid(row=0, column=0, padx=5)
    tk.Button(button_frame, text="Apply to All", command=lambda: Thread(target=apply_to_all, args=(entries,)).start()).grid(row=0, column=1, padx=5)

def adjust_textbox_height(text_box):
    text_box_height = int(text_box.index('end-1c').split('.')[0])
    text_box.configure(height=text_box_height)

def save_changes(entries, file_path, image_data):
    try:
        json_data = {}
        comment_data = {}
        for key, entry in entries.items():
            if key.startswith("Comment."):
                comment_key = key.split(".", 1)[1]
                comment_data[comment_key] = entry.get("1.0", tk.END).strip()
            else:
                json_data[key] = entry.get("1.0", tk.END).strip()
        if comment_data:
            json_data["Comment"] = json.dumps(comment_data)
        output_path = filedialog.asksaveasfilename(defaultextension=".png", filetypes=[("PNG Images", "*.png")])
        if output_path:
            save_hidden_data_to_image(image_data, json_data, output_path)
            messagebox.showinfo("Success", "Changes saved successfully!")
            logger.info(f"Changes saved successfully to {output_path}")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to save changes: {e}")
        logger.error(f"Failed to save changes: {e}")

def apply_to_all(entries):
    try:
        json_data = {}
        comment_data = {}
        for key, entry in entries.items():
            if key.startswith("Comment."):
                comment_key = key.split(".", 1)[1]
                comment_data[comment_key] = entry.get("1.0", tk.END).strip()
            else:
                json_data[key] = entry.get("1.0", tk.END).strip()
        if comment_data:
            json_data["Comment"] = json.dumps(comment_data)

        output_folder = filedialog.askdirectory()
        if not output_folder:
            return

        default_data = {"Comment": json.dumps({"Default": "This is default metadata"})}
        
        for idx, file_path in enumerate(image_files):
            try:
                with open(file_path, 'rb') as img_file:
                    image_data = img_file.read()
                try:
                    _ = read_hidden_data_from_image(image_data)
                except:
                    image_data_io = BytesIO()
                    Image.open(file_path).save(image_data_io, format='PNG')
                    image_data = image_data_io.getvalue()
                    save_hidden_data_to_image(image_data, default_data, file_path)

                output_path = os.path.join(output_folder, os.path.basename(file_path))
                save_hidden_data_to_image(image_data, json_data, output_path)
                logger.info(f"Processed {file_path} ({idx + 1}/{len(image_files)})")
            except Exception as e:
                logger.error(f"Failed to process {file_path}: {e}")
        messagebox.showinfo("Success", "Changes applied to all images successfully!")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to apply changes to all images: {e}")
        logger.error(f"Failed to apply changes to all images: {e}")

def setup_logging():
    global logger
    logger = logging.getLogger("ImageMetadataEditor")
    logger.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)

    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)

    logger.addHandler(console_handler)

    log_text = scrolledtext.ScrolledText(root, state='disabled', height=40, width=50)
    log_text.grid(row=0, column=0, rowspan=2, sticky="nsew")

    class TextHandler(logging.Handler):
        def __init__(self, text_widget):
            logging.Handler.__init__(self)
            self.text_widget = text_widget

        def emit(self, record):
            msg = self.format(record)
            def append():
                self.text_widget.configure(state='normal')
                self.text_widget.insert(tk.END, msg + '\n')
                self.text_widget.configure(state='disabled')
                self.text_widget.yview(tk.END)
            self.text_widget.after(0, append)

    text_handler = TextHandler(log_text)
    text_handler.setLevel(logging.DEBUG)
    text_handler.setFormatter(formatter)

    logger.addHandler(text_handler)

def quit_program(icon, item):
    icon.stop()
    root.quit()

# def setup_tray_icon():
#     global icon
#     image = Image.open("myicon.ico")
#     menu = (item('Quit', quit_program),)
#     icon = pystray.Icon("name", image, "Image Metadata Editor", menu)
#     Thread(target=icon.run).start()

def set_icon(root):
    if hasattr(sys, '_MEIPASS'):
        # if程序使用 PyInstaller 打包，从缓存中获取图标文件
        icon_path = os.path.join(sys._MEIPASS, 'myicon.ico')
    else:
        # 程序未打包，直接获取源文件
        icon_path = 'myicon.ico'
    
    if os.path.exists(icon_path):
        root.iconbitmap(icon_path)
    else:
        print("Icon file not found at:", icon_path)

# 说明部分窗口
def about_me():
    about_window = tk.Toplevel(root)
    about_window.title("About Me")
    about_window.geometry("400x300")
    
    tk.Label(about_window, text="Image Metadata Editor", font=("Arial", 16)).pack(pady=10)
    tk.Label(about_window, text="这个工具允许您隐藏和编辑 PNG 图像中的元数据").pack(pady=5)
    tk.Label(about_window, text="查看源代码？访问:").pack(pady=5)
    link = tk.Label(about_window, text="https://github.com/YILING0013/xianyun_Nai3GenIMG", fg="blue", cursor="hand2")

    link.pack(pady=5)
    link.bind("<Button-1>", lambda e: open_github())
    tk.Label(about_window, text="赞助我？爱发电链接").pack(pady=5)
    link2 = tk.Label(about_window, text="https://afdian.net/a/lingyunfei", fg="blue", cursor="hand2")
    link2.pack(pady=5)
    link2.bind("<Button-1>", lambda e: open_afdian())
    tk.Label(about_window, text="在线Nai3绘图服务").pack(pady=5)
    link3 = tk.Label(about_window, text="https://nai3.xianyun.cool/", fg="blue", cursor="hand2")
    link3.pack(pady=5)
    link3.bind("<Button-1>", lambda e: open_xianyunWeb())

    
    def open_github():
        webbrowser.open_new("https://github.com/YILING0013/xianyun_Nai3GenIMG")

    def open_afdian():
        webbrowser.open_new("https://afdian.com/a/lingyunfei")
    
    def open_xianyunWeb():
        webbrowser.open_new("https://nai3.xianyun.cool/")

def print_about_info():
    logger.info("程序加载成功！现在可以打开图片进行编辑了。")


root = tk.Tk()
root.title("Image Metadata Editor")
root.geometry("800x430")

root.grid_rowconfigure(0, weight=1)
root.grid_columnconfigure(1, weight=1)

setup_logging()
set_icon(root)
print_about_info()

control_frame = tk.Frame(root)
control_frame.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)

frame = tk.Frame(control_frame)
frame.grid(row=1, column=0, columnspan=2, sticky="nsew", pady=10)

tk.Button(control_frame, text="Open Image", command=open_image).grid(row=0, column=0, padx=5, pady=5)
tk.Button(control_frame, text="Open Image Folder", command=open_images).grid(row=0, column=1, padx=5, pady=5)
tk.Button(control_frame, text="About Me", command=about_me).grid(row=0, column=2, padx=5, pady=5)

root.mainloop()
