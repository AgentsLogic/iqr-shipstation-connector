/**
 * ShipStation API Client
 * Handles order creation and retrieval from ShipStation
 */

const axios = require('axios');
const logger = require('../utils/logger');

class ShipStationClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.apiBaseUrl = config.apiBaseUrl;
    
    // Create base64 encoded auth header
    const authString = `${this.apiKey}:${this.apiSecret}`;
    this.authHeader = Buffer.from(authString).toString('base64');
  }

  /**
   * Get common headers for ShipStation API calls
   */
  getHeaders() {
    return {
      'Authorization': `Basic ${this.authHeader}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create or update an order in ShipStation
   * @param {Object} orderData - Order data in ShipStation format
   * @returns {Promise<Object>} Created/updated order
   */
  async createOrder(orderData) {
    try {
      logger.info(`Creating order in ShipStation: ${orderData.orderNumber}`);
      
      const response = await axios.post(
        `${this.apiBaseUrl}/orders/createorder`,
        orderData,
        { headers: this.getHeaders() }
      );

      if (response.status === 200 && response.data) {
        logger.info(`Successfully created order ${orderData.orderNumber} in ShipStation`);
        return response.data;
      } else {
        throw new Error('Invalid response from ShipStation');
      }
    } catch (error) {
      logger.error(`Failed to create order ${orderData.orderNumber}:`, error.message);
      if (error.response) {
        logger.error('ShipStation error response:', error.response.data);
      }
      throw new Error(`Failed to create order in ShipStation: ${error.message}`);
    }
  }

  /**
   * Create multiple orders in ShipStation (batch)
   * @param {Array<Object>} ordersData - Array of order data
   * @returns {Promise<Object>} Batch creation result
   */
  async createOrders(ordersData) {
    try {
      logger.info(`Creating ${ordersData.length} orders in ShipStation (batch)`);
      
      const response = await axios.post(
        `${this.apiBaseUrl}/orders/createorders`,
        ordersData,
        { headers: this.getHeaders() }
      );

      if (response.status === 200 && response.data) {
        logger.info(`Successfully created ${ordersData.length} orders in ShipStation`);
        return response.data;
      } else {
        throw new Error('Invalid response from ShipStation');
      }
    } catch (error) {
      logger.error('Failed to create orders batch:', error.message);
      if (error.response) {
        logger.error('ShipStation error response:', error.response.data);
      }
      throw new Error(`Failed to create orders in ShipStation: ${error.message}`);
    }
  }

  /**
   * Get an order from ShipStation by order number
   * @param {string} orderNumber - Order number to search for
   * @returns {Promise<Object|null>} Order data or null if not found
   */
  async getOrderByNumber(orderNumber) {
    try {
      logger.debug(`Checking if order ${orderNumber} exists in ShipStation`);
      
      const response = await axios.get(
        `${this.apiBaseUrl}/orders`,
        {
          headers: this.getHeaders(),
          params: {
            orderNumber: orderNumber
          }
        }
      );

      if (response.status === 200 && response.data && response.data.orders) {
        const orders = response.data.orders;
        if (orders.length > 0) {
          logger.debug(`Found order ${orderNumber} in ShipStation`);
          return orders[0];
        }
      }
      
      logger.debug(`Order ${orderNumber} not found in ShipStation`);
      return null;
    } catch (error) {
      logger.error(`Failed to check order ${orderNumber}:`, error.message);
      throw new Error(`Failed to check order in ShipStation: ${error.message}`);
    }
  }

  /**
   * Check if an order already exists in ShipStation
   * @param {string} orderNumber - Order number to check
   * @returns {Promise<boolean>} True if order exists
   */
  async orderExists(orderNumber) {
    const order = await this.getOrderByNumber(orderNumber);
    return order !== null;
  }

  /**
   * Get shipments for an order
   * @param {string} orderNumber - Order number
   * @returns {Promise<Array>} Array of shipments
   */
  async getShipments(orderNumber) {
    try {
      logger.debug(`Fetching shipments for order ${orderNumber}`);
      
      const response = await axios.get(
        `${this.apiBaseUrl}/shipments`,
        {
          headers: this.getHeaders(),
          params: {
            orderNumber: orderNumber
          }
        }
      );

      if (response.status === 200 && response.data && response.data.shipments) {
        return response.data.shipments;
      }
      
      return [];
    } catch (error) {
      logger.error(`Failed to fetch shipments for order ${orderNumber}:`, error.message);
      throw new Error(`Failed to fetch shipments: ${error.message}`);
    }
  }
}

module.exports = ShipStationClient;

