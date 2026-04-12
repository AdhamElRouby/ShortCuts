/**
 * Custom API Error Class
 * Extends Error to include HTTP status codes for API responses
 * Enables consistent error handling throughout the application
 */

class CustomAPIError extends Error {
  statusCode: number;

  /**
   * @param msg - Error message to display
   * @param statusCode - HTTP status code for the error response
   */
  constructor(msg: string, statusCode: number) {
    super(msg);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomAPIError.prototype);
  }
}

export default CustomAPIError;
