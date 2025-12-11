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
    this.maxPages = parseInt(process.env.MAX_PAGES, 10) || 50; // Limit to prevent excessive crawling
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
   * Return true for http(s) URLs
   */
  isHttpUrl(url) {
    try {
      const p = new URL(url).protocol;
      return p === 'http:' || p === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Heuristic: skip links that look like static assets (images, archives, etc.)
   */
  isLikelyHtml(url) {
    try {
      const pathname = new URL(url).pathname || '';
      const ext = pathname.split('.').pop().toLowerCase();
      const assetExts = new Set(['jpg','jpeg','png','gif','webp','svg','ico','css','js','json','pdf','zip','rar','7z','mp4','mp3','wav','woff','woff2','ttf']);
      if (!ext || ext === pathname) return true; // no extension -> likely HTML
      return !assetExts.has(ext);
    } catch {
      return false;
    }
  }

  /**
   * Normalize a URL
   */
  normalizeUrl(url, pageUrl) {
    try {
      // Skip javascript:, mailto:, tel: and anchors
      if (!url || typeof url !== 'string') return null;
      const lower = url.trim().toLowerCase();
      if (lower.startsWith('javascript:') || lower.startsWith('mailto:') || lower.startsWith('tel:') || lower.startsWith('#')) {
        return null;
      }

      // Handle absolute and relative URLs
      let resolved;
      if (url.startsWith('/')) {
        resolved = new URL(url, this.baseUrl).href;
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        resolved = new URL(url).href;
      } else {
        resolved = new URL(url, pageUrl).href;
      }

      // Only keep http(s) URLs
      if (!this.isHttpUrl(resolved)) return null;
      return resolved;
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
        timeout: 5001,
        maxRedirects: 5,
        validateStatus: () => true, // Don't throw on any status
      });
      // Treat 2xx and 3xx as valid, and treat 403 as not an actionable "broken" link for our purposes
      let status = response.status;
      if (status === 405) {
        // Some servers disallow HEAD; try GET as a fallback
        try {
          const getResp = await axios.get(url, { timeout: 5001, maxRedirects: 5, validateStatus: () => true });
          status = getResp.status;
        } catch (e) {
          // leave status as 405 if GET fails
        }
      }
      const isValid = (status >= 200 && status < 400) || status === 403;
      this.linkCache.set(url, { isValid, status: response.status });
      return { isValid, status };
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
        return { links: [], skipped: [] };
      }

      const $ = cheerio.load(response.data);
      const links = [];
      const skipped = [];

      $('a[href]').each((i, elem) => {
        const raw = $(elem).attr('href') ?? '';
        const href = raw.trim();

        if (href === '') {
          skipped.push({ url: raw, reason: 'blank' });
          return;
        }

        const lower = href.toLowerCase();
        if (lower.startsWith('#')) {
          skipped.push({ url: raw, reason: 'anchor' });
          return;
        }
        if (lower.startsWith('javascript:')) {
          skipped.push({ url: raw, reason: 'javascript' });
          return;
        }

        const normalized = this.normalizeUrl(href, pageUrl);
        if (normalized) {
          links.push(normalized);
        } else {
          skipped.push({ url: raw, reason: 'invalid' });
        }
      });

      return { links: [...new Set(links)], skipped };
    } catch (error) {
      console.error(`Error extracting links from ${pageUrl}:`, error.message);
      return { links: [], skipped: [] };
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
      const { links, skipped } = await this.extractLinks(pageUrl);
      const pageResults = {
        url: pageUrl,
        brokenLinks: [],
        validLinks: [],
        skippedLinks: skipped,
        totalLinks: (links ? links.length : 0) + (skipped ? skipped.length : 0),
      };

      // Check each link
      for (const link of (links || [])) {
        // If it's an internal, likely-HTML http(s) link and we haven't visited it yet,
        // enqueue it for crawling BEFORE checking status. This ensures we crawl pages
        // even when servers reject HEAD requests.
        if (this.isSameDomain(link) && this.isHttpUrl(link) && this.isLikelyHtml(link) && !this.visited.has(link)) {
          queue.push(link);
          this.visited.add(link);
        }

        const status = await this.checkLinkStatus(link);

        if (status.isValid) {
          pageResults.validLinks.push({ url: link, status: status.status });
        } else {
          pageResults.brokenLinks.push({ url: link, status: status.status || 'unknown', error: status.error });
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
      totalLinks: 0,
      pages: [],
    };

    for (const [url, data] of Object.entries(this.results)) {
      const brokenCount = data.brokenLinks.length;
      const totalLinks = data.totalLinks || (data.brokenLinks.length + data.validLinks.length);
      summary.totalBrokenLinks += brokenCount;
      summary.totalLinks += totalLinks;

      summary.pages.push({
        url,
        totalLinks,
        brokenLinkCount: brokenCount,
        brokenLinks: data.brokenLinks,
      });
    }

    // Sort by number of broken links
    summary.pages.sort((a, b) => b.brokenLinkCount - a.brokenLinkCount);

    return summary;
  }
}

module.exports = LinkChecker;
