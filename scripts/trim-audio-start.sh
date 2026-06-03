#!/usr/bin/env bash
# Trim the first 4 minutes from an audio file.
# Usage: ./scripts/trim-audio-start.sh <input> [output]
# If output is omitted, writes to <input>_trimmed.<ext>

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <input_audio> [output_audio]"
  exit 1
fi

INPUT="$1"
EXT="${INPUT##*.}"
NAME="${INPUT%.*}"
OUTPUT="${2:-${NAME}_trimmed.${EXT}}"

echo "Trimming first 4 minutes from: $INPUT"
echo "Output: $OUTPUT"

ffmpeg -y -i "$INPUT" -ss 00:05:00 -map_metadata -1 -c copy "$OUTPUT" 2>/dev/null || \
ffmpeg -y -i "$INPUT" -ss 00:05:00 -map_metadata -1 "$OUTPUT"

echo "Done: $OUTPUT"
