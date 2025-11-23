#!/bin/bash
#
# Run scripts with Doppler secrets
# Usage: ./scripts/run_with_doppler.sh [script_command]
#
# Examples:
#   ./scripts/run_with_doppler.sh python3 scripts/run_analysis.py
#   ./scripts/run_with_doppler.sh python3 -m src.analyzers.code_quality src/
#

set -e

# Check if doppler is installed
if ! command -v doppler &> /dev/null; then
    echo "❌ Error: Doppler CLI not found"
    echo ""
    echo "Install Doppler:"
    echo "  macOS: brew install dopplerhq/cli/doppler"
    echo "  Linux: See https://docs.doppler.com/docs/install-cli"
    exit 1
fi

# Doppler configuration
PROJECT="integrity-studio"
CONFIG="dev"

# Check if command provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 [command]"
    echo ""
    echo "Examples:"
    echo "  $0 python3 scripts/run_analysis.py"
    echo "  $0 python3 -m src.analyzers.code_quality src/"
    echo "  $0 python3 scripts/run_tests.py"
    exit 1
fi

echo "🔐 Running with Doppler secrets..."
echo "   Project: $PROJECT"
echo "   Config: $CONFIG"
echo "   Command: $@"
echo ""

# Run command with Doppler secrets
doppler run --project "$PROJECT" --config "$CONFIG" -- "$@"
