import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'tierbuild-dev-key'
    # Affiliate tag for illustrative upgrade links (never ranks recommendations).
    AFFILIATE_TAG = os.environ.get('AFFILIATE_TAG') or 'tierbuild-20'
