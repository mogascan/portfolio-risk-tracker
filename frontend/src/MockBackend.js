// MockBackend.js - This will intercept API calls for development
import { createServer } from 'miragejs';

export function startMockServer() {
  // Create a mock server with Mirage
  return createServer({
    routes() {
      this.namespace = 'api';
      
      // Mock market data endpoint
      this.get('/market/topcoins', () => {
        return [
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            current_price: 65000,
            market_cap: 1200000000000,
            market_cap_rank: 1,
            total_volume: 50000000000,
            price_change_percentage_24h: 2.5,
            price_change_percentage_7d_in_currency: 5.2,
            price_change_percentage_30d_in_currency: 15.7
          },
          {
            id: 'ethereum',
            symbol: 'eth',
            name: 'Ethereum',
            current_price: 3500,
            market_cap: 420000000000,
            market_cap_rank: 2,
            total_volume: 20000000000,
            price_change_percentage_24h: 1.8,
            price_change_percentage_7d_in_currency: 3.7,
            price_change_percentage_30d_in_currency: 12.3
          },
          {
            id: 'sonic',
            symbol: 's',
            name: 'Sonic',
            current_price: 0.55,
            market_cap: 55000000,
            market_cap_rank: 150,
            total_volume: 5000000,
            price_change_percentage_24h: 10.0,
            price_change_percentage_7d_in_currency: 25.0,
            price_change_percentage_30d_in_currency: 40.0
          },
          {
            id: 'euler',
            symbol: 'eul',
            name: 'Euler',
            current_price: 4.2,
            market_cap: 42000000,
            market_cap_rank: 180,
            total_volume: 3000000,
            price_change_percentage_24h: 5.0,
            price_change_percentage_7d_in_currency: 15.0,
            price_change_percentage_30d_in_currency: 30.0
          }
        ];
      });
      
      // Pass through any requests that don't match our defined routes
      this.passthrough();
    },
  });
}

export default startMockServer; 