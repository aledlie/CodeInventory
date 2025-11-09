"""
Sample Python file for testing
"""

import os
import json
from pathlib import Path

def calculate_total(items):
    """Calculate the total of all items"""
    return sum(items)

def process_data(data):
    # TODO: Implement this
    print("Processing data")
    return data

class DataProcessor:
    """Process data with various methods"""

    def __init__(self, config):
        self.config = config

    def validate(self, data):
        """Validate the data"""
        try:
            return bool(data)
        except:
            return False

    async def fetch_data(self, url):
        """Fetch data from URL"""
        return {"url": url}

# Hardcoded credential (for testing security detection)
API_KEY = "secret_key_12345"
