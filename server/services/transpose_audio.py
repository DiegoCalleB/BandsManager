import sys
import argparse
from pedalboard import Pedalboard, PitchShift
from pedalboard.io import AudioFile

def transpose_audio(input_path: str, output_path: str, semitones: float):
    try:
        with AudioFile(input_path) as f:
            samplerate = f.samplerate
            num_channels = f.num_channels
            audio_data = f.read(f.frames)

        # Aplicar el efecto de PitchShift de alta fidelidad de Spotify Pedalboard
        board = Pedalboard([PitchShift(semitones=semitones)])
        effected = board(audio_data, samplerate)

        with AudioFile(output_path, 'w', samplerate, num_channels) as f:
            f.write(effected)

        print(f"SUCCESS: Transposed audio by {semitones} semitones saved to {output_path}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to transpose audio: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transpose audio using Spotify Pedalboard")
    parser.add_argument("--input", required=True, help="Input audio file path")
    parser.add_argument("--output", required=True, help="Output audio file path")
    parser.add_argument("--semitones", type=float, required=True, help="Semitones to transpose (-12 to 12)")

    args = parser.parse_args()
    transpose_audio(args.input, args.output, args.semitones)
