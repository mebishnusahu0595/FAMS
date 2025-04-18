from TTS.api import TTS
import sys
import os

def generate_audio(text, output_file):
    """
    Generate an audio file from the given text using Coqui TTS.
    :param text: Text to convert to speech
    :param output_file: Path to save the generated audio file
    """
    try:
        # Initialize the TTS model
        tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)

        # Generate audio file
        tts.tts_to_file(text=text, file_path=output_file)
        print(f"Audio generated successfully: {output_file}")
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Validate command-line arguments
    if len(sys.argv) != 3:
        print("Usage: python coqui_tts.py <text> <output_file>")
        sys.exit(1)

    # Parse command-line arguments
    text = sys.argv[1]
    output_file = sys.argv[2]

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    # Generate audio
    generate_audio(text, output_file)