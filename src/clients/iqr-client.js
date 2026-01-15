/**
 * IQ Reseller API Client
 * Handles authentication, session management, and API calls to IQR
 */

const axios = require('axios');
const logger = require('../utils/logger');

class IQRClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.authUrl = config.authUrl;
    this.apiBaseUrl = config.apiBaseUrl;
    this.sessionToken = null;
    this.sessionExpiry = null;
  }

  /**
   * Authenticate and get session token
   * @returns {Promise<string>} Session token
   */
  async authenticate() {
    try {
      logger.info('Authenticating with IQR API...');
      
      const response = await axios.post(
        `${this.authUrl}/api/IntegrationAPI/Session`,
        { APIToken: this.apiKey },
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'UTF8',
            'Accept': 'application/json'
          }
        }
      );

      if (response.status === 200 && response.data && response.data.Data) {
        this.sessionToken = response.data.Data;
        // Session tokens typically expire after 1 hour, set expiry to 50 minutes to be safe
        this.sessionExpiry = Date.now() + (50 * 60 * 1000);
        logger.info('Successfully authenticated with IQR API');
        return this.sessionToken;
      } else {
        throw new Error('Authentication failed: Invalid response from IQR API');
      }
    } catch (error) {
      logger.error('IQR authentication failed:', error.message);
      throw new Error(`IQR authentication failed: ${error.message}`);
    }
  }

  /**
   * End the current session
   */
  async endSession() {
    if (!this.sessionToken) {
      return;
    }

    try {
      logger.info('Ending IQR session...');
      await axios.delete(
        `${this.authUrl}/api/IntegrationAPI/Session`,
        {
          headers: {
            'iqr-session-token': this.sessionToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      this.sessionToken = null;
      this.sessionExpiry = null;
      logger.info('IQR session ended successfully');
    } catch (error) {
      logger.error('Failed to end IQR session:', error.message);
    }
  }

  /**
   * Ensure we have a valid session token
   */
  async ensureAuthenticated() {
    if (!this.sessionToken || Date.now() >= this.sessionExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Get sales orders from IQR
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of sales orders
   */
  async getSalesOrders(options = {}) {
    await this.ensureAuthenticated();

    try {
      logger.info('Fetching sales orders from IQR...');
      
      const response = await axios.get(
        `${this.apiBaseUrl}/webapi.svc/SO/JSON/GetSOs`,
        {
          headers: {
            'iqr-session-token': this.sessionToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          params: options.params || {}
        }
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        logger.info(`Fetched ${response.data.length} sales orders from IQR`);
        return response.data;
      } else {
        throw new Error('Invalid response from GetSOs endpoint');
      }
    } catch (error) {
      logger.error('Failed to fetch sales orders:', error.message);
      throw new Error(`Failed to fetch sales orders: ${error.message}`);
    }
  }

  /**
   * Filter orders by status
   * @param {Array} orders - Array of orders
   * @param {Array<string>} statuses - Array of status values to filter by
   * @returns {Array} Filtered orders
   */
  filterByStatus(orders, statuses) {
    return orders.filter(order => {
      const orderStatus = order.status ? order.status.trim() : '';
      return statuses.some(status => orderStatus.toLowerCase() === status.toLowerCase());
    });
  }

  /**
   * Filter orders by date range
   * @param {Array} orders - Array of orders
   * @param {number} daysBack - Number of days to look back
   * @returns {Array} Filtered orders
   */
  filterByDateRange(orders, daysBack) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return orders.filter(order => {
      if (!order.saledate) return false;
      const saleDate = new Date(order.saledate);
      return saleDate >= cutoffDate;
    });
  }

  /**
   * TODO: Filter orders by agent channel
   * This requires knowing which field contains "DPC - QUIC"
   * Placeholder for now - will implement once we get answer from IQR team
   */
  filterByAgentChannel(orders, channelName) {
    logger.warn('Agent channel filtering not yet implemented - need field mapping from IQR team');
    // TODO: Implement once we know which field contains the agent channel
    // Possible fields: userdefined1-5, or a separate API call
    return orders;
  }
}

module.exports = IQRClient;

