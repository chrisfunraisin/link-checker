const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class LinkChecker {
  constructor(startUrl) {
    this.startUrl = startUrl;
    this.baseUrl = new URL(startUrl).origin;
    this.visited = new Set();
    this.results = {};
    this.linkCache = new Map();
    this.maxPages = 50; // Limit to prevent excessive crawling
  }

  /**
   * Extract the domain from a URL
   */
  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * Check if a URL belongs to the same domain
   */
  isSameDomain(url) {
    try {
      const urlDomain = this.getDomain(url);
      const baseDomain = this.getDomain(this.baseUrl);
      return urlDomain === baseDomain;
    } catch {
      return false;
    }
  }

  /**
   * Normalize a URL
   */
  normalizeUrl(url, pageUrl) {
    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return new URL(url, this.baseUrl).href;
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return new URL(url).href;
      }
      if (url.startsWith('#')) {
        return null; // Skip anchors
      }
      // Relative URLs
      return new URL(url, pageUrl).href;
    } catch {
      return null;
    }
  }

  /**
   * Check the status of a single link
   */
  async checkLinkStatus(url) {
    if (this.linkCache.has(url)) {
      return this.linkCache.get(url);
    }

    try {
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: () => true, // Don't throw on any status
      });
      const isValid = response.status >= 200 && response.status < 400;
      this.linkCache.set(url, { isValid, status: response.status });
      return { isValid, status: response.status };
    } catch (error) {
      this.linkCache.set(url, { isValid: false, status: 0, error: error.message });
      return { isValid: false, status: 0, error: error.message };
    }
  }

  /**
   * Extract all links from a page
   */
  async extractLinks(pageUrl) {
    try {
      const response = await axios.get(pageUrl, {
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        return [];
      }

      const $ = cheerio.load(response.data);
      const links = [];

      $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        const normalized = this.normalizeUrl(href, pageUrl);
        if (normalized) {
          links.push(normalized);
        }
      });

      return [...new Set(links)]; // Remove duplicates
    } catch (error) {
      console.error(`Error extracting links from ${pageUrl}:`, error.message);
      return [];
    }
  }

  /**
   * Crawl the website and return results
   */
  async check() {
    const queue = [this.startUrl];
    this.visited.add(this.startUrl);

    while (queue.length > 0 && this.visited.size < this.maxPages) {
      const pageUrl = queue.shift();
      console.log(`Checking page: ${pageUrl}`);

      // Extract all links from the page
      const links = await this.extractLinks(pageUrl);
      const pageResults = {
        url: pageUrl,
        brokenLinks: [],
        validLinks: [],
      };

      // Check each link
      for (const link of links) {
        const status = await this.checkLinkStatus(link);

        if (status.isValid) {
          pageResults.validLinks.push({
            url: link,
            status: status.status,
          });

          // If it's an internal link we haven't visited, add to queue
          if (this.isSameDomain(link) && !this.visited.has(link)) {
            queue.push(link);
            this.visited.add(link);
          }
        } else {
          pageResults.brokenLinks.push({
            url: link,
            status: status.status || 'unknown',
            error: status.error,
          });
        }
      }

      this.results[pageUrl] = pageResults;
    }

    return this.formatResults();
  }

  /**
   * Format results for API response
   */
  formatResults() {
    const summary = {
      totalPages: Object.keys(this.results).length,
      totalBrokenLinks: 0,
      pages: [],
    };

    for (const [url, data] of Object.entries(this.results)) {
      const brokenCount = data.brokenLinks.length;
      summary.totalBrokenLinks += brokenCount;

      if (brokenCount > 0) {
        summary.pages.push({
          url,
          brokenLinkCount: brokenCount,
          brokenLinks: data.brokenLinks,
        });
      }
    }

    // Sort by number of broken links
    summary.pages.sort((a, b) => b.brokenLinkCount - a.brokenLinkCount);

    return summary;
  }
}

module.exports = LinkChecker;
