from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import time
import numpy as np

app = Flask(__name__)
CORS(app)

# Cache setup
cache = {}
cache_timestamp = 0
CACHE_DURATION_SECONDS = 60  # Cache for 60 seconds

def format_symbol_for_yfinance(symbol):
    """Formats a trading symbol into a yfinance-compatible ticker."""
    symbol = symbol.upper()
    
    # Mapping for common indices and commodities
    special_symbols = {
        'US30': '^DJI',
        'SPX500': '^GSPC',
        'NAS100': '^IXIC',
        'XAU/USD': 'GC=F',
        'XAUUSD': 'GC=F',
        'XAG/USD': 'SI=F',
        'XAGUSD': 'SI=F',
        'USOIL': 'CL=F',
    }
    if symbol in special_symbols:
        return special_symbols[symbol]

    if '/' in symbol:
        # Forex pair
        return f"{symbol.replace('/', '')}=X"
    if symbol.endswith('USDT'):
        # Crypto pair
        return f"{symbol.replace('USDT', '')}-USD"
    
    return symbol

def get_yfinance_interval(timeframe):
    """Maps frontend timeframe to a valid yfinance interval."""
    timeframe_map = {
        '1m': '1m',
        '3m': '2m',  # yfinance doesn't have '3m', falling back to '2m'
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '4h': '1h',  # yfinance doesn't have '4h', we can aggregate later if needed
        '1d': '1d',
        '1wk': '1wk',
        '1mo': '1mo',
    }
    return timeframe_map.get(timeframe, '1h') # Default to '1h' if not found

@app.route('/api/forex-data')
def get_forex_data():
    pair = request.args.get('pair')
    timeframe = request.args.get('timeframe', '1h')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not pair:
        return jsonify({'error': 'The "pair" parameter is required.'}), 400

    formatted_pair = format_symbol_for_yfinance(pair)
    interval = get_yfinance_interval(timeframe)
    
    # Construct parameters for yfinance
    params = {'interval': interval}
    if start_date and end_date:
        params['start'] = start_date
        params['end'] = end_date
    else:
        # Default period if no date range is provided
        params['period'] = '1mo' if interval in ['1d', '1wk', '1mo'] else '7d'

    try:
        # Use yf.download for more robust fetching
        data = yf.download(
            tickers=formatted_pair,
            **params,
            auto_adjust=False,
            progress=False
        )

        if data.empty:
            return jsonify({'error': f'No data found for {pair} with the specified parameters.'}), 404

        data.reset_index(inplace=True)
        
        # Identify the correct timestamp column
        timestamp_col = 'Datetime' if 'Datetime' in data.columns else 'Date'
        
        # Standardize timestamp to UTC
        if data[timestamp_col].dt.tz:
            data[timestamp_col] = data[timestamp_col].dt.tz_convert('UTC')
        else:
            data[timestamp_col] = data[timestamp_col].dt.tz_localize('UTC')
        
        data['time'] = data[timestamp_col].dt.strftime('%Y-%m-%d %H:%M:%S')

        # Rename columns to be frontend-friendly
        data.rename(columns={
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        }, inplace=True)

        # Ensure all required columns are present
        required_cols = ['time', 'open', 'high', 'low', 'close']
        if 'volume' in data.columns:
            required_cols.append('volume')
        
        # Replace NaN with None for JSON compatibility
        data.replace({np.nan: None}, inplace=True)
        
        return jsonify(data[required_cols].to_dict(orient='records'))

    except Exception as e:
        print(f"Error fetching data for {pair}: {str(e)}")
        return jsonify({'error': f'An error occurred while fetching data for {pair}.'}), 500

@app.route('/api/bulk-forex-data')
def get_bulk_forex_data():
    pairs = request.args.get('pairs')
    timeframe = request.args.get('timeframe', '1h')
    
    if not pairs:
        return jsonify({'error': 'The "pairs" parameter is required.'}), 400

    pairs_list = pairs.split(',')
    formatted_pairs_list = [format_symbol_for_yfinance(p) for p in pairs_list]
    interval = get_yfinance_interval(timeframe)
    period = '1mo' if interval in ['1d', '1wk', '1mo'] else '7d'

    try:
        data = yf.download(
            tickers=formatted_pairs_list,
            period=period,
            interval=interval,
            group_by='ticker',
            auto_adjust=False,
            threads=True,
            progress=False
        )

        results = {}
        for i, pair in enumerate(pairs_list):
            formatted_pair = formatted_pairs_list[i]
            
            if formatted_pair in data.columns:
                pair_data = data[formatted_pair].copy()
                pair_data.reset_index(inplace=True)
                
                timestamp_col = 'Datetime' if 'Datetime' in pair_data.columns else 'Date'
                
                if pair_data[timestamp_col].dt.tz:
                    pair_data[timestamp_col] = pair_data[timestamp_col].dt.tz_convert('UTC')
                else:
                    pair_data[timestamp_col] = pair_data[timestamp_col].dt.tz_localize('UTC')
                
                pair_data['time'] = pair_data[timestamp_col].dt.strftime('%Y-%m-%d %H:%M:%S')

                pair_data.rename(columns={
                    'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'
                }, inplace=True)
                
                required_cols = ['time', 'open', 'high', 'low', 'close']
                if 'volume' in pair_data.columns:
                    required_cols.append('volume')
                
                # Replace NaN with None for JSON compatibility
                pair_data.replace({np.nan: None}, inplace=True)
                results[pair] = pair_data[required_cols].to_dict(orient='records')
            else:
                results[pair] = []

        return jsonify(results)

    except Exception as e:
        print(f"Error fetching bulk historical data: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching bulk historical data.'}), 500

@app.route('/api/forex-price')
def get_forex_price():
    pair = request.args.get('pair')
    if not pair:
        return jsonify({'error': 'Pair parameter is missing.'}), 400

    formatted_pair = format_symbol_for_yfinance(pair)

    try:
        ticker = yf.Ticker(formatted_pair)
        if not ticker.info:
            return jsonify({'error': f'Invalid ticker symbol: {pair}'}), 404
        info = ticker.info

        # yfinance provides different fields for price, try to find one that exists
        price = info.get('regularMarketPrice') or info.get('bid') or info.get('ask')

        if price:
            return jsonify({'pair': pair, 'price': price})
        else:
            # If no direct price field, try to get the last close price from a short period
            data = ticker.history(period='1d', interval='1m')
            if not data.empty:
                latest_price = data['Close'].iloc[-1]
                return jsonify({'pair': pair, 'price': latest_price})
            else:
                return jsonify({'error': f'No price data found for {pair}'}), 404

    except Exception as e:
        print(f"Error fetching data for {pair}: {str(e)}")
        return jsonify({'error': f'An error occurred while fetching data for {pair}.'}), 500

@app.route('/api/bulk-forex-price')
def get_bulk_forex_price():
    global cache, cache_timestamp
    current_time = time.time()

    # Check if cache is valid
    if current_time - cache_timestamp < CACHE_DURATION_SECONDS and cache:
        pairs = request.args.get('pairs')
        if not pairs:
            return jsonify(cache)
        pairs_list = pairs.split(',')
        # Return only the requested pairs from the cache
        cached_results = {pair: cache.get(pair) for pair in pairs_list if pair in cache}
        return jsonify(cached_results)

    # If cache is invalid, fetch new data for all known symbols
    all_known_symbols = [
      'XAU/USD', 'XAG/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
      'EUR/JPY', 'GBP/JPY', 'CHF/JPY', 'AUD/JPY', 'CAD/JPY', 'NZD/JPY', 'EUR/GBP',
      'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD', 'GBP/AUD', 'GBP/CAD', 'GBP/NZD',
      'AUD/CHF', 'AUD/CAD', 'AUD/NZD', 'CAD/CHF', 'NZD/CHF', 'NZD/CAD'
    ]
    formatted_pairs_list = [format_symbol_for_yfinance(p) for p in all_known_symbols]
    
    try:
        data = yf.download(
            tickers=formatted_pairs_list,
            period='1d',
            interval='1m',
            group_by='ticker',
            auto_adjust=True,
            threads=True,
            progress=False
        )

        new_cache_data = {}
        for i, pair in enumerate(all_known_symbols):
            formatted_pair = formatted_pairs_list[i]
            
            if formatted_pair in data.columns and not data[formatted_pair].empty:
                last_price = data[formatted_pair]['Close'].dropna().iloc[-1] if not data[formatted_pair]['Close'].dropna().empty else None
                if last_price is not None and pd.notna(last_price):
                    new_cache_data[pair] = {'pair': pair, 'price': last_price}
                else:
                    new_cache_data[pair] = {'error': f'No recent price data for {pair}'}
            else:
                 new_cache_data[pair] = {'error': f'No data found for {pair}'}
        
        # Update cache
        cache = new_cache_data
        cache_timestamp = current_time
        
        # Return requested pairs from the newly fetched data
        requested_pairs = request.args.get('pairs')
        if not requested_pairs:
            return jsonify(cache)
        
        requested_pairs_list = requested_pairs.split(',')
        requested_results = {pair: cache.get(pair) for pair in requested_pairs_list if pair in cache}
        return jsonify(requested_results)

    except Exception as e:
        print(f"Error fetching bulk data: {str(e)}")
        # Return stale cache data if available, otherwise error
        if cache:
            return jsonify(cache)
        return jsonify({'error': 'An error occurred while fetching bulk data and cache is empty.'}), 500

import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5009))
    app.run(port=port, debug=True)
