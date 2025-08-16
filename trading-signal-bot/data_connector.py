import yfinance as yf
import pandas as pd
import sys
import json

def format_symbol_for_yfinance(symbol):
    """Formats a trading symbol into a yfinance-compatible ticker."""
    symbol = symbol.upper()
    if '/' in symbol:
        # Forex pair
        return f"{symbol.replace('/', '')}=X"
    if symbol.endswith('USDT'):
        # Crypto pair
        return f"{symbol.replace('USDT', '')}-USD"
    
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
    return special_symbols.get(symbol, symbol)

def get_historical_data(symbol, timeframe, start_date=None, end_date=None):
    """
    Fetches historical market data from Yahoo Finance with flexible date ranges.
    """
    formatted_symbol = format_symbol_for_yfinance(symbol)

    timeframe_map = {
        '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
        '1h': '1h', '4h': '1h', '1d': '1d', '1wk': '1wk', '1mo': '1mo'
    }
    yf_timeframe = timeframe_map.get(timeframe)
    if not yf_timeframe:
        return {"error": f"Unsupported timeframe: {timeframe}. Please use a standard format (e.g., '1m', '1h', '1d')."}

    params = {'interval': yf_timeframe, 'progress': False, 'auto_adjust': False}
    if start_date and end_date:
        params['start'] = start_date
        params['end'] = end_date
    else:
        params['period'] = "1mo" if yf_timeframe in ['1d', '1wk', '1mo'] else "7d"

    try:
        data = yf.download(tickers=formatted_symbol, **params)
        
        if data.empty:
            return {"error": f"No data found for symbol {formatted_symbol}. Check the symbol or adjust the date range."}

        data.reset_index(inplace=True)
        
        timestamp_col = 'Datetime' if 'Datetime' in data.columns else 'Date'
        data.rename(columns={timestamp_col: 'date'}, inplace=True)
        
        # Standardize column names
        data.rename(columns={
            'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'
        }, inplace=True)

        # Ensure timestamps are in ISO 8601 format
        data['date'] = pd.to_datetime(data['date']).dt.tz_localize(None).isoformat()

        required_cols = ['date', 'open', 'high', 'low', 'close']
        if 'volume' in data.columns:
            required_cols.append('volume')
            
        return data[required_cols].to_dict('records')

    except Exception as e:
        import traceback
        return {"error": f"An error occurred for symbol {formatted_symbol}: {str(e)}", "trace": traceback.format_exc()}


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Invalid arguments. Usage: python data_connector.py <symbol> <timeframe>"}))
        sys.exit(1)

    symbol_arg = sys.argv[1]
    timeframe_arg = sys.argv[2]

    data = get_historical_data(symbol_arg, timeframe_arg)
    
    print(json.dumps(data))
