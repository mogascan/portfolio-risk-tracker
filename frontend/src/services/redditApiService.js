import axios from 'axios';

class RedditApiService {
  constructor() {
    // Use our backend proxy instead of direct Reddit API
    this.apiClient = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000'
    });
  }

  // Fetch posts from a subreddit
  async getSubredditPosts(subreddit, limit = 10, sort = 'hot') {
    try {
      console.log(`Fetching r/${subreddit} posts sorted by ${sort}`);
      
      // Use the proxy endpoint
      const response = await this.apiClient.get(`/reddit/${subreddit}/${sort}`, {
        params: { limit }
      });

      // Log successful response
      if (response.data && response.data.posts) {
        console.log(`Reddit API: Fetched ${response.data.posts.length} posts from r/${subreddit}`);
      } else {
        console.warn('Reddit API: Received data but no posts array found in response');
      }

      // Transform data to ensure consistency with component expectations
      const transformedPosts = (response.data.posts || []).map(post => {
        return {
          id: post.id,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          score: post.score,
          numComments: post.num_comments,
          created: post.created_utc ? post.created_utc * 1000 : Date.now(), // Convert to milliseconds
          url: post.url,
          permalink: post.permalink,
          selftext: post.selftext || '',
          thumbnail: post.image || null,
          isVideo: false,
          upvoteRatio: post.upvote_ratio,
          isSelf: post.is_self
        };
      });

      return transformedPosts;
    } catch (error) {
      console.error('Error fetching subreddit posts:', error);
      
      if (error.response) {
        console.error('Reddit API error response:', error.response.status, error.response.data);
      }
      
      // Return empty array instead of throwing to prevent component errors
      return [];
    }
  }

  // Search posts across multiple subreddits
  async searchPosts(query, subreddits = [], limit = 10) {
    try {
      const subreddit = subreddits.length > 0 ? subreddits[0] : null;
      console.log(`Searching Reddit for "${query}" in ${subreddit || 'all subreddits'}`);
      
      // Use the search proxy endpoint
      const response = await this.apiClient.get('/reddit/search', {
        params: {
          q: query,
          subreddit,
          limit,
          sort: 'relevance',
          t: 'week' // Time: hour, day, week, month, year, all
        }
      });

      // Transform data to ensure consistency
      const transformedPosts = (response.data.posts || []).map(post => {
        return {
          id: post.id,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          score: post.score,
          numComments: post.num_comments,
          created: post.created_utc ? post.created_utc * 1000 : Date.now(), // Convert to milliseconds
          url: post.url,
          permalink: post.permalink,
          selftext: post.selftext || '',
          thumbnail: post.image || null,
          isVideo: false,
          upvoteRatio: post.upvote_ratio,
          isSelf: post.is_self
        };
      });

      return transformedPosts;
    } catch (error) {
      console.error('Error searching posts:', error);
      
      if (error.response) {
        console.error('Reddit search API error response:', error.response.status, error.response.data);
      }
      
      // Return empty array instead of throwing
      return [];
    }
  }
  
  // Add fallback method to handle error cases
  async fallbackGetPosts(subreddit, limit = 10) {
    try {
      // Try fallback endpoint with different parameters
      console.log(`Trying fallback method for r/${subreddit}`);
      
      // Try different sort methods as fallbacks
      const sorts = ['new', 'top', 'hot'];
      
      for (const sort of sorts) {
        try {
          const response = await this.apiClient.get(`/reddit/${subreddit}/${sort}`, {
            params: { limit }
          });
          
          if (response.data && response.data.posts && response.data.posts.length > 0) {
            console.log(`Fallback succeeded with sort=${sort}, found ${response.data.posts.length} posts`);
            
            // Transform data
            return response.data.posts.map(post => ({
              id: post.id,
              title: post.title,
              author: post.author,
              subreddit: post.subreddit,
              score: post.score,
              numComments: post.num_comments,
              created: post.created_utc ? post.created_utc * 1000 : Date.now(),
              url: post.url,
              permalink: post.permalink,
              selftext: post.selftext || '',
              thumbnail: post.image || null,
              isVideo: false,
              upvoteRatio: post.upvote_ratio,
              isSelf: post.is_self
            }));
          }
        } catch (error) {
          console.warn(`Fallback for sort=${sort} failed:`, error.message);
          continue; // Try next sort option
        }
      }
      
      // If we reach here, all fallbacks failed
      console.error('All fallback attempts failed for subreddit:', subreddit);
      return [];
    } catch (error) {
      console.error('Error in fallback method for fetching posts:', error);
      return [];
    }
  }
}

export default new RedditApiService(); 