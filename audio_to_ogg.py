import subprocess
from pathlib import Path

def convert_to_ogg(input_folder):
    formats = [".mp3", ".wav", ".m4a", ".flac"]
    print("Starting batch conversion...")

    for ext in formats:
        for file_path in Path(input_folder).glob(f"*{ext}"):
            input_file = str(file_path)
            output_file = str(Path(input_folder) / file_path.with_suffix('.ogg').name)
            command = [
                "ffmpeg",
                "-i", input_file,
                "-c:a", "libvorbis",
                "-q:a", "5",
                "-ac", "1",
                "-ar", "3200",
                "-af", "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB",
                "-y",
                output_file
            ]
            print(f"Converting {file_path.name} to OGG...")
            try:
                subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f" -> Saved to {output_file}")
            except subprocess.CalledProcessError as e:
                print(f" -> Error converting {file_path.name}. Ensure it's a valid audio file.")
                print(e)
    print("Done!")

convert_to_ogg("public/sound/music")
convert_to_ogg("public/sound/sfx")