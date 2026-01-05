"""Domain constants."""

# Interest categories for user profile
# These categories help personalize the app experience based on user use cases
INTEREST_CATEGORIES = [
    {"id": "baking", "label": "Baking"},
    {"id": "cooking", "label": "Cooking"},
    {"id": "sports", "label": "Sports & Fitness"},
    {"id": "workouts", "label": "Workouts"},
    {"id": "lab", "label": "Lab Protocols"},
    {"id": "crafts", "label": "Arts & Crafts"},
    {"id": "diy", "label": "DIY & Home Improvement"},
    {"id": "beauty", "label": "Beauty & Skincare"},
    {"id": "music", "label": "Music Practice"},
    {"id": "gardening", "label": "Gardening"},
    {"id": "meditation", "label": "Meditation & Wellness"},
    {"id": "study", "label": "Study & Learning"},
]

# Extract just the IDs for validation
VALID_INTEREST_IDS = [category["id"] for category in INTEREST_CATEGORIES]
