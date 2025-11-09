"""
Sample test file for testing coverage analyzer
"""

import pytest
from .sample import calculate_total, DataProcessor

def test_calculate_total():
    """Test calculate_total function"""
    assert calculate_total([1, 2, 3]) == 6
    assert calculate_total([]) == 0

def test_data_processor_validate():
    """Test DataProcessor.validate method"""
    processor = DataProcessor({})
    assert processor.validate([1, 2, 3]) == True
    assert processor.validate([]) == False

# Note: process_data and fetch_data are not tested
