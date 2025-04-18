import os
import sys
import wave
from vosk import Model, KaldiRecognizer

def transcribe_audio(audio_file):
    # Load the Vosk model
    model_path = "models/vosk-model-small-en-us-0.15"
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")

    model = Model(model_path)
    wf = wave.open(audio_file, "rb")

    # Initialize the recognizer
    rec = KaldiRecognizer(model, wf.getframerate())

    # Process the audio file
    result = ""
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result += rec.Result()

    # Get the final transcription
    final_result = rec.FinalResult()
    return final_result

if __name__ == "__main__":
    audio_file = sys.argv[1]
    try:
        result = transcribe_audio(audio_file)
        print(result)
    except Exception as e:
        print(f"Error: {str(e)}")