/**
 * Mock data for the Twitter feed component
 */

export const MOCK_ACCOUNTS = [
  {
    id: 1,
    handle: '@VitalikButerin',
    name: 'Vitalik Buterin',
    category: 'crypto',
    verified: true
  },
  {
    id: 2,
    handle: '@CoinDesk',
    name: 'CoinDesk',
    category: 'news',
    verified: true
  },
  {
    id: 3,
    handle: '@Binance',
    name: 'Binance',
    category: 'exchange',
    verified: true
  }
];

export const MOCK_TWEETS = [
  {
    id: 101,
    accountId: 1,
    text: "Excited to announce a new breakthrough in Ethereum scaling. Layer 2 solutions are getting faster and more efficient than ever!",
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    likes: 3240,
    comments: 421,
    retweets: 1892,
    profileImg: 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg',
    media: []
  },
  {
    id: 102,
    accountId: 2,
    text: "Bitcoin hits new 6-month high as market sentiment improves. Analysts predict continued growth through Q2 2023.",
    date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    likes: 1872,
    comments: 231,
    retweets: 942,
    profileImg: 'https://pbs.twimg.com/profile_images/1683886463062671375/NzaR_Y93_400x400.png',
    media: []
  },
  {
    id: 103,
    accountId: 3,
    text: "Binance launches new educational program to help users understand crypto fundamentals. Check out binance.com/learn for free resources!",
    date: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    likes: 2103,
    comments: 187,
    retweets: 764,
    profileImg: 'https://pbs.twimg.com/profile_images/1777320798559203330/GUQ7DLEV_400x400.jpg',
    media: []
  },
  {
    id: 104,
    accountId: 1,
    text: "Thinking about the balance between privacy and transparency in blockchain systems. We need better solutions that protect user data while maintaining network integrity.",
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    likes: 4521,
    comments: 543,
    retweets: 2103,
    profileImg: 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg',
    media: []
  },
  {
    id: 105,
    accountId: 2,
    text: "BREAKING: Major partnership announced between traditional finance giant and crypto exchange. This could accelerate institutional adoption.",
    date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    likes: 1543,
    comments: 321,
    retweets: 876,
    profileImg: 'https://pbs.twimg.com/profile_images/1683886463062671375/NzaR_Y93_400x400.png',
    media: []
  }
];

// Default categories that match what's in the components
export const DEFAULT_CATEGORIES = [
  { id: 'crypto', name: 'Crypto', isActive: true },
  { id: 'news', name: 'News', isActive: true },
  { id: 'exchange', name: 'Exchange', isActive: true },
  { id: 'tech', name: 'Tech', isActive: true }
]; 